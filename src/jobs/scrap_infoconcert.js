const scrapper = require('../scrappers/infoconcert');

async function doJob(job) {
  console.log('Infoconcert job');
  const {
    artist: {
      name,
    },
    events,
  } = job.data;

  // console.log('Authentication');
  // await apiService.authenticate();

  console.log(`Search for : ${name}`);
  const urls = await scrapper.doSearch(name);

  if(urls.artists.length > 0) {
    for(let i=0; i<urls.artists.length; i++) {
      const artist = await scrapper.doArtist(urls.artists[i]);
      // @todo go to service createArtist
    }
  }

  if(urls.events.length > 0) {
    for(let i=0; i<urls.events.length; i++) {
      const events = await scrapper.doEvent(urls.events[i]);
      // @todo go to service createEvent
    }
  }
}



module.exports = {
  name: 'scrapper-infoconcert',
  doJob,
};