const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getLibrary,
  addEntry,
  updateEntry,
  deleteEntry,
} = require('../controllers/libraryController');

// All library routes are protected — user must be logged in
router.get('/',    authMiddleware, getLibrary);
router.post('/',   authMiddleware, addEntry);
router.patch('/:id', authMiddleware, updateEntry);
router.delete('/:id', authMiddleware, deleteEntry);

module.exports = router;
