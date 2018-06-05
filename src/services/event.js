const apiService = require('./concertoApi');
const artistService = require('./artist');
const locationService = require('./location');

/**
 * @param event
 * @return {Promise.<null>}
 */
async function isExists(event) {
  const result = await apiService.request('POST', '/searches/events', {
    name: event.name,
    fromScrapper: true, //@todo remove
  });

  if(result.results.length > 0) {
    return result.results[0];
  } else {
    return null;
  }
}

/**
 * Make an event
 * @return {Promise.<null>}
 * @param dataEvent
 */
async function make(dataEvent) {
  if(!dataEvent || !dataEvent.name || !dataEvent.startDate) {
    return null;
  }

  const location = await locationService.make(dataEvent);

  if(!location) {
    return null;
  } else {
    dataEvent.location = location.id;
  }

  const event = await isExists(dataEvent);
  let eventStored = {};

  if(event) {
    eventStored = await apiService.request('PATCH', `/events/${event.id}`, dataEvent);
    console.log(`Event updated : ${eventStored.name} (${eventStored.id})`);
  } else {
    eventStored = await apiService.request('PUT', '/events', dataEvent);
    console.log(`Event created : ${eventStored.name} (${eventStored.id})`);
  }

  putArtists(eventStored, dataEvent.artists);
}

/**
 * Add event to artists
 * @param event : existing event
 * @param artists
 * @return {Promise.<void>}
 */
async function putArtists(event, artists) {
  if(artists && artists.length > 0) {
    for(let i=0; i<artists.length; i++) {
      const dataArtist = await artistService.isExists(artists[i]);

      if(dataArtist) {
        artistService.putEvent(dataArtist, event);
      } else {
        artists[i].events = [event.id];
        artistService.create(artists[i]);
      }
    }
  }
}

module.exports = {
  isExists,
  make,
};