var jwt = require('jsonwebtoken')

module.exports.validateAndReturn = (req, res, next) => {
  var token = req.query.token || req.body.token || req.get('Authorization');
  console.log('Body ' + JSON.stringify(req.body))
  console.log('Query ' + JSON.stringify(req.query))
  console.log('Header ' + JSON.stringify(req.get('Authorization')))
  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }
  console.log('Token recebido:', token);
  if (token) {
    jwt.verify(token, 'EngWeb2025', (err, payload) => {
      if (err) {
        return res.status(401).jsonp({ valid: false, error: err.message });
      } else {
        req.user = payload; // Adiciona payload ao request
        next();
      }
    });
  } else {
    return res.status(401).jsonp({ valid: false, message: 'Token inexistente.' });
  }
};