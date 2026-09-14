import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

/** 水泡闪光转场：白→蓝径向水光，跨骑硬切两侧各 6f */
export const BubbleFlash: React.FC<{ duration?: number }> = ({ duration = 12 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, duration * 0.35, duration], [0, 0.92, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: o,
        background:
          'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.96), rgba(160,230,255,0.6) 55%, rgba(90,190,240,0.3) 100%)',
      }}
    />
  );
};
