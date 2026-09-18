/**
 * 移植自镜头卡 `effects/assemble-then-type-flyin`
 * （demo: cards/demos/effects/assemble-then-type-flyin/AssembleThenTypeFlyin.tsx）
 *
 * 保留的卡内核：两段式，且两段的**运动维度必须不同**——
 *   ① 空骨架从四面八方飞入贴合（outBack 过冲 + 运动残余 blur，落位即清晰）；
 *   ② 文字逐字从 3D 空间旋转着落位（每字独立 translate3d + rotateX/Y/Z + perspective）。
 * 改掉的：Acme Studio 占位版面换成两张报名表（国考 / 省考）；进度源换成窗口内帧。
 * 复用件：FlyChars / Tag 见 ./parts。
 */
import { E, lerp, rand, seg, useLocalT } from './motion';
import { FlyChars } from './parts';
import { FONT, SK, surface } from './skin';

type Shell = { from: [number, number]; rot: number; ft: number };

/** 空骨架飞入样式（卡的第一段） */
const fly = (t: number, s: Shell): React.CSSProperties => {
  const a = seg(t, s.ft, s.ft + 0.14, E.outBack);
  const speed = a > 0 && a < 0.97 ? 1 - a : 0;
  return {
    opacity: t >= s.ft ? Math.min(1, seg(t, s.ft, s.ft + 0.05) * 1.5) : 0,
    transform: `translate(${lerp(a, s.from[0], 0)}px,${lerp(a, s.from[1], 0)}px) rotate(${lerp(
      a,
      s.rot,
      0,
    )}deg)`,
    filter: speed > 0.03 ? `blur(${speed * 5}px)` : 'none',
  };
};

/** 报名表：骨架先贴（阶段一），表头与表格线随文字后落（阶段二） */
const Form: React.FC<{
  t: number;
  shell: Shell;
  title: string;
  when: string;
  rows: number;
  titleAt: number;
}> = ({ t, shell, title, when, rows, titleAt }) => (
  <div
    style={{
      position: 'absolute',
      ...fly(t, shell),
      ...surface(SK.paper, 18),
      width: 400,
      padding: '16px 22px 20px',
    }}
  >
    <div
      style={{
        opacity: seg(t, titleAt, titleAt + 0.05),
        transform: `translateY(${lerp(seg(t, titleAt, titleAt + 0.06, E.outBack), -14, 0)}px)`,
      }}
    >
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: SK.ink }}>{title}</div>
      <div
        style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: SK.stamp, marginTop: 2 }}
      >
        {when}
      </div>
    </div>
    <div style={{ marginTop: 14 }}>
      {Array.from({ length: rows }, (_, i) => {
        const rt = titleAt + 0.04 + i * 0.035;
        const a = seg(t, rt, rt + 0.05, E.outCubic);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: `3px solid ${SK.ink}`,
                background: a > 0.6 ? SK.sponge : 'transparent',
                transform: `scale(${a})`,
              }}
            />
            <div
              style={{
                height: 10,
                borderRadius: 5,
                background: 'rgba(15,60,92,0.24)',
                width: `${(a > 0 ? 0.55 + 0.35 * rand(i * 3.3) : 0) * 100}%`,
                transformOrigin: 'left center',
                transform: `scaleX(${a})`,
              }}
            />
          </div>
        );
      })}
    </div>
  </div>
);

export const AssembleForms: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const t = useLocalT(dur);
  // 卡点来自 narration.ts（分镜相对帧）：两个都报 90 / 国考十一月底考 122 /
  // 省考联考在来年三月考 165 / 时间正好错开 227 / 机会直接翻倍 377。
  // 组件挂在 [start, start+dur) 的 Sequence 里，先减窗口起点再归一化。
  const T = (rel: number) => (rel - start) / dur;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 54,
          transform: 'translateX(-50%)',
          opacity: 1 - seg(t, T(230), T(250)) * 0.85,
        }}
      >
        <FlyChars text="应届生：两个都报" start={T(90)} t={t} size={74} color={SK.white} outline />
      </div>

      <Form
        t={t}
        shell={{ from: [-620, -120], rot: -7, ft: T(122) }}
        title="国考"
        when="11 月底笔试"
        rows={3}
        titleAt={T(128)}
      />
      <Form
        t={t}
        shell={{ from: [660, 140], rot: 6, ft: T(165) }}
        title="省考"
        when="次年 3 月笔试"
        rows={3}
        titleAt={T(171)}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 452,
          transform: 'translateX(-50%)',
          opacity: seg(t, T(227), T(240)),
        }}
      >
        <FlyChars text="时间正好错开" start={T(227)} t={t} size={54} color={SK.sponge} outline />
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 300,
          transform: 'translateX(-50%)',
          opacity: seg(t, T(377), T(390)),
        }}
      >
        <FlyChars text="机会直接翻倍" start={T(377)} t={t} size={104} color={SK.stamp} outline />
      </div>
    </>
  );
};
