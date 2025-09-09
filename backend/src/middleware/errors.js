const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

exports.notFound = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ error: { message: 'Not Found', code: 'NOT_FOUND' } });
};

exports.errorHandler = (err, req, res, next) => { // eslint-disable-line
  const status = err.statusCode || err.status || StatusCodes.BAD_REQUEST;
  const code = err.code || 'BAD_REQUEST';
  const message = err.message || 'Something went wrong';
  if (status >= 500) logger.error(err);
  res.status(status).json({ error: { message, code } });
};
