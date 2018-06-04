const apiService = require('./concertoApi');
const artistService = require('./artist');
const locationService = require('./location');

async function isExists(event) {
  const result = await apiService.request('POST', '/searches/events', {
    name: event.name,
    fromScrapper: true,
  });

  return result.results.length > 0;
}

async function make(data) {
  let event = {};
  data.location = await locationService.make(data);
  if(!data.location) {
    return null;
  } else {
    data.location = data.location.id;
  }

  const result = await apiService.request('POST', '/searches/events', {
    name: data.name,
    fromScrapper: true,
  });

  if(result.pagination.totalCount === 0) {
    event = await apiService.request('PUT', '/events', data);
    console.log('put event : '+event.id);
  } else {
    event = await apiService.request('PATCH', `/events/${result.results[0].id}`, data);
    console.log('patch event : ' +event.id);
  }

  return createArtist(event, data);
}

async function createArtist(event, data) {
  if(data.artists) {
    event.artists = [];
    for(let i=0; i<data.artists.length; i++) {
      const dataArtist = data.artists[i];
      dataArtist.events = [
        event.id
      ];
      event.artists.push((await artistService.make(dataArtist)));
    }
  }

  return event;
}

module.exports = {
  isExists,
  createArtist,
  make,
};