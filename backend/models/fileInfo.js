const mongoose = require('mongoose');

const FileInfoSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    file_path: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
});

module.exports = mongoose.model('fileInfo', FileInfoSchema);