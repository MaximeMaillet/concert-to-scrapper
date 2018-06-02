require('dotenv').config();
const request = require('request');
let token = null;

function _request(method, url, data, headers) {
  if(token === null) {
    return new Promise.reject('No authentication');
  }

  return new Promise((resolve, reject) => {
    const _headers = Object.assign({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }, headers);

    const options = {
      url: process.env.CONCERTO_URL+url,
      method: method.toUpperCase(),
      headers: _headers,
      body: JSON.stringify(data),
    };

    function callback(error, response, body) {
      if (error || response.statusCode !== 200) {
        if(error) {
          console.log(error);
        }
        reject(response.body);
      } else {
        resolve(JSON.parse(body));
      }
    }

    request(options, callback);
  });
}

function authenticate() {
  return new Promise((resolve, reject) => {
    const options = {
      url: `${process.env.CONCERTO_URL}/authenticate/logins`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.fr',
        password: 'admin@test.fr'
      }),
    };

    function callback(error, response, body) {
      if (error || response.statusCode !== 200) {
        reject();
      } else {
        const response = JSON.parse(body);
        token = response.token;
        resolve(response);
      }
    }

    request(options, callback);
  });
}

module.exports = {
  request: _request,
  authenticate,
};