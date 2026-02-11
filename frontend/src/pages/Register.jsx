import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/register', form);
      const { token, user } = res.data;
      login({ token, user });
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card auth-card">
      <h2>Register</h2>
      <form onSubmit={submit} className="auth-form">
        <input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} required />
        <input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required autoComplete="email" />
        <input name="password" type="password" placeholder="Password (8+ chars)" value={form.password} onChange={handleChange} required minLength={8} autoComplete="new-password" />
        <label>
          Role:
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="professional">Professional</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
