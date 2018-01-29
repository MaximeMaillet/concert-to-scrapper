const mysql = require('mysql');

const mongoose = require('mongoose');
const Event = require('../../models/Event');
const artists = [];
const locations = [];

module.exports = async(job) => {

  const {
    workflow: {
      data: wfData
    }
  } = job.data;

  mongoose.connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/concert-to`);
  const connection = mysql.createConnection({
    host     : wfData.host,
    port: wfData.port,
    user     : wfData.user,
    password : wfData.password,
  });

  const events = await Event.find();
  events.filter((key) => {
    if(key.artist !== null && key.artist !== undefined) {

      return true;
    } else {
      return false;
    }
  });

  for(const i in events) {
    if(events[i].artist !== null && events[i].artist !== undefined) {
      pushArtist({
        name: events[i].artist,
        logo: events[i].logoArtist,
      });
    }

    pushLocation({
      lat: events[i].location.lat,
      lng: events[i].location.lng,
      name: events[i].name,
      address: events[i].address,
      cp: events[i].cp,
      city: events[i].city,
      country: events[i].country
    });
  }

  await connect(connection);

  await workflowArtist(connection);

  await workflowCities(connection);

  const values = [];

  const tArtist = artists.map((key) => key.name);
  const tLocation = locations.map((key) => key.name);
  for(const i in events) {
    const d = new Date();
    const index = tArtist.indexOf(events[i].artist);
    const idex = tLocation.indexOf(events[i].name);

    values.push([
      events[i].name,
      events[i].startDate,
      null,
      d,
      d,
      index !== -1 ? artists[index].id : null,
      events[i].hash,
      idex !== -1 ? locations[idex].id : null,
    ]);
  }

  await addEvents(connection, values);

  connection.end();

  const idsArray = events.map((key) => key._id);

  Event.remove({ _id: { $in: idsArray } }, (err) => {
    if (err) {
      throw err;
    }

    return 'OK';
  });
};

function connect(connection) {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        reject(err);
      }

      resolve();
    });
  });
}

async function workflowArtist(connection) {
  await getArtists(connection);

  const newArtists = artists.filter((key) => key.id === null).map((key) => {
    const d = new Date();
    return [key.name, key.logo, d, d];
  });

  if(newArtists.length > 0) {
    await addArtists(connection, newArtists);
  }

  await getArtists(connection);
}

function getArtists(connection) {
  return new Promise((resolve, reject) => {
    const _artists = artists.map((key) => key.name);
    connection.query('SELECT * FROM concerto.artists WHERE name IN (?)', [_artists], (err, results) => {
      if (err) {
        reject(err);
      }

      if (results && results.length > 0) {
        for (const i in results) {
          for (const j in artists) {
            if (artists[j].name === results[i].name) {
              artists[j].id = results[i].id;
            }
          }
        }
      }

      for (const j in artists) {
        if (artists[j].id === null || artists[j].id === undefined) {
          artists[j].id = null;
        }
      }

      resolve(artists);
    });
  });
}

function addArtists(connection, newArtists) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO concerto.artists(name, logo, createdAt, updatedAt) VALUES ?';
    connection.query(sql, [newArtists], (error, res) => {
      if (error) {
        reject(error);
      }

      resolve(res);
    });
  });
}

async function workflowCities(connection) {
  await getLocation(connection);

  const newLocations = locations.filter((key) => key.id === null).map((key) => {
    const d = new Date();
    return [key.name, key.address, key.cp, key.city, key.country, key.lat, key.lng, d, d];
  });

  if(newLocations.length > 0) {
    await addLocation(connection, newLocations);
  }

  await getLocation(connection);
}

function getLocation(connection) {
  return new Promise((resolve, reject) => {
    const _locations = locations.map((key) => key.name);
    connection.query('SELECT * FROM concerto.locations WHERE name IN (?)', [_locations], (err, results) => {
      if (err) {
        reject(err);
      }

      if (results.length > 0) {
        for (const i in results) {
          for (const j in locations) {
            if (locations[j].name === results[i].name) {
              locations[j].id = results[i].id;
            }
          }
        }
      }

      for (const j in locations) {
        if (locations[j].id === undefined) {
          locations[j].id = null;
        }
      }

      resolve(locations);
    });
  });
}

function addLocation(connection, newLocation) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO concerto.locations(name,address,cp,city,country,latitude,longitude,createdAt,updatedAt) VALUES ?';
    connection.query(sql, [newLocation], (error, res) => {
      if (error) {
        reject(error);
      }

      resolve(res);
    });
  });
}

function addEvents(connection, events) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT IGNORE INTO concerto.events (name, date_start, date_end, createdAt, updatedAt, artistId, hash, locationId) VALUES ?';
    connection.query(sql, [events], (error, res) => {
      if (error) {
        reject(error);
      }

      resolve(res);
    });
  });
}

function pushArtist(artist) {
  for(const i in artists) {
    if(artists[i].name === artist.name) {
      return;
    }
  }
  artists.push(artist);
}

function pushLocation(location) {
  for(const i in locations) {
    if(locations[i].name === location.name && locations[i].country === location.country) {
      return;
    }
  }
  locations.push(location);
}