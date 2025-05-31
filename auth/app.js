var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const {v4 : uuidv4} = require('uuid');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

var mongoDB = 'mongodb://localhost:27017/EWprojeto';
mongoose.connect(mongoDB)
var connection = mongoose.connection
connection.on('error', console.error.bind(console, 'Erro na conexão ao MongoDB'))
connection.once('open', () => console.log('Conexão ao MongoDB realizada com sucesso'))

const User = require('./models/user');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Verificar se user já existe pelo Google ID
    let user = await User.findOne({ 'authMethods.google': profile.id });
    
    if (user) {
      // Usuário já existe
      user.lastLogin = (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})();
      await user.save();
      return done(null, user);
    }
    
    // Verificar se existe user com mesmo email
    user = await User.findOne({ username: profile.emails[0].value });
    
    if (user) {
      // Vincular conta Google ao user existente
      user.authMethods.google = profile.id;
      user.lastLogin = (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()
      await user.save();
      return done(null, user);
    }
    
    // Criar novo user
    user = new User({
      username: profile.emails[0].value,
      name: profile.displayName,
      authMethods: {
        google: profile.id
      },
      lastLogin: (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()
    });
    
    await user.save();
    return done(null, user);
    
  } catch (error) {
    return done(error, null);
  }
}));

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

var usersRouter = require('./routes/users')

var app = express();

app.use(session({
  genid: (req) => {
    return uuidv4(); // Gera um ID único para a sessão
  },
  secret: 'EngWeb2025',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in developme  nt
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
