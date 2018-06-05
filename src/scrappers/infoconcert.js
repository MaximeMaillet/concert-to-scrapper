const baseUrl = 'https://www.infoconcert.com';

const Scrapper = require('../services/scrapper');
const mongoService = require('../services/mongo');

async function doSearch(name) {
  try {
    const scrapper = new Scrapper();
    await scrapper.isExists(`${baseUrl}/recherche-concert.html?motclef=${name}`);

    const scr = await scrapper.get();
    const urls = {
      artists: [],
      events: [],
      locations: [],
    };

    scr('a').each((index, value) => {
      const link = scr(value).attr('href');
      if(link.match(/^\/artiste.*\/concerts\.html$/)) {
        urls.artists.push(baseUrl+link);
      }

      if(link.match(/^\/salle.*\/concerts\.html$/) || link.match(/^\/festival.*\/concerts\.html$/)) {
        urls.events.push(baseUrl+link);
      }
    });

    return urls;

  } catch(e) {
    throw e;
  }
}

async function doArtist(url) {
  try {
    const toScrap = await mongoService.scrapFromArtist(url);
    // console.log(`Artist (${url}) to scrap : ${toScrap}`);

    if(toScrap) {
      const scrapper = new Scrapper();
      await scrapper.isExists(url);
      mongoService.addScrap('artist', url);

      const $ = await scrapper.get();

      return {
        name: $('h1[itemprop=name]').text(),
        type: $('.single-intro-top .genre').find('a').text(),
        popularity: $('span[itemprop=ratingCount]').text() | 0,
        logo: $('.single-intro .affiche').find('img').attr('src'),
      };
    }

    return null;
  } catch(e) {
    throw e;
  }
}

async function doEvent(url) {
  const toScrap = await mongoService.scrapFromEvent(url);
  const events = [];

  if(toScrap) {
    mongoService.addScrap('event', url);
    const scrapper = new Scrapper();
    await scrapper.isExists(url);

    const $ = await scrapper.get();
    const cpRegex = /(([0-8][0-9])|(9[0-5]))[0-9]{3}/;
    const dataScrap = {
      url: baseUrl+url,
      location: {
        name: $('h1[itemprop=name]').text(),
        address: $('.single-intro .adr .street-address').text(),
        postal_code: $('.single-intro .adr').text().match(cpRegex) ? $('.single-intro .adr').text().match(cpRegex)[0] : null,
        city: $('.single-intro .adr .locality').text(),
        country: '',
        latitude: $('.geo .latitude .value-title').attr('title'),
        longitude: $('.geo .longitude .value-title').attr('title'),
      }
    };

    $('.date-line').each((index, value) => {
      const artists = [];
      $(value).find('.spectacle a').each((index, value) => {
        artists.push({name: $(value).text().toLowerCase()});
      });
      events.push({
        name: $(value).find('.festival-associe a').text() ? $('.festival-associe a').text() : $('h1[itemprop=name]').text(),
        url: dataScrap.url,
        location: dataScrap.location,
        startDate: $(value).find('time').attr('datetime'),
        artists: artists,
      });
    });
  }

  return events;
}

module.exports = {
  enable: true,
  baseUrl,
  doSearch,
  doArtist,
  doEvent,
};