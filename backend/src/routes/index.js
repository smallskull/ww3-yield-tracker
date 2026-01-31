const express = require('express');
const router = express.Router();
const poolsRouter = require('./pools');

router.use('/pools', poolsRouter);

module.exports = router;