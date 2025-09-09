const pino = require('pino');
const level = process.env.LOG_LEVEL || 'info';
const transport = process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined;
module.exports = pino({ level, transport });
