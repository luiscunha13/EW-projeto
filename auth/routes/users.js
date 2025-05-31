const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
//const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const crypto = require('crypto');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const Auth = require('../auth/auth');
const User = require('../models/user');

router.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

/*// Estratégia Local (username/password)
passport.use(new LocalStrategy(
  { usernameField: 'email' }, // email como username
  function(email, password, cb) {
    UserController.getUserbyEmail(email , function(err, user) {
      if (err) { 
        console.error('Error fetching user with email:', email, err)
        return cb(err); }
      if (!user) { 
        console.log(`No user found with email: ${email}`);
        return cb(null, false, { message: 'Não existe nenhuma conta associada a esse email' }); 
      }
      
      if (!user.validPassword(password)) {
        console.log(`Invalid password for user with email: ${email}`);
        return cb(null, false, { message: 'Email ou password incorreto' });
      }
      
      return cb(null, user);
    });
  }
));*/

// Estratégia Google
/*
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, function(accessToken, refreshToken, profile, cb) {
  UserController.getUser({ 'authMethods.google': profile.id }, function(err, user) {
    if (err) { return cb(err); }
    
    if (!user) {
      // Criar novo usuário
      const newUser = new User({
        username: profile.emails[0].value.split('@')[0],
        email: profile.emails[0].value,
        authMethods: { google: profile.id },
        role: 'user'
      });
      
      newUser.save(function(err) {
        if (err) { return cb(err); }
        return cb(null, newUser);
      });
    } else {
      return cb(null, user);
    }
  });
}));
*/
// Estratégia Facebook
/*passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: '/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name']
}, function(accessToken, refreshToken, profile, cb) {
  UserController.findOne({ 'authMethods.facebook': profile.id }, function(err, user) {
    if (err) { return cb(err); }
    
    if (!user) {
      // Criar novo usuário
      const newUser = new User({
        username: profile.emails[0].value.split('@')[0],
        email: profile.emails[0].value,
        authMethods: { facebook: profile.id },
        role: 'user'
      });
      
      newUser.save(function(err) {
        if (err) { return cb(err); }
        return cb(null, newUser);
      });
    } else {
      return cb(null, user);
    }
  });
}));*/

/*// Serialização/Desserialização do usuário
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, role: user.role });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});*/

router.post('/register', (req, res, next) => {
  const now = new Date();
  console.log('Registo de utilizador:', req.body, 'em', now);
  User.register(new User({
    username: req.body.username,
    name: req.body.name,
    role: req.body.role || 'user',
    lastLogin: now,
    createdAt: now,
    authMethods: {
      google: null,
      facebook: null
    }
  }),
  req.body.password,
  (err, registeredUser) => {
    if (err) {
      console.error('Erro ao registar user:', err);
      return res.status(500).jsonp(err);
    }

    const token = jwt.sign(
      { id: registeredUser._id, role: registeredUser.role },
      'EngWeb2025',
      { expiresIn: '24h' }
    );

    res.status(201).jsonp({
      success: true,
      token,
    }); 
  });
});

router.post('/login', (req, res, next) => { passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return res.status(500).json({ success : false, message: 'Erro interno' });
    if (!user){
      console.log('Erro de autenticação:', info.message);
      console.error('Erro de autenticação:', err);

      return res.status(401).json({ success: false, message: info.message })};
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      'EngWeb2025',
      { expiresIn: '24h' }
    );
    
    user.lastLogin = new Date();
    user.save();
    
    res.status(201).jsonp({
      success: true,
      token,
    });
  })(req, res, next);
});

router.get('/login/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

/*router.get('/login/facebook', passport.authenticate('facebook', {
  scope: ['email']
}));*/

router.get('/auth/google/callback', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

/*router.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/',
  failureRedirect: '/login'
}));*/  

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


/*Verificação de Tokens*/

router.get('/verify', Auth.validateAndReturn, (req, res) => {
  res.status(200).json({
    valid: true,
    user: {
      id: req.user.id,
      role: req.user.role
    }
  });
});

router.get('/verify-admin', Auth.validateAndReturn, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      valid: false,
      message: 'User sem permissão para aceder ao conteúdo'
    });
  }
  
  res.status(200).json({
    valid: true,
    isAdmin: true,
    user: {
      id: req.user.id,
      role: req.user.role
    }
  });
});

/*PARTE DE DADOS*/
// Obter lista de utilizadores
router.get('/users', (req, res) => {
  UserController.list().then(users => {
    res.status(200).json(users);
  })
  .catch(err => {
    res.status(500).json(err);
  });
});

// Obter utilizador por ID
router.get('/users/:id', (req, res) => {
  UserController.getUser(req.params.id).then(user => {
    res.status(200).json(user);
  })
  .catch(err => {
    res.status(500).json(err);
  });
});

module.exports = router;