// Import Soundworks library (client side)
import * as soundworks from 'soundworks/client';
import PlayerRenderer from './PlayerRenderer';

const audioContext = soundworks.audioContext;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center">
      <p>latitude: <%= latitude %></p>
      <p>longitude: <%= longitude %></p>
      <p>accuracy: <%= accuracy %></p>
      <p>altitude: <%= altitude %></p>
      <p>altitudeAccuracy: <%= altitudeAccuracy %></p>
      <p>heading: <%= heading %></p>
      <p>speed: <%= speed %></p>
      <p>timestamp: <%= timestamp %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

/**
 * `player` experience.
 * This experience plays a sound when it starts, and plays another sound when
 * other clients join the experience.
 */
export default class PlayerExperience extends soundworks.Experience {
  constructor(audioFiles) {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.loader = this.require('loader', { files: audioFiles });
    this.checkin = this.require('checkin', { setup : { capacity : 4 } });
    this.motionInput = this.require('motion-input', {
      descriptors: ['acceleration', 'accelerationIncludingGravity', 'rotationRate']
    });
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      altitude: 0,
      altitudeAccuracy: 0,
      heading: 0,
      speed: 0,
      timestamp: 0,
    };
    this.viewCtor = soundworks.CanvasView;
    this.view = this.createView();
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    if (this.motionInput.isAvailable('acceleration')) {
      this.motionInput.addListener('acceleration', (acc) => {

      });
    }

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((position) => {
        const coords = position.coords;
        this.view.content = {
          timestamp: position.timestamp,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          altitude: coords.altitude,
          altitudeAccuracy: coords.altitudeAccuracy,
          heading: coords.heading,
          speed: coords.speed,
        };
        this.view.render();
      });
    } else {
      console.log("Geolocation is not supported by this browser.");
    }

    // play the first loaded buffer immediately
    const src = audioContext.createBufferSource();
    src.buffer = this.loader.buffers[0];
    src.connect(audioContext.destination);
    src.start(audioContext.currentTime);

    // play the second loaded buffer when the message `play` is received from
    // the server, the message is send when another player joins the experience.
    this.receive('play', () => {
      const delay = Math.random();
      const src = audioContext.createBufferSource();
      src.buffer = this.loader.buffers[1];
      src.connect(audioContext.destination);
      src.start(audioContext.currentTime + delay);
    });

    // initialize rendering
    this.renderer = new PlayerRenderer(100, 100);
    this.view.addRenderer(this.renderer);
    // this given function is called before each update (`Renderer.render`) of the canvas
    this.view.setPreRender(function(ctx, dt) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, ctx.width, ctx.height);
      ctx.restore();
    });
  }
}
