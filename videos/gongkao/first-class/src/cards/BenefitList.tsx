/**
 * 移植自镜头卡 `ui-entrance/list-reveal`
 * （demo: cards/demos/ui-entrance/list-reveal/ListReveal.tsx）
 *
 * 保留的卡内核：**两层运动分离叠加**——整个列表容器全程线性缓慢漂移，
 * 而每一项各自用 outBack 轻微过冲 scale 找位（0.78→1 + translateY 14→0）。
 * 逐项入场与整体漂移叠在一起，才不像"逐条淡入"的 PPT。
 * 改掉的：Dashboard/Settings 占位换成旁白里的往届生优势；进度源换窗口内帧。
 */
import { E, lerp, seg, useLocalT } from './motion';
import { FONT, SK, surface } from './skin';

export const BenefitList: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const t = useLocalT(dur);
  // 卡点来自 narration.ts（相对分镜）：离家近 206 / 限本省户籍 264 /
  // 能框掉外地人 320；240 是把"岗位多"独立成一条
  const rows = [
    { at: 206, text: '岗位多', note: '省 / 市 / 县 / 乡镇 全有' },
    { at: 240, text: '离家近', note: '通勤半径内的岗位' },
    { at: 264, text: '限本省户籍', note: '把外地竞争者框在外面' },
    { at: 320, text: '框掉外地人', note: '报录比直接下来' },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 150,
        // 整体漂移层：全程线性缓慢上移（与逐项入场是两层独立运动）
        transform: `translateX(-50%) translateY(${lerp(t, 22, -22)}px)`,
        width: 760,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {rows.map((r, i) => {
        const tp = seg(t, (r.at - start) / dur, (r.at - start) / dur + 0.24, E.outBack);
        return (
          <div
            key={r.text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '12px 24px',
              ...surface(SK.paper, 14),
              opacity: Math.min(1, Math.max(0, tp) * 2.2),
              transform: `scale(${0.78 + Math.max(0, tp) * 0.22}) translateY(${lerp(
                Math.max(0, tp),
                16,
                0,
              )}px)`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                flex: 'none',
                background: i === rows.length - 1 ? SK.stamp : SK.sponge,
                border: `4px solid ${SK.ink}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 22,
                color: i === rows.length - 1 ? SK.paper : SK.ink,
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 36, color: SK.ink }}>
              {r.text}
            </div>
            <div
              style={{
                marginLeft: 'auto',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 20,
                color: SK.dim,
              }}
            >
              {r.note}
            </div>
          </div>
        );
      })}
    </div>
  );
};
