import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { SceneBg } from './SceneBg';
import { BigText } from './BigText';
import { DigitRoll } from './DigitRoll';
import { COLORS, FONT, outlineShadow, POP_EASE } from './style';

/** 简单卡通汉堡（CSS 组装，确定性渲染） */
const Burger: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      width: 200,
      filter: 'drop-shadow(0 12px 16px rgba(6,30,48,0.4))',
    }}
  >
    <div
      style={{
        height: 62,
        background: '#f6b93b',
        borderRadius: '46px 46px 10px 10px',
        border: '6px solid #7c4a12',
      }}
    />
    <div style={{ height: 12, background: '#7cc576', borderRadius: 6, border: '4px solid #3f7d3a' }} />
    <div style={{ height: 30, background: '#e65a5a', borderRadius: 4, border: '5px solid #8f2323' }} />
    <div style={{ height: 14, background: '#ffd23f', borderRadius: 3, border: '4px solid #b8860b' }} />
    <div
      style={{
        height: 40,
        background: '#8d5524',
        borderRadius: '4px 4px 30px 30px',
        border: '6px solid #5a3313',
      }}
    />
  </div>
);

/** 顶部小标签 pill */
const Badge: React.FC<{ text: string; delay: number; color?: string; bg?: string; size?: number }> = ({
  text,
  delay,
  color = COLORS.ink,
  bg = COLORS.yellow,
  size = 36,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: POP_EASE,
  });
  return (
    <div
      style={{
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
    >
      {text}
    </div>
  );
};

/** 1. 开场：阳光海底 + 标题 */
export const SceneOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin((frame / 50) * Math.PI * 2) * 0.008;
  return (
    <SceneBg src="bg-open.png" duration={100} zoomTo={1.04}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 46,
        }}
      >
        <Badge text="30 秒看懂 · 减肥误区" delay={6} />
        <div style={{ transform: `scale(${1 + bob})` }}>
          <BigText
            lines={[
              [{ text: '为什么你' }, { text: '减肥', accent: true }],
              [{ text: '总是失败' }, { text: '？', color: COLORS.red }],
            ]}
            size={132}
            delay={16}
            perWord={13}
          />
        </div>
      </AbsoluteFill>
    </SceneBg>
  );
};

/** 2. 极端节食：饿到崩溃 → 暴食反弹 */
export const SceneStarve: React.FC = () => {
  const frame = useCurrentFrame();
  // 汉堡 100→130 飞入落地，之后原地小跳 idle
  const flyT = interpolate(frame, [100, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.9, 0.3, 1),
  });
  const hop = frame >= 132 ? Math.abs(Math.sin(((frame - 132) / 46) * Math.PI * 2)) * 26 : 0;
  const bx = 300 + flyT * 1150;
  const by = 620 - hop - Math.sin(flyT * Math.PI) * 110;
  const rot = flyT * 720 - 40;
  return (
    <SceneBg src="bg-starve.png" duration={185} zoomTo={1.05}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 60 }}>
        <BigText lines={[[{ text: '饿到崩溃', color: COLORS.red }]]} size={150} delay={6} mode="slam" />
        <div style={{ position: 'absolute', left: bx, top: by, transform: `rotate(${rot}deg)` }}>
          <Burger />
        </div>
        <BigText lines={[[{ text: '暴食反弹', color: COLORS.red }]]} size={96} delay={150} />
      </AbsoluteFill>
    </SceneBg>
  );
};

/** 3. 熬夜：熬夜失眠 → 食欲失控 */
export const SceneNight: React.FC = () => {
  const frame = useCurrentFrame();
  const zzz = ['Z', 'z', 'z'].map((ch, i) => {
    const on = Math.floor(frame / 24) % 2 === 0;
    return (
      <span
        key={i}
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 58 - i * 14,
          color: 'rgba(255,255,255,0.9)',
          textShadow: outlineShadow(COLORS.ocean, 5),
          opacity: on ? 0.95 : 0.25,
          display: 'inline-block',
        }}
      >
        {ch}
      </span>
    );
  });
  return (
    <SceneBg src="bg-night.png" duration={185} zoomTo={1.05}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 46 }}>
        <BigText lines={[[{ text: '熬夜失眠', color: '#a8d8ff' }]]} size={140} delay={8} mode="slam" />
        <BigText lines={[[{ text: '食欲失控', accent: true }]]} size={120} delay={100} glow="rgba(255,230,0,0.7)" />
        <div style={{ display: 'flex', gap: 10, position: 'absolute', top: 150, right: 180 }}>{zzz}</div>
      </AbsoluteFill>
    </SceneBg>
  );
};

