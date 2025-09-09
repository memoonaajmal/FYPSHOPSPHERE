module.exports = {
  openapi: '3.0.0',
  info: { title: 'Fashion API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:' + (process.env.PORT || 4000) }],
  paths: {}
};
