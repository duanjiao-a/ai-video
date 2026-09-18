import { Easing } from 'remotion';

export const COLORS = {
  ocean: '#0b4f73',
  sea: '#1d9ad4',
  yellow: '#ffe600',
  red: '#ff5a5f',
  white: '#ffffff',
  ink: '#083a57',
};

export const FONT =
  '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif';

/** 活泼愉悦（消费/社交）预设 */
export const POP_EASE = Easing.bezier(0.34, 1.56, 0.64, 1);
/** slam 大过冲 */
export const SLAM_EASE = Easing.bezier(0.12, 1.5, 0.25, 1);

/** 卡通气泡字：8 方向粗描边 + 底部硬投影 */
export function outlineShadow(color: string, s = 8) {
  return [
    `-${s}px -${s}px 0 ${color}`,
    `0 -${s}px 0 ${color}`,
    `${s}px -${s}px 0 ${color}`,
    `-${s}px 0 0 ${color}`,
    `${s}px 0 0 ${color}`,
    `-${s}px ${s}px 0 ${color}`,
    `0 ${s}px 0 ${color}`,
    `${s}px ${s}px 0 ${color}`,
    `0 ${s * 2}px 0 ${color}`,
  ].join(',');
}
