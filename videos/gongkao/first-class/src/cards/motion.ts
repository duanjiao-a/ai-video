/**
 * 动效公共件 —— 取自镜头卡库的共享依赖 `cards/demos/_fixtures/Motion.tsx`，
 * 另加一个"窗口内归一化进度" useLocalT。
 *
 * 为什么要 useLocalT：库里的 demo 用 useT()，那是拿**合成**时长的归一化进度；
 * 本片把每张卡塞进一个 <Sequence> 窗口里，useT() 会拿到整片 2948 帧的长度，
 * 卡片的时间轴就全错。useLocalT(dur) 用 Sequence 内的局部帧数，与卡内
 * 参数表（0–1 归一化）完全对应。
 */
import { useCurrentFrame } from 'remotion';

export const E = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  inQuart: (t: number) => t * t * t * t,
  outExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: (t: number, s = 1.70158) =>
    1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inBack: (t: number, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
  outElastic: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  spring: (t: number, bounce = 0.25) => {
    const w = 8 + 8 * (1 - bounce);
    return 1 - Math.exp(-6 * t) * Math.cos(w * t * bounce * 2.2);
  },
};

export const lerp = (t: number, a: number, b: number) => a + (b - a) * t;

/** 分段进度：t 在 [t0,t1] 内归一化后过 ease，越界钳位 */
export const seg = (
  t: number,
  t0: number,
  t1: number,
  ease: (x: number) => number = E.linear,
) => ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));

/** 确定性伪随机（禁 Math.random，逐帧确定性渲染） */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 窗口内归一化进度 t∈[0,1]（末帧恰为 1）——替代库里的 useT() */
export const useLocalT = (durationInFrames: number) => {
  const frame = useCurrentFrame();
  return Math.min(1, frame / Math.max(1, durationInFrames - 1));
};
