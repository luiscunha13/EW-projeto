const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')

const UserSchema = new mongoose.Schema({
  username: String,
  name: String,
  authMethods: {
    google: { type: String, default: null },
    facebook: { type: String, default: null }
  },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('user', UserSchema);