/** 4. 只做有氧：只跑步 → 肌肉流失 → 代谢下降 */
export const SceneCardio: React.FC = () => {
  return (
    <SceneBg src="bg-cardio.png" duration={185} zoomTo={1.05}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 30 }}>
        <BigText lines={[[{ text: '只跑步' }]]} size={118} delay={8} />
        <BigText lines={[[{ text: '肌肉流失', color: COLORS.red }]]} size={96} delay={60} />
        <BigText lines={[[{ text: '代谢下降', accent: true }]]} size={96} delay={110} />
      </AbsoluteFill>
    </SceneBg>
  );
};

/** 5. 天天称体重：52.6 → 52.1 → 53.0 → 心态崩了 */
export const SceneScale: React.FC = () => {
  const frame = useCurrentFrame();
  const shake3 = frame >= 54 && frame < 74 ? Math.sin(frame * 1.6) * 8 : 0;
  const subT = interpolate(frame, [94, 106], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: POP_EASE,
  });
  const pill = (value: string, delay: number, color: string, shake = 0) => {
    const t = interpolate(frame, [delay, delay + 12], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: POP_EASE,
    });
    return (
      <div
        style={{
          opacity: t,
          transform: `translateY(${(1 - t) * 40}px) scale(${1.5 - 0.5 * t}) translateX(${shake}px)`,
          background: '#fff',
          border: `8px solid ${COLORS.ocean}`,
          borderRadius: 28,
          padding: '12px 30px 18px',
          boxShadow: '0 10px 0 rgba(6,30,48,0.3)',
        }}
      >
        <DigitRoll value={value} delay={delay} fontSize={88} color={color} />
      </div>
    );
  };
  return (
    <SceneBg src="bg-scale.png" duration={150} zoomTo={1.05}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 34 }}>
        <Badge text="每天称体重" delay={6} size={40} />
        <div style={{ display: 'flex', gap: 46, alignItems: 'center' }}>
          {pill('52.6', 14, COLORS.ocean)}
          {pill('52.1', 34, COLORS.ocean)}
          {pill('53.0', 54, COLORS.red, shake3)}
        </div>
        <BigText lines={[[{ text: '心态崩了', color: COLORS.red }]]} size={150} delay={64} mode="slam" />
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 46,
            color: COLORS.white,
            textShadow: outlineShadow(COLORS.ocean, 6),
            opacity: subT,
            transform: `translateY(${(1 - subT) * 22}px)`,
          }}
        >
          是水分，不是胖
        </div>
      </AbsoluteFill>
    </SceneBg>
  );
};

/** 6. 收尾：慢慢来，才瘦得久 */
export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const subT = interpolate(frame, [55, 67], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: POP_EASE,
  });
  const bob = Math.sin((frame / 50) * Math.PI * 2) * 0.008;
  return (
    <SceneBg src="bg-outro.png" duration={95} zoomTo={1.04}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ transform: `scale(${1 + bob})` }}>
          <BigText lines={[[{ text: '慢慢来', accent: true }]]} size={132} delay={6} />
        </div>
        <BigText lines={[[{ text: '才瘦得久', color: COLORS.red }]]} size={158} delay={30} mode="slam" />
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 44,
            color: COLORS.yellow,
            textShadow: outlineShadow(COLORS.ocean, 6),
            opacity: subT,
            transform: `translateY(${(1 - subT) * 20}px)`,
            marginTop: 26,
          }}
        >
          别跟身体对抗
        </div>
      </AbsoluteFill>
    </SceneBg>
  );
};
