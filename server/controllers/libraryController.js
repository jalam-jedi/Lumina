const LibraryEntry = require('../models/LibraryEntry');

// ─────────────────────────────────────────────
//  GET /api/library   (protected)
//  Returns all library entries for the logged-in user.
//  Optional query params:
//    ?status=completed|planning|in-progress|dropped|paused
//    ?type=anime|movie|book …  (filters on mediaSnapshot.type)
// ─────────────────────────────────────────────
const getLibrary = async (req, res) => {
  try {
    const filter = { user: req.user._id };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.type)   filter['mediaSnapshot.type'] = req.query.type;

    const entries = await LibraryEntry.find(filter)
      .populate('media')          // populate full Media doc if ref exists
      .sort({ updatedAt: -1 });

    res.status(200).json({ entries });
  } catch (error) {
    console.error('getLibrary error:', error);
    res.status(500).json({ error: 'Server error fetching library.' });
  }
};

// ─────────────────────────────────────────────
//  POST /api/library   (protected)
//  Add a new entry to the user's library.
//  Body: { mediaSnapshot: { externalId, source, type, title, coverImage? },
//          status? }
//  OR:   { media: <ObjectId>, status? }   (for custom/DB-backed entries)
// ─────────────────────────────────────────────
const addEntry = async (req, res) => {
  try {
    const { mediaSnapshot, media, status } = req.body;

    // Must provide either a snapshot or a media ref
    if (!mediaSnapshot && !media) {
      return res.status(400).json({
        error: 'Provide either a mediaSnapshot or a media ID.',
      });
    }

    if (mediaSnapshot) {
      const { externalId, source, type, title } = mediaSnapshot;
      if (!externalId || !source || !type || !title) {
        return res.status(400).json({
          error: 'mediaSnapshot requires: externalId, source, type, title.',
        });
      }
    }

    const newEntryData = {
      user: req.user._id,
      status: status || 'planning',
      ...(req.body.progress ? { progress: req.body.progress } : {}),
    };

    if (media) newEntryData.media = media;
    if (mediaSnapshot) newEntryData.mediaSnapshot = mediaSnapshot;

    const entry = await LibraryEntry.create(newEntryData);

    res.status(201).json({ entry });
  } catch (error) {
    // Duplicate key error (11000) means the user already has this entry
    if (error.code === 11000) {
      console.error('Duplicate key error in addEntry:', error);
      return res.status(400).json({ error: 'This item is already in your library.' });
    }
    console.error('addEntry error:', error);
    res.status(500).json({ error: 'Server error adding entry.' });
  }
};

// ─────────────────────────────────────────────
//  PATCH /api/library/:id   (protected)
//  Update status, progress, rating, notes, tags, dates.
//  Only the owner can update their entry.
// ─────────────────────────────────────────────
const updateEntry = async (req, res) => {
  try {
    const entry = await LibraryEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'Library entry not found.' });
    }
    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorised to update this entry.' });
    }

    // Whitelist of updatable fields
    const allowed = ['status', 'progress', 'userRating', 'notes', 'tags', 'startedAt', 'completedAt', 'extra'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) entry[field] = req.body[field];
    });

    // Convenience: auto-set startedAt when status flips to in-progress
    if (req.body.status === 'in-progress' && !entry.startedAt) {
      entry.startedAt = new Date();
    }
    // Auto-set completedAt when status flips to completed
    if (req.body.status === 'completed' && !entry.completedAt) {
      entry.completedAt = new Date();
    }

    await entry.save();
    res.status(200).json({ entry });
  } catch (error) {
    console.error('updateEntry error:', error);
    res.status(500).json({ error: 'Server error updating entry.' });
  }
};

// ─────────────────────────────────────────────
//  DELETE /api/library/:id   (protected)
//  Remove an entry. Only the owner can delete.
// ─────────────────────────────────────────────
const deleteEntry = async (req, res) => {
  try {
    const entry = await LibraryEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'Library entry not found.' });
    }
    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorised to delete this entry.' });
    }

    await entry.deleteOne();
    res.status(200).json({ message: 'Entry removed from library.' });
  } catch (error) {
    console.error('deleteEntry error:', error);
    res.status(500).json({ error: 'Server error deleting entry.' });
  }
};

module.exports = { getLibrary, addEntry, updateEntry, deleteEntry };
