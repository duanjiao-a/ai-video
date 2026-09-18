/**
 * 卡件复用池：把两条卡内核抽成可复用件，供各分镜按需调用。
 *
 * - `FlyChars`  来自 `effects/assemble-then-type-flyin` 的第二段：逐字从 3D 空间
 *   旋转着落位（每个字符独立 translate3d + rotateX/Y/Z + perspective）。
 * - `Tag`       来自同一卡的**第一段**：无内容骨架从画外飞入贴合，outBack 过冲 +
 *   运动残余 blur（落位即清晰）。
 * 抽出来的原因：同一张卡的第一/第二段在本片要分别用在不同的旁白句子上，
 * 绑死在一个组件里就没法对卡点。
 */
import { E, lerp, rand, seg, useLocalT } from './motion';
import { FONT, SK, surface } from './skin';

/**
 * 逐字 3D 飞入参数。种子由**文本内容**哈希决定，不能用模块级自增计数器：
 * 组件每帧重渲，计数器会随之增长，同一个字每帧拿到不同参数 —— 画面乱抖且逐帧不确定。
 */
export const charParams = (text: string) => {
  let h = 7;
  for (const ch of text) h = (h * 131 + ch.charCodeAt(0)) >>> 0;
  return Array.from(text, (_, i) => {
    const k = (h % 9973) + i * 37;
    return {
      dx: (rand(k) - 0.5) * 900,
      dy: (rand(k + 50) - 0.5) * 700,
      dz: -220 - rand(k + 99) * 620,
      rx: (rand(k + 7) - 0.5) * 340,
      ry: (rand(k + 13) - 0.5) * 380,
      rz: (rand(k + 23) - 0.5) * 240,
    };
  });
};

/** 一行逐字 3D 落位的字。start/t 都是"窗口内归一化"后的值。 */
export const FlyChars: React.FC<{
  text: string;
  start: number;
  t: number;
  step?: number;
  size: number;
  color: string;
  outline?: boolean;
}> = ({ text, start, t, step = 0.011, size, color, outline }) => {
  const cs = charParams(text);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        color,
        whiteSpace: 'nowrap',
        textShadow: outline ? '0 6px 0 rgba(8,58,86,0.55)' : undefined,
      }}
    >
      {Array.from(text, (ch, i) => {
        const ft = start + i * step;
        const c = cs[i];
        const a = seg(t, ft, ft + 0.13, E.outCubic);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: a > 0 ? Math.min(1, a * 1.8) : 0,
              transform:
                a >= 1
                  ? 'none'
                  : `perspective(600px) translate3d(${lerp(a, c.dx, 0)}px,${lerp(
                      a,
                      c.dy,
                      0,
                    )}px,${lerp(a, c.dz, 0)}px) rotateX(${lerp(a, c.rx, 0)}deg) rotateY(${lerp(
                      a,
                      c.ry,
                      0,
                    )}deg) rotateZ(${lerp(a, c.rz, 0)}deg)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** 纸标签：从画外飞入贴合（outBack 过冲 + 残影 blur），落位即清晰 */
export const Tag: React.FC<{
  text: string;
  from: [number, number];
  ft: number;
  t: number;
  size?: number;
  accent?: boolean;
  style?: React.CSSProperties;
}> = ({ text, from, ft, t, size = 30, accent = false, style }) => {
  const a = seg(t, ft, ft + 0.05, E.outBack);
  const speed = a > 0 && a < 0.97 ? 1 - a : 0;
  return (
    <div
      style={{
        ...surface(accent ? SK.sponge : SK.paper, 14),
        padding: '8px 22px',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        color: SK.ink,
        opacity: t >= ft ? Math.min(1, seg(t, ft, ft + 0.02) * 1.6) : 0,
        transform: `translate(${lerp(a, from[0], 0)}px,${lerp(a, from[1], 0)}px) rotate(${lerp(
          a,
          from[0] > 0 ? 5 : -5,
          0,
        )}deg)`,
        filter: speed > 0.03 ? `blur(${speed * 6}px)` : 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/**
 * 单行字卡：入场沿用卡库的"落位"语法（outBack 过冲 + 残余 blur），
 * 不走"缩放入场"那套通用模板。放在 [at, at+dur) 的 Sequence 里用。
 */
export const Line: React.FC<{
  main: string;
  sub?: string;
  size?: number;
  top?: number;
  dur: number;
  color?: string;
  accent?: string;
}> = ({ main, sub, size = 76, top = 70, dur, color = SK.white, accent = SK.sponge }) => {
  const t = useLocalT(dur);
  const enter = seg(t, 0, 0.16, E.outBack);
  const speed = enter > 0 && enter < 0.97 ? 1 - enter : 0;
  const leave = seg(t, 0.88, 1);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top,
        transform: `translateX(-50%) translateY(${lerp(enter, -34, 0)}px) scale(${lerp(
          enter,
          1.22,
          1,
        )}) rotate(${lerp(enter, -3, 0)}deg)`,
        opacity: Math.min(1, Math.max(0, enter)) * (1 - leave),
        filter: speed > 0.03 ? `blur(${speed * 9}px)` : 'none',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: size,
          color,
          textShadow: '0 7px 0 rgba(8,58,86,0.6)',
        }}
      >
        {main}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: size * 0.52,
            color: accent,
            textShadow: '0 5px 0 rgba(8,58,86,0.6)',
            marginTop: 6,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
