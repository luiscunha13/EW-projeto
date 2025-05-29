const mongoose = require('mongoose');

const MetadataSchema = new mongoose.Schema({
  _id: {type: String, required: true},
  user: {type: String, required: true},
  creationDate: Date,
  lastModified: Date,
  title: {type: String, required: true},
  description: String,
  occurrenceDate: Date,
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