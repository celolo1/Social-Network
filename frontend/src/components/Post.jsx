import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import Icon from './Icon';

export default function Post({ post, onUpdate, onDelete }){
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const handleLike = async () => {
    try{
      const res = await api.post(`/posts/${post._id}/like`);
      onUpdate(res.data);
      setError(null);
    }catch(err){
      setError(err?.response?.data?.message || 'Unable to update like');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if(!trimmed) return;

    try{
      const res = await api.post(`/posts/${post._id}/comment`, { text: trimmed });
      setComment('');
      onUpdate(res.data);
      setError(null);
    }catch(err){
      setError(err?.response?.data?.message || 'Unable to add comment');
    }
  };

  const liked = user && post.likes && post.likes.find(id => id.toString() === user._id?.toString());
  const isOwner = user && post.author?._id && user._id?.toString() === post.author._id.toString();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete?.(post._id);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete post');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="card post-card">
      <div className="post-head">
        <Avatar
          src={post.author?.profilePicture}
          firstName={post.author?.firstName}
          lastName={post.author?.lastName}
          size={44}
        />
        <div>
          <Link className="post-author" to={`/users/${post.author?._id}`}>
            {post.author?.firstName} {post.author?.lastName}
          </Link>
          {post.author?.status && <div className="muted">{post.author.status}</div>}
        </div>
      </div>
      <div className="post-content">{post.content}</div>
      {post.image && <img className="post-image" src={post.image} alt="Post" />}
      <div className="post-date">{new Date(post.createdAt).toLocaleString()}</div>
      <div className="post-actions">
        <button onClick={handleLike} title={liked ? 'Unlike' : 'Like'}>
          <Icon name="like" size={15} />
          <span>{post.likes?.length || 0}</span>
        </button>
        {isOwner && (
          <button type="button" onClick={handleDelete} disabled={deleting} title="Delete post">
            <Icon name="trash" size={15} />
            {deleting && <span>Deleting</span>}
          </button>
        )}
      </div>
      <div className="post-comments">
        <strong className="comments-title">
          <Icon name="comment" size={14} />
          <span>Comments</span>
        </strong>
        {post.comments?.length === 0 && <div className="muted">No comments</div>}
        {post.comments?.map(c => (
          <div key={c._id || `${c.author?._id}-${c.createdAt}`} className="comment-row">
            <div className="comment-author"><strong>{c.author?.firstName} {c.author?.lastName}</strong></div>
            <div className="comment-text">{c.text}</div>
            <div className="comment-date">{new Date(c.createdAt).toLocaleString()}</div>
          </div>
        ))}

        {user ? (
          <form onSubmit={submitComment} className="comment-form">
            <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Write a comment..." maxLength={500} />
            <button type="submit" title="Send comment">
              <Icon name="send" size={14} />
            </button>
          </form>
        ) : <div className="muted">Log in to comment</div>}
        {error && <p className="error">{error}</p>}
      </div>
    </article>
  );
}
