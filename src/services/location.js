const apiService = require('./concertoApi');

async function make(data) {
  const result = await apiService.request('POST', '/searches/locations', {
    name: data.name,
    address: data.location.address,
    city: data.location.city,
    country: data.location.country,
    postal_code: data.location.postal_code,
    longitude: data.location.longitude,
    latitude: data.location.latitude,
    startDate: data.startDate,
    fromScrapper: true,
  });

  if(result.results.length === 0) {
    return apiService.request('PUT', '/locations', data.location);
  } else {
    return apiService.request('PATCH', `/locations/${result.results[0].id}`, data.location);
  }
}

module.exports = {
  make,
};