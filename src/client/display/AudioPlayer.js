import * as soundworks from 'soundworks/client';
const audioContext = soundworks.audioContext;
const fadeTime = 0.050;

const minCutoff = 200;
const maxCutoff = 20000;
const logCutoffRatio = Math.log(maxCutoff / minCutoff);

class Loop {
  constructor(buffer, duration, output) {
    this.buffer = buffer;
    this.duration = duration;
    this.output = output;

    const env = audioContext.createGain();
    env.connect(output);
    env.gain.value = 0;

    const src = audioContext.createBufferSource();
    src.connect(env);
    src.buffer = buffer;

    this.env = env;
    this.src = src;
  }

  start(time) {
    const gain = this.env.gain;
    gain.setValueAtTime(0, time);
    gain.linearRampToValueAtTime(1, time + fadeTime);

    const src = this.src;
    src.start(time, time % this.duration);
    src.loopStart = 0;
    src.loopEnd = this.duration;
    src.loop = true;
  }

  stop(time) {
    const gain = this.env.gain;
    gain.setValueAtTime(1, time);
    gain.linearRampToValueAtTime(0, time + fadeTime);

    this.src.stop(time + fadeTime);
  }
}

export default class AudioPlayer {
  constructor(output = audioContext.destination) {
    this.loopBuffers = null;
    this.loopDurations = null;
    this.output = output;

    const lowpass = audioContext.createBiquadFilter();
    lowpass.connect(output);
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 0;
    lowpass.Q.value = 12;
    this.lowpass = lowpass;

    this.quant = 0.1;
    this.loop = null;
    this.loopIndex = -1;
  }

  startLoop(loopIndex) {
    const time = audioContext.currentTime;

    if(this.loopIndex >= 0)
      this.loop.stop(time);

    const buffer = this.loopBuffers[loopIndex];
    const duration = this.loopDurations[loopIndex];
    this.loop = new Loop(buffer, duration, this.lowpass);
    this.loop.start(time);

    this.loopIndex = loopIndex;
  }

  stopLoop() {
    if(this.loopIndex >= 0) {
      const time = audioContext.currentTime;

      this.loop.stop(time);
      this.loop = null;
      this.loopIndex = -1;
    }
  }

  setCutoff(value) {
    value = Math.max(0, Math.min(1, value));
    this.lowpass.frequency.value = minCutoff * Math.exp(logCutoffRatio * value);
  }

  playBreak(breakIndex) {
    const time = audioContext.currentTime;
    const quantTime = Math.ceil(time / this.quant) * this.quant;

    const src = audioContext.createBufferSource();
    src.connect(this.output);
    src.buffer = this.breakBuffers[breakIndex];
    src.start(quantTime);
  }
}
