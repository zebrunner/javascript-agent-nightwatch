const ipc = require('node-ipc').default;

const connectIPCClient = () => {
  ipc.config.id = `zebrunneragent_${process.pid}`;
  ipc.config.retry = 1500;
  ipc.config.silent = true;

  ipc.connectTo('zebrunneragent', () => {
    ipc.of.zebrunneragent.on('connect', () => {
      ipc.log('### connected to zebrunneragent ###');
    });
    ipc.of.zebrunneragent.on('disconnect', () => {
      ipc.log('### disconnected from zebrunneragent ###');
    });
  });
};

const disconnectIPCClient = () => {
  ipc.log('disconnect from zebrunneragent');
  ipc.disconnect('zebrunneragent');
};

const publishIPCEvent = (event, message) => {
  ipc.log('send event to zebrunneragent');

  ipc.of.zebrunneragent.emit(event, message);
};

module.exports = {
  connectIPCClient,
  disconnectIPCClient,
  publishIPCEvent,
};
