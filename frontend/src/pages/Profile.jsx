import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Post from '../components/Post';
import Avatar from '../components/Avatar';

const mapUserToForm = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  profilePicture: user?.profilePicture || '',
  status: user?.status || '',
  bio: user?.bio || '',
  university: user?.university || '',
  major: user?.major || ''
});

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState(mapUserToForm(user));
  const [posts, setPosts] = useState([]);
  const [pageInfo, setPageInfo] = useState({ hasMore: false, nextCursor: null });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      const res = await api.get('/users/me');
      const nextUser = res.data?.user || null;
      setProfile(nextUser);
      setForm(mapUserToForm(nextUser));
      if (nextUser) updateUser(nextUser);
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        return;
      }
      setError(err?.response?.data?.message || 'Unable to load profile');
    } finally {
      setLoadingProfile(false);
    }
  }, [logout, updateUser]);

  const fetchPosts = useCallback(async ({ cursor, append = false } = {}) => {
    const profileId = profile?._id || user?._id;
    if (!profileId) return;

    setLoadingPosts(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.set('cursor', cursor);

      const res = await api.get(`/posts/user/${profileId}?${params.toString()}`);
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
  }, [logout, profile?._id, user?._id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile?._id || user?._id) {
      fetchPosts();
    }
  }, [fetchPosts, profile?._id, user?._id]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.patch('/users/me', form);
      const nextUser = res.data?.user || null;
      setProfile(nextUser);
      setForm(mapUserToForm(nextUser));
      if (nextUser) updateUser(nextUser);
      setSuccess('Profile updated');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await api.post('/users/me/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const nextUser = res.data?.user || null;
      setProfile(nextUser);
      setForm(mapUserToForm(nextUser));
      if (nextUser) updateUser(nextUser);
      setSuccess('Profile photo updated');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to upload profile photo');
    } finally {
      setUploadingPhoto(false);
      event.target.value = '';
    }
  };

  if (loadingProfile) {
    return <p className="muted">Loading profile...</p>;
  }

  return (
    <section className="profile-page">
      <div className="card profile-summary">
        <Avatar
          src={profile?.profilePicture}
          firstName={profile?.firstName}
          lastName={profile?.lastName}
          size={72}
        />
        <div className="profile-meta">
          <h2>{profile?.firstName} {profile?.lastName}</h2>
          <p className="muted">{profile?.email}</p>
          {profile?.status && <p>{profile.status}</p>}
          <div className="profile-stats">
            <span>{profile?.followersCount || 0} followers</span>
            <span>{profile?.followingCount || 0} following</span>
          </div>
        </div>
      </div>

      <form className="card profile-form" onSubmit={handleSubmit}>
        <h3>Edit profile</h3>
        <div className="photo-upload-row">
          <label className="file-upload">
            <span>{uploadingPhoto ? 'Uploading...' : 'Upload profile photo'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
            />
          </label>
          <span className="muted">Max 2MB - PNG, JPG, WEBP, GIF</span>
        </div>
        <div className="two-columns">
          <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" required />
          <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" required />
        </div>
        <input
          name="profilePicture"
          value={form.profilePicture}
          onChange={handleChange}
          placeholder="Profile picture URL"
          maxLength={2048}
        />
        <input
          name="status"
          value={form.status}
          onChange={handleChange}
          placeholder="Current status (e.g. Looking for internship)"
          maxLength={160}
        />
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Bio"
          maxLength={300}
        />
        <div className="two-columns">
          <input
            name="university"
            value={form.university}
            onChange={handleChange}
            placeholder="University"
            maxLength={120}
          />
          <input
            name="major"
            value={form.major}
            onChange={handleChange}
            placeholder="Major / Field"
            maxLength={120}
          />
        </div>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
        {success && <p className="success">{success}</p>}
      </form>

      {error && <p className="error">{error}</p>}

      <section className="profile-posts">
        <h3>My posts</h3>
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
