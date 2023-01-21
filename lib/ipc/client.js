const ipc = require('node-ipc').default;
const { EVENTS } = require('./events');

const connectToZbrIPC = (config) => {
  const ipcConnectionAlias = `zbr-${process.ppid}`;

  ipc.config.id = 'zbrReporter';
  ipc.config.retry = 200;
  ipc.config.silent = true;

  ipc.connectTo(ipcConnectionAlias, () => {
    ipc.of[ipcConnectionAlias].on('connect', () => {
      console.log(
          `client was connected to zbr reporter's ipc server with alias '${ipcConnectionAlias}'`,
      );
      ipc.of[ipcConnectionAlias].emit(EVENTS.CONFIG, config);
      console.log('config was emitted');
    });
    ipc.of[ipcConnectionAlias].on('disconnect', () => {
      // console.log("client was disconnected from zbr reporter's ipc server");
    });
  });
};

module.exports = { connectToZbrIPC };
