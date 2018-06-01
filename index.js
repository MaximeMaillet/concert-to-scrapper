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

app.listen(8088);