import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login(){
  const [form, setForm] = useState({ email:'', password:'' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try{
      const res = await api.post('/auth/login', form);
      const { token, user } = res.data;
      login({ token, user });
      navigate('/dashboard');
    }catch(err){
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card auth-card">
      <h2>Login</h2>
      <form onSubmit={submit} className="auth-form">
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required autoComplete="email" />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required autoComplete="current-password" />
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
