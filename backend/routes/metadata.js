var express = require('express');
var router = express.Router();
var Metadata = require('../controllers/metadata');

router.get('/:pub_id', (req, res) => {
    const pubId = req.params.pub_id;
    Metadata.getMetadataByPubId(pubId)
    .then(metadata => {
        if (metadata) {
            res.status(200).json(metadata);
        } else {
            res.status(404).json({ message: 'Metadata não encontrada para a publicação indicada' });
        }
    })
    .catch(err => {
        console.error('Error fetching metadata:', err);
        res.status(500).json({ message: 'Internal server error' });
    });
});

module.exports = router;