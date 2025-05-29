const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  authMethods: {
    google: { type: String, default: null },
    facebook: { type: String, default: null }
  },
  level: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

UserSchema.plugin(passportLocalMongoose, {
    usernameField: 'email', // email como campo de login
    usernameLowerCase: true, // emails em lowercase
    errorMessages: {
        UserExistsError: 'Já existe um utilizador com este email.'
      }
  });

module.exports = mongoose.model('user', UserSchema);