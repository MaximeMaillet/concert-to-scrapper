const apiService = require('./concertoApi');

async function make(artist) {
  const result = await apiService.request('POST', '/searches/artists', {
    name: artist.name,
    fromScrapper: true,
  });

  if(result.results.length > 0) {
    const allEvents = result.results[0].events.map((val) => val.id).concat(artist.events);
    const mergedData = (Object.assign(result.results[0], artist));
    mergedData.events = dedupeEvents(allEvents);
    return apiService.request('PATCH', `/artists/${result.results[0].id}`, mergedData);
  } else {
    return apiService.request('PUT', '/artists', artist);
  }
}

function dedupeEvents(events) {
  return events.filter((elem, pos, arr) => {
      return arr.indexOf(elem) == pos;
  });
}

module.exports = {
  make,
};