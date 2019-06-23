const
	testConfig = require('./test-config.json'),
	octaneWSClient = require('../src/octane-ws-client');

octaneWSClient.connect(testConfig)
	.then(owsClient => {
		owsClient.onMessage = data => console.dir(data);
	})
	.catch(error => {
		console.error(error);
	});