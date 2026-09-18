/**
 * 移植自镜头卡 `data/avatar-grid-radial-build-colorize`
 * （demo: cards/demos/data/avatar-grid-radial-build-colorize/AvatarGridRadialBuildColorize.tsx）
 *
 * 保留的卡内核：① 网格按**到中心的环号**分环生长，每环错开若干帧，逐格
 * opacity + scale 0.8→1，**只显形不位移**；② 铺满后约 15% 的格子在自己的
 * 随机时刻把底色染红，形成"异常项逐渐浮现"的扫描感；③ 中央挖空留给标题与图例。
 * 改掉的：首字母/图标/缩略图占位换成旁白里的招录层级词；红=联考集中省份；
 * 进度源换成窗口内帧。
 */
import { E, lerp, rand, seg, useLocalT } from './motion';
import { FONT, SK, surface } from './skin';

const COLS = 8;
const ROWS = 4;
const GAP = 10;
const INSET = 56;
/** 网格纵向范围：上留到 56，下止于 576 —— 必须避开底部字幕条的 y 610–686 */
const TOP = 56;
const GRID_H = 520;
const CELL_W = (1280 - INSET * 2 - (COLS - 1) * GAP) / COLS;
const CELL_H = (GRID_H - (ROWS - 1) * GAP) / ROWS;

const LABELS = ['省', '市', '县', '乡镇', '街道', '机关', '直属', '基层', '派出', '站所', '厅局', '部门'];

/** 每格静态参数：环号决定出生时刻，flagged 决定是否会被染红 */
const CELLS = Array.from({ length: ROWS * COLS }, (_, i) => {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const hidden = r >= 1 && r <= 2 && c >= 2 && c <= 5; // 中央挖空给标题
  const ring = Math.round(Math.hypot((c - 3.5) / 1.0, (r - 1.5) / 0.85));
  const jitter = rand(i + 40) * 4;
  const label = LABELS[Math.floor(rand(i * 3.7) * LABELS.length)];
  const flagged = rand(i + 900) < 0.22;
  const at = 0.7 + rand(i + 1600) * 0.18;
  return { hidden, ring, jitter, label, flagged, at };
});

export const UnitGrid: React.FC<{ dur: number }> = ({ dur }) => {
  const t = useLocalT(dur);
  // 环号 → 出生时刻：每环 7f，配 0–4f 帧级抖动（卡 md：每 4 帧扩一环）
  const born = (ring: number, jitter: number) => 0.02 + (ring * 7 + jitter) / dur;
  const titleIn = seg(t, 0.42, 0.5, E.outQuad);
  const legendIn = seg(t, 0.62, 0.72, E.outQuad);

  return (
    <>
      <div style={{ position: 'absolute', left: INSET, top: TOP, width: 1280 - INSET * 2, height: GRID_H }}>
        {CELLS.map((cl, i) => {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          const f = born(cl.ring, cl.jitter);
          const o = seg(t, f, f + 0.022, E.linear);
          const sc = seg(t, f, f + 0.045, E.outQuad);
          const cT = cl.flagged ? seg(t, cl.at, cl.at + 0.06, E.outQuad) : 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: c * (CELL_W + GAP),
                top: r * (CELL_H + GAP),
                width: CELL_W,
                height: CELL_H,
                boxSizing: 'border-box',
                borderRadius: 12,
                background: cl.flagged
                  ? `rgba(217,58,53,${0.12 + 0.5 * cT})`
                  : 'rgba(255,245,220,0.9)',
                border: `3px solid ${cl.flagged ? SK.stamp : SK.ink}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 30,
                color: cl.flagged ? SK.stamp : SK.ink,
                opacity: o,
                visibility: cl.hidden ? 'hidden' : 'visible',
                transform: `scale(${lerp(sc, 0.8, 1)})`,
                boxShadow: '0 4px 0 rgba(8,58,86,0.22)',
              }}
            >
              {cl.label}
            </div>
          );
        })}
      </div>

      {/* 中央标题：占住挖空区 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%,-50%) scale(${lerp(titleIn, 0.96, 1)})`,
          ...surface(SK.paper, 20),
          padding: '14px 40px',
          opacity: titleIn,
          zIndex: 5,
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: SK.ink }}>
          岗位多 · 离家近
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: SK.stamp, marginTop: 4 }}>
          省 / 市 / 县 / 乡镇 全覆盖
        </div>
      </div>

      {/* 图例：红格 = 多省联考集中 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 452,
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 22,
          alignItems: 'center',
          opacity: legendIn,
          padding: '6px 18px',
          background: 'rgba(8,58,86,0.55)',
          borderRadius: 999,
        }}
      >
        {[
          ['常招层级', SK.paper],
          ['联考集中', SK.stamp],
        ].map(([txt, col]) => (
          <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                background: col as string,
                border: `2px solid ${SK.ink}`,
                display: 'inline-block',
              }}
            />
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: SK.paper }}>
              {txt}
            </span>
          </div>
        ))}
      </div>
    </>
  );
};
