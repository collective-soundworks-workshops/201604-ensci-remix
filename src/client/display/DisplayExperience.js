import * as soundworks from 'soundworks/client';
import DisplayRenderer from './DisplayRenderer';
import AudioPlayer from './AudioPlayer';

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center">
    </div>
    <div id="states" class="section-bottom">
    <p><%= value %></p>
    <p><%= state0 %></p>
    <p><%= state1 %></p>
    <p><%= state2 %></p>
    </div>
  </div>
`;

/**
 * `display` experience.
 * This experience plays a sound when it starts, and plays another sound when
 * other clients join the experience.
 */
export default class DisplayExperience extends soundworks.Experience {
  constructor() {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.network = this.require('network');
    this.loader = this.require('loader', { files: [
      'sounds/barking-drums-66.wav',
      'sounds/barking-drums-100.wav',
      'sounds/barking-drums-133.wav',
      'sounds/barking-drums-break.wav',
      'sounds/barking-drums-scratch.wav',
      'sounds/barking-drums-roll.wav',
      'sounds/barking-synth-66.wav',
      'sounds/barking-synth-100.wav',
      'sounds/barking-synth-133.wav',
      'sounds/barking-synth-break.wav',
      'sounds/barking-synth-scratch.wav',
      'sounds/barking-synth-roll.wav',
      'sounds/barking-dog-66.wav',
      'sounds/barking-dog-100.wav',
      'sounds/barking-dog-133.wav',
      'sounds/barking-dog-break.wav',
      'sounds/barking-dog-scratch.wav',
      'sounds/barking-dog-roll.wav',
    ]});
    this.motionInput = this.require('motion-input', {
      descriptors: ['acceleration', 'accelerationIncludingGravity', 'rotationRate']
    });

    this.players = [null, null, null];
    this.players[0] = new AudioPlayer();
    this.players[1] = new AudioPlayer();
    this.players[2] = new AudioPlayer();
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = {
      value: '',
      state0: 'still',
      state1: 'still',
      state2: 'still',
    };
    this.viewCtor = soundworks.CanvasView;
    this.view = this.createView();
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    const players = this.players;
    const buffers = this.loader.buffers;
    players[0].loopBuffers = [buffers[0], buffers[1], buffers[2]];
    players[0].loopDurations = [14.4, 9.6, 7.2];
    players[0].breakBuffers = [buffers[3], buffers[4], buffers[5]];
    players[0].quant = 0.225;

    players[1].loopBuffers = [buffers[6], buffers[7], buffers[8]];
    players[1].loopDurations = [14.4, 9.6, 7.2];
    players[1].breakBuffers = [buffers[9], buffers[10], buffers[11]];
    players[1].quant = 0.225;

    players[2].loopBuffers = [buffers[12], buffers[13], buffers[14]];
    players[2].loopDurations = [14.4, 9.6, 7.2];
    players[2].breakBuffers = [buffers[15], buffers[16], buffers[17]];
    players[2].quant = 0.225;

    this.network.receive('state', (index, state) => {
      switch(state) {
        case 'still':
        this.players[index].stopLoop();
        break;

        case 'walk':
        this.players[index].startLoop(0);
        break;

        case 'run':
        this.players[index].startLoop(1);
        break;

        case 'fast':
        this.players[index].startLoop(2);
        break;

        case 'jump':
        break;

        case 'boom':
        this.players[index].playBreak(0);
        break;

        case 'turn':
        this.players[index].playBreak(1);
        break;

        case 'roll':
        this.players[index].playBreak(2);
        break;
      }

      this.view.content['state' + index] = state;
      this.view.render('#states');
    });

    this.network.receive('duck', (index, duck) => {
      this.players[index].setCutoff(2 * duck);
    });

    this.network.receive('display', (index, value) => {
      if(index === 0) {
        this.renderer.setValue(value);
        this.view.content.value = value;
        this.view.render('#states');
      }
    });

    this.network.receive('print', (value) => {
      console.log(value);
    });

    // initialize rendering
    this.renderer = new DisplayRenderer();
    this.view.addRenderer(this.renderer);

    // this given function is called before each update (`Renderer.render`) of the canvas
    this.view.setPreRender(function(ctx, dt) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, ctx.width, ctx.height);
      ctx.restore();
    });
  }
}
