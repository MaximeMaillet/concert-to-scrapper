const Scrapper = require('../services/scrapper');
const request = require('request');
const baseUrl = 'https://www.songkick.com';
const apiService = require('../services/concertoApi');
const moment = require('moment');
const urlCleaner = require('../services/urlCleaner');
const mongoService = require('../services/mongo');
const eventService = require('../services/event');
const artistService = require('../services/artist');

async function doJob(job) {
  console.log('SongKick job');
  const {
    artist: {
      name,
    },
    events,
  } = job.data;

  try {

    console.log('Authentication');
    await apiService.authenticate();

    console.log('Search for : '+name);
    const urls = await doSearch(name);

    if(urls.artists.length > 0) {
      for(let i=0; i<urls.artists.length; i++) {
        doArtist(urlCleaner.removeUtm(urls.artists[i]));
        doEvent(urlCleaner.removeUtm(urls.artists[i]))
      }
    }

    if(urls.events.length > 0) {
      for(let i=0; i<urls.events.length; i++) {
        doEvent(urlCleaner.removeUtm(urls.events[i]))
      }
    }

    // const toScrap = await mongoService.scrapFromArtist(name);
    // console.log('Scrap ? '+toScrap);
    // job.progress(10);
    //
    // if(toScrap) {
    //   job.progress(20);
    //
    //
    //   console.log(urls);
    //
    //   if(urls && urls.artists) {
    //     job.progress(30);
    //     for(let i=0; i<urls.artists.length; i++) {
    //       doArtist(name, urlCleaner.removeUtm(urls.artists[i]));
    //     }
    //   }
    //
    //   if(urls && urls.locations) {
    //     job.progress(40);
    //     //
    //   }
    //
    //   if(urls && urls.events) {
    //     job.progress(50);
    //     //
    //   }
    // }


    // const artist = await apiArtist(Object.assign(data.artist, {events: data.events}));

  } catch(e) {
    console.log('DAMN !');
    console.log(e);
  }
}

/**
 * Return url for artist profile
 * @return {Promise.<{}>}
 * @param name
 */
async function doSearch(name) {
  try {
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

  } catch(e) {
    throw e;
  }
}

/**
 * Find artist and save his
 * @param url
 * @return {Promise.<void>}
 */
async function doArtist(url) {
  try {
    const toScrap = await mongoService.scrapFromArtist(url);
    console.log('Artist ('+url+') to scrap : '+toScrap);

    if(toScrap) {
      const dataScrapped = await getDataArtist(url);
      mongoService.addScrap('artist', url);

      const result = await apiService.request('POST', '/searches/artists', {
        name: dataScrapped.artist.name,
        fromScrapper: true,
      });

      if(result.results.length === 0) {
        doEvent(urlCleaner.removeUtm(url));
        artistService.make(dataScrapped.artist);
      }
    }
  } catch(e) {
    throw e;
  }
}

/**
 * Find events and save them
 * @param url
 * @return {Promise.<Array>}
 */
async function doEvent(url) {
  try {
    const toScrap = await mongoService.scrapFromEvent(url);
    console.log('Event ('+url+') to scrap : '+toScrap);

    if(toScrap) {
      const dataScrapped = await getDataEvent(url);
      mongoService.addScrap('event', url);

      const events = [];
      for(let i=0; i<dataScrapped.length;i++) {
        const event = await eventService.make(dataScrapped[i]);
        if(event) {
          events.push(event);
        }
      }

      return events;
    }
  } catch(e) {
    throw e;
  }
}

async function getDataArtist(url) {
  try {
    const dataScrap = await getDataScrap(url);

    const dataReturn = {
      artist: {
        name: null,
        logo: null,
        popularity: null,
        rating: null,
      },
      events: []
    };

    if(dataScrap.artist.name) {
      dataReturn.artist.name = dataScrap.artist.name;
    }

    if(dataScrap.artist.logo) {
      dataReturn.artist.logo = dataScrap.artist.logo;
    }

    if(dataScrap.artist.interactionCount) {
      dataReturn.artist.popularity = dataScrap.artist.interactionCount.replace(' UserLikes', '');
    }

    for(let i=0; i<dataScrap.events.length; i++) {
      const event = extractEvent(dataScrap.events[i]);
      if(event && event.startDate && moment(event.startDate, 'Y-m-d\\TH:i:sP').isValid()) {
        dataReturn.events.push(event);
      }
    }

    return dataReturn;
  } catch(e) {
    throw e;
  }
}

