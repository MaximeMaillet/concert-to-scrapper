const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const urlSchema = new Schema({
  url: String,
  type: String,
  host: String,
});

module.exports = mongoose.model('Url', urlSchema);