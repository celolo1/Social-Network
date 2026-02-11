import mongoose from 'mongoose';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const StorySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      trim: true,
      maxlength: 220,
      default: ''
    },
    image: {
      type: String,
      default: null
    },
    viewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + ONE_DAY_MS),
      required: true
    }
  },
  {
    timestamps: true
  }
);

StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
StorySchema.index({ author: 1, createdAt: -1 });

StorySchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Story', StorySchema);
