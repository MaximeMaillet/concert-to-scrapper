require('dotenv').config();
const ScrappyServer = require('../../../../ScrappyScrapper/index');
const mongoose = require('mongoose');
const md5 = require('md5');
// const Schema = mongoose.Schema;
// const EventModel = require('../../models/Event');
//
// const eventSchema = new Schema(EventModel);
// const Event = mongoose.model('Event', eventSchema);
const Event = require('../../models/Event');

const worker = {
  scrapPattern: [/^\/artists\/.+/],
  isAlreadyScrapped,
  start,
};

module.exports = async(job) => {
  const {
    body
  } = job.data;
  mongoose.connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/concert-to`);
  const db = mongoose.connection;
  db.once('open', () => {
    ScrappyServer.init([{
      interval: 500,
      baseUrl: 'https://www.songkick.com',
      entrypoint: `https://www.songkick.com/search?query=${body.name}`,
      worker: worker,
      oneShot: true,
    }]);

    ScrappyServer.start();
  });
};

function isAlreadyScrapped(url) {
  return Promise.reject();
}

function start(url, $) {
  const events = [];
  let artist = {};
  $('.microformat').each(function() {
    const json = JSON.parse($(this).find('script').html());
    json.forEach((value) => {
      if (value['@type'] !== undefined) {
        if (value['@type'] === 'MusicGroup') {
          artist = checkArtist(value);
        }
        else if (value['@type'] === 'MusicEvent') {
          events.push(checkEvent(value));
        }
      }
    });
  });

  for(const i in events) {
    (new Event(Object.assign(events[i], artist))).save();
  }
}

function generateHash(json) {
  let hash = json.name+json.location.name+json.startDate;
  hash = hash.replace(/'/g, '');
  hash = hash.replace(/\s+/g, '');
  hash = hash.toLowerCase();
  return md5(hash);
}

function checkEvent(value) {
  const hash = generateHash(value);
  return {
    'hash': hash,
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

function checkArtist(value) {
  return {
    artist: value.name,
    logoArtist: value.logo,
  };
}