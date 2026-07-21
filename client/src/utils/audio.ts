const MUTE_KEY = 'picquads-muted';

let audioContext: AudioContext | null = null;

const getContext = (): AudioContext => {
  if (!audioContext) audioContext = new AudioContext();
  // 當 AudioContext 被暫停時，呼叫 resume() 以恢復播放。
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
};

// 判斷是否靜音
export const isMuted = (): boolean => {
  return localStorage.getItem(MUTE_KEY) === 'true';
};

// 設定靜音狀態
export const setMuted = (muted: boolean): void => {
  localStorage.setItem(MUTE_KEY, String(muted));
};

// 播放倒數嗶聲
export const playCountdownBeep = () => {
  if (isMuted()) return;

  try {
    const ctx = getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 520;

    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // skip
  }
};

// 播放倒數最後一聲（高頻嗶聲）
export const playCountdownFinalBeep = () => {
  if (isMuted()) return;

  try {
    const ctx = getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 660;

    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.01);
    gain.gain.setValueAtTime(0.22, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // skip
  }
};

// 播放快門聲（包含三層聲音）
export const playShutterSound = () => {
  if (isMuted()) return;

  try {
    const ctx = getContext();
    const now = ctx.currentTime;

    // 反光板抬起的聲音
    const clickBuf = ctx.createBuffer(
      1,
      ctx.sampleRate * 0.015,
      ctx.sampleRate
    );
    const clickData = clickBuf.getChannelData(0);
    for (let i = 0; i < clickData.length; i++) {
      const t = i / ctx.sampleRate;
      clickData[i] =
        (Math.random() * 2 - 1) * Math.exp(-t * 300) * 0.8 +
        Math.sin(2 * Math.PI * 3000 * t) * Math.exp(-t * 200) * 0.3;
    }

    const clickSrc = ctx.createBufferSource();
    clickSrc.buffer = clickBuf;
    const clickGain = ctx.createGain();
    clickGain.gain.value = 0.5;
    clickSrc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickSrc.start(now);

    // 快門滑動的聲音
    const slideBuf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const slideData = slideBuf.getChannelData(0);
    for (let i = 0; i < slideData.length; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.sin((Math.PI * t) / 0.04) * Math.exp(-t * 15);
      slideData[i] = (Math.random() * 2 - 1) * envelope;
    }

    const slideSrc = ctx.createBufferSource();
    slideSrc.buffer = slideBuf;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 3000;
    bandpass.Q.value = 1.5;

    const slideGain = ctx.createGain();
    slideGain.gain.value = 0.35;
    slideSrc.connect(bandpass);
    bandpass.connect(slideGain);
    slideGain.connect(ctx.destination);
    slideSrc.start(now + 0.01);

    // 反光板落下的聲音
    const thudBuf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    const thudData = thudBuf.getChannelData(0);
    for (let i = 0; i < thudData.length; i++) {
      const t = i / ctx.sampleRate;
      thudData[i] =
        Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 50) * 0.6 +
        (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.2;
    }

    const thudSrc = ctx.createBufferSource();
    thudSrc.buffer = thudBuf;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 400;

    const thudGain = ctx.createGain();
    thudGain.gain.value = 0.45;
    thudSrc.connect(lowpass);
    lowpass.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudSrc.start(now + 0.025);
  } catch {
    // skip
  }
};

// 播放完成音
export const playCompleteSound = () => {
  if (isMuted()) return;

  try {
    const ctx = getContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523, start: 0, dur: 0.12 },
      { freq: 659, start: 0.08, dur: 0.12 },
      { freq: 784, start: 0.16, dur: 0.2 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const t = now + start;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
      gain.gain.setValueAtTime(0.2, t + dur - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

      osc.start(t);
      osc.stop(t + dur);
    });
  } catch {
    // skip
  }
};
