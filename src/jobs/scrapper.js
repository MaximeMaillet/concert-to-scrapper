const urlCleaner = require('../services/urlCleaner');
const eventService = require('../services/event');
const artistService = require('../services/artist');

module.exports = async(job) => {
  const {
    data: {
      name,
    },
    job: scrapperInterface,
  } = job.data;

  try {
    const scrapper = require(scrapperInterface);
    console.log(`Start scrap : ${scrapper.baseUrl} for ${name}`);

    console.log('Authentication');
    const apiService = require('../services/concertoApi');
    await apiService.authenticate();

    console.log('Search for : '+name);
    const urls = await scrapper.doSearch(name);

    if(urls.artists && urls.artists.length > 0) {
      for(let i=0; i<urls.artists.length; i++) {
        const artist = await scrapper.doArtist(urlCleaner.removeUtm(urls.artists[i]));
        const artistExists = await artistService.isExists(artist);

        if(!artistExists) {
          await artistService.create(artist);
        }

        const events = await scrapper.doEvent(urlCleaner.removeUtm(urls.artists[i]));
        for(let i=0; i<events.length; i++) {
          eventService.make(events[i]);
        }
      }
    }

    if(urls.events && urls.events.length > 0) {
      for(let i=0; i<urls.events.length; i++) {
        const events = await scrapper.doEvent(urlCleaner.removeUtm(urls.events[i]));
        for(let i=0; i<events.length; i++) {
          eventService.make(events[i]);
        }
      }
    }

    return Promise.resolve('ok');
  } catch(e) {
    console.log('DAMN !');
    console.log(e);
  }
};