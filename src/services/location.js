const apiService = require('./concertoApi');

async function make(data) {
  let location = null;

  if(!data.location || !data.location.latitude || !data.location.longitude || !data.location.city) {
    return location;
  }

  const result = await apiService.request('POST', '/searches/locations', {
    name: data.name,
    address: data.location.address,
    city: data.location.city,
    country: data.location.country,
    postal_code: data.location.postal_code,
    longitude: data.location.longitude,
    latitude: data.location.latitude,
    fromScrapper: true, // @todo remove
  });

  if(result.pagination.totalCount === 0) {
    location = await apiService.request('PUT', '/locations', data.location);
  } else {
    location = await apiService.request('PATCH', `/locations/${result.results[0].id}`, data.location);
  }

  return location;
}

module.exports = {
  make,
};