async function getDataScrap(url) {
  try {
    const scrapper = new Scrapper();
    await scrapper.isExists(url);

    const $ = await scrapper.get();
    const dataScrap = {
      artist: null,
      events: [],
    };

    $('.microformat').each(function() {
      let json = JSON.parse($(this).find('script').html());
      json.forEach(function (value) {
        if (value['@type'] !== undefined) {
          if(value['@type'] === 'MusicGroup') {
            dataScrap.artist = value;
          }
          else if(value['@type'] === 'MusicEvent') {
            dataScrap.events.push(value);
          }
        }
      });
    });

    return dataScrap;

  } catch(e) {
    throw e;
  }
}

async function getDataEvent(url) {
  try {
    const scrapper = new Scrapper();
    await scrapper.isExists(url);
    const $ = await scrapper.get();
    const dataScrap = []

    $('.microformat').each(function() {
      let json = JSON.parse($(this).find('script').html());
      json.forEach(function (value) {
        if (value['@type'] !== undefined && value['@type'] === 'MusicEvent') {
          if(value['location'] && value['location']['geo']) {
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

            dataScrap.push(data);
          }
        }
      });
    });

    return dataScrap;

  } catch(e) {
    throw e;
  }
}

async function makeEvent(dataScrapped) {
  dataScrapped.location = (await getLocationFromScrapped(dataScrapped)).id;
  return apiEvents(dataScrapped);
}

async function getLocationFromScrapped(dataScrapped) {
  const result = await apiService.request('POST', '/searches/locations', {
    name: dataScrapped.name,
    address: dataScrapped.location.address,
    city: dataScrapped.location.city,
    country: dataScrapped.location.country,
    postal_code: dataScrapped.location.postal_code,
    longitude: dataScrapped.location.longitude,
    latitude: dataScrapped.location.latitude,
    startDate: dataScrapped.startDate,
    fromScrapper: true,
  });

  if(result.results.length === 0) {
    return apiLocation(dataScrapped);
  } else {
    return result.results[0];
  }
}

async function apiArtist(data) {
  return apiService.request('PUT', '/artists', data);
}

async function apiEvents(data) {
  return apiService.request('PUT', '/events', data);
}

async function apiLocation(data) {
  return apiService.request('PUT', '/locations', data.location);
}

function extractEvent(data) {
  const dataReturn = {
    name: data.location.name ? data.location.name : null,
    url: data.url ? urlCleaner.removeUtm(data.url) : null,
    startDate: data.startDate ? data.startDate : null,
    description: data.description ? data.description : null,
  };

  if(data.performer) {
    dataReturn.performers = [];
    for(let i=0; i<data.performer.length; i++) {
      if(data.performer[i].name !== data.name) {
        dataReturn.performers.push({
          name: data.performer[i].name,
        });
      }
    }
  }

  if(data.location) {
    dataReturn.location = {};

    if(data.location.address) {
      dataReturn.location.city = data.location.address.addressLocality ? data.location.address.addressLocality : null;
      dataReturn.location.address = data.location.address.streetAddress ? data.location.address.streetAddress : null;
      dataReturn.location.postalCode = data.location.address.postalCode ? data.location.address.postalCode : null;
      dataReturn.location.country = data.location.address.addressCountry ? data.location.address.addressCountry : null;
    }

    if(data.location.geo) {
      dataReturn.location.longitude = data.location.geo.longitude ? data.location.geo.longitude : 0.0;
      dataReturn.location.latitude = data.location.geo.latitude ? data.location.geo.latitude : 0.0;
    }
  }

  return dataReturn;
}

module.exports = {
  name: 'scrapper-songkick',
  doJob,
};