/**
 * 卡的"皮肤"——库里 demo 用的是中性灰占位（SUBJECT / OUTCOME / #0a0b10 底），
 * 直接用会跟海绵宝宝海底场景打架。这里统一定义本片的纸感皮肤，
 * 所有从卡库移植过来的组件都从这里取色，保证六张卡是同一套材质。
 */
export const SK = {
  deep: '#083a56',
  ink: '#0f3c5c',
  sea: '#2fb3e6',
  paper: '#fff5dc',
  paperDeep: '#f6e6bd',
  sponge: '#ffd93b',
  gold: '#ffbe2e',
  stamp: '#d93a35',
  white: '#ffffff',
  dim: '#7d8f9c',
};

export const FONT =
  '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif';

/** 证卡纸面：纸黄底 + 墨蓝硬边 + 硬投影（卡片飘在背景之上的统一读法） */
export function surface(bg: string = SK.paper, radius = 18): React.CSSProperties {
  return {
    background: bg,
    border: `5px solid ${SK.ink}`,
    borderRadius: radius,
    boxShadow: '0 10px 0 rgba(8,58,86,0.34)',
  };
}

/** 白字 + 墨蓝描边（压在背景图上时用） */
export function inkOutline(size = 6, color: string = SK.ink) {
  return [
    `-${size}px -${size}px 0 ${color}`,
    `0 -${size}px 0 ${color}`,
    `${size}px -${size}px 0 ${color}`,
    `-${size}px 0 0 ${color}`,
    `${size}px 0 0 ${color}`,
    `-${size}px ${size}px 0 ${color}`,
    `0 ${size}px 0 ${color}`,
    `${size}px ${size}px 0 ${color}`,
    `0 ${size * 2}px 0 ${color}`,
  ].join(',');
}
