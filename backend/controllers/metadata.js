var Metadata = require('../models/metadata');

module.exports.getMetadataByPubId = (pubId) => {
    return Metadata.findById(pubId).exec();
}

module.exports.getMetadataUserPublic = (user) => {
    return Metadata.find({ user: user, visibility: 'public' }).sort({ creationDate: -1 }).exec()
}

module.exports.getMetadataPublic = () => {
    return Metadata.find({ visibility: 'public' }).sort({ creationDate: -1 }).exec();
}

module.exports.getMetadataByUser = (user) => {
    return Metadata.find({ user: user }).sort({ creationDate: -1 }).exec();
}

module.exports.create = (metadata) => {
    const newMetadata = new Metadata(metadata);
    return newMetadata.save();
}