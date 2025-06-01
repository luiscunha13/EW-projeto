var FileInfo = require('../models/fileInfo');

module.exports.getFileInfoById = (id) => {
    return FileInfo.findById(id).exec();
}

module.exports.create = (fileInfo) => {
    const newFileInfo = new FileInfo(fileInfo);
    return newFileInfo.save();
}