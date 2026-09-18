/**
 * 移植自镜头卡 `outro/logo-shrink-wordmark-lockup`
 * （demo: cards/demos/outro/logo-shrink-wordmark-lockup/LogoShrinkWordmarkLockup.tsx）
 *
 * 保留的卡内核：切口弧环图标 easeInOut 快速**收束**（5.4→1，末尾 sin 过冲刹车）
 * → 缺口愈合、霓虹转实心 → 图标左移让位 → 字母从左到右逐个 opacity + 位移滑入
 * 完成 lockup → 强调色标语延迟整行淡入。
 * 改掉的：BRAND / BUILD. SHIP. REPEAT. 换成「国考省考」与记忆口诀；进度源换窗口内帧。
 */
import { E, lerp, seg, useLocalT } from './motion';
import { FONT, SK } from './skin';

const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [
    cx + r * Math.cos((a * Math.PI) / 180),
    cy + r * Math.sin((a * Math.PI) / 180),
  ];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
};

/** 双弧组：带缺口的切口环（a0–a1 及其对角） */
const Arcs: React.FC<{ a0: number; a1: number; w: number; opacity: number; stroke: string; blur?: number }> = ({
  a0,
  a1,
  w,
  opacity,
  stroke,
  blur,
}) => (
  <g opacity={opacity}>
    {[
      [a0, a1],
      [a0 + 180, a1 + 180],
    ].map(([b0, b1], i) => (
      <path
        key={i}
        d={arcPath(30, 30, 21, b0, b1)}
        fill="none"
        stroke={stroke}
        strokeWidth={w}
        strokeLinecap="round"
        style={blur ? { filter: `blur(${blur}px)` } : undefined}
      />
    ))}
  </g>
);

export const OutroLockup: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const t = useLocalT(dur);
  const T = (rel: number) => (rel - start) / dur;
  const k = seg(t, T(43), T(43) + 0.26, E.inOutCubic);
  const brake = Math.sin(seg(t, T(43) + 0.24, T(43) + 0.35) * Math.PI) * 0.06;
  const s = lerp(k, 5.4, 1) * (1 + brake);
  const heal = seg(t, T(52), T(43) + 0.26, E.inOutQuad);
  const shift = seg(t, T(77), T(90), E.inOutCubic) * -176;
  const WORDMARK = '国考省考';
  const tagline = seg(t, T(143), T(160), E.outQuad);
  const cta = seg(t, T(257), T(272), E.outBack);

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* 图标：SVG 双弧切口环 —— 收束时缺口愈合、霓虹转实心 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 232,
            width: 60,
            height: 60,
            margin: '-30px 0 0 -30px',
            transform: `translateX(${shift}px) scale(${s})`,
          }}
        >
          <svg viewBox="0 0 60 60" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <Arcs a0={-32} a1={122} w={13} opacity={1 - heal} stroke="rgba(47,179,230,.65)" blur={5} />
            <Arcs a0={-32} a1={122} w={7} opacity={1 - heal * 0.75} stroke={SK.sponge} />
            <circle
              cx={30}
              cy={30}
              r={21}
              fill="none"
              stroke={SK.stamp}
              strokeWidth={11}
              opacity={heal}
            />
          </svg>
        </div>

        {/* 字标：图标右侧，逐字 stagger 滑入 */}
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% - 96px)',
            top: 232,
            height: 60,
            marginTop: -30,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {[...WORDMARK].map((ch, i) => {
            const lk = seg(t, T(80) + i * 0.035, T(80) + i * 0.035 + 0.1, E.outCubic);
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 54,
                  letterSpacing: 3,
                  color: SK.white,
                  textShadow: '0 6px 0 rgba(8,58,86,0.6)',
                  opacity: lk,
                  transform: `translateX(${lerp(lk, 16, 0)}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        {/* 记忆口诀：整行淡入 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 366,
            transform: `translateX(-50%) translateY(${lerp(tagline, 14, 0)}px)`,
            opacity: tagline,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 34,
            color: SK.sponge,
            textShadow: '0 6px 0 rgba(8,58,86,0.6)',
            whiteSpace: 'nowrap',
          }}
        >
          应届两头抓 · 往届盯本省
        </div>

        {/* CTA */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 442,
            transform: `translateX(-50%) scale(${lerp(cta, 0.8, 1)})`,
            opacity: Math.min(1, Math.max(0, cta)),
            background: SK.stamp,
            border: `5px solid ${SK.ink}`,
            borderRadius: 999,
            padding: '12px 40px',
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 32,
            color: SK.paper,
            boxShadow: '0 10px 0 rgba(8,58,86,0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          2027 国考 · 赶紧去看公告
        </div>
      </div>
    </>
  );
};
