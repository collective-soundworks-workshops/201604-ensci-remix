// import soundworks client side
import * as soundworks from 'soundworks/client';

// import display experience
import DisplayExperience from './DisplayExperience.js';

// launch application when document is fully loaded
window.addEventListener('load', () => {
  // mandatory configuration options received from the server through the html/default.ejs template
  const socketIO = window.CONFIG && window.CONFIG.SOCKET_CONFIG;
  const appName = window.CONFIG && window.CONFIG.APP_NAME;

  // initialize the 'display' client
  soundworks.client.init('display', { socketIO, appName });

  // create client side (display) experience
  const experience = new DisplayExperience();

  // start the client
  soundworks.client.start();
});
