require('dotenv').config();
const Queue = require('bull');
const path = require('path');
const fs = require('fs');

function service(req, res, next) {

  const queueScrapping = new Queue('queue-scrapping', {
    redis: {
      port: process.env.REDIS_PORT,
      host: process.env.REDIS_HOST
    }
  });

  const scrapper = require('../jobs/scrapper');
  queueScrapping.process('scrapper', scrapper);

  req.jobs = {
    scrap: (data) => {
      fs.readdir(`${path.resolve('.')}/src/scrappers`, (err, files) => {
        files.forEach(file => {
          queueScrapping.add('scrapper', {
            data: data,
            job: `${path.resolve('.')}/src/scrappers/${file}`,
          });
        });
      });
    }
  };

  next();
}

module.exports = {
  service,
};