const axios = require('axios');

// Auxiliar para verificar o token JWT, pois nem todos tem acesso aos logs

const verifyToken = async (req, res, next) => {
    const token = req.query.token || req.body.token || req.get('Authorization');
    if (!token) {
        return res.status(401).jsonp({ error: 'No token provided' });
    }
    try {
        const response = await axios.get('http://localhost:13000/verify-admin',  {
            headers: {
                Authorization: token,
            },
        });
        
        if (response.data && response.data.valid && response.data.isAdmin) {
            next();
        } else {
            res.status(401).jsonp({ error: 'Invalid token' });
        }
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(401).jsonp(err);
    }
}

const verifyTokenSimple = async (req, res, next) => {
    const token = req.query.token || req.body.token || req.get('Authorization');
    if (!token) {
        return res.status(401).jsonp({ error: 'No token provided' });
    }
    try {
        const response = await axios.get('http://localhost:13000/verify',  {
            headers: {
                Authorization: token,
            },
        });
        
        if (response.data && response.data.valid) {
            req.loggedUser = response.data.user; // Store user info in request object
            next();
        } else {
            res.status(401).jsonp({ error: 'Invalid token' });
        }
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(401).jsonp(err);
    }
}

const verifyTokenReturn = async (req) => {
  const token = req.query.token || req.body.token || req.get('Authorization');
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const response = await axios.get('http://localhost:13000/verify', {
      headers: {
        Authorization: token,
      },
    });
    
    if (response.data && response.data.valid) {
      return true;
    } else {
      throw new Error('Invalid token');
    }
  } catch (err) {
    throw new Error('Token verification failed: ' + err.message);
  }
};

module.exports.verifyTokenSimple = verifyTokenSimple;
module.exports.verifyToken = verifyToken;
module.exports.verifyTokenReturn = verifyTokenReturn;