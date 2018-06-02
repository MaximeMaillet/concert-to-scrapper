const Scrapper = require('../services/scrapper');
const request = require('request');
const baseUrl = 'https://www.songkick.com';
const apiService = require('../services/concertoApi');
const moment = require('moment');
const urlCleaner = require('../services/urlCleaner');
const mongoService = require('../services/mongo');

async function doJob(job) {
  console.log('SongKick job');
  const {
    artist: {
      name,
    },
    events,
  } = job.data;

  try {

    console.log('Search for : '+name);
    const urls = await doSearch(name);

    if(urls.artists.length > 0) {
      for(let i=0; i<urls.artists.length; i++) {
        doArtist(urlCleaner.removeUtm(urls.artists[i]));
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
 * Save artists if not exists
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
        exactName: dataScrapped.artist.name,
        fromScrapper: true,
      });

      if(result.length === 0) {
        apiArtist(Object.assign(
          dataScrapped.artist,
          {events: dataScrapped.events}
        ));
      }
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

async function apiArtist(data) {
  return apiService.request('PUT', '/artists', data);
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