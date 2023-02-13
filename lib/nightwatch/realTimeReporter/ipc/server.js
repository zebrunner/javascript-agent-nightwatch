const ipc = require('node-ipc').default;

const startIPCServer = (subscribeServerEvents, unsubscribeServerEvents) => {
  if (ipc.server) {
    return;
  }

  ipc.config.id = 'zebrunneragent';
  ipc.config.retry = 1500;
  ipc.config.silent = true;
  ipc.config.logInColor = true;
  ipc.config.logDepth = 5;
  ipc.config.logger = console.log;
  ipc.config.maxConnections = 10;

  ipc.serve(() => {
    // Nightwatch publish this event on serverClosed
    ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
      ipc.log(`client ${destroyedSocketID} has disconnected!`);
    });

    // General node-ipc event
    ipc.server.on('destroy', () => {
      ipc.log('server destroyed');
    });

    subscribeServerEvents(ipc.server);

    // Unsubscribe all event when Node process is finished
    process.on('exit', () => {
      unsubscribeServerEvents(ipc.server);
      ipc.server.stop();
    });
  });

  // node-ipc
  ipc.server.start();
};

const stopIPCServer = (unsubscribeServerEvents) => {
  if (!ipc.server) {
    return;
  }

  unsubscribeServerEvents(ipc.server);

  // node-ipc
  ipc.server.stop();
};

module.exports = {
  startIPCServer,
  stopIPCServer,
};
