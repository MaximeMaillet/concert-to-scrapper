const bodyParser = require('body-parser');

module.exports = {
  bodyParser: bodyParser.json(),
  urlencoded: bodyParser.urlencoded({ extended: false }),
};