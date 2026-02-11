import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

export default function People() {
  const { logout } = useAuth();
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyIds, setBusyIds] = useState([]);

  const fetchUsers = useCallback(async (nextQuery = '') => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: '30' });
      if (nextQuery.trim()) params.set('q', nextQuery.trim());
      const res = await api.get(`/users/search?${params.toString()}`);
      setPeople(res.data?.items || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        return;
      }
      setError(err?.response?.data?.message || 'Unable to load people');
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(query);
    }, 250);

    return () => clearTimeout(timeout);
  }, [fetchUsers, query]);

  const toggleFollow = async (userId) => {
    if (busyIds.includes(userId)) return;

    setBusyIds((prev) => [...prev, userId]);
    try {
      const res = await api.post(`/users/${userId}/follow`);
      setPeople((prev) => prev.map((person) => (
        person._id === userId
          ? {
            ...person,
            isFollowing: res.data?.isFollowing,
            followersCount: res.data?.followersCount ?? person.followersCount
          }
          : person
      )));
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update follow');
    } finally {
      setBusyIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  return (
    <section className="people-page">
      <div className="card people-header">
        <h2>People</h2>
        <p className="muted">Find classmates and professionals to follow.</p>
        <div className="search-input-wrap">
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, university, major..."
          />
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading people...</p>}

      <div className="people-grid">
        {people.map((person) => {
          const isBusy = busyIds.includes(person._id);
          return (
            <article key={person._id} className="card person-card">
              <Avatar
                src={person.profilePicture}
                firstName={person.firstName}
                lastName={person.lastName}
                size={56}
              />
              <div className="person-content">
                <Link className="person-name" to={`/users/${person._id}`}>
                  {person.firstName} {person.lastName}
                </Link>
                {person.status && <p className="muted">{person.status}</p>}
                <p className="muted">{person.university || 'No university yet'}</p>
                <div className="person-stats">
                  <span>{person.followersCount || 0} followers</span>
                  <span>{person.followingCount || 0} following</span>
                </div>
                <div className="person-actions">
                  <button type="button" onClick={() => toggleFollow(person._id)} disabled={isBusy}>
                    {isBusy ? 'Updating...' : person.isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  <Link to={`/messages?user=${person._id}`} className="story-inline-link">
                    <Icon name="message" size={15} />
                    <span>Message</span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
        {!loading && people.length === 0 && (
          <p className="muted">No users found.</p>
        )}
      </div>
    </section>
  );
}
