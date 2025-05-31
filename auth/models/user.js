const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  salt: { type: String, required: true },
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