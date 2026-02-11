import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    lastMessage: {
      text: {
        type: String,
        default: ''
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      createdAt: {
        type: Date,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

ConversationSchema.pre('validate', function validateParticipants(next) {
  if (!Array.isArray(this.participants) || this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'));
  }

  const [a, b] = this.participants.map((id) => id.toString());
  if (a === b) {
    return next(new Error('Conversation participants must be different users'));
  }

  return next();
});

ConversationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Conversation', ConversationSchema);
