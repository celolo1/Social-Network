import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import User from '../src/models/User.js';

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

describe('Posts API', () => {
  it('creates a post for the authenticated user and ignores body author spoofing', async () => {
    const alice = await registerUser({
      firstName: 'Alice',
      lastName: 'Poster',
      email: 'alice@posts.test'
    });
    const bob = await registerUser({
      firstName: 'Bob',
      lastName: 'Spoofer',
      email: 'bob@posts.test'
    });

    const createResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({
        content: 'Hello network',
        author: bob.user._id
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.content).toBe('Hello network');
    expect(createResponse.body.author._id).toBe(alice.user._id);
  });

  it('rejects post creation without auth token', async () => {
    const response = await request(app)
      .post('/api/posts')
      .send({ content: 'No auth' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authorization token is required');
  });

  it('returns a user feed with cursor pagination', async () => {
    const alice = await registerUser({
      firstName: 'Alice',
      lastName: 'Feed',
      email: 'alice@feed.test'
    });

    const createOps = [];
    for (let index = 0; index < 12; index += 1) {
      createOps.push(
        request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${alice.token}`)
          .send({ content: `post-${index}` })
      );
    }
    await Promise.all(createOps);

    const firstPage = await request(app)
      .get('/api/posts/feed?limit=10')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.items).toHaveLength(10);
    expect(firstPage.body.pageInfo.hasMore).toBe(true);
    expect(firstPage.body.pageInfo.nextCursor).toBeTypeOf('string');

    const secondPage = await request(app)
      .get(`/api/posts/feed?limit=10&cursor=${encodeURIComponent(firstPage.body.pageInfo.nextCursor)}`)
      .set('Authorization', `Bearer ${alice.token}`);

    expect(secondPage.status).toBe(200);
    expect(secondPage.body.items).toHaveLength(2);
    expect(secondPage.body.pageInfo.hasMore).toBe(false);
    expect(secondPage.body.pageInfo.nextCursor).toBeNull();
  });

  it('includes followed user posts in feed', async () => {
    const alice = await registerUser({
      firstName: 'Alice',
      lastName: 'Source',
      email: 'alice@follow.test'
    });
    const bob = await registerUser({
      firstName: 'Bob',
      lastName: 'Follower',
      email: 'bob@follow.test'
    });

    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ content: 'alice-post' });

    await User.findByIdAndUpdate(
      bob.user._id,
      { $addToSet: { following: alice.user._id } },
      { new: true }
    );

    const bobFeed = await request(app)
      .get('/api/posts/feed?limit=10')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(bobFeed.status).toBe(200);
    expect(bobFeed.body.items.some((post) => post.content === 'alice-post')).toBe(true);
  });

  it('toggles like and adds a comment on a post', async () => {
    const alice = await registerUser({
      firstName: 'Alice',
      lastName: 'Engage',
      email: 'alice@engage.test'
    });

    const createdPost = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ content: 'engagement-post' });

    const likeResponse = await request(app)
      .post(`/api/posts/${createdPost.body._id}/like`)
      .set('Authorization', `Bearer ${alice.token}`);

    expect(likeResponse.status).toBe(200);
    expect(likeResponse.body.likes).toHaveLength(1);

    const unlikeResponse = await request(app)
      .post(`/api/posts/${createdPost.body._id}/like`)
      .set('Authorization', `Bearer ${alice.token}`);

    expect(unlikeResponse.status).toBe(200);
    expect(unlikeResponse.body.likes).toHaveLength(0);

    const commentResponse = await request(app)
      .post(`/api/posts/${createdPost.body._id}/comment`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ text: 'great post' });

    expect(commentResponse.status).toBe(201);
    expect(commentResponse.body.comments).toHaveLength(1);
    expect(commentResponse.body.comments[0].text).toBe('great post');
    expect(commentResponse.body.comments[0].author._id).toBe(alice.user._id);
  });
});
