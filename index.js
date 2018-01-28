// const ScrappyServer = require('./ScrappyScrapper/index');
//
//
// ScrappyServer([
//   {
//     interval: 500,
//     baseUrl: 'https://www.songkick.com',
//     worker: require('./src/workers/worker-songkick/index'),
//     oneShot: true,
//     ip_change: {
//       os: 'osx',
//       card: 'en0',
//       current: 'LaGargouille',
//       ips: [
//         {'SSID': 'aux3maries_EXT', 'PASSWD':'aux3maries'},
//         {'SSID': 'LaGargouille', 'PASSWD':'La_Gargouille{14}'}
//       ]
//     }
//   }
// ]);
//
// ScrappyServer.start();

const express = require('express');
const bodyParser = require('body-parser');
const Arena = require('bull-arena');
const workflowManager = require('bull-workflow-manager');

const app = express();
const router = express.Router();
app.use(bodyParser.json());


workflowManager.init({
  parameters: `${__dirname}/src/workflows/parameters.yml`,
  jobs_directory:`${__dirname}/src/workflows/jobs`,
  workflows_directory:`${__dirname}/src/workflows/workflows`,
});

workflowManager.register('scrap', [
  {name: 'Senbeï'},
]);

const arena = Arena(
  {
    'queues': [{
      'name': process.env.QUEUE_NAME,
      'port': process.env.REDIS_PORT,
      'host': process.env.REDIS_HOST,
      'hostId': process.env.QUEUE_HOST_ID
    }]
  },
  {
    'port': 4001
  }
);
router.use('/', arena);

