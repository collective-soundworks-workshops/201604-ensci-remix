import * as soundworks from 'soundworks/client';
import PlayerRenderer from './PlayerRenderer';

const client = soundworks.client;
const audioContext = soundworks.audioContext;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center">
      <p>Hey!</p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

class MovingAverage {
 constructor(size) {
   this.buffer = new Float32Array(size);
   this.index = 0;
 }

 process(value) {
   this.buffer[this.index] = value;

   const len = this.buffer.length;
   let sum = 0;

   for (let i = 0; i < len; i++)
     sum += this.buffer[i];

   this.index = (this.index + 1) % len;

   return sum / len;
 }
}

const period = 0.05;
const kGravityFilter = Math.exp(-2 * Math.PI * period / 0.1);

export default class PlayerExperience extends soundworks.Experience {
  constructor(audioFiles) {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.placer = this.require('placer');
    this.network = this.require('network');
    this.motionInput = this.require('motion-input', {
      descriptors: ['accelerationIncludingGravity', 'rotationRate']
    });

    this.duckFilter = new MovingAverage(8);
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = {
      value: 0,
    };
    this.viewCtor = soundworks.CanvasView;
    this.view = this.createView();
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    this.state = 'still';
    this.lastAcc = [0, 0, 0];
    this.lastDynAcc = [0, 0, 0];
    this.accMag = 1;
    this.accDynMag = 1;
    this.slowEnergy = 0;

    this.jumpCount = 0;
    this.boomCount = 0;

    if (this.motionInput.isAvailable('accelerationIncludingGravity')) {
      this.motionInput.addListener('accelerationIncludingGravity', (acc) => {
        const accX = acc[0] / 9.81;
        const accY = acc[1] / 9.81;
        const accZ = acc[2] / 9.81;
        const accMag = Math.sqrt(accX * accX + accY * accY + accZ * accZ);

        const lastAcc = this.lastAcc;
        const lastDynAcc = this.lastDynAcc;
        const dynAccX = (1 + kGravityFilter) * 0.5 * (accX - lastAcc[0]) + kGravityFilter * lastDynAcc[0];
        const dynAccY = (1 + kGravityFilter) * 0.5 * (accY - lastAcc[1]) + kGravityFilter * lastDynAcc[1];
        const dynAccZ = (1 + kGravityFilter) * 0.5 * (accZ - lastAcc[2]) + kGravityFilter * lastDynAcc[2];
        const dynAccMag = Math.sqrt(dynAccX * dynAccX + dynAccY * dynAccY + dynAccZ * dynAccZ);

        this.lastAcc[0] = accX;
        this.lastAcc[1] = accY;
        this.lastAcc[2] = accZ;

        this.lastDynAcc[0] = dynAccX;
        this.lastDynAcc[1] = dynAccY;
        this.lastDynAcc[2] = dynAccZ;

        let duck = Math.abs(-2 * Math.atan(accY / Math.sqrt(accZ * accZ + accX * accX)) / Math.PI);
        duck = this.duckFilter.process(duck);
        this.network.send('display', 'duck', client.index, duck);

        this.accMag = accMag;
        this.slowEnergy = 0.95 * this.slowEnergy + 0.05 * dynAccMag;
      });
    }

    if (this.motionInput.isAvailable('rotationRate')) {
      this.motionInput.addListener('rotationRate', (gyro) => {
        const now = audioContext.currentTime;
        const gyroX = gyro[0];
        const gyroY = gyro[1];
        const gyroZ = gyro[2];
        const absGyroZ = Math.abs(gyroZ);
        const accMag = this.accMag;
        const slowEnergy = this.slowEnergy;
        let state = 'still';

        if(absGyroZ > 400) {
          state = 'roll';
        } else if(gyroY > 400) {
          state = 'turn';
        } else if(accMag < 0.3) {
          state = 'jump';

          if(this.state !== 'jump') {
            this.jumpStart = now;
            this.jumpCount++;
          }
        } else if(this.state === 'jump' && now - this.jumpStart > 0.200) {
          console.log(now - this.jumpStart);
          state = 'boom';
          this.boomCount++;
        } else if(slowEnergy > 0.25) {
          state = 'fast';
        } else if(slowEnergy > 0.1) {
          state = 'run';
        } else if(slowEnergy > 0.02) {
          state = 'walk';
        }

        if(state !== this.state) {
          this.network.send('display', 'state', client.index, state);
          this.state = state;
        }

        const value = slowEnergy;
        this.renderer.setValue(value);
        this.network.send('display', 'display', client.index, value);
      });
    }

    // initialize rendering
    this.renderer = new PlayerRenderer();
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
