import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ['student', 'professional'],
      required: true,
      default: 'student'
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 72,
      select: false
    },
    profilePicture: {
      type: String,
      default: null
    },
    status: {
      type: String,
      default: '',
      trim: true,
      maxlength: 160
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300
    },
    university: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    major: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

UserSchema.index({ email: 1 }, { unique: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('User', UserSchema);
