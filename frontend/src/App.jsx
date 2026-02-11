import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import People from './pages/People';
import UserProfile from './pages/UserProfile';
import Messages from './pages/Messages';
import Stories from './pages/Stories';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

function Home() {
  return (
    <section className="home card">
      <h1>Student Social Network</h1>
      <p>Connect with students and professionals in one focused feed.</p>
      <p className="home-actions">
        <Link to="/register">Create account</Link>
        <span>/</span>
        <Link to="/login">Login</Link>
      </p>
    </section>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/feed"
        element={isAuthenticated ? <Feed /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/people"
        element={isAuthenticated ? <People /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/messages"
        element={isAuthenticated ? <Messages /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/stories"
        element={isAuthenticated ? <Stories /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/users/:id"
        element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="container">
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
