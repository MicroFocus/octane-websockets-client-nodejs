const
	testConfig = require('./test-config.json'),
	octaneWSClient = require('../src/octane-ws-client');

testConfig.onMessage = data => {
	console.dir(data);
};

octaneWSClient.connect(testConfig);
