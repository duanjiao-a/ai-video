import { Easing } from 'remotion';

/**
 * 《国考省考，你分得清吗？》视觉 tokens
 *
 * 差异化定位（步骤4）：上一条走"选举辩论 + 计票板冲刺"的凌厉路线；
 * 本条走"办事大厅科普 + 证书盖章"的暖调路线——纸感底色、公文墨蓝描边、
 * 印章红点睛，动效用圆润过冲（盖章感）替代上条的硬 slam，背景缓推也更平。
 */
export const COLORS = {
  /** 海底深蓝：画面兜底色 + 字幕条底色 */
  deep: '#083a56',
  /** 公文墨蓝：大字描边主色（上条用的是更亮的 0b4f73） */
  ink: '#0f3c5c',
  /** 海水蓝：辅助色/气泡 */
  sea: '#2fb3e6',
  /** 证书纸黄：卡片、pill 底色 */
  paper: '#fff5dc',
  /** 海绵黄：强调词 */
  sponge: '#ffd93b',
  /** 暖金：次级强调 */
  gold: '#ffbe2e',
  /** 印章红：数字/警示/盖章 */
  stamp: '#d93a35',
  white: '#ffffff',
};

export const FONT =
  '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif';

/** 盖章落地：圆润大过冲（本条的性格，比上条的 SLAM 更弹） */
export const PRESS_EASE = Easing.bezier(0.2, 1.7, 0.42, 1);
/** 普通弹入 */
export const POP_EASE = Easing.bezier(0.34, 1.62, 0.64, 1);
/** 砸入（比上条收敛，本条只在强调词上用） */
export const SLAM_EASE = Easing.bezier(0.16, 1.42, 0.3, 1);
/** 卡片/纸片滑入 */
export const SLIDE_EASE = Easing.bezier(0.22, 1.35, 0.4, 1);

/** 卡通气泡字：8 方向粗描边 + 底部硬投影 */
export function outlineShadow(color: string, s = 6) {
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

/** 纸片/pill 通用外观：证卡纸底 + 墨蓝硬边 + 硬投影 */
export function paperCard(bg: string = COLORS.paper): React.CSSProperties {
  return {
    background: bg,
    border: `6px solid ${COLORS.ink}`,
    boxShadow: '0 8px 0 rgba(8,58,86,0.35)',
  };
}
