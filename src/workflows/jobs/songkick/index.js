require('dotenv').config();
const ScrappyServer = require('../../../../ScrappyScrapper/index');
const mongoose = require('mongoose');

const Event = require('../../models/Event');
const Url = require('../../models/Url');
const worker = require('../../workers/songkick');

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
      worker: {
        scrapPattern: [/^\/artists\/.+/],
        start,
      },
      oneShot: true,
    }]);

    ScrappyServer.start();
  });
};

async function start(url, $) {

  saveUrl(url);

  const artist = await worker($);

  for(const i in artist.events) {
    (new Event(Object.assign(artist.events[i], artist.name))).save();
  }
}

async function saveUrl(_url) {
  const url = await Url.findOne({
    url: _url
  }).exec();

  if(!url) {
    new Url({url: _url, type:'artist', host: 'songkick'}).save();
  }
}