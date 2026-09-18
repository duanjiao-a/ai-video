import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONT, outlineShadow, POP_EASE, SLAM_EASE } from './style';

export type Word = { text: string; accent?: boolean; color?: string };

/**
 * 卡通大字卡：逐词弹入（pop / slam 两种模式）。
 * - pop:  scale 1.9→1 + 过冲（back.out 系）
 * - slam: scale 3.2→1 + 大过冲压缩（砸入感）
 * 白字 + 深蓝 8 方向描边 + 硬投影，海绵宝宝气泡字感。
 */
export const BigText: React.FC<{
  lines: Word[][];
  size?: number;
  gap?: number;
  delay?: number;
  perWord?: number;
  mode?: 'pop' | 'slam';
  outline?: string;
  glow?: string;
}> = ({
  lines,
  size = 130,
  gap = 30,
  delay = 0,
  perWord = 13,
  mode = 'pop',
  outline = COLORS.ocean,
  glow,
}) => {
  const frame = useCurrentFrame();
  const ease = mode === 'slam' ? SLAM_EASE : POP_EASE;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap,
        pointerEvents: 'none',
      }}
    >
      {lines.map((line, li) => (
        <div
          key={li}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: '0.18em',
          }}
        >
          {line.map((w, wi) => {
            const i = li * 100 + wi;
            const d = delay + i * perWord;
            const t = interpolate(frame, [d, d + 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: ease,
            });
            const scale = mode === 'slam' ? 3.2 - 2.2 * t : 1.9 - 0.9 * t;
            const shadow = outlineShadow(outline) + (glow ? `, 0 0 44px ${glow}` : '');
            return (
              <span
                key={wi}
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: size,
                  lineHeight: 1.06,
                  color: w.color ?? (w.accent ? COLORS.yellow : COLORS.white),
                  textShadow: shadow,
                  opacity: t,
                  transform: `scale(${scale}) rotate(${(1 - t) * -4}deg)`,
                  filter: `blur(${(1 - t) * 6}px)`,
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
