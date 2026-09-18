/**
 * 移植自镜头卡 `typography/vertical-word-roll-blur-cycle`
 * （demo: cards/demos/typography/vertical-word-roll-blur-cycle/VerticalWordRollBlurCycle.tsx）
 *
 * 保留的卡内核：句干纹丝不动 + 三行遮罩窗内竖向滚轮换词；相邻行按距离加
 * **垂直 blur**（滚轮景深）+ 降不透明度；落定瞬间中心词从灰染成强调色；
 * 每步走 `0.7·outQuint + 0.3·outBack`（前快后极慢 + 轻过冲）。
 * 改掉的：占位词换成旁白里真实出现的词；中性灰底换成纸面牌；进度源换成窗口内帧。
 */
import { E, lerp, seg, useLocalT } from './motion';
import { FONT, SK, surface } from './skin';

const ROW = 62;

export const WordRoll: React.FC<{
  /** 句干（全程不动） */
  stem: string;
  /** 滚轮词序列，最后一个停在窗口中心 */
  words: string[];
  /** 每步换词的归一化时刻 */
  steps: number[];
  /** 窗口时长（帧），决定 t 的归一化 */
  dur: number;
  /** 牌面位置 */
  top?: number;
  fontSize?: number;
  /** 中心词落定后的强调色（默认印章红） */
  accent?: string;
  /** 中心词落定后给牌面盖一道红边（倒计时用） */
  sealAfter?: boolean;
}> = ({
  stem,
  words,
  steps,
  dur,
  top = 66,
  fontSize = 54,
  accent = SK.stamp,
  sealAfter = false,
}) => {
  const t = useLocalT(dur);
  // 滚轮进度：0=第一个词在中心，每步 +1
  let p = 0;
  for (const s of steps) {
    const u = seg(t, s, s + 0.11);
    p += 0.7 * E.outQuint(u) + 0.3 * E.outBack(u);
  }
  const settled = p >= words.length - 1 - 0.02;
  const seal = sealAfter ? seg(t, 0.86, 0.98, E.outBack) : 0;
  const winW = Math.max(fontSize * 4.2, 240);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top,
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 34px',
        ...surface(),
        outline: seal > 0 ? `${4 * seal}px solid rgba(217,58,53,${0.9 * seal})` : undefined,
        outlineOffset: 6,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize,
          color: SK.ink,
          letterSpacing: -0.5,
          whiteSpace: 'nowrap',
        }}
      >
        {stem}
      </div>
      {/* 三行高的遮罩窗，滚轮列在其中滑动，中心行 = 第二行 */}
      <div style={{ position: 'relative', height: ROW * 3, width: winW, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            transform: `translateY(${ROW - p * ROW}px)`,
          }}
        >
          {words.map((w, i) => {
            const d = Math.abs(i - p);
            const blur = d < 1 ? 4 * d : 4 + 3 * Math.min(d - 1, 1);
            const op = d < 1 ? 1 - 0.6 * d : Math.max(0.08, 0.34 - 0.24 * (d - 1));
            const k = Math.max(0, Math.min(1, 1 - d * 2.4));
            return (
              <div
                key={w}
                style={{
                  height: ROW,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize,
                  letterSpacing: -0.5,
                  filter: `blur(${blur.toFixed(2)}px)`,
                  opacity: op,
                  color: k > 0 ? accent : SK.dim,
                  transform: `scale(${lerp(k, 0.94, 1)})`,
                  whiteSpace: 'nowrap',
                }}
              >
                {w}
              </div>
            );
          })}
        </div>
      </div>
      {/* 落定后的对勾，确认"就是它" */}
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: fontSize * 0.9,
          color: accent,
          opacity: settled ? seg(t, 0.9, 1, E.outBack) : 0,
          transform: `scale(${settled ? seg(t, 0.9, 1, E.outBack) : 0.4})`,
        }}
      >
        ✓
      </div>
    </div>
  );
};
