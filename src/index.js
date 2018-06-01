var Queue = require('bull');

var videoQueue = new Queue('video transcoding', 'redis://127.0.0.1:6379');
// var audioQueue = new Queue('audio transcoding', {redis: {port: 6379, host: '127.0.0.1', password: 'foobared'}}); // Specify Redis connection using object

videoQueue.process(function(job, done){

  // job.data contains the custom data passed when the job was created
  // job.id contains id of this job.

  // transcode video asynchronously and report progress
  job.progress(42);
  console.log(job.data);

  // call done when finished
  done();
});

videoQueue.add({video: 'http://example.com/video1.mov'});
console.log('done');