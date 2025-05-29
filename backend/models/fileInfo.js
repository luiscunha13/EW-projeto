const mongoose = require('mongoose');

const FileInfoSchema = new mongoose.Schema({
    pub_id: { type: String, required: true },
    filename: { type: String, required: true },
    originalFilename: { type: String, required: true },
    file_path: { type: String, required: true },
    checksum: { type: String, required: true },
    mimeType: { type: String, required: true },
});

module.exports = mongoose.model('fileInfo', FileInfoSchema);