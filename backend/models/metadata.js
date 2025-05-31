const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  comment: { type: String, required: true }
}, { _id: false });

const MetadataSchema = new mongoose.Schema({
  user: {type: String, required: true},
  creationDate: Date,
  lastModified: Date,
  occurrenceDate: Date,
  title: {type: String, required: true},
  description: {type: String, required: false},
  visibility : {
    type: String,
    required: true,
    enum: ['public', 'private'],
    default: 'private'
  },
  comments:[CommentSchema],
  files: [String],
  resourceType: { 
    type: String,
    required: true,
    enum: ['desporto', 'académico', 'familiar', 'viagem', 'trabalho', 'pessoal', 'entretenimento', 'outro']
  },
  //Campos opcionais desporto
  sport: String,
  activityTime: Number,
  activityDistance: Number,

  //Campos opcionais académico
  institution: String,
  course: String,
  schoolYear: Number,

  //Campos opcionais familiar
  familyMember: [String],

  //Campos opcionais viagem
  places: [String],

  //Campos opcionais trabalho
  company: String,
  position: String,

  //Campos opcionais pessoal
  feeling: String,

  //Campos opcionais entretenimento
  artist: String,
  genre: String,
  movie: String,
  festival: String,
});

module.exports = mongoose.model('metadata', MetadataSchema);