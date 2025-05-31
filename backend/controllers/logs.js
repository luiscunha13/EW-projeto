const Logs = require('../models/logs');

module.exports.getLogs = () => {
    return Logs.find().sort({ timestamp: -1 }).exec()
}

module.exports.getLogsByUser = (userId) => {
    return Logs.find({ user: userId }).sort({ timestamp: -1 }).exec()
}

module.exports.addLog = (log) => {
    const newLog = new Logs(log);
    return newLog.save();
}