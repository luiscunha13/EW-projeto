const express = require('express');
const router = express.Router();
const Logs = require('../controllers/logs');
const axios = require('axios');

// Auxiliar para verificar o token JWT, pois nem todos tem acesso aos logs
const verifyToken = async (req, res, next) => {
    const token = req.query.token || req.body.token || req.get('Authorization');
    if (!token) {
        return res.status(401).jsonp({ error: 'No token provided' });
    }
    try {
        const response = await axios.get('http://localhost:13000/verify-admin', { token });
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

router.get('/', verifyToken, (req, res) => {
    Logs.getLogs()
    .then(logs => {
        res.status(200).jsonp(logs);
    })
    .catch(err => {
        console.error('Error fetching logs:', err);
        res.status(500).jsonp(err);
    });
});

router.get('/:user_id', (req, res) => {
    const userId = req.params.user_id;
    Logs.getLogsByUser(userId)
    .then(logs => {
        res.status(200).jsonp(logs);
    })
    .catch(err => {
        console.error('Error fetching logs:', err);
        res.status(500).jsonp(err);
    });
});

router.post('/', (req, res) => {
    const log = req.body;
    if (!log.user || !log.timestamp || !log.action) {
        return res.status(400).jsonp({ error: 'Missing required fields' });
    }
    
    Logs.addLog(log)
    .then(newLog => {
        res.status(201).jsonp(newLog);
    })
    .catch(err => {
        console.error('Error adding log:', err);
        res.status(500).jsonp(err);
    });
});

module.exports = router;