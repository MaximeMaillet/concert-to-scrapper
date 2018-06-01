require('dotenv').config();
const Queue = require('bull');

function service(req, res, next) {

  const queueScrapping = new Queue('queue-scrapping', {
    redis: {
      port: process.env.REDIS_PORT,
      host: process.env.REDIS_HOST
    }
  });
  const jobScrapping = [];

  const songkick = require('../jobs/scrap_songkick');
  queueScrapping.process(songkick.name, songkick.doJob);
  jobScrapping.push(songkick.name);

  req.jobs = {
    scrap: (data) => {
      for(let i=0; i<jobScrapping.length; i++) {
        queueScrapping.add(jobScrapping[i], data);
      }
    }
  };

  next();
}

module.exports = {
  service,
};