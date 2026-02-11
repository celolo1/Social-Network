import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <section className="dashboard">
      <div className="card dashboard-hero">
        <h2>Bienvenue, {user?.firstName}.</h2>
        {user?.status && <p>{user.status}</p>}
        <p>Ton espace est pret. Tu peux publier, parcourir ton feed, mettre a jour ton profil et suivre des personnes.</p>
        <div className="dashboard-actions">
          <Link className="dashboard-link" to="/feed">
            <Icon name="feed" size={16} />
            <span>Feed</span>
          </Link>
          <Link className="dashboard-link dashboard-link-secondary" to="/stories">
            <Icon name="story" size={16} />
            <span>Stories</span>
          </Link>
          <Link className="dashboard-link dashboard-link-secondary" to="/messages">
            <Icon name="message" size={16} />
            <span>Messages</span>
          </Link>
          <Link className="dashboard-link dashboard-link-secondary" to="/profile">
            <Icon name="profile" size={16} />
            <span>Mon profil</span>
          </Link>
          <Link className="dashboard-link dashboard-link-secondary" to="/people">
            <Icon name="people" size={16} />
            <span>Trouver des personnes</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
