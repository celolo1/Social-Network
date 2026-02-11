import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_1234567890';
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    dbName: 'student-social-network-test'
  });
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  const clearOps = Object.values(collections).map((collection) => collection.deleteMany({}));
  await Promise.all(clearOps);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
