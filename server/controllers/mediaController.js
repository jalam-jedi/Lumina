const Media = require('../models/Media');

// ─────────────────────────────────────────────
//  POST /api/media/custom   (protected)
//  Create a custom media entry (webnovel, manhwa, personal etc.)
//  Only the authenticated user can add custom entries.
// ─────────────────────────────────────────────
const createCustom = async (req, res) => {
  try {
    const {
      title, mediaType, synopsis, genres,
      coverImage, year, score, metadata,
    } = req.body;

    if (!title || !mediaType) {
      return res.status(400).json({ error: 'title and mediaType are required.' });
    }

    const media = await Media.create({
      source:     'custom',
      externalId: null,        // custom entries have no external ID
      mediaType,
      title,
      coverImage: coverImage || '',
      synopsis:   synopsis   || '',
      genres:     genres     || [],
      year:       year       || null,
      score:      score      || null,
      metadata:   metadata   || {},
      isCustom:   true,
      addedBy:    req.user._id,
    });

    res.status(201).json({ media });
  } catch (error) {
    console.error('createCustom error:', error);
    res.status(500).json({ error: 'Server error creating custom media.' });
  }
};

// ─────────────────────────────────────────────
//  PATCH /api/media/custom/:id   (protected)
//  Update a custom entry — only the creator may update.
// ─────────────────────────────────────────────
const updateCustom = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media || !media.isCustom) {
      return res.status(404).json({ error: 'Custom media entry not found.' });
    }
    if (media.addedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorised to edit this entry.' });
    }

    const allowed = ['title', 'mediaType', 'synopsis', 'genres', 'coverImage', 'year', 'score', 'metadata'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) media[field] = req.body[field];
    });

    await media.save();
    res.status(200).json({ media });
  } catch (error) {
    console.error('updateCustom error:', error);
    res.status(500).json({ error: 'Server error updating custom media.' });
  }
};

// ─────────────────────────────────────────────
//  DELETE /api/media/custom/:id   (protected)
//  Delete a custom entry — only the creator may delete.
// ─────────────────────────────────────────────
const deleteCustom = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media || !media.isCustom) {
      return res.status(404).json({ error: 'Custom media entry not found.' });
    }
    if (media.addedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorised to delete this entry.' });
    }

    await media.deleteOne();
    res.status(200).json({ message: 'Custom media entry deleted.' });
  } catch (error) {
    console.error('deleteCustom error:', error);
    res.status(500).json({ error: 'Server error deleting custom media.' });
  }
};

module.exports = { createCustom, updateCustom, deleteCustom };
