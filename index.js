require('dotenv').config();
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

app.post('/hook/:entity/:object', (req, res) => {
  try {
    workflowManager.register(`${req.params.entity}-${req.params.object}`, req.body);
    res.status(204).send();
  } catch(err) {
    res.status(500).send(err);
  }
});

app.listen(process.env.API_PORT);


