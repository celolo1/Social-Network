import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

const registerUser = async ({ firstName, lastName, email, password = 'password123', role = 'student' }) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      firstName,
      lastName,
      email,
      password,
      role
    });

  return response.body;
};

describe('Stories API', () => {
  it('creates, lists, marks viewed, and deletes stories', async () => {
    const alice = await registerUser({
      firstName: 'Alice',
      lastName: 'Story',
      email: 'alice@stories.test'
    });
    const bob = await registerUser({
      firstName: 'Bob',
      lastName: 'Viewer',
      email: 'bob@stories.test'
    });

    const createResponse = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ content: 'My first story' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.story.content).toBe('My first story');
    expect(createResponse.body.story.author._id).toBe(alice.user._id);

    const listResponse = await request(app)
      .get('/api/stories')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].viewed).toBe(false);

    const markViewedResponse = await request(app)
      .post(`/api/stories/${createResponse.body.story._id}/view`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(markViewedResponse.status).toBe(200);
    expect(markViewedResponse.body.story.viewed).toBe(true);
    expect(markViewedResponse.body.story.viewersCount).toBe(1);

    const forbiddenDelete = await request(app)
      .delete(`/api/stories/${createResponse.body.story._id}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(forbiddenDelete.status).toBe(403);

    const deleteResponse = await request(app)
      .delete(`/api/stories/${createResponse.body.story._id}`)
      .set('Authorization', `Bearer ${alice.token}`);

    expect(deleteResponse.status).toBe(204);
  });
});
