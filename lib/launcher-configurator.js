const substituteHubProperties = (config) => {
  const configuration = config;
  const hubUrlString = process.env.ZEBRUNNER_HUB_URL;
  console.log(hubUrlString);

  if (hubUrlString && hubUrlString !== '') {
    console.log('inside hub');
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

  return configuration;
};

const substituteCapabilities = () => {
  const capabilitiesString = process.env.ZEBRUNNER_CAPABILITIES;
  console.log(capabilitiesString);

//   if (capabilitiesString && capabilitiesString !== '') {
//     console.log('inside capabilities');
//     const capabilitiesObject = JSON.parse(capabilitiesString);
//     Object.keys(capabilitiesObject)
//       .forEach((key) => {
//         const keyParts = key.split('.');

//         let capabilitiesNode = capabilities;
//         for (let i = 0; i < keyParts.length - 1; i += 1) {
//           const keyPart = keyParts[i];
//           capabilitiesNode = capabilitiesNode[keyPart] = capabilitiesNode[keyPart] || {};
//         }

//         capabilitiesNode[keyParts[keyParts.length - 1]] = capabilitiesObject[key];
//       });
//     delete capabilities.provider;
//   }
};

const ZebrunnerConfigurator = {

  configureLauncher: (config) => {
    const configuration = config;
    console.log('before process');
    console.log(configuration);

    if (process.env.REPORTING_RUN_SUBSTITUTE_REMOTE_WEB_DRIVERS === 'true') {
      console.log('inside substitute');
      substituteHubProperties(config);
      console.log('after process');
      console.log(configuration);
      const capabilities = configuration.desiredCapabilities || configuration.capabilities;
      substituteCapabilities(capabilities);
    }

    console.log(process.env);

    return configuration;
  },
};

module.exports = ZebrunnerConfigurator;
