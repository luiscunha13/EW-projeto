const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')
const crypto = require('crypto'); 

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

UserSchema.methods.validPassword = function(password) {
  console.log('username: ', this.username)
  console.log('email: ', this.email)
  console.log('password: ', this.password)
  console.log('salt: ', this.salt)
  console.log('role: ', this.role)
  if(!this.salt){
    throw new Error('Salt not available for user');
  }
  
  const hash= crypto.pbkdf2Sync(
    password,
    this.salt,
    310000, 
    32,
    'sha256'
  ).toString('hex');
  
  
  return this.password === hash;
};

module.exports = mongoose.model('user', UserSchema);