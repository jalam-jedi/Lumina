const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─────────────────────────────────────────────
//  HELPER: creates and signs a JWT for a user
//  WHY SEPARATE FUNCTION: Both register & login
//  need to sign a token, so we avoid repeating code
// ─────────────────────────────────────────────
const signToken = (userId) => {
  return jwt.sign(
    { id: userId },          // payload: what we embed in the token
    process.env.JWT_SECRET,  // secret: used to sign + later verify
    { expiresIn: '7d' }      // token is valid for 7 days
  );
};

// ─────────────────────────────────────────────
//  REGISTER  →  POST /api/auth/register
// ─────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // 2. Check for duplicate username or email
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(400).json({ error: `${field} is already taken.` });
    }

    // 3. Hash the password
    //    saltRounds: 12 means bcrypt does 2^12 iterations — secure but not too slow
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create the user in MongoDB
    const user = await User.create({ username, email, passwordHash });

    // 5. Sign a JWT (toJSON() strips passwordHash from the response automatically)
    const token = signToken(user._id);
    res.status(201).json({ token, user });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};


// ─────────────────────────────────────────────
//  LOGIN  →  POST /api/auth/login
// ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 1. Find user — we need passwordHash so we select it explicitly
    //    (it's NOT excluded at the schema level, so normal findOne works)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // IMPORTANT: same error for wrong email AND wrong password
      // Never tell the attacker which one was wrong (security best practice)
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 2. Compare the plaintext password against the stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. All good — sign and return the token
    const token = signToken(user._id);
    res.status(200).json({ token, user }); // user.toJSON() auto-strips passwordHash

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

// ─────────────────────────────────────────────
//  GET ME  →  GET /api/auth/me   (protected)
//  Returns the currently logged-in user's data
//  authMiddleware already attached req.user for us
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};

module.exports = { register, login, getMe };
