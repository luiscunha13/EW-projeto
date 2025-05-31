const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')

const UserSchema = new mongoose.Schema({
  username: String,
  name: String,
  authMethods: {
    google: { type: String, default: null }
  },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()},
  lastLogin: Date,
  feedBanned: { type: Boolean, default: false },
}, { versionKey: false });

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('user', UserSchema);