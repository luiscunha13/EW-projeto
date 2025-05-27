const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const crypto = require('crypto');
var jwt = require('jsonwebtoken');
var auth = require('../auth/auth');
const User = require('../models/user');
var UserController = require('../controllers/user'); 


// Estratégia Local (username/password)
passport.use(new LocalStrategy(
  { usernameField: 'email' }, // email como username
  function(email, password, cb) {
    UserController.findOne({ email: email }, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { 
        return cb(null, false, { message: 'Não existe nenhuma conta associada a esse email.' }); 
      }
      
      if (!user.validPassword(password)) {
        return cb(null, false, { message: 'Email ou password incorreto.' });
      }
      
      return cb(null, user);
    });
  }
));

// Estratégia Google
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, function(accessToken, refreshToken, profile, cb) {
  UserController.findOne({ 'authMethods.google': profile.id }, function(err, user) {
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

router.post('/login/password', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

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

router.post('/signup', function(req, res, next) {
  // Gerar salt e hash da senha
  const salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword.toString('hex'),
      salt: salt.toString('hex'),
      role: 'user'
    });
    
    newUser.save(function(err) {
      if (err) {
        if (err.code === 11000) { // Erro de duplicação no MongoDB
          return res.redirect('/signup?error=email_exists');
        }
        return next(err);
      }
      
      req.login(newUser, function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
    });
  });
});

//DOS storees ver o que da para tirar daqui
router.post('/register', auth.validate, function(req, res) {
  const d = new Date().toISOString().substring(0, 19);
  const newUser = new User({
    username: req.body.username,
    name: req.body.name,
    level: req.body.level,
    active: true,
    dateCreated: d
  });

  User.register(newUser, req.body.password, function(err, user) {
    if (err) {
      res.jsonp({ error: err, message: "Register error: " + err });
    } else {
      passport.authenticate("local")(req, res, function() {
        jwt.sign(
          {
            username: req.user.username,
            level: req.user.level,
            sub: 'aula de EngWeb2023'
          },
          "EngWeb2023",
          { expiresIn: 3600 },
          function(e, token) {
            if (e) res.status(500).jsonp({ error: "Erro na geração do token: " + e });
            else res.status(201).jsonp({ token: token });
          }
        );
      });
    }
  });
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