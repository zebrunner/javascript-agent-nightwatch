const substituteHubProperties = (config) => {
  const configuration = config;
  const hubUrlString = process.env.ZEBRUNNER_HUB_URL;

  if (hubUrlString && hubUrlString !== '') {
    const hubUrl = new URL(hubUrlString);

    const protocol = hubUrl.protocol.slice(0, -1);
    let port = parseInt(hubUrl.port, 10);

    if (!port) {
      port = protocol === 'https' ? 443 : 80;
    }

    configuration.selenium.host = hubUrl.hostname;
    configuration.selenium.port = port;
    configuration.username = hubUrl.username;
    configuration.access_key = hubUrl.password;
  }
};

const substituteCapabilities = (capabilities) => {
  const desiredCapabilities = capabilities;
  const capabilitiesString = process.env.ZEBRUNNER_CAPABILITIES;

  if (capabilitiesString && capabilitiesString !== '') {
    const capabilitiesObject = JSON.parse(capabilitiesString);
    Object.keys(capabilitiesObject)
      .forEach((key) => {
        const keyParts = key.split('.');
        let capabilitiesNode = desiredCapabilities;
        for (let i = 0; i < keyParts.length - 1; i += 1) {
          const keyPart = keyParts[i];
          capabilitiesNode = capabilitiesNode[keyPart] || {};
        }
        capabilitiesNode[keyParts[keyParts.length - 1]] = capabilitiesObject[key];
      });
    delete desiredCapabilities.provider;
  }
};

const ZebrunnerConfigurator = {

  configureLauncher: (config) => {
    if (process.env.REPORTING_RUN_SUBSTITUTE_REMOTE_WEB_DRIVERS === 'true') {
      substituteHubProperties(config);

      const capabilities = config.desiredCapabilities || config.capabilities;
      substituteCapabilities(capabilities);
    }

    return config;
  },
};

module.exports = ZebrunnerConfigurator;
