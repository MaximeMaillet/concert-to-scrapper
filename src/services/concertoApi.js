require('dotenv').config();
const request = require('request');
let token = 'eyJhbGciOiJSUzI1NiJ9.eyJpZCI6NjQyLCJlbWFpbCI6ImFkbWluQHRlc3QuZnIiLCJpc0FjdGl2ZSI6dHJ1ZSwicm9sZXMiOlsiUk9MRV9VU0VSIiwiUk9MRV9BRE1JTiJdLCJleHAiOjE1Mjc4MDg4NjYsImlhdCI6MTUyNzgwNTI2Nn0.eg1MooMJQWcr8Bs_3vzt2vQ3ZnDMdoANJXg0cJoQVIWl5Y4dVLLWW-PG6nzT0JDgU8IPXig3GX17qZNMxtP1We675TqgDHzbUQeeyZ4mTUzSsus3vN-BmfLjflF5LZIi-K_43S8A6YZnKsP1UWMoH1s8n0wIn8emGXa2BuFQUKim_b0S6E3GnS9Jn1akFAteaCEyVYCZ0CHj3LS9TC_e0xA0BauD4WYnhg5aRJ8uZij2GSf0gYXeDuYGbeSJmsFPtBiQZPMKLzZYWpXjjhfMDnMgd6X4PFaJnBUig4gicO3YcSge8pj0B_GwOSMtG1Etqx_RzdVICx_UrRfcNOiE6rqdM81lbM_ohbU8YjHEw_rH4vJ_teU2-aABPTl3YPm13UTdmAsoLBe60rc5ofPjeIBVBNTlNnf9DH3hVwDZ5zT7_N4HQFtaXyirnsoA26sIOPx6zHLDvJ9IF44w9M6Db8qZISj6Bnw6WWoabNYKVK19buXzccHAl6EWDUEoLGfPNJ4ajqYhivr9eUpB_Lqo8fMZ-JUE_65KK1kYoPbg2pms8_15SGuRJI2ia8JofSIYbtWJ8hfIEKpzmqnCO6RwvMeZkXDFVF9x7L4-YslNRDb-ZmbGDKst4QISi-FaFV0WuaEVxxPyLe3pCo32unQWzUrKKZ4JD8fGJm-ZqMMCMvw';

function _request(method, url, data, headers) {
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
        if(!error && response.statusCode === 401) {
          return authenticate()
            .then((body) => {
              token = body.token;
              return _request(method, url, data, headers);
            })
            .catch((err) => {
              console.log('err auth');
            })
          ;
        } else {
          if(error) {
            console.log(error);
          } else {
            console.log(response.statusCode);
            console.log(response.body);
          }
          reject();
        }
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
        resolve(JSON.parse(body));
      }
    }

    request(options, callback);
  });
}

module.exports = {
  request: _request
};