const
	https = require('https'),
	http = require('http'),
	WS = require('ws'),
	HttpsProxyAgent = require('https-proxy-agent');

exports.connect = connect;

async function connect(config) {
	validateConfig(config);
	console.info('configuration to Octane WebSocket endpoint:');
	console.dir({
		isSSL: config.isSSL,
		octaneHost: config.octaneHost,
		octanePort: config.octanePort,
		sharedSpace: config.sharedSpace,
		endpoint: config.endpoint,
		client: config.client,
		proxyHost: config.proxyHost,
		proxyPort: config.proxyPort
	});

	return new Promise(async (resolve, reject) => {
		let authToken;
		try {
			authToken = await doLogin(config);
		} catch (error) {
			reject(error);
			return;
		}

		const proxyAgent = createProxyAgentIfAny(config);
		const targetUrl = (config.isSSL ? 'wss' : 'ws') + '://' +
			config.octaneHost + ':' + config.octanePort +
			'/messaging/shared_spaces/' + config.sharedSpace + '/' + config.endpoint;
		const options = {
			headers: {
				'ALM_OCTANE_TECH_PREVIEW': 'true',
				'Cookie': authToken
			}
		};

		if (proxyAgent) {
			options.agent = proxyAgent;
		}

		const
			wsClient = new WS(targetUrl, options),
			result = {
				onError: null,
				onMessage: config.onMessage
			};

		wsClient.on('open', () => {
			console.info('successfully established WS connection to Octane endpoint "' + config.endpoint + '"');
			resolve(result);
		});
		wsClient.on('error', error => {
			if (typeof result.onError === 'function') {
				result.onError(error);
			} else {
				console.error('failed to establish WS connection to Octane endpoint "' + config.endpoint + '"', error);
			}
		});
		wsClient.on('message', data => {
			if (typeof result.onMessage === 'function') {
				result.onMessage(data);
			}
		});

		const pingInterval = setInterval(() => {
			wsClient.ping(() => {
			});
		}, 7000);
	});

}

function validateConfig(config) {
	if (!config) {
		throw new Error('failed to obtain configuration');
	}
	if (!config.octaneHost || typeof config.octaneHost !== 'string') {
		throw new Error('"octaneHost" parameter is missing, empty or not a string');
	}
	if (!config.octanePort || isNaN(config.octanePort)) {
		throw new Error('"octanePort" parameter is missing or not a number');
	}
	if (!config.sharedSpace || isNaN(config.sharedSpace)) {
		throw new Error('"sharedSpace" parameter is missing or not a number');
	}
	if (!config.endpoint || typeof config.endpoint !== 'string') {
		throw new Error('"endpoint" parameter is missing, empty or not a string');
	}
	if (!config.client || typeof config.client !== 'string') {
		throw new Error('"client" parameter is missing, empty or not a string');
	}
	if (!config.secret || typeof config.secret !== 'string') {
		throw new Error('"secret" parameter is missing, empty or not a string');
	}
}

function doLogin(config) {
	return new Promise((resolve, reject) => {
		const
			proxyAgent = createProxyAgentIfAny(config),
			loginPayload = JSON.stringify({client_id: config.client, client_secret: config.secret}),
			options = {
				method: 'POST',
				hostname: config.octaneHost,
				port: config.octanePort,
				path: '/authentication/sign_in',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': loginPayload.length
				}
			};

		if (proxyAgent) {
			options.agent = proxyAgent;
		}

		const
			req = (config.isSSL ? https : http).request(options, res => {
				if (res.statusCode !== 200) {
					reject('login to Octane failed with status ' + res.statusCode);
					return;
				}

				let authToken;
				if (res.headers && Array.isArray(res.headers['set-cookie'])) {
					let cookies = res.headers['set-cookie'];
					for (let i = 0, l = cookies.length; i < l; i++) {
						if (cookies[i].indexOf('LWSSO_COOKIE_KEY') === 0) {
							authToken = cookies[i];
							break;
						}
					}
				}
				if (authToken) {
					resolve(authToken);
				} else {
					reject('failed to extract auth token from response');
				}
			});

		req.on('error', reject);
		req.write(loginPayload);
		req.end()
	});
}

function createProxyAgentIfAny(config) {
	let result = null;
	if (config.proxyHost && config.proxyPort) {
		result = new HttpsProxyAgent({
			host: config.proxyHost,
			port: config.proxyPort
		});
	}
	return result;
}