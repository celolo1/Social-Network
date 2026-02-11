import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Stories() {
  const { user, logout } = useAuth();
  const [stories, setStories] = useState([]);
  const [form, setForm] = useState({ content: '', image: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get('/stories?limit=100');
      setStories(res.data?.items || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        return;
      }
      setError(err?.response?.data?.message || 'Unable to load stories');
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const groupedStories = useMemo(() => {
    const map = new Map();
    stories.forEach((story) => {
      const key = story.author?._id || story._id;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(story);
    });
    return Array.from(map.values());
  }, [stories]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const createStory = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        content: form.content.trim(),
        image: form.image.trim() || null
      };

      const res = await api.post('/stories', payload);
      const story = res.data?.story;
      if (story) setStories((prev) => [story, ...prev]);
      setForm({ content: '', image: '' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create story');
    } finally {
      setSubmitting(false);
    }
  };

  const markViewed = async (storyId) => {
    try {
      const res = await api.post(`/stories/${storyId}/view`);
      const updated = res.data?.story;
      if (!updated) return;
      setStories((prev) => prev.map((story) => (story._id === storyId ? updated : story)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to mark story as viewed');
    }
  };

  const deleteStory = async (storyId) => {
    try {
      await api.delete(`/stories/${storyId}`);
      setStories((prev) => prev.filter((story) => story._id !== storyId));
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete story');
    }
  };

  return (
    <section className="stories-page">
      <form className="card story-create-form" onSubmit={createStory}>
        <h2>Stories</h2>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="Share a quick update (optional if image is present)"
          maxLength={220}
        />
        <input
          name="image"
          value={form.image}
          onChange={handleChange}
          placeholder="Optional image URL"
          maxLength={2048}
        />
        <button type="submit" disabled={submitting} title="Create story">
          <Icon name="plus" size={16} />
          <span>Create story</span>
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading stories...</p>}

      <div className="stories-groups">
        {!loading && groupedStories.length === 0 && (
          <p className="muted">No active stories yet.</p>
        )}

        {groupedStories.map((group) => {
          const author = group[0]?.author;
          return (
            <article key={author?._id || group[0]?._id} className="card story-group-card">
              <header className="story-group-head">
                <Avatar
                  src={author?.profilePicture}
                  firstName={author?.firstName}
                  lastName={author?.lastName}
                  size={44}
                />
                <div>
                  <div className="story-author">
                    <Link to={`/users/${author?._id}`}>
                      {author?.firstName} {author?.lastName}
                    </Link>
                  </div>
                  {author?.status && <div className="muted">{author.status}</div>}
                </div>
              </header>

              <div className="story-items">
                {group.map((story) => {
                  const mine = story.author?._id === user?._id;
                  return (
                    <div key={story._id} className={`story-item ${story.viewed ? 'viewed' : 'fresh'}`}>
                      {story.image && <img src={story.image} alt="Story" className="story-image" />}
                      {story.content && <p className="story-content">{story.content}</p>}
                      <div className="story-meta">
                        <span className="muted">{formatDate(story.createdAt)}</span>
                        <span className="muted">{story.viewersCount || 0} views</span>
                      </div>
                      <div className="story-actions">
                        {!mine && !story.viewed && (
                          <button type="button" onClick={() => markViewed(story._id)} title="Mark as viewed">
                            <Icon name="story" size={15} />
                            <span>View</span>
                          </button>
                        )}
                        {mine && (
                          <button type="button" onClick={() => deleteStory(story._id)} title="Delete story">
                            <Icon name="trash" size={15} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
