import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

export default function Navbar(){
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="brand">SSN</Link>
        <div className="nav-links">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="nav-icon-link" title="Home">
            <Icon name="home" />
            <span className="sr-only">Home</span>
          </Link>
          {isAuthenticated && (
            <Link to="/feed" className="nav-icon-link" title="Feed">
              <Icon name="feed" />
              <span className="sr-only">Feed</span>
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/stories" className="nav-icon-link" title="Stories">
              <Icon name="story" />
              <span className="sr-only">Stories</span>
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/messages" className="nav-icon-link" title="Messages">
              <Icon name="message" />
              <span className="sr-only">Messages</span>
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/people" className="nav-icon-link" title="People">
              <Icon name="people" />
              <span className="sr-only">People</span>
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/profile" className="nav-icon-link" title="Profile">
              <Icon name="profile" />
              <span className="sr-only">Profile</span>
            </Link>
          )}
        </div>
      </div>
      {user ? (
        <div className="nav-user">
          <span>Hi, {user.firstName}</span>
          <button type="button" onClick={handleLogout} title="Logout">
            <Icon name="logout" />
            <span className="sr-only">Logout</span>
          </button>
        </div>
      ) : (
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </nav>
  )
}
