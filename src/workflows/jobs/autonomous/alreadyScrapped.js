const mongoose = require('mongoose');
const ScrappyServer = require('../../../../ScrappyScrapper/index');
const Event = require('../../models/Event');
const Url = require('../../models/Url');
const worker = require('../../workers/songkick');

module.exports = async(job) => {
  mongoose.connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/concert-to`);
  const db = mongoose.connection;
  db.once('open', async() => {
    const urls = await Url.find({host: 'songkick', type:'artist'});

    for(const i in urls) {
      ScrappyServer.init([{
        interval: 500,
        baseUrl: 'https://www.songkick.com',
        entrypoint: urls[i].url,
        worker: {
          scrapPattern: [/^\/artists\/.+/],
          start: async(url, $) => {
            const artist = await worker($);
            for(const i in artist.events) {
              (new Event(Object.assign(artist.events[i], artist.name))).save();
            }
          },
        },
        oneShot: true,
      }]);

      ScrappyServer.start();
    }
  });
};