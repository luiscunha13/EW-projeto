const express = require('express');
const router = express.Router();
const passport = require('passport');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const Auth = require('../auth/auth');
const User = require('../models/user');
const UserController = require('../controllers/user');

router.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


router.post('/register', (req, res, next) => {
  const now = (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()
  User.register(new User({
    username: req.body.username,
    name: req.body.name,
    role: req.body.role || 'user',
    lastLogin: now,
    createdAt: now,
    authMethods: {
      google: null,
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
      createdAt: registeredUser.createdAt,
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
    
    user.lastLogin = (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()
    user.save();
    
    res.status(201).jsonp({
      success: true,
      token,
    });
  })(req, res, next);
});

// Rota para iniciar autenticação Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Callback do Google
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Sucesso - cria JWT
    const token = jwt.sign(
      { 
        id: req.user._id, 
        role: req.user.role,  
      },
      'EngWeb2025',
      { expiresIn: '24h' }
    );
    
    // Redireciona para frontend com token
    res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
  }
);

// Rota para logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {console.log(err);return res.status(500).json(err);}
    res.json({ success: true, message: 'Logout realizado' });
  });
});


/*Verificação de Tokens*/

router.get('/verify', Auth.validateAndReturn, (req, res) => {
  UserController.getUser(req.user.id).then(user => {
    res.status(200).json({
      valid: true,
      user: user
    });
  })
  .catch(err => {
    res.status(500).json(err);
  });
});

router.get('/verify-admin', Auth.validateAndReturn, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      valid: false,
      message: 'User sem permissão para aceder ao conteúdo'
    });
  }

  UserController.getUser(req.user.id).then(user => {
    res.status(200).json({
      valid: true,
      isAdmin: true,
      user: user
    });
  })
  .catch(err => {
    res.status(500).json(err);
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

router.put('/users/:id', Auth.validateAndReturn, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'User sem permissão para atualizar utilizadores'
    });
  }

  const updateData = req.body;

  UserController.updateUser(req.params.id, updateData).then(() => {
    res.status(200).json(updateData);
  })
  .catch(err => {
    res.status(500).json(err);
  });
});

router.post('/users', Auth.validateAndReturn, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'User sem permissão para criar utilizadores'
    });
  }

  const now = (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()
  User.register(new User({
    username: req.body.username,
    name: req.body.name,
    role: req.body.role || 'user',
    lastLogin: null,
    createdAt: now,
    authMethods: {
      google: null,
    }
  }),
  req.body.password,
  (err, registeredUser) => {
    if (err) {
      console.error('Erro ao registar user:', err);
      return res.status(500).jsonp(err);
    }
    
    res.status(201).jsonp(registeredUser); 
  });
});


router.delete('/users/:id', Auth.validateAndReturn, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'User sem permissão para eliminar utilizadores'
    });
  }

  UserController.deleteUser(req.params.id).then(() => {
    res.status(200).json({ message: 'Utilizador eliminado com sucesso' });
  })
  .catch(err => {
    res.status(500).json(err);
  });
});

module.exports = router;