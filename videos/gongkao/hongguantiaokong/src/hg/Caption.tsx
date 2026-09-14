import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONT, outlineShadow } from './style';

/** 底部解说字幕：白字深蓝描边 + 半透明气泡 pill（1280×720 画布） */
export const Caption: React.FC<{ text: string; duration: number }> = ({ text, duration }) => {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [0, 9], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outT = interpolate(frame, [duration - 9, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 40,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity: inT * outT,
        transform: `translateY(${(1 - inT) * 14}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 34,
          color: COLORS.white,
          textShadow: outlineShadow(COLORS.ocean, 5),
          background: 'rgba(11,79,115,0.55)',
          borderRadius: 20,
          padding: '10px 32px',
          border: '3px solid rgba(255,255,255,0.85)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  );
};
