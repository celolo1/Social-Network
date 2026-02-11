import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function Messages() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const activePartnerId = activePartner?._id || null;

  const fetchConversations = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingConversations(true);

    try {
      const res = await api.get('/messages/conversations?limit=40');
      setConversations(res.data?.items || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        return;
      }
      setError(err?.response?.data?.message || 'Unable to load conversations');
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  }, [logout]);

  const fetchThread = useCallback(async (partnerId, { silent = false } = {}) => {
    if (!partnerId) return;
    if (!silent) setLoadingMessages(true);

    try {
      const res = await api.get(`/messages/${partnerId}?limit=80`);
      setMessages(res.data?.items || []);
      if (!activePartner || activePartner._id !== partnerId) {
        setActivePartner(res.data?.partner || null);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        return;
      }
      setError(err?.response?.data?.message || 'Unable to load messages');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [activePartner, logout]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const queryUserId = searchParams.get('user');
    if (!queryUserId) return;

    const existing = conversations.find((item) => item.partner?._id === queryUserId);
    if (existing) {
      setActivePartner(existing.partner);
      fetchThread(queryUserId);
      return;
    }

    (async () => {
      try {
        const userRes = await api.get(`/users/${queryUserId}`);
        setActivePartner(userRes.data?.user || null);
        await fetchThread(queryUserId);
      } catch (err) {
        if (err?.response?.status === 401) {
          logout();
          return;
        }
        setError(err?.response?.data?.message || 'Unable to open this conversation');
      }
    })();
  }, [conversations, fetchThread, logout, searchParams]);

  useEffect(() => {
    if (!activePartnerId) return undefined;

    const intervalId = setInterval(() => {
      fetchThread(activePartnerId, { silent: true });
      fetchConversations({ silent: true });
    }, 6000);

    return () => clearInterval(intervalId);
  }, [activePartnerId, fetchConversations, fetchThread]);

  const openConversation = useCallback((partner) => {
    setActivePartner(partner);
    setSearchParams({ user: partner._id });
    fetchThread(partner._id);
  }, [fetchThread, setSearchParams]);

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();

    if (!activePartnerId) {
      setError('Select a conversation first');
      return;
    }
    if (!trimmed) return;

    setSending(true);
    setError(null);
    try {
      const res = await api.post('/messages', {
        recipientId: activePartnerId,
        text: trimmed
      });
      setMessages((prev) => [...prev, res.data.message]);
      setText('');
      fetchConversations({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  const conversationItems = useMemo(() => conversations.map((item) => (
    <button
      key={item._id}
      type="button"
      className={`conversation-item ${activePartnerId === item.partner?._id ? 'active' : ''}`}
      onClick={() => openConversation(item.partner)}
    >
      <Avatar
        src={item.partner?.profilePicture}
        firstName={item.partner?.firstName}
        lastName={item.partner?.lastName}
        size={40}
      />
      <div className="conversation-meta">
        <div className="conversation-name">
          {item.partner?.firstName} {item.partner?.lastName}
        </div>
        <div className="muted conversation-preview">{item.lastMessage?.text || 'No message yet'}</div>
      </div>
      {item.unreadCount > 0 && <span className="unread-badge">{item.unreadCount}</span>}
    </button>
  )), [activePartnerId, conversations, openConversation]);

  return (
    <section className="messages-page">
      <aside className="card conversations-panel">
        <div className="messages-panel-head">
          <h2>Messages</h2>
          <Link to="/people" className="dashboard-link dashboard-link-secondary messages-new-btn" title="New conversation">
            <Icon name="plus" size={16} />
            <span className="sr-only">Start new conversation</span>
          </Link>
        </div>
        {loadingConversations && <p className="muted">Loading conversations...</p>}
        <div className="conversations-list">
          {!loadingConversations && conversations.length === 0 && (
            <p className="muted">No conversations yet. Open a profile and start messaging.</p>
          )}
          {conversationItems}
        </div>
      </aside>

      <section className="card chat-panel">
        {activePartner ? (
          <>
            <header className="chat-head">
              <Avatar
                src={activePartner.profilePicture}
                firstName={activePartner.firstName}
                lastName={activePartner.lastName}
                size={44}
              />
              <div>
                <div className="chat-title">
                  <Link to={`/users/${activePartner._id}`}>
                    {activePartner.firstName} {activePartner.lastName}
                  </Link>
                </div>
                {activePartner.status && <div className="muted">{activePartner.status}</div>}
              </div>
            </header>

            <div className="messages-thread">
              {loadingMessages && <p className="muted">Loading messages...</p>}
              {!loadingMessages && messages.length === 0 && (
                <p className="muted">No messages yet. Say hello.</p>
              )}
              {messages.map((message) => {
                const mine = message.sender?._id === user?._id;
                return (
                  <div key={message._id} className={`message-row ${mine ? 'mine' : 'other'}`}>
                    <div className={`message-bubble ${mine ? 'mine' : 'other'}`}>
                      <p>{message.text}</p>
                      <span className="message-time">{formatTime(message.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <form className="message-form" onSubmit={handleSend}>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Write a message..."
                maxLength={1000}
              />
              <button type="submit" disabled={sending} title="Send message">
                <Icon name="send" size={16} />
                <span className="sr-only">Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="messages-empty">
            <Icon name="message" size={28} />
            <p>Select a conversation or start one from People.</p>
          </div>
        )}
      </section>

      {error && <p className="error">{error}</p>}
    </section>
  );
}
