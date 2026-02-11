import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Post from '../components/Post';
import Icon from '../components/Icon';

export default function UserProfile() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pageInfo, setPageInfo] = useState({ hasMore: false, nextCursor: null });
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [busyFollow, setBusyFollow] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/users/${id}`);
      setProfile(res.data?.user || null);
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        return;
      }
      setError(err?.response?.data?.message || 'Unable to load profile');
    } finally {
      setLoading(false);
    }
  }, [id, logout]);

  const fetchPosts = useCallback(async ({ cursor, append = false } = {}) => {
    if (!id) return;
    setLoadingPosts(true);

    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.set('cursor', cursor);

      const res = await api.get(`/posts/user/${id}?${params.toString()}`);
      const items = res.data?.items || [];
      const nextPageInfo = res.data?.pageInfo || { hasMore: false, nextCursor: null };
      setPosts((prev) => (append ? [...prev, ...items] : items));
      setPageInfo(nextPageInfo);
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        return;
      }
      setError(err?.response?.data?.message || 'Unable to load posts');
    } finally {
      setLoadingPosts(false);
    }
  }, [id, logout]);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [fetchPosts, fetchProfile]);

  const handleFollow = async () => {
    if (!profile || busyFollow) return;

    setBusyFollow(true);
    setError(null);
    try {
      const res = await api.post(`/users/${profile._id}/follow`);
      setProfile((prev) => (prev ? {
        ...prev,
        isFollowing: res.data?.isFollowing,
        followersCount: res.data?.followersCount ?? prev.followersCount
      } : prev));
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update follow');
    } finally {
      setBusyFollow(false);
    }
  };

  if (loading) {
    return <p className="muted">Loading user profile...</p>;
  }

  if (!profile) {
    return <p className="muted">User not found.</p>;
  }

  const isMe = user?._id?.toString() === profile._id?.toString();

  return (
    <section className="profile-page">
      <div className="card profile-summary">
        <Avatar
          src={profile.profilePicture}
          firstName={profile.firstName}
          lastName={profile.lastName}
          size={72}
        />
        <div className="profile-meta">
          <h2>{profile.firstName} {profile.lastName}</h2>
          <p className="muted">{profile.email}</p>
          {profile.status && <p>{profile.status}</p>}
          {profile.bio && <p>{profile.bio}</p>}
          <div className="profile-stats">
            <span>{profile.followersCount || 0} followers</span>
            <span>{profile.followingCount || 0} following</span>
          </div>
          {isMe ? (
            <Link className="dashboard-link" to="/profile">Edit my profile</Link>
          ) : (
            <div className="profile-cta-row">
              <button type="button" onClick={handleFollow} disabled={busyFollow}>
                {busyFollow ? 'Updating...' : profile.isFollowing ? 'Unfollow' : 'Follow'}
              </button>
              <Link className="story-inline-link" to={`/messages?user=${profile._id}`}>
                <Icon name="message" size={15} />
                <span>Message</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="profile-posts">
        <h3>Posts</h3>
        {!loadingPosts && posts.length === 0 && <p className="muted">No posts yet.</p>}
        {posts.map((post) => (
          <Post
            key={post._id}
            post={post}
            onUpdate={(updated) => {
              setPosts((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
            }}
            onDelete={(postId) => {
              setPosts((prev) => prev.filter((item) => item._id !== postId));
            }}
          />
        ))}
        {pageInfo.hasMore && (
          <button
            type="button"
            className="load-more"
            disabled={loadingPosts}
            onClick={() => fetchPosts({ cursor: pageInfo.nextCursor, append: true })}
          >
            {loadingPosts ? 'Loading...' : 'Load more'}
          </button>
        )}
      </section>
    </section>
  );
}
