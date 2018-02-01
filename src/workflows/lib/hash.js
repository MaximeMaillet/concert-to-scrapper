const md5 = require('md5');

module.exports.generateHash = (json) => {
  let hash = json.name+json.location.name+json.startDate;
  hash = hash.replace(/'/g, '');
  hash = hash.replace(/\s+/g, '');
  hash = hash.toLowerCase();
  return md5(hash);
};