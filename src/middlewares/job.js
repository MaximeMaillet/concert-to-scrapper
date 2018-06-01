const Queue = require('bull');

function service(req, res, next) {

  const queueScrapping = new Queue('queue-scrapping', 'redis://127.0.0.1:6379');
  const jobScrapping = [];
// var audioQueue = new Queue('audio transcoding', {redis: {port: 6379, host: '127.0.0.1', password: 'foobared'}}); // Specify Redis connection using object

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