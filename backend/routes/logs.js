const express = require('express');
const router = express.Router();
const Logs = require('../controllers/logs');
const cors = require('cors');
const { verifyTokenSimple, verifyToken, verifyTokenReturn } = require('../utils/auth');

router.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

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

router.get('/:username', (req, res) => {
    const username = req.params.username;
    Logs.getLogsByUser(username)
    .then(logs => {
        res.status(200).jsonp(logs);
    })
    .catch(err => {
        console.error('Error fetching logs:', err);
        res.status(500).jsonp(err);
    });
});

router.post('/', async (req, res) => {
    const log = {user: req.body.log.user, timestamp: req.body.log.timestamp, action: req.body.log.action};

    if (!log.user || !log.timestamp || !log.action) {
        return res.status(400).jsonp({ error: 'Missing required fields' });
    }

    if (log.action !== 'login' && log.action !== 'register') {
        try {
            await verifyTokenReturn(req);
        } catch (err) {
            console.error('Token verification failed:', err.message);
            return res.status(401).jsonp({ error: 'Invalid token' });
        }
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