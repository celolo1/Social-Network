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

describe('Messages API', () => {
  it('allows direct messaging between users even when they do not follow each other', async () => {
    const alice = await registerUser({
      firstName: 'Alice',
      lastName: 'Messenger',
      email: 'alice@messages.test'
    });
    const bob = await registerUser({
      firstName: 'Bob',
      lastName: 'Receiver',
      email: 'bob@messages.test'
    });

    const sendResponse = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({
        recipientId: bob.user._id,
        text: 'Salut Bob!'
      });

    expect(sendResponse.status).toBe(201);
    expect(sendResponse.body.message.text).toBe('Salut Bob!');
    expect(sendResponse.body.message.sender._id).toBe(alice.user._id);
    expect(sendResponse.body.message.recipient._id).toBe(bob.user._id);

    const conversationsForBob = await request(app)
      .get('/api/messages/conversations')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(conversationsForBob.status).toBe(200);
    expect(conversationsForBob.body.items).toHaveLength(1);
    expect(conversationsForBob.body.items[0].partner._id).toBe(alice.user._id);
    expect(conversationsForBob.body.items[0].unreadCount).toBe(1);

    const threadResponse = await request(app)
      .get(`/api/messages/${alice.user._id}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(threadResponse.status).toBe(200);
    expect(threadResponse.body.items).toHaveLength(1);
    expect(threadResponse.body.items[0].text).toBe('Salut Bob!');

    const updatedConversationsForBob = await request(app)
      .get('/api/messages/conversations')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(updatedConversationsForBob.status).toBe(200);
    expect(updatedConversationsForBob.body.items[0].unreadCount).toBe(0);
  });

  it('rejects sending a message to self', async () => {
    const alice = await registerUser({
      firstName: 'Alice',
      lastName: 'Self',
      email: 'alice-self@messages.test'
    });

    const response = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({
        recipientId: alice.user._id,
        text: 'self message'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('You cannot send messages to yourself');
  });
});
