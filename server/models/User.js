const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────
//  HYBRID AUTH SCHEMA DESIGN:
//
//  This schema supports TWO login methods:
//
//  Method A — Email/Password:
//    passwordHash is set, googleId is null
//
//  Method B — Google OAuth:
//    googleId is set, passwordHash is null
//    (they never set a password — Google handles it)
//
//  Method C — Both linked (future: "link accounts"):
//    Both googleId AND passwordHash are set
//
//  KEY RULE: at least one of (passwordHash, googleId) must exist.
//  We enforce this with a pre-save validator below.
// ─────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },

    // ── Email/Password Auth ──────────────────
    // optional: Google users won't have this
    passwordHash: {
      type: String,
      default: null,
    },

    // ── Google OAuth ─────────────────────────
    // The unique ID Google assigns to a user's Google account
    googleId: {
      type: String,
      default: null,
      sparse: true, // sparse index: allows multiple null values (non-Google users)
    },

    // Tracks how the account was originally created (for UX — e.g. "Sign in with Google")
    authProvider: {
      type: String,
      enum: ['local', 'google', 'both'],
      default: 'local',
    },

    avatar: {
      type: String,
      default: '', // Google OAuth will fill this with the Google profile picture URL
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
//  VALIDATION: user must have at least one auth method
// ─────────────────────────────────────────────
userSchema.pre('save', function (next) {
  if (!this.passwordHash && !this.googleId) {
    return next(new Error('User must have either a password or a Google account linked.'));
  }
  next();
});

// ─────────────────────────────────────────────
//  INSTANCE METHOD: comparePassword
//  Only valid for local (email/password) users
// ─────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.passwordHash) {
    throw new Error('This account uses Google Sign-In. No password is set.');
  }
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// ─────────────────────────────────────────────
//  SAFETY: strip sensitive fields before any JSON response
// ─────────────────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;  // never send the hash
  delete obj.googleId;      // internal — frontend doesn't need this
  return obj;
};

module.exports = mongoose.model('User', userSchema);
