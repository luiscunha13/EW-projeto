const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    user: String,
    timestamp: Date,
    action: String,
}, { versionKey: false });

module.exports = mongoose.model('log', LogSchema);
