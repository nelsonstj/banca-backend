const port = process.env.PORT || 2000;

const config = require('config');

const express = require('express');
const cors = require('cors');
const headerToSession = require('./middlewares/headerToSession');
const bodyParser = require('body-parser');
const passport = require('passport');
const morgan = require('morgan');
const routers = require('./routers');
const log = require('./helpers/log').logger;
const authHelper = require('./helpers/auth');
const userController = require('./controllers/user');

const app = express();

// Access log
app.use(morgan(config.get('morgan')));
app.use(bodyParser.json());

// Configuring authentication strategy
authHelper.configureAuth({ siscomConfig: config.get('siscom'), userController });

// TODO: configure cors (CRTICAL FOR SECURITY!!!)
const corsOptions = {
  origin: '*',
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));
app.use(headerToSession('authorization'));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/v1', routers.router);

app.listen(port, () => {
  log.info(`Server running at port ${port}`);
});

module.exports = app;
