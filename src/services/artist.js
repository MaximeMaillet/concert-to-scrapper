const apiService = require('./concertoApi');

async function isExists(artist) {
  const result = await apiService.request('POST', '/searches/artists', {
    name: artist.name,
    fromScrapper: true,
  });

  if(result.results.length > 0) {
    return result.results[0];
  } else {
    return null;
  }
}

async function create(artist) {
  try {
    const art = await apiService.request('PUT', '/artists', artist);
    console.log(`Artist created : ${art.name} (${art.id})`);
  } catch(e) {
    console.log('Artist created failed');
    console.log(e);
  }
}

async function putEvent(artist, event) {
  try {
    await apiService.request('PUT', `/artists/${artist.id}/events/${event.id}`);
    console.log(`Event putted : ${artist.name} (${artist.id}) < ${event.name} (${event.id})`);
  } catch(e) {

  }
}

module.exports = {
  create,
  putEvent,
  isExists,
};