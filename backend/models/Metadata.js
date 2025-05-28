const mongoose = require('mongoose');
const path = require('path');

const MetadataSchema = new mongoose.Schema({
  creationDate: { type: Date, required: true },
  submissionDate: { type: Date, default: Date.now },
  producer: { type: String, required: true },
  submitter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  resourceType: { 
    type: String, 
    required: true,
    enum: ['desporto', 'académico', 'familiar', 'viagem', 'trabalho', 'pessoal', 'entretenimento', 'outro']
  },
  description: String,
  tags: [String]
});

module.exports = mongoose.model('Metadata', MetadataSchema);