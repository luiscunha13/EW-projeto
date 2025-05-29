var Metadata = require('../models/metadata');

module.exports.getMetadataByPubId = (pubId) => {
    return Metadata.findById(pubId).exec();
}