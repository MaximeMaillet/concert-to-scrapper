const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  hash: String,
  name: String,
  artist: String,
  logoArtist: String,
  address: String,
  cp: Number,
  city: String,
  country: String,
  location: {
    lat: Number,
    lng: Number,
  },
  startDate: Date
});

module.exports = mongoose.model('Event', eventSchema);