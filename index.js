/**
 * express-simp: Encouragement middleware for metered APIs
 * Usage: app.use(simp()) or app.use(simp({ header: 'X-Motivation' }))
 */

const fs = require('fs');
const path = require('path');

function loadMessages(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

function getRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Express middleware factory.
 * @param {Object} options
 * @param {string} [options.header='X-Encouragement']
 * @param {string} [options.field='encouragement']
 * @param {string} [options.file]
 * @param {boolean} [options.overwrite=false]
 * @param {boolean} [options.disableBody=false]
 */
function simp(options = {}) {
  const {
    header = 'X-Encouragement',
    field = 'encouragement',
    file = path.join(__dirname, 'encouragement.txt'),
    overwrite = false,
    disableBody = false
  } = options;

  const messages = loadMessages(file);

  if (messages.length === 0) {
    throw new Error('No encouragement messages found in file');
  }

  return function simpMiddleware(req, res, next) {
    const message = getRandomMessage(messages);
    res.setHeader(header, message);

    if (!disableBody) {
      const originalJson = res.json.bind(res);
      res.json = function(body) {
        if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
          if (overwrite || !(field in body)) {
            body[field] = message;
          }
        }
        return originalJson(body);
      };

      const originalSend = res.send.bind(res);
      res.send = function(body) {
        const contentType = res.get('Content-Type') || '';
        if (body && typeof body === 'object' && !Buffer.isBuffer(body) && contentType.includes('json')) {
          if (overwrite || !(field in body)) {
            body[field] = message;
          }
        }
        return originalSend(body);
      };
    }

    next();
  };
}

module.exports = simp;
