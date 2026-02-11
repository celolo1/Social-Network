import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import Post from '../components/Post';
import { useAuth } from '../context/AuthContext';

export default function Feed(){
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ content: '', image: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageInfo, setPageInfo] = useState({ hasMore: false, nextCursor: null });
  const { user, logout } = useAuth();

  const fetchPosts = useCallback(async ({ cursor, append = false } = {}) => {
    setLoading(true);
    setError(null);

    try{
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.set('cursor', cursor);

      const res = await api.get(`/posts/feed?${params.toString()}`);
      const items = res.data?.items || [];
      const nextPageInfo = res.data?.pageInfo || { hasMore: false, nextCursor: null };

      setPosts((prev) => (append ? [...prev, ...items] : items));
      setPageInfo(nextPageInfo);
    }catch(err){
      const status = err?.response?.status;
      if (status === 401) {
        logout();
      }
      setError(err?.response?.data?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try{
      const content = form.content.trim();
      const image = form.image.trim();
      if (!content) {
        setError('Post content is required');
        return;
      }

      const res = await api.post('/posts', { content, image: image || null });
      setForm({ content: '', image: '' });
      setPosts((prev) => [res.data, ...prev]);
    }catch(err){
      setError(err?.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="feed">
      <h2>Feed</h2>

      <form onSubmit={submit} className="card post-form">
        <div className="muted">Posting as <strong>{user?.firstName} {user?.lastName}</strong></div>
        <textarea
          name="content"
          placeholder="What's on your mind?"
          value={form.content}
          onChange={handleChange}
          required
          maxLength={1000}
        />
        <input
          name="image"
          placeholder="Optional image URL"
          value={form.image}
          onChange={handleChange}
          maxLength={2048}
        />
        <button type="submit" disabled={submitting}>{submitting ? 'Posting...' : 'Post'}</button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="posts-list">
        {!loading && posts.length === 0 && <p className="muted">No posts yet in your network.</p>}
        {posts.map(p => (
          <Post
            key={p._id}
            post={p}
            onUpdate={(updated)=>{
              setPosts(prev=>prev.map(x=>x._id===updated._id?updated:x));
            }}
            onDelete={(postId) => {
              setPosts((prev) => prev.filter((item) => item._id !== postId));
            }}
          />
        ))}
      </div>

      {pageInfo.hasMore && (
        <button
          type="button"
          className="load-more"
          disabled={loading}
          onClick={() => fetchPosts({ cursor: pageInfo.nextCursor, append: true })}
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </section>
  );
}
