const mongoose = require('mongoose');

const liveRoomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostName: {
    type: String,
    required: true
  },
  hostAvatar: {
    type: String,
    default: ''
  },
  isLive: {
    type: Boolean,
    default: false
  },
  scheduledStartTime: {
    type: Date,
    required: true
  },
  actualStartTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  maxListeners: {
    type: Number,
    default: 1000
  },
  currentListeners: {
    type: Number,
    default: 0
  },
  speakers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    isHost: Boolean,
    isModerator: Boolean
  }],
  listeners: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date
  }],
  chatMessages: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  }],
  // dj_set rooms carry live audio from DJ mode (see services/liveRelay.js)
  roomType: {
    type: String,
    enum: ['talk', 'dj_set'],
    default: 'talk'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  genre: {
    type: String
  },
  language: {
    type: String,
    default: 'en'
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  coverImage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
liveRoomSchema.index({ isLive: 1 });
liveRoomSchema.index({ scheduledStartTime: 1 });
liveRoomSchema.index({ hostId: 1 });
liveRoomSchema.index({ isPublic: 1 });
liveRoomSchema.index({ genre: 1 });
liveRoomSchema.index({ language: 1 });
liveRoomSchema.index({ tags: 1 });

module.exports = mongoose.model('LiveRoom', liveRoomSchema);