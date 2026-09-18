/**
 * 五个硬切点用的转场卡 —— 全部移植自镜头卡库，各取卡的**转场动作**，
 * 压进跨骑切点两侧各 13 帧的窗口（原卡 108–180f 是含 A/B 停留的整段长度，
 * 真正的动作段本来就只有十几帧；这里只留动作段，并在文档里记明压缩）。
 *
 * 每张卡在窗口内自成一体、全屏不透明，切点落在窗口正中间，用来盖住场景切换。
 */
import { E, lerp, rand, seg, useLocalT } from './motion';
import { FONT, SK } from './skin';

const FONT_STACK = FONT;

/**
 * 卡：transition/white-flash-logo-simplify-cut —— 彩色液态字标 → 冲白 → 扁平字标
 *
 * 皮肤改动（全片一致）：库里的 demo 一律用 #08070c 近黑舞台（为产品暗场片调校）。
 * 本片是明亮海底场景，切点闪一块全屏黑会读作"信号断了"。所以五个转场卡统一
 * 换成纸色舞台（纸黄/海蓝/海绵黄），只保留各卡的**动作**，不用它的底色。
 */
export const CutWhiteFlash: React.FC<{ dur: number; word: string }> = ({ dur, word }) => {
  const t = useLocalT(dur);
  const flow = t * 100;
  const flashK = seg(t, 0.34, 0.42, E.inQuad);
  const blurPulse = Math.sin(seg(t, 0.34, 0.46) * Math.PI);
  const lk = seg(t, 0.48, 0.74, E.outCubic);
  const out = seg(t, 0.86, 1);
  return (
    <div style={{ position: 'absolute', inset: 0, background: SK.paper, overflow: 'hidden', opacity: 1 - out }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT_STACK,
          fontWeight: 900,
          fontSize: 150,
          letterSpacing: 12,
          background:
            'linear-gradient(105deg,#ff5fa2 0%,#ff9d4d 22%,#ffe45c 38%,#4de3c1 58%,#4d9bff 76%,#a05cff 100%)',
          backgroundSize: '320% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          backgroundPosition: `${flow}% 0`,
          filter: `blur(${blurPulse * 5}px) brightness(${1 + blurPulse * 1.2})`,
          opacity: 1 - lk,
        }}
      >
        {word}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: SK.white, opacity: flashK }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: lk,
          transform: `scale(${lerp(lk, 0.96, 1)})`,
        }}
      >
        <div
          style={{
            fontFamily: FONT_STACK,
            fontWeight: 900,
            fontSize: 140,
            letterSpacing: 16,
            background: `linear-gradient(92deg,#d93a35 0%,#0f3c5c 45%,#2fb3e6 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {word}
        </div>
      </div>
    </div>
  );
};

/** 卡：transition/gradient-transition —— 背景在 linear / radial / conic 三类渐变间平滑过渡 */
const hsl = (h: number, s: number, l: number) => `hsl(${h},${s}%,${l}%)`;
type H3 = [number, number, number];
const mixH = (a: H3, b: H3, k: number): H3 => [
  lerp(k, a[0], b[0]),
  lerp(k, a[1], b[1]),
  lerp(k, a[2], b[2]),
];

export const CutGradient: React.FC<{ dur: number; label: string }> = ({ dur, label }) => {
  const t = useLocalT(dur);
  const p1 = seg(t, 0, 0.4, E.inOutQuad);
  const ang = lerp(p1, 40, 230);
  const c1 = mixH([340, 88, 60], [190, 78, 52], p1);
  const c2 = mixH([265, 80, 52], [205, 92, 58], p1);
  const bg1 = `linear-gradient(${ang}deg, ${hsl(...c1)}, ${hsl(...c2)})`;
  const p2 = seg(t, 0.33, 0.7, E.inOutQuad);
  const bg2 = `radial-gradient(circle ${lerp(p2, 45, 85)}% at ${lerp(p2, 28, 72)}% ${lerp(
    p2,
    66,
    32,
  )}%, ${hsl(...mixH([45, 95, 62], [285, 85, 58], p2))}, ${hsl(...mixH([220, 60, 14], [230, 55, 10], p2))})`;
  const p3 = seg(t, 0.66, 1, E.inOutQuad);
  const bg3 = `conic-gradient(from ${p3 * 300}deg at 50% 50%, hsl(210,85%,58%), hsl(190,80%,55%), hsl(45,90%,62%), hsl(340,85%,62%), hsl(265,80%,60%), hsl(210,85%,58%))`;
  const layer = (background: string, opacity: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    background,
    opacity,
  });
  const out = seg(t, 0.9, 1);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 1 - out }}>
      <div style={layer(bg1, 1 - seg(t, 0.3, 0.38))} />
      <div style={layer(bg2, seg(t, 0.3, 0.38) - seg(t, 0.63, 0.71))} />
      <div style={layer(bg3, seg(t, 0.63, 0.71))} />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          padding: '12px 44px',
          borderRadius: 999,
          background: 'rgba(8,58,86,.62)',
          border: `4px solid ${SK.paper}`,
          color: SK.paper,
          fontFamily: FONT_STACK,
          fontWeight: 900,
          fontSize: 60,
          letterSpacing: 10,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** 卡：transition/cube-navigation —— 内容贴面、rig 转面带动法线明暗（压成一次 90° 转面） */
const CubeFace: React.FC<{
  tf: string;
  bg: string;
  title: string;
  sub: string;
  lit: number;
}> = ({ tf, bg, title, sub, lit }) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 420,
      height: 420,
      margin: '-210px 0 0 -210px',
      transform: tf,
      backfaceVisibility: 'hidden',
      background: bg,
      border: `6px solid ${SK.ink}`,
      borderRadius: 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      filter: `brightness(${0.5 + Math.max(0, lit) * 0.62}) saturate(${0.8 + Math.max(0, lit) * 0.4})`,
    }}
  >
    <div style={{ fontFamily: FONT_STACK, fontWeight: 900, fontSize: 86, color: SK.ink }}>{title}</div>
    <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 30, color: SK.stamp }}>{sub}</div>
  </div>
);

export const CutCube: React.FC<{ dur: number; front: string; back: string }> = ({
  dur,
  front,
  back,
}) => {
  const t = useLocalT(dur);
  // 相机 rig：先推近（读正面）→ 转 90° 并拉远 → 推近读背面
  const pull = seg(t, 0.05, 0.3, E.inOutCubic) - seg(t, 0.72, 1, E.inOutCubic);
  const ry = -90 * seg(t, 0.3, 0.72, E.inOutCubic);
  const rx = -22 * Math.sin(seg(t, 0.3, 0.72) * Math.PI);
  const z = lerp(pull, 240, -150);
  const rad = (d: number) => (d * Math.PI) / 180;
  const litFront = Math.cos(rad(ry)) * Math.cos(rad(rx));
  const litBack = Math.cos(rad(ry + 90)) * Math.cos(rad(rx));
  const out = seg(t, 0.92, 1);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(160deg, ${SK.sea}, ${SK.deep})`,
        overflow: 'hidden',
        perspective: 1200,
        opacity: 1 - out,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform: `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
        }}
      >
        <CubeFace
          tf="rotateY(0deg) translateZ(210px)"
          bg={SK.paper}
          title={front}
          sub="已讲完"
          lit={litFront}
        />
        <CubeFace
          tf="rotateY(90deg) translateZ(210px)"
          bg={SK.paperDeep}
          title={back}
          sub="接下来"
          lit={litBack}
        />
      </div>
    </div>
  );
};

/** 卡：transition/mosaic-reframe —— 瓦片在两种排版之间连续变形（压成一次整屏重排） */
const GAP_M = 8;
const TILE_W = (1280 - GAP_M * 7) / 8;
const TILE_H = (720 - GAP_M * 5) / 6;

export const CutMosaic: React.FC<{ dur: number; label: string }> = ({ dur, label }) => {
  const t = useLocalT(dur);
  const out = seg(t, 0.9, 1);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: SK.paperDeep,
        overflow: 'hidden',
        opacity: 1 - out,
      }}
    >
      {Array.from({ length: 48 }, (_, i) => {
        const c = i % 8;
        const r = Math.floor(i / 8);
        const st = i * 0.006;
        // A → B：整屏规则网格 → 对角推移（每片位置与尺寸各自独立插值）
        const u = seg(t, 0.18 + st, 0.66 + st, E.inOutCubic);
        const x = lerp(u, c * (TILE_W + GAP_M), c * (TILE_W + GAP_M) + (r - 2.5) * 34);
        const y = lerp(u, r * (TILE_H + GAP_M), r * (TILE_H + GAP_M) + (c - 3.5) * 22);
        const w = lerp(u, TILE_W, TILE_W * 0.86);
        const h = lerp(u, TILE_H, TILE_H * 0.86);
        const rot = (c - 3.5) * 2.2 * u;
        // 瓦片配色改成纸黄/海蓝/海绵黄三色循环 —— 与全片材质同一套
        const TILE_COLORS = [
          `linear-gradient(150deg, ${SK.paper}, ${SK.paperDeep})`,
          `linear-gradient(150deg, ${SK.sea}, #1c7fb0)`,
          `linear-gradient(150deg, ${SK.sponge}, ${SK.gold})`,
        ];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: w,
              height: h,
              borderRadius: 8,
              transform: `rotate(${rot}deg)`,
              background: TILE_COLORS[i % 3],
              border: `2px solid rgba(15,60,92,.35)`,
              boxShadow: '0 4px 0 rgba(8,58,86,.18)',
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          opacity: seg(t, 0.5, 0.62) * (1 - seg(t, 0.78, 0.92)),
          fontFamily: FONT_STACK,
          fontWeight: 900,
          fontSize: 120,
          color: SK.white,
          textShadow: '0 10px 0 rgba(8,58,86,0.6)',
          letterSpacing: 10,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** 卡：effects/scanline-assemble-flyin —— 亮扫描线掠过，扫到处组件就地装配落位 */
export const CutScanline: React.FC<{ dur: number; label: string }> = ({ dur, label }) => {
  const t = useLocalT(dur);
  const ly = lerp(seg(t, 0.06, 0.74), -80, 800);
  const lineOpacity = seg(t, 0.03, 0.08) * (1 - seg(t, 0.74, 0.84));
  const out = seg(t, 0.88, 1);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${SK.paper}, ${SK.paperDeep})`,
        overflow: 'hidden',
        opacity: 1 - out,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          background:
            'repeating-linear-gradient(0deg,transparent 0 47px,rgba(15,60,92,.07) 47px 48px),' +
            'repeating-linear-gradient(90deg,transparent 0 47px,rgba(15,60,92,.07) 47px 48px)',
        }}
      />
      {/* 落位块：扫描线扫到即从画外飞入贴合（outBack + 残影 blur） */}
      {Array.from({ length: 6 }, (_, i) => {
        const y = 90 + i * 96;
        const ft = 0.06 + ((y + 80) / 880) * 0.68;
        const a = seg(t, ft, ft + 0.15, E.outBack);
        const speed = a > 0 && a < 0.97 ? 1 - a : 0;
        const dirX = i % 2 === 0 ? -240 : 260;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 120,
              top: y,
              width: 1040,
              height: 64,
              borderRadius: 10,
              background: i === 2 ? SK.stamp : 'rgba(47,179,230,.22)',
              border: `3px solid ${SK.ink}`,
              opacity: t >= ft ? Math.min(1, seg(t, ft, ft + 0.06) * 1.4) : 0,
              transform: `translate(${lerp(a, dirX, 0)}px,${lerp(a, -60, 0)}px) rotate(${lerp(
                a,
                i % 2 === 0 ? -4 : 4,
                0,
              )}deg)`,
              filter: speed > 0.03 ? `blur(${speed * 5}px)` : 'none',
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '46%',
          transform: 'translate(-50%,-50%)',
          opacity: seg(t, 0.56, 0.68),
          fontFamily: FONT_STACK,
          fontWeight: 900,
          fontSize: 130,
          color: SK.ink,
          letterSpacing: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: 60,
          background:
            'linear-gradient(180deg,transparent,rgba(15,60,92,.10) 55%,rgba(15,60,92,.02) 96%,transparent)',
          transform: `translateY(${ly - 60}px)`,
          opacity: lineOpacity,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 3,
            background: SK.stamp,
            boxShadow: `0 0 14px ${SK.stamp},0 0 30px rgba(217,58,53,.45)`,
          }}
        />
      </div>
    </div>
  );
};
