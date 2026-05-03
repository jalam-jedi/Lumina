const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    passwordHash: { type: String, default: null },
    googleId:     { type: String, default: null },
    authProvider: { type: String, enum: ['local','google','both'], default: 'local' },
    avatar:       { type: String, default: '' },
    settings: {
      adultMode: { type: Boolean, default: false },
      excludeTypes: [{ type: String, enum: ['movie', 'tvshow', 'anime', 'manga', 'book'] }]
    }
  },
  { timestamps: true }
);

// Sparse unique index  allows many null googleIds, but no two equal non-null values
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// Pre-save: must have at least one auth method
// WHY async+throw instead of next(err):
// Mongoose v7+ supports async pre hooks — throwing rejects the save promise.
// Old callback-style next() can fail in Mongoose v9 in certain call paths.
userSchema.pre('save', async function () {
  if (!this.passwordHash && !this.googleId) {
    throw new Error('User must have a password or a Google account linked.');
  }
});


userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.passwordHash) throw new Error('This account uses Google Sign-In.');
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.googleId;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
