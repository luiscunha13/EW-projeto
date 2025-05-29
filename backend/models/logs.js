const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    user: { type: String, required: true },
    timestamp: { type: Date, required: true },
    action: { type: String, required: true },
})

module.exports = mongoose.model('logs', LogSchema);
