// All music and effects are synthesized locally with Web Audio.
export function createAudio() {
  let context, master, musicGain, enabled = true, music = true, sequencer = 0, beat = 0;
  const volumes = { shot: .035, mine: .023, hit: .085, kill: .075, collect: .045, pulse: .12, upgrade: .09, wave: .07, win: .09, lose: .09 };
  function init() {
    if (!context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      context = new Audio(); master = context.createGain(); master.gain.value = enabled ? .55 : 0;
      musicGain = context.createGain(); musicGain.gain.value = music ? .18 : 0;
      musicGain.connect(master); master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
  }
  function tone(freq, end, duration, volume, type = 'sine', delay = 0, destination = master) {
    if (!context) return;
    const oscillator = context.createOscillator(), gain = context.createGain(), t = context.currentTime + delay;
    oscillator.type = type; oscillator.frequency.setValueAtTime(freq, t);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(18, end), t + duration);
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(volume, t + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    oscillator.connect(gain); gain.connect(destination); oscillator.start(t); oscillator.stop(t + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function effect(name) {
    if (!enabled || !context) return;
    const v = volumes[name] || .06;
    if (name === 'shot') tone(540, 100, .09, v, 'triangle');
    if (name === 'mine') tone(130 + Math.random() * 90, 60, .13, v, 'sawtooth');
    if (name === 'hit') { tone(150, 25, .22, v, 'sawtooth'); tone(42, 24, .3, v); }
    if (name === 'kill' || name === 'pulse') { tone(name === 'pulse' ? 180 : 90, 20, .6, v, 'sawtooth'); tone(55, 22, .8, v); }
    if (name === 'collect') tone(650, 1100, .13, v);
    if (name === 'wave' || name === 'lose') [0, .18, .36].forEach((d,i) => tone(180 - i * 30, 60, .3, v, 'triangle', d));
    if (name === 'upgrade' || name === 'win') [261.6, 329.6, 392, 523.2].forEach((f,i) => tone(f, f * 1.002, .6, v, 'sine', i * .12));
  }
  return {
    init, effect,
    get enabled() { return enabled; }, get music() { return music; },
    toggle() { init(); enabled = !enabled; if(master) master.gain.setTargetAtTime(enabled ? .55 : 0, context.currentTime, .08); return enabled; },
    toggleMusic() { init(); music = !music; if(musicGain) musicGain.gain.setTargetAtTime(music ? .18 : 0, context.currentTime, .08); return music; },
    update(dt, tension = 0) {
      if (!context || !enabled || !music || context.state !== 'running') return;
      sequencer -= dt;
      if (sequencer > 0) return;
      sequencer = .38;
      const notes = [65.4,65.4,98,73.4,65.4,87.3,98,49], f = notes[beat % notes.length];
      tone(f, f, .7, .12, 'sine', 0, musicGain);
      if (beat % 4 === 0) tone(f * 4, f * 4, 2, .045, 'triangle', 0, musicGain);
      if (tension > .4 && beat % 2 === 0) tone(140, 38, .12, .07, 'sine', 0, musicGain);
      beat++;
    },
  };
}
