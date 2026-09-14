import { Easing } from 'remotion';

/** 全片统一视觉 tokens（DESIGN.md §二） */
export const COLORS = {
  ocean: '#0b4f73',
  sea: '#1d9ad4',
  yellow: '#ffe600',
  red: '#ff5a5f',
  gold: '#ffb400',
  white: '#ffffff',
  ink: '#083a57',
};

export const FONT =
  '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif';

/** 活泼搞笑（选举喜剧）预设 */
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

/** 模板 demo 的灰阶调色板 → 本片品牌色映射（海蓝/亮黄/珊瑚红） */
export const G = {
  bg: '#0a3a58',
  card: '#ffffff',
  border: 'rgba(11,79,115,0.35)',
  ink: COLORS.ink,
  mid: '#5b7a8f',
  line: 'rgba(11,79,115,0.18)',
  bar: COLORS.yellow,
  sideBar: '#cfe3ef',
  amber: COLORS.gold,
  red: COLORS.red,
};
