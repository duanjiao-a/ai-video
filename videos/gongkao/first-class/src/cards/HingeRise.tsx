/**
 * 移植自镜头卡 `ui-entrance/platform-hinge-rise`
 * （demo: cards/demos/ui-entrance/platform-hinge-rise/PlatformHingeRise.tsx）
 *
 * 保留的卡内核：底座先以 scaleX 0.012→1 撑开 → 圆牌从上落下 → 两块主体
 * 各自绕**相邻底角**反向翻起（bezier(0.4,0,0.2,1)）并在落定后做阻尼摆动
 * → 最后一个结论台再升入。两段的运动维度不同（旋转 vs 位移），所以读得出
 * "这是第二步"。
 * 改掉的：SUBJECT/CONTEXT/OUTCOME 占位换成旁白里的「中央机关 / 直属机构 /
 * 统一招录公务员」；灰阶换纸感；进度源换成窗口内帧。
 */
import { interpolate } from 'remotion';
import { useLocalT } from './motion';
import { FONT, SK, surface } from './skin';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 阻尼摆动：落定后 3 个来回、幅度按 (1-p)² 衰减 */
const wobble = (t: number, start: number, dur: number, amp: number) => {
  const p = (t - start) / dur;
  if (p <= 0 || p >= 1) return 0;
  return amp * Math.sin(p * Math.PI * 3) * Math.pow(1 - p, 2);
};

const Panel: React.FC<{
  side: 'left' | 'right';
  progress: number;
  wob: number;
  text: string;
  sub: string;
}> = ({ side, progress, wob, text, sub }) => {
  const isLeft = side === 'left';
  const w = isLeft ? 320 : 292;
  const h = isLeft ? 148 : 132;
  return (
    <div
      style={{
        position: 'absolute',
        left: isLeft ? 300 : 648,
        top: 196,
        width: w,
        height: h,
        clipPath: 'polygon(7% 9%,93% 0,100% 100%,0 100%)',
        background: isLeft ? SK.paper : SK.paperDeep,
        border: `5px solid ${SK.ink}`,
        transformOrigin: isLeft ? '100% 100%' : '0% 100%',
        transform: `translateY(${interpolate(progress, [0, 1], [150, 0])}px) rotate(${
          interpolate(progress, [0, 1], [isLeft ? -17 : 17, 0]) + wob
        }deg)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        boxShadow: '0 12px 0 rgba(8,58,86,0.28)',
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 40,
          color: SK.ink,
          letterSpacing: 1,
        }}
      >
        {text}
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: SK.stamp }}>
        {sub}
      </div>
    </div>
  );
};

export const HingeRise: React.FC<{ dur: number }> = ({ dur }) => {
  const t = useLocalT(dur);
  // 卡内时间轴（参数取自卡 md 的"动效核心"：底座 0–15f、圆牌 12–32f、
  // 双面翻起 14–30f、结论台 52–74f，按 dur 归一化到本片窗口）
  const f = (n: number) => n / dur;
  const platform = interpolate(t, [0, f(16)], [0.012, 1], CLAMP);
  const context = interpolate(t, [f(14), f(34)], [0, 1], CLAMP);
  const hinge = interpolate(t, [f(16), f(32)], [0, 1], CLAMP);
  const conclusion = interpolate(t, [f(74), f(104)], [0, 1], CLAMP);
  const wl = wobble(t, f(32), f(18), 1.6);
  const wr = wobble(t, f(33), f(18), -1.3);

  return (
    <>
      {/* 语境圆牌：国考 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 34,
          width: 152,
          height: 152,
          marginLeft: -76,
          borderRadius: '50%',
          ...surface(SK.sponge, 999),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          opacity: context,
          transform: `translateY(${interpolate(context, [0, 1], [26, 0])}px) scale(${interpolate(
            context,
            [0, 1],
            [0.86, 1],
          )})`,
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: SK.ink }}>国考</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 17, color: SK.ink, opacity: 0.75 }}>
          中央序列
        </div>
      </div>

      {/* 底座：从中间撑开 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 356,
          width: 860,
          height: 24,
          marginLeft: -430,
          clipPath: 'polygon(4% 0,96% 0,100% 100%,0 100%)',
          background: SK.gold,
          border: `4px solid ${SK.ink}`,
          transformOrigin: '50% 50%',
          transform: `scaleX(${platform})`,
        }}
      />

      {/* 两块主体：绕相邻底角反向翻起 */}
      <Panel side="left" progress={hinge} wob={wl} text="中央机关" sub="本级部门" />
      <Panel side="right" progress={hinge} wob={wr} text="直属机构" sub="垂直系统" />

      {/* 结论台 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 400,
          width: 900,
          height: 104,
          marginLeft: -450,
          clipPath: 'polygon(15% 0,85% 0,100% 100%,0 100%)',
          background: SK.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: interpolate(conclusion, [0, 0.2, 1], [0, 0.5, 1], CLAMP),
          transform: `translateY(${interpolate(conclusion, [0, 1], [110, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 42,
            color: SK.paper,
            letterSpacing: 3,
          }}
        >
          统一招录公务员
        </div>
      </div>
    </>
  );
};
