import 'source-map-support/register';
import * as soundworks from 'soundworks/server';

soundworks.server.init({
  appName: 'ENSCI Remix',
  setup: {
    labels: ['drums', 'synth', 'dog'],
  },
});

class RemixExperience extends soundworks.Experience {
  constructor() {
    super(['player', 'display']);

    this.require('network');
    this.require('placer');
  }

  enter(client) {
    super.enter(client);
    this.receive(client, 'print', (value) => console.log(value));
  }
}

const experience = new RemixExperience();

soundworks.server.start();
