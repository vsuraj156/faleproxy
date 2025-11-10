const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { sampleHtmlWithYale } = require('./test-utils');
const nock = require('nock');

// Set a different port for testing to avoid conflict with the main app
const TEST_PORT = 3099;
let server;

describe('Integration Tests', () => {
  // Modify the app to use a test port
  beforeAll(async () => {
    // Mock external HTTP requests
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    nock.enableNetConnect('localhost');
    
    // Create a temporary test app file
    await execAsync('cp app.js app.test.js');
    await execAsync(`sed -i '' 's/const PORT = 3001/const PORT = ${TEST_PORT}/' app.test.js`);
    
    // Start the test server
    server = require('child_process').spawn('node', ['app.test.js'], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Give the server time to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, 10000); // Increase timeout for server startup

  afterAll(async () => {
    // Kill the test server and clean up
    if (server && server.pid) {
      process.kill(-server.pid);
    }
    await execAsync('rm app.test.js');
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test('Should handle error cases properly', async () => {
    // Test missing URL parameter
    try {
      await axios.post(`http://localhost:${TEST_PORT}/fetch`, {});
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toBe('URL is required');
    }
  });
});
