import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('Auth API', () => {
  it('registers a user and returns token + safe user payload', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Alice',
        lastName: 'Doe',
        email: 'alice@example.com',
        password: 'password123',
        role: 'student'
      });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTypeOf('string');
    expect(response.body.user.email).toBe('alice@example.com');
    expect(response.body.user.password).toBeUndefined();
  });

  it('rejects duplicate email registration', async () => {
    const payload = {
      firstName: 'Alice',
      lastName: 'Doe',
      email: 'alice@example.com',
      password: 'password123',
      role: 'student'
    };

    await request(app).post('/api/auth/register').send(payload);
    const duplicate = await request(app).post('/api/auth/register').send(payload);

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe('Email already in use');
  });

  it('logs in and returns a fresh token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Bob',
        lastName: 'Doe',
        email: 'bob@example.com',
        password: 'password123',
        role: 'student'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'password123'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeTypeOf('string');
    expect(loginResponse.body.user.email).toBe('bob@example.com');
  });

  it('rejects login with invalid password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Charlie',
        lastName: 'Doe',
        email: 'charlie@example.com',
        password: 'password123',
        role: 'student'
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'charlie@example.com',
        password: 'wrong_password'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  it('returns current authenticated user via /me', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Dina',
        lastName: 'Doe',
        email: 'dina@example.com',
        password: 'password123',
        role: 'professional'
      });

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registerResponse.body.token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe('dina@example.com');
    expect(meResponse.body.user.role).toBe('professional');
    expect(meResponse.body.user.password).toBeUndefined();
  });

  it('rejects /me without token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authorization token is required');
  });
});
