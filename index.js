require('dotenv').config();
const express = require('express');
const router = require('express-imp-router');
const path = require('path');

const app = express();
router(app);

router.route([{
  routes: `${path.resolve('.')}/src/routes.json`,
  controllers: `${path.resolve('.')}/src/controllers`,
  middlewares: `${path.resolve('.')}/src/middlewares`,
}]);

app.listen(process.env.API_PORT);
console.log(`API started at port ${process.env.API_PORT}`);