const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
//const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const crypto = require('crypto');
const cors = require('cors');
var jwt = require('jsonwebtoken');
var auth = require('../auth/auth');
const User = require('../models/user');
var UserController = require('../controllers/user'); 

router.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Estratégia Local (username/password)
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
));

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

// Serialização/Desserialização do usuário
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, role: user.role });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

// Rotas de Login/Logout
router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post('/login/local', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ error: err });
    if (!user) return res.status(401).json({ error: info.message });
    
    // Generate JWT token
    jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      "EngWeb2025", 
      { expiresIn: '1h' },
      function(e, token) {
        if (e) return res.status(500).json({ error: "Token generation error" });
        res.json({ token });
      }
    );
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

router.post('/register', async function(req, res) {
  const { username, email, password } = req.body;
  
  try {
    const existingUserEmail = await User.findOne({ email }).exec();
    if (existingUserEmail) {
      return res.status(400).json({ error: 'Já existe uma conta com este email' });
    }
    const existingUserUname = await User.findOne({ username }).exec();
    if (existingUserUname) {
      return res.status(400).json({ error: 'Username indisponível' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    console.log('Generated salt:', salt);
    const hashedPassword = crypto.pbkdf2Sync(
      password,
      salt,
      310000,
      32,
      'sha256'
    ).toString('hex');

    console.log('Generated salt:', salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      salt,
      role: 'user',
      createdAt: new Date()
    });

    await newUser.save();

    const token = await new Promise((resolve, reject) => {
      jwt.sign(
        {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        },
        "EngWeb2025",
        { expiresIn: '1h' },
        (e, token) => {
          if (e) reject(e);
          else resolve(token);
        }
      );
    });

    res.status(201).json({ token });
    
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Middleware para verificar autenticação
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Middleware para verificar se é admin
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).send('Access denied');
}


/*PARTE DE DADOS*/
// Obter lista de utilizadores
router.get('/users', auth.validate, (req, res) => {
  UserController.list().then(users => {
    res.status(200).json(users);
  })
  .catch(err => {
    res.status(500).json(err);
  });
});

// Obter utilizador por ID
router.get('/users/:id', auth.validate, (req, res) => {
  UserController.getUser(req.params.id).then(user => {
    res.status(200).json(user);
  })
  .catch(err => {
    res.status(500).json(err);
  });
});

module.exports = router;