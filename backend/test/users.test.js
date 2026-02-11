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

describe('Users API', () => {
  it('updates profile with photo and status', async () => {
    const user = await registerUser({
      firstName: 'Lina',
      lastName: 'Profile',
      email: 'lina@profile.test'
    });

    const updateResponse = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        profilePicture: 'https://example.com/avatar.jpg',
        status: 'Open to internship opportunities',
        bio: 'Computer science student',
        university: 'State University',
        major: 'Software Engineering'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.user.profilePicture).toBe('https://example.com/avatar.jpg');
    expect(updateResponse.body.user.status).toBe('Open to internship opportunities');
    expect(updateResponse.body.user.bio).toBe('Computer science student');
    expect(updateResponse.body.user.university).toBe('State University');
    expect(updateResponse.body.user.major).toBe('Software Engineering');
  });

  it('supports user search and follow/unfollow flow', async () => {
    const alice = await registerUser({
      firstName: 'Alice',
      lastName: 'Network',
      email: 'alice@users.test'
    });
    const bob = await registerUser({
      firstName: 'Bob',
      lastName: 'Network',
      email: 'bob@users.test'
    });

    const searchResponse = await request(app)
      .get('/api/users/search?q=Alice')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.items.some((item) => item._id === alice.user._id)).toBe(true);

    const followResponse = await request(app)
      .post(`/api/users/${alice.user._id}/follow`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(followResponse.status).toBe(200);
    expect(followResponse.body.isFollowing).toBe(true);
    expect(followResponse.body.followersCount).toBe(1);

    const profileResponse = await request(app)
      .get(`/api/users/${alice.user._id}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.user.followersCount).toBe(1);
    expect(profileResponse.body.user.isFollowing).toBe(true);

    const unfollowResponse = await request(app)
      .post(`/api/users/${alice.user._id}/follow`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(unfollowResponse.status).toBe(200);
    expect(unfollowResponse.body.isFollowing).toBe(false);
    expect(unfollowResponse.body.followersCount).toBe(0);
  });

  it('uploads profile photo file', async () => {
    const user = await registerUser({
      firstName: 'Photo',
      lastName: 'User',
      email: 'photo@users.test'
    });

    const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+f+QAAAAASUVORK5CYII=';
    const tinyPngBuffer = Buffer.from(tinyPngBase64, 'base64');

    const uploadResponse = await request(app)
      .post('/api/users/me/photo')
      .set('Authorization', `Bearer ${user.token}`)
      .attach('photo', tinyPngBuffer, 'avatar.png');

    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.body.user.profilePicture).toContain('/uploads/');
  });
});
