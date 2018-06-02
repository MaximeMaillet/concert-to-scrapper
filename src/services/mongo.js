const mongoose = require('mongoose');
const moment = require('moment');

const Scrap = mongoose.model('Scrap', {
  from: String,
  label: String,
  scrapped_date: Date
});

function mongoConnect() {
  return new Promise((resolve, reject) => {
    mongoose.connect(`mongodb://${process.env.MONGO_HOST}/scrap`);
    const db = mongoose.connection;
    db.once('open', () => {
      resolve();
    });
  });
}

async function scrapFromArtist(url) {
  await mongoConnect();

  return new Promise((resolve, reject) => {
    Scrap.findOne({from: 'artist', label: url}, (err, scrap) => {
      if(err) {
        reject(err);
      } else {
        if(scrap) {
          const today = moment().subtract(1, 'days');
          const scrappedDate = moment(scrap.scrapped_date);
          if(today > scrappedDate) {
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          resolve(true);
        }
      }
    });
  });
}

async function scrapFromEvent(url) {
  await mongoConnect();

  return new Promise((resolve, reject) => {
    Scrap.findOne({from: 'event', label: url}, (err, scrap) => {
      if(err) {
        reject(err);
      } else {
        if(scrap) {
          const today = moment().subtract(1, 'days');
          const scrappedDate = moment(scrap.scrapped_date);
          if(today > scrappedDate) {
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          resolve(true);
        }
      }
    });
  });
}

async function scrapFromLocation(url) {
  await mongoConnect();

  return new Promise((resolve, reject) => {
    Scrap.findOne({from: 'location', label: url}, (err, scrap) => {
      if(err) {
        reject(err);
      } else {
        if(scrap) {
          const today = moment().subtract(1, 'days');
          const scrappedDate = moment(scrap.scrapped_date);
          if(today > scrappedDate) {
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          resolve(true);
        }
      }
    });
  });
}

async function addScrap(name, label) {
  try {
    const scrap = new Scrap({from: name, label: label, scrapped_date: new Date()});
    await scrap.save();
  } catch(e) {
    console.log(e);
  }
}

module.exports = {
  addScrap,
  scrapFromArtist,
  scrapFromEvent,
  scrapFromLocation,
};