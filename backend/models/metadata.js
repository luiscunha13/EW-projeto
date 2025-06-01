const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  comment: { type: String, required: true },
  date: { type: Date, required: true}
}, { _id: false }, { versionKey: false });

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
    enum: ['sport', 'academic', 'family', 'trip', 'work', 'personal', 'fun', 'other']
  },
  //Campos opcionais sport
  sport: String,
  activityTime: Number,
  activityDistance: Number,

  //Campos opcionais academic
  institution: String,
  course: String,
  schoolYear: Number,

  //Campos opcionais family
  familyMember: [String],

  //Campos opcionais trip
  places: [String],

  //Campos opcionais work
  company: String,
  position: String,

  //Campos opcionais personal
  feeling: String,

  //Campos opcionais fun
  artist: String,
  genre: String,
  movie: String,
  festival: String,
}, { versionKey: false });

module.exports = mongoose.model('metadata', MetadataSchema);