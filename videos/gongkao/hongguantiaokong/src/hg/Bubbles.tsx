import { AbsoluteFill, useCurrentFrame } from 'remotion';

/** mulberry32：固定种子 PRNG（确定性渲染铁律，禁 Math.random） */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 24;
const BUBBLES = Array.from({ length: N }, (_, i) => {
  const r = mulberry32(7 + i * 13);
  return {
    x: r() * 100,
    size: 7 + r() * 24,
    speed: 0.06 + r() * 0.16, // 每帧上升的屏幕百分比
    phase: r() * 1000,
    sway: 0.5 + r() * 2,
    alpha: 0.15 + r() * 0.3,
  };
});

/** 持续上升的水泡层：给海底背景提供"永不停下"的环境运动 */
export const Bubbles: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {BUBBLES.map((b, i) => {
        const prog = ((frame * b.speed + b.phase) % 1.3) / 1.3;
        const top = 112 - prog * 125;
        const swayX = Math.sin((frame + b.phase) / 26) * b.sway;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${b.x + swayX}%`,
              top: `${top}%`,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              border: `2px solid rgba(255,255,255,${b.alpha})`,
              background:
                'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0.05) 60%)',
              opacity: 0.55,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
