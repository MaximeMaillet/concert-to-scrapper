const {hash} = require('../lib');

module.exports = async($) => {

  const artist = {
    events: [],
  };

  $('.microformat').each(function() {
    const json = JSON.parse($(this).find('script').html());
    json.forEach((value) => {
      if (value['@type'] !== undefined) {
        if (value['@type'] === 'MusicGroup') {
          checkArtist(artist, value);
        }
        else if (value['@type'] === 'MusicEvent') {
          artist.events.push(checkEvent(value));
        }
      }
    });
  });

  return artist;
};

function checkEvent(value) {
  const _hash = hash.generateHash(value);
  return {
    'hash': _hash,
    'name': value.location.name,
    'address': value.location.address.streetAddress,
    'cp': value.location.address.postalCode,
    'city': value.location.address.addressLocality,
    'country': value.location.address.addressCountry,
    'location': {
      lat: value.location.geo !== undefined ? value.location.geo.latitude : 0,
      lng: value.location.geo !== undefined ? value.location.geo.longitude : 0
    },
    'startDate': value.startDate,
  };
}

function checkArtist(artist, value) {
  artist.name = value.name;
  artist.logoArtist = value.logo;
}