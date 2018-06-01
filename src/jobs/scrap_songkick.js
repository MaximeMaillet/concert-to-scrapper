const Scrapper = require('../services/scrapper');
const request = require('request');
const baseUrl = 'https://www.songkick.com';
const apiService = require('../services/concertoApi');
const moment = require('moment');
const urlCleaner = require('../services/urlCleaner');

async function doJob(job) {
  console.log('ok');
  const {
    name,
    events,
  } = job.data;

  try {
    const url = await doSearch(name);

    const data = await doArtist(urlCleaner.removeUtm(url));
    const artist = await apiArtist(Object.assign(data.artist, {events: data.events}));

  } catch(e) {
    console.log('DAMN !');
    console.log(e);
  }
}

/**
 * Return url for artist profile
 * @return {Promise.<void>}
 * @param name
 */
async function doSearch(name) {
  try {
    const scrapper = new Scrapper();
    await scrapper.isExists(`${baseUrl}/search?query=${name}`);
    console.log('isExists');

    const scr = await scrapper.get();
    return `${baseUrl}${scr('li.artist').find('a').attr('href')}`;

  } catch(e) {
    throw e;
  }
}

async function doArtist(url) {
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

module.exports = {
  name: 'scrapper-songkick',
  doJob,
};