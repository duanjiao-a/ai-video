// 8 个场景组件。每镜头一张镜头配方卡，从 demos/ 准确 demo 源码复制适配
// （改背景/文案/色板，保留缓动时值、转场、已知坑规避等调校参数）。
// 除开场（carousel-3d，480 坐标）外，所有内容在 1920×1080 设计坐标
// （DesignStage 等比缩放到 1280×720），demo 参数原样保留。
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { SceneBg } from './SceneBg';
import { BigText } from './BigText';
import { Bubbles } from './Bubbles';
import { Carousel3D } from './Carousel3D';
import { DesignStage, E, lerp, rand, seg } from './Motion';
import { COLORS, FONT, G, outlineShadow, POP_EASE } from './style';

/* ================= 通用小组件（1920 设计坐标） ================= */

/** 顶部小标签 pill */
const Badge: React.FC<{
  text: string;
  delay: number;
  color?: string;
  bg?: string;
  size?: number;
}> = ({ text, delay, color = COLORS.ink, bg = COLORS.yellow, size = 44 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: POP_EASE,
  });
  return (
    <div
      style={{
        position: 'absolute',
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: size,
        color,
        background: bg,
        borderRadius: 999,
        padding: '10px 36px',
        border: `6px solid ${COLORS.ocean}`,
        boxShadow: '0 8px 0 rgba(6,30,48,0.35)',
        opacity: t,
        transform: `translateY(${(1 - t) * 26}px) scale(${1.4 - 0.4 * t})`,
      }}
    />
  );
};

/** 圆点 pill（三大手段 / 三工具子条） */
const Pill: React.FC<{
  text: string;
  delay: number;
  dot: string;
  size?: number;
  x: number;
  y: number;
}> = ({ text, delay, dot, size = 44, x, y }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: POP_EASE,
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '16px 40px',
        borderRadius: 999,
        background: COLORS.white,
        border: `6px solid ${COLORS.ocean}`,
        boxShadow: '0 10px 0 rgba(6,30,48,0.3)',
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: size,
        color: COLORS.ink,
        whiteSpace: 'nowrap',
        opacity: t,
        transform: `translateY(${(1 - t) * 30}px) scale(${1.5 - 0.5 * t})`,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: dot,
          border: `4px solid ${COLORS.ocean}`,
          flex: 'none',
        }}
      />
      {text}
    </div>
  );
};

/* ================= 1. 开场（carousel-3d）================= */

export const SceneOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin((frame / 50) * Math.PI * 2) * 0.008;
  return (
    <AbsoluteFill style={{ background: '#052033', overflow: 'hidden' }}>
      <Carousel3D duration={275} />
      <Bubbles />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 34, display: 'flex', justifyContent: 'center' }}>
        <Badge text="公考 3 分钟 · 开讲" delay={8} size={40} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 104,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ transform: `scale(${1 + bob})` }}>
          <BigText
            lines={[
              [{ text: '比奇堡大选？', accent: true }],
              [{ text: '3分钟搞懂', color: COLORS.white }, { text: '宏观调控', color: COLORS.red }],
            ]}
            size={78}
            gap={22}
            delay={30}
            perWord={12}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ================= 2. r1 什么是宏观调控（list-reveal）================= */

const ListReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const t = seg(frame, 305, 435);
  const ITEMS = [
    { label: '经济手段', dot: COLORS.gold },
    { label: '法律手段', dot: COLORS.sea },
    { label: '行政手段', dot: COLORS.red },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 容器漂移层：与逐项入场两层运动解耦，全程线性上移 */}
      <div
        style={{
          position: 'relative',
          width: 880,
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
          transform: `translateY(${lerp(t, 128, -128)}px)`,
        }}
      >
        {ITEMS.map((it, i) => {
          const p = seg(t, 0.06 + i * 0.09, 0.06 + i * 0.09 + 0.24, E.outBack);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 44,
                padding: '36px 52px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.95)',
                border: `6px solid ${COLORS.ocean}`,
                boxShadow: '0 12px 0 rgba(6,30,48,0.3)',
                opacity: Math.min(1, p * 2.2),
                transform: `scale(${0.78 + Math.max(0, p) * 0.22}) translateY(${lerp(Math.max(0, p), 56, 0)}px)`,
              }}
            >
              <span
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  flex: 'none',
                  background: `linear-gradient(140deg, ${it.dot}, ${it.dot}cc)`,
                  border: `5px solid ${COLORS.ocean}`,
                }}
              />
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 56, color: COLORS.ink, lineHeight: 1 }}>
                {it.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SceneDemand: React.FC = () => {
  return (
    <SceneBg src="bg-demand.png" duration={424} zoomTo={1.04}>
      <DesignStage w={1920} h={1080} bg="transparent">
        <div style={{ position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center' }}>
          <BigText lines={[[{ text: '总需求不足', color: COLORS.red }]]} size={150} delay={8} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center' }}>
          <BigText lines={[[{ text: '宏观调控', accent: true }]]} size={168} delay={200} glow="rgba(255,230,0,0.55)" />
        </div>
        <ListReveal />
      </DesignStage>
    </SceneBg>
  );
};

/* ================= 3. r2 扩张性财政政策（score-slam）================= */

const ScoreSlamCard: React.FC = () => {
  const frame = useCurrentFrame();
  const IMPACT = 205;
  const slamScale =
    frame < IMPACT
      ? interpolate(frame, [199, IMPACT], [2.5, 0.97], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.in(Easing.quad),
        })
      : interpolate(frame, [IMPACT, 213], [0.97, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
  const slamRot = interpolate(frame, [199, IMPACT], [5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const slamY = interpolate(frame, [199, IMPACT], [-80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const cardOp = interpolate(frame, [199, 202], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  let shakeX = 0;
  let shakeY = 0;
  if (frame >= IMPACT && frame < IMPACT + 5) {
    const tt = frame - IMPACT;
    const amp = 18 * Math.exp(-tt * 0.9);
    shakeX = amp * (rand(frame * 7 + 1) * 2 - 1);
    shakeY = amp * (rand(frame * 13 + 2) * 2 - 1);
  }
  const ringT = interpolate(frame, [IMPACT, IMPACT + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const ringD = interpolate(ringT, [0, 1], [60, 860]);
  const ringTLin = interpolate(frame, [IMPACT, IMPACT + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringOp = interpolate(ringTLin, [0, 0.65, 1], [0.75, 0.55, 0]);
  const ringOn = frame >= IMPACT && frame < IMPACT + 14;
  const dustT = interpolate(frame, [IMPACT, IMPACT + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const dustTLin = interpolate(frame, [IMPACT, IMPACT + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dustOn = frame >= IMPACT && frame < IMPACT + 16;
  const CX = 960;
  const CY = 560;
  const CARD_W = 620;
  const CARD_H = 320;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        {dustOn &&
          Array.from({ length: 8 }).map((_, i) => {
            const ang = (i / 8) * Math.PI * 2 + (rand(i + 3) - 0.5) * 0.7;
            const dist = 160 + rand(i + 11) * 160;
            const size = 18 + rand(i + 23) * 12;
            const dx = Math.cos(ang) * dist * dustT;
            const dy = Math.sin(ang) * dist * dustT + 90 * dustT * dustT;
            const s = size * (1 - 0.75 * dustTLin);
            const op = interpolate(dustTLin, [0, 0.75, 1], [0.9, 0.7, 0]);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: CX + dx - s / 2,
                  top: CY + CARD_H / 2 - 20 + dy - s / 2,
                  width: s,
                  height: s,
                  background: COLORS.ink,
                  opacity: op,
                  borderRadius: 2,
                }}
              />
            );
          })}
        {ringOn && (
          <div
            style={{
              position: 'absolute',
              left: CX - ringD / 2,
              top: CY - ringD / 2,
              width: ringD,
              height: ringD,
              borderRadius: '50%',
              border: `6px solid ${COLORS.yellow}`,
              opacity: ringOp,
              boxSizing: 'border-box',
            }}
          />
        )}
        {frame >= 199 && (
          <div
            style={{
              position: 'absolute',
              left: CX - CARD_W / 2,
              top: CY - CARD_H / 2,
              width: CARD_W,
              height: CARD_H,
              background: COLORS.white,
              border: `8px solid ${COLORS.ocean}`,
              borderRadius: 30,
              boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 22,
              opacity: cardOp,
              transform: `translateY(${slamY}px) rotate(${slamRot}deg) scale(${slamScale})`,
              transformOrigin: '50% 50%',
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 64,
                color: COLORS.ink,
                letterSpacing: 2,
                lineHeight: 1,
                textShadow: outlineShadow(COLORS.yellow, 4),
              }}
            >
              扩张性财政政策
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 30,
                color: COLORS.red,
                letterSpacing: 8,
              }}
            >
              经济冷 · 政府花
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const SceneFiscal: React.FC = () => {
  return (
    <SceneBg src="bg-fiscal.png" duration={303} zoomTo={1.04}>
      <DesignStage w={1920} h={1080} bg="transparent">
        <div style={{ position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center' }}>
          <Badge text="珊迪的方案" delay={15} size={52} />
        </div>
        <Pill text="增加支出" delay={45} dot={COLORS.gold} x={470} y={890} />
        <Pill text="发行国债" delay={90} dot={COLORS.sea} x={740} y={890} />
        <Pill text="减少税收" delay={135} dot={COLORS.red} x={1010} y={890} />
        <ScoreSlamCard />
      </DesignStage>
    </SceneBg>
  );
};

/* ================= 4. r3 供给侧改革（card-flip-reveal）================= */

const FlipCard: React.FC<{ i: number; front: string; back: string; start: number; frame: number }> = ({
  i,
  front,
  back,
  start,
  frame,
}) => {
  const FLIP_DUR = 18;
  const SETTLE = 8;
  const OVERSHOOT = 12;
  const CW = 440;
  const CH = 320;
  const GAP = 60;
  const X0 = (1920 - (CW * 2 + GAP)) / 2;
  const Y = 340;
  const angleAt = (f: number): number => {
    if (f < start + FLIP_DUR) {
      return interpolate(f, [start, start + FLIP_DUR], [0, 180 + OVERSHOOT], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.55, 0, 0.3, 1),
      });
    }
    return interpolate(f, [start + FLIP_DUR, start + FLIP_DUR + SETTLE], [180 + OVERSHOOT, 180], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.poly(5)),
    });
  };
  const angle = angleAt(frame);
  const pos = interpolate(angle, [35, 145], [-25, 115], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = Math.max(0, 1 - Math.abs(angle - 90) / 55);
  const sheen =
    op <= 0.004 ? null : (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14,
          pointerEvents: 'none',
          opacity: op,
          background: `linear-gradient(105deg, rgba(0,0,0,0) ${pos - 14}%, rgba(0,0,0,0.32) ${pos}%, rgba(0,0,0,0) ${pos + 14}%)`,
        }}
      />
    );
  return (
    <div
      style={{
        position: 'absolute',
        left: X0 + i * (CW + GAP),
        top: Y,
        width: CW,
        height: CH,
        perspective: 1200,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${angle}deg)`,
        }}
      >
        {/* 正面：方案 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: COLORS.white,
              border: `6px solid ${COLORS.ocean}`,
              borderRadius: 22,
              boxSizing: 'border-box',
              boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color: COLORS.ink }}>{front}</span>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, color: G.mid }}>候选方案</span>
          </div>
          {sheen}
        </div>
        {/* 背面：学名 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: COLORS.yellow,
            border: `6px solid ${COLORS.ocean}`,
            borderRadius: 22,
            boxSizing: 'border-box',
            boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 64,
              color: COLORS.ink,
              letterSpacing: 2,
              textShadow: outlineShadow(COLORS.yellow, 3),
            }}
          >
            {back}
          </span>
          {sheen}
        </div>
      </div>
    </div>
  );
};

export const SceneMarket: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneBg src="bg-market.png" duration={296} zoomTo={1.04}>
      <DesignStage w={1920} h={1080} bg="transparent">
        <div style={{ position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center' }}>
          <Badge text="两种路线，你来选" delay={12} size={48} bg={COLORS.sea} color={COLORS.white} />
        </div>
        <FlipCard i={0} front="政府花钱" back="需求侧管理" start={120} frame={frame} />
        <FlipCard i={1} front="减税放权" back="供给侧改革" start={130} frame={frame} />
      </DesignStage>
    </SceneBg>
  );
};

/* ================= 5. r4 货币政策（needle-sweep-selftest）================= */

const Gauge: React.FC<{ start: number; target: number }> = ({ start, target }) => {
  const frame = useCurrentFrame();
  const AMBER = G.amber;
  const RED = G.red;
  const CARD_W = 1500;
  const GA_W = CARD_W / 3;
  const R = 148;
  const CX = GA_W / 2;
  const CY = 240;
  const polar = (a: number, r: number): [number, number] => [
    CX + r * Math.cos((a * Math.PI) / 180),
    CY + r * Math.sin((a * Math.PI) / 180),
  ];
  const arcPath = (d0: number, d1: number, r: number): string => {
    const [x0, y0] = polar(135 + d0, r);
    const [x1, y1] = polar(135 + d1, r);
    const large = d1 - d0 > 180 ? 1 : 0;
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const needleAngle = (f: number): number => {
    if (f <= start) return 0;
    if (f <= start + 12) {
      return interpolate(f, [start, start + 12], [0, 270], { easing: Easing.out(Easing.cubic) });
    }
    if (f <= start + 25) {
      return interpolate(f, [start + 12, start + 25], [270, target - 8], { easing: Easing.inOut(Easing.cubic) });
    }
    return interpolate(f, [start + 25, start + 32], [target - 8, target], {
      easing: Easing.out(Easing.cubic),
      extrapolateRight: 'clamp',
    });
  };
  const d = needleAngle(frame);
  const settle = start + 32;
  const value = Math.round((target / 270) * 100);
  const popScale = interpolate(frame, [settle, settle + 4, settle + 8], [0.3, 1.18, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const popOp = interpolate(frame, [settle, settle + 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const [tipX, tipY] = polar(135, R - 26);
  const [tailX, tailY] = polar(315, 36);
  const ticks: React.ReactNode[] = [];
  for (let k = 0; k <= 30; k++) {
    const dd = k * 9;
    const major = k % 3 === 0;
    const a = 135 + dd;
    const [x0, y0] = polar(a, R - 8);
    const [x1, y1] = polar(a, major ? R - 30 : R - 19);
    ticks.push(
      <line
        key={k}
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={dd >= 225 ? RED : G.mid}
        strokeWidth={major ? 4 : 2}
      />,
    );
  }
  return (
    <div style={{ width: GA_W, height: 500, position: 'relative' }}>
      <svg width={GA_W} height={430}>
        <path d={arcPath(0, 270, R)} fill="none" stroke={G.line} strokeWidth={10} strokeLinecap="round" />
        <path d={arcPath(225, 270, R)} fill="none" stroke={RED} strokeWidth={10} strokeLinecap="round" opacity={0.85} />
        {ticks}
        <g transform={`rotate(${d.toFixed(3)} ${CX} ${CY})`}>
          <line x1={tailX} y1={tailY} x2={tipX} y2={tipY} stroke={AMBER} strokeWidth={9} strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r={15} fill={COLORS.ink} />
        <circle cx={CX} cy={CY} r={6} fill={AMBER} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 396,
          textAlign: 'center',
          opacity: popOp,
          transform: `scale(${popScale.toFixed(4)})`,
        }}
      >
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 62, color: COLORS.ink }}>{value}</span>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: G.mid, marginLeft: 8 }}>%</span>
      </div>
    </div>
  );
};

export const SceneCbank: React.FC = () => {
  const frame = useCurrentFrame();
  const CARD_W = 1500;
  const CARD_H = 660;
  const CARD_X = (1920 - CARD_W) / 2;
  const CARD_Y = 210;
  const GA_W = CARD_W / 3;
  const GAUGES = [
    { start: 40, target: 190 },
    { start: 44, target: 120 },
    { start: 48, target: 235 },
  ];
  const LABELS = ['降利率', '降准备金率', '买国债'];
  const labelT = (i: number) =>
    interpolate(frame, [100 + i * 50, 112 + i * 50], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: POP_EASE,
    });
  return (
    <SceneBg src="bg-cbank.png" duration={345} zoomTo={1.04}>
      <DesignStage w={1920} h={1080} bg="transparent">
        <div style={{ position: 'absolute', left: 0, right: 0, top: 80, display: 'flex', justifyContent: 'center' }}>
          <Badge text="货币政策 · 央行工具箱" delay={10} size={50} bg={COLORS.gold} color={COLORS.ink} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: CARD_X,
            top: CARD_Y,
            width: CARD_W,
            height: CARD_H,
            background: 'rgba(255,255,255,0.96)',
            border: `6px solid ${COLORS.ocean}`,
            borderRadius: 26,
            boxSizing: 'border-box',
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            padding: 36,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 30,
              color: COLORS.ink,
              letterSpacing: 2,
            }}
          >
            直接调节货币供应量
          </div>
          <div style={{ position: 'absolute', left: 0, top: 96, display: 'flex' }}>
            {GAUGES.map((g, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <Gauge start={g.start} target={g.target} />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    textAlign: 'center',
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 40,
                    color: COLORS.red,
                    opacity: labelT(i),
                    transform: `translateY(${(1 - labelT(i)) * 20}px)`,
                  }}
                >
                  {LABELS[i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DesignStage>
    </SceneBg>
  );
};

/* ================= 6. r5 经济过热（axis-rescale-shock）================= */

export const SceneHot: React.FC = () => {
  const frame = useCurrentFrame();
  const AMBER = G.amber;
  const CARD_W = 1060;
  const CARD_H = 600;
  const CX = (1920 - CARD_W) / 2;
  const CY = (1080 - CARD_H) / 2 - 20;
  const PAD = 52;
  const AXIS_W = 96;
  const PLOT_W = CARD_W - PAD * 2 - AXIS_W;
  const PLOT_H = 360;
  const PLOT_X = PAD + AXIS_W;
  const PLOT_Y = 130;
  const DATA = [22, 30, 26, 38, 35, 47, 44, 58, 55, 66, 72, 340];
  const N = DATA.length;
  const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const HOLD = 25;
  const DRAW_END = HOLD + 34;
  const SHOCK_END = DRAW_END + 16;
  const BEAT = SHOCK_END + 16;
  const RESCALE_END = BEAT + 12;
  const MARK_END = RESCALE_END + 8;
  const VAL_END = MARK_END + 10;
  const easeDraw = Easing.inOut(Easing.cubic);
  const range = interpolate(frame, [BEAT, RESCALE_END], [100, 400], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const yOf = (v: number): number => PLOT_H - (v / range) * PLOT_H;
  const drawT = interpolate(frame, [HOLD, DRAW_END], [0, N - 2], {
    easing: easeDraw,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shockT = interpolate(frame, [DRAW_END + 2, SHOCK_END], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const SHOCK_Y = -(PLOT_Y + 220);
  const rescaleP = interpolate(frame, [BEAT, RESCALE_END], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const xOf = (i: number): number => (i / (N - 1)) * PLOT_W;
  const basePts: string[] = [];
  const upto = Math.min(drawT, N - 2);
  for (let i = 0; i <= Math.floor(upto); i++)
    basePts.push(`${xOf(i).toFixed(2)},${yOf(DATA[i]).toFixed(2)}`);
  if (upto < N - 2 && upto > Math.floor(upto)) {
    const i = Math.floor(upto);
    const f = upto - i;
    const x = xOf(i) + (xOf(i + 1) - xOf(i)) * f;
    const y = yOf(DATA[i]) + (yOf(DATA[i + 1]) - yOf(DATA[i])) * f;
    basePts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  let headX = basePts.length ? Number(basePts[basePts.length - 1].split(',')[0]) : 0;
  let headY = basePts.length ? Number(basePts[basePts.length - 1].split(',')[1]) : 0;
  let shockSeg: string[] = [];
  if (shockT > 0) {
    const x0 = xOf(N - 2);
    const y0 = yOf(DATA[N - 2]);
    const x = x0 + (xOf(N - 1) - x0) * shockT;
    const yEnd = SHOCK_Y + (yOf(DATA[N - 1]) - SHOCK_Y) * rescaleP;
    const y = y0 + (yEnd - y0) * shockT;
    shockSeg = [`${x0.toFixed(2)},${y0.toFixed(2)}`, `${x.toFixed(2)},${y.toFixed(2)}`];
    headX = x;
    headY = y;
  }
  const swap = interpolate(frame, [BEAT, BEAT + 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const OLD_TICKS = ['25', '50', '75', '100'];
  const NEW_TICKS = ['100', '200', '300', '400'];
  const denseOp = swap;
  const markS = interpolate(frame, [RESCALE_END, MARK_END], [0, 1], {
    easing: Easing.out(Easing.back(2.2)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const valS = interpolate(frame, [MARK_END, VAL_END], [0, 1], {
    easing: Easing.out(Easing.back(1.8)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const kick =
    frame >= SHOCK_END && frame < SHOCK_END + 8
      ? 8 * (1 - (frame - SHOCK_END) / 8) * Math.sin((frame - SHOCK_END) * 2.6)
      : 0;
  const shockOn = frame >= DRAW_END;
  return (
    <SceneBg src="bg-hot.png" duration={329} zoomTo={1.04}>
      <DesignStage w={1920} h={1080} bg="transparent">
        <div style={{ position: 'absolute', left: 0, right: 0, top: 30, display: 'flex', justifyContent: 'center' }}>
          <BigText lines={[[{ text: '经济过热', accent: true }]]} size={110} delay={28} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: CX,
            top: CY,
            width: CARD_W,
            height: CARD_H,
            background: COLORS.white,
            border: `2px solid ${G.border}`,
            borderRadius: 14,
            boxSizing: 'border-box',
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            transform: `translateY(${kick.toFixed(2)}px)`,
            overflow: 'visible',
          }}
        >
          <div style={{ position: 'absolute', left: PAD, top: 34, fontFamily: FONT }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: COLORS.ink }}>蟹堡王价格</div>
            <div style={{ fontSize: 19, fontWeight: 500, color: G.mid, marginTop: 6 }}>比奇堡 · 每月均价 · 贝壳</div>
          </div>
          <div style={{ position: 'absolute', left: PLOT_X, top: PLOT_Y, width: PLOT_W, height: PLOT_H }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={`g${i}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: (PLOT_H / 4) * i,
                  height: 2,
                  background: G.line,
                }}
              />
            ))}
            {[1, 3, 5, 7].map((i) => (
              <div
                key={`gd${i}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: (PLOT_H / 8) * i,
                  height: 1.5,
                  background: G.line,
                  opacity: 0.8 * denseOp,
                }}
              />
            ))}
            {OLD_TICKS.map((v, i) => {
              const y = (PLOT_H / 4) * (3 - i);
              return (
                <div
                  key={`t${i}`}
                  style={{
                    position: 'absolute',
                    left: -AXIS_W,
                    top: y - 13,
                    width: AXIS_W - 14,
                    height: 26,
                    textAlign: 'right',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      fontFamily: FONT,
                      fontWeight: 700,
                      fontSize: 21,
                      color: G.mid,
                      textAlign: 'right',
                      opacity: 1 - swap,
                      transform: `translateY(${(swap * 30).toFixed(2)}px)`,
                    }}
                  >
                    {v}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      fontFamily: FONT,
                      fontWeight: 700,
                      fontSize: 21,
                      color: COLORS.ink,
                      textAlign: 'right',
                      opacity: swap,
                      transform: `translateY(${((swap - 1) * 30).toFixed(2)}px)`,
                    }}
                  >
                    {NEW_TICKS[i]}
                  </div>
                </div>
              );
            })}
            <div
              style={{
                position: 'absolute',
                left: -AXIS_W,
                top: PLOT_H - 13,
                width: AXIS_W - 14,
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 21,
                color: G.mid,
                textAlign: 'right',
              }}
            >
              0
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: G.bar }} />
            <svg width={PLOT_W} height={PLOT_H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <polyline
                points={basePts.join(' ')}
                fill="none"
                stroke={COLORS.ink}
                strokeWidth={5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {shockSeg.length > 0 && (
                <polyline
                  points={shockSeg.join(' ')}
                  fill="none"
                  stroke={AMBER}
                  strokeWidth={shockOn && frame < RESCALE_END ? 10 : 6}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {markS > 0 && (
                <>
                  <circle cx={headX} cy={headY} r={13 * markS} fill={AMBER} />
                  <circle cx={headX} cy={headY} r={22 * markS} fill="none" stroke={AMBER} strokeWidth={3} opacity={0.55} />
                </>
              )}
            </svg>
            {valS > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: headX - 178,
                  top: headY - 27,
                  width: 150,
                  height: 54,
                  background: AMBER,
                  borderRadius: 10,
                  color: '#fff',
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${valS.toFixed(4)})`,
                  transformOrigin: 'right center',
                }}
              >
                340
              </div>
            )}
            {MONTHS.map((m, i) => (
              <div
                key={`m${i}`}
                style={{
                  position: 'absolute',
                  left: xOf(i) - 30,
                  top: PLOT_H + 16,
                  width: 60,
                  textAlign: 'center',
                  fontFamily: FONT,
                  fontSize: 18,
                  fontWeight: 600,
                  color: i === N - 1 ? AMBER : G.mid,
                }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 900, display: 'flex', justifyContent: 'center' }}>
          <BigText
            lines={[
              [
                { text: '加税', color: COLORS.red },
                { text: '加息', color: COLORS.red },
                { text: '少花钱', color: COLORS.red },
              ],
            ]}
            size={92}
            delay={195}
            perWord={16}
          />
        </div>
      </DesignStage>
    </SceneBg>
  );
};

/* ================= 7. r6 公考考点（cel-flash-stomp）================= */

export const SceneExam: React.FC = () => {
  const frame = useCurrentFrame();
  const LAND = 6;
  const WORDS = [
    { text: '判类型', start: 10, end: 40, rot: 2.5, flashLen: 6 },
    { text: '判方向', start: 40, end: 70, rot: -2.5, flashLen: 6 },
    { text: '选对策', start: 70, end: 9999, rot: 0, flashLen: 8 },
  ];
  const word = WORDS.find((w) => frame >= w.start && frame < w.end);
  // 首词入场前（f<10）：只留压暗背景的节拍，不渲染词/闪/标签条
  if (!word) {
    return (
      <SceneBg src="bg-exam.png" duration={284} zoomTo={1.04} dim={0.5}>
        <DesignStage w={1920} h={1080} bg="transparent">
          <></>
        </DesignStage>
      </SceneBg>
    );
  }
  const t = frame - word.start;
  const scale =
    t < 4
      ? interpolate(t, [0, 4], [1.18, 0.98], {
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.poly(5)),
        })
      : interpolate(t, [4, LAND], [0.98, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.quad),
        });
  const ft = t - LAND;
  const flashing = ft >= 0 && ft < word.flashLen;
  const flashOn = flashing && Math.floor(ft / 2) % 2 === 0;
  const labelOp = interpolate(frame, [76, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  return (
    <SceneBg src="bg-exam.png" duration={284} zoomTo={1.04} dim={0.5}>
      <DesignStage w={1920} h={1080} bg="transparent">
        {/* 底闪层：与文字分层，落定帧起闪；层内无任何内容元素 */}
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background: flashOn ? COLORS.sea : flashing ? COLORS.ocean : 'transparent',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 200,
              color: COLORS.white,
              textShadow: outlineShadow(COLORS.ocean, 14),
              transform: `scale(${scale}) rotate(${word.rot}deg)`,
              whiteSpace: 'nowrap',
            }}
          >
            {word.text}
          </div>
        </div>
        {/* 底部标签条：末词落定同帧淡入 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 130,
            background: COLORS.ink,
            opacity: labelOp,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 46,
              color: COLORS.yellow,
              letterSpacing: 4,
            }}
          >
            公考三连问 · 先背口诀
          </span>
        </div>
      </DesignStage>
    </SceneBg>
  );
};

/* ================= 8. outro 派大星获胜（counter-confetti）================= */

const PAL = ['#ff6b8b', '#ffb347', '#ffe86b', '#7bff9e', '#5fd8ff', '#6c8cff', '#c86cff', '#ff6cf0'];
const BURST = 0.52;
const BITS = Array.from({ length: 52 }, (_, i) => {
  const isRect = rand(i * 3) > 0.4;
  const w = (5 + rand(i + 2) * 6) * 4;
  const h = (isRect ? 8 + rand(i + 5) * 7 : w) * 4;
  const side = i % 2 ? 1 : -1;
  return {
    w,
    h,
    isRect,
    color: PAL[i % 8],
    x0: side * 1000,
    y0: (rand(i + 30) - 0.5) * 240,
    vx: -side * (600 + rand(i * 5 + 1) * 1200),
    vy: -(920 + rand(i * 7 + 3) * 880),
    g: 3600 + rand(i + 60) * 2080,
    spin: (rand(i + 90) - 0.5) * 6000,
    d: rand(i + 120) * 0.06,
  };
});

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = 339;
  const t = Math.min(1, frame / (dur - 1));
  const p = seg(t, 0.06, 0.56, E.outQuart);
  const val = Math.round(p * 2000);
  const s1 = seg(t, 0.06, 0.3, E.outCubic);
  const s2 = seg(t, 0.56, 0.72, E.outBack);
  const sc = lerp(s1, 0.2, 1.3) + s2 * (1 - 1.3);
  const rp = seg(t, 0.545, 0.75, E.outQuart);
  return (
    <SceneBg src="bg-outro.png" duration={339} zoomTo={1.04}>
      <DesignStage w={1920} h={1080} bg="transparent">
        {/* 中心辉光 + 读数区压暗 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '28%',
            width: 900,
            height: 900,
            margin: -450,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(4,20,35,0.55), transparent 66%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '28%',
            transformOrigin: '50% 50%',
            transform: `scale(${sc})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: 'translate(-50%,-50%)',
              whiteSpace: 'nowrap',
              fontWeight: 900,
              fontSize: 296,
              lineHeight: 1,
              fontFamily: FONT,
              letterSpacing: -4,
              background: 'linear-gradient(180deg,#ffffff,#ffd23f)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 0 60px rgba(255,200,60,0.35)',
              opacity: Math.min(1, seg(t, 0.02, 0.12) * 1.2),
            }}
          >
            {val.toLocaleString('en-US')}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '39%',
            transform: 'translate(-50%,0)',
            fontWeight: 800,
            fontSize: 42,
            lineHeight: 1,
            fontFamily: FONT,
            color: COLORS.yellow,
            textShadow: outlineShadow(COLORS.ink, 8),
            opacity: seg(t, 0.62, 0.78, E.outCubic),
            letterSpacing: lerp(seg(t, 0.62, 0.82, E.outCubic), 16, 6),
          }}
        >
          派大星 · 得票数
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '28%',
            width: 480,
            height: 480,
            margin: -240,
            borderRadius: '50%',
            border: '2px solid rgba(255,230,0,0.8)',
            boxSizing: 'content-box',
            opacity: rp > 0 ? (1 - rp) * 0.9 : 0,
            transform: `scale(${0.35 + rp * 2.6})`,
          }}
        />
        {BITS.map((b, i) => {
          const u = seg(t, BURST + b.d, 1);
          const life = u * 1.1;
          const x = b.x0 + b.vx * life;
          const y = b.y0 + b.vy * life + 0.5 * b.g * life * life;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '28%',
                width: b.w,
                height: b.h,
                background: b.color,
                borderRadius: b.isRect ? 8 : '50%',
                willChange: 'transform',
                opacity: u <= 0 ? 0 : Math.min(1, u * 8) * (1 - seg(u, 0.74, 1) * 0.95),
                transform: `translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) rotate(${b.spin * life}deg) scale(${0.8 + (1 - u) * 0.35})`,
              }}
            />
          );
        })}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 690,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <BigText
            lines={[[{ text: '宏观调控', accent: true }], [{ text: '要科学！', color: COLORS.red }]]}
            size={130}
            gap={20}
            delay={225}
            perWord={10}
            mode="slam"
          />
        </div>
      </DesignStage>
    </SceneBg>
  );
};
