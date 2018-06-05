const baseUrl = 'https://www.songkick.com';

const Scrapper = require('../services/scrapper');
const mongoService = require('../services/mongo');

async function doSearch(name) {
  const scrapper = new Scrapper();
  await scrapper.isExists(`${baseUrl}/search?query=${name}`);

  const scr = await scrapper.get();
  const urls = {
    artists: [],
    events: [],
    locations: [],
  };

  scr('li.artist a.thumb').each((index, value) => {
    urls.artists.push(baseUrl+scr(value).attr('href'));
  });

  scr('li.venue a.thumb').each((index, value) => {
    urls.locations.push(baseUrl+scr(value).attr('href'));
  });

  scr('li.concert a.thumb').each((index, value) => {
    urls.events.push(baseUrl+scr(value).attr('href'));
  });

  scr('li.event a.thumb').each((index, value) => {
    urls.events.push(baseUrl+scr(value).attr('href'));
  });

  return urls;
}

async function doArtist(url) {
  const toScrap = await mongoService.scrapFromArtist(url);
  console.log('Artist ('+url+') to scrap : '+toScrap);
  let dataScrap = null;

  if(toScrap) {
    const scrapper = new Scrapper();
    await scrapper.isExists(url);
    const $ = await scrapper.get();
    mongoService.addScrap('artist', url);

    $('.microformat').each((index, value) => {
      let json = JSON.parse($(value).find('script').html());
      json.forEach((value) => {
        if (value['@type'] !== undefined) {
          if(value['@type'] === 'MusicGroup') {
            dataScrap = {
              name: value.name || null,
              logo: value.logo || null,
              popularity: value.interactionCount.replace(' UserLikes', '') || 0
            };
          }
        }
      });
    });

    return dataScrap;
  }
}

async function doEvent(url) {
  const toScrap = await mongoService.scrapFromEvent(url);
  console.log('Event ('+url+') to scrap : '+toScrap);
  const events = [];

  if(toScrap) {
    const scrapper = new Scrapper();
    await scrapper.isExists(url);
    const $ = await scrapper.get();
    mongoService.addScrap('event', url);

    $('.microformat').each((index, value) => {
      let json = JSON.parse($(value).find('script').html());
      json.forEach((value) => {
        if (
          value['@type'] !== undefined &&
          value['@type'] === 'MusicEvent' &&
          value['location'] &&
          value['location']['geo'])
        {
          const data = {
            name: value['location'] ? value['location']['name'] : null,
            url: value['url'],
            startDate: value['startDate'],
            description: value['description'],
            artists: value['performer'] ? value['performer'].map((val) => ({name: val.name})) : null,
            location: {
              name: value['location'] ? value['location']['name'] : null,
              url: value['location'] ? value['location']['sameAs'] : null,
              address: value['location'] && value['location']['address'] ? value['location']['address']['streetAddress'] : null,
              postal_code: value['location'] && value['location']['address'] ? value['location']['address']['postalCode'] : null,
              city: value['location'] && value['location']['address'] ? value['location']['address']['addressLocality'] : null,
              country: value['location'] && value['location']['address'] ? value['location']['address']['addressCountry'] : null,
              latitude: value['location'] && value['location']['geo'] ? value['location']['geo']['latitude'] : null,
              longitude: value['location'] && value['location']['geo'] ? value['location']['geo']['longitude'] : null,
            }
          };

          events.push(data);
        }
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