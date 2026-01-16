const http = require('http');
const logger = require('./src/config/logger');
const env = require('./src/config/env');
const app = require('./src/app');

const PORT = env.PORT;

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

// Handle server errors (e.g., port already in use)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
  logger.error(err);
});
