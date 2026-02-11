import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
};

const parseCursorDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const sanitizeText = (value) => String(value || '').trim();

const findConversationBetween = (userA, userB) => Conversation.findOne({
  participants: { $all: [userA, userB], $size: 2 }
});

const safeUserFields = 'firstName lastName profilePicture status';

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const recipientId = req.body.recipientId;
    const text = sanitizeText(req.body.text);

    if (!senderId) return res.status(401).json({ message: 'Unauthorized' });
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Invalid recipient id' });
    }
    if (senderId.toString() === recipientId.toString()) {
      return res.status(400).json({ message: 'You cannot send messages to yourself' });
    }
    if (!text) return res.status(400).json({ message: 'Message text is required' });
    if (text.length > 1000) {
      return res.status(400).json({ message: 'Message is too long (max 1000 chars)' });
    }

    const recipient = await User.findById(recipientId).select('_id');
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    let conversation = await findConversationBetween(senderId, recipientId);
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId]
      });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      recipient: recipientId,
      text
    });

    conversation.lastMessage = {
      text,
      sender: senderId,
      createdAt: message.createdAt
    };
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', safeUserFields)
      .populate('recipient', safeUserFields);

    return res.status(201).json({
      conversationId: conversation._id,
      message: populatedMessage
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const limit = parseLimit(req.query.limit);

    const conversations = await Conversation.find({
      participants: userId
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('participants', safeUserFields)
      .populate('lastMessage.sender', safeUserFields);

    const items = await Promise.all(conversations.map(async (conversation) => {
      const partner = conversation.participants.find(
        (participant) => participant._id.toString() !== userId.toString()
      );

      const unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        recipient: userId,
        readAt: null
      });

      return {
        _id: conversation._id,
        partner,
        lastMessage: conversation.lastMessage,
        updatedAt: conversation.updatedAt,
        unreadCount
      };
    }));

    return res.json({ items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMessagesWithUser = async (req, res) => {
  try {
    const userId = req.userId;
    const partnerId = req.params.userId;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (partnerId.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Cannot open a conversation with yourself' });
    }

    const partner = await User.findById(partnerId).select(safeUserFields);
    if (!partner) return res.status(404).json({ message: 'User not found' });

    const limit = parseLimit(req.query.limit);
    const before = parseCursorDate(req.query.before);
    const conversation = await findConversationBetween(userId, partnerId);

    if (!conversation) {
      return res.json({
        conversationId: null,
        partner,
        items: [],
        pageInfo: {
          hasMore: false,
          nextCursor: null
        }
      });
    }

    const filter = { conversation: conversation._id };
    if (before) {
      filter.createdAt = { $lt: before };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('sender', safeUserFields)
      .populate('recipient', safeUserFields);

    const hasMore = messages.length > limit;
    const pageItems = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].createdAt.toISOString() : null;

    await Message.updateMany(
      {
        conversation: conversation._id,
        recipient: userId,
        readAt: null
      },
      {
        $set: { readAt: new Date() }
      }
    );

    return res.json({
      conversationId: conversation._id,
      partner,
      items: pageItems.reverse(),
      pageInfo: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
