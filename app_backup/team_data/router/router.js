const express = require('express');
const router = express.Router();
const userRouter = require('./user_router');
const keyRouter = require('./key_router');
router.use(userRouter);
router.use(keyRouter);

const moment = require('moment'); require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

module.exports = router;        