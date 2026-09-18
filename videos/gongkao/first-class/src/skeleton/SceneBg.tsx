import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COLORS } from './style';
import { Bubbles } from './Bubbles';

/**
 * 通用海底场景：一张 RunningHub 生成的背景 + 缓慢推镜 + 上升气泡层 + 阅读性暗角。
 *
 * 与上一条的差别（步骤4 差异化）：缓推幅度收到 1.03（上条 1.05），
 * 顶部加一道 scrim——因为本条的屏幕大字固定落在背景图的上方留白区，
 * 白字压在浅色海水上需要一点压暗才立得住。
 */
export const SceneBg: React.FC<{
  src: string;
  duration: number;
  zoomTo?: number;
  panX?: number;
  bubbles?: boolean;
  children?: React.ReactNode;
}> = ({ src, duration, zoomTo = 1.03, panX = 0, bubbles = true, children }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, duration], [1, zoomTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.linear,
  });
  const x = interpolate(frame, [0, duration], [0, panX], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.linear,
  });
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: COLORS.deep }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${z}) translateX(${x}px)`,
        }}
      >
        <Img
          src={staticFile(`textures/${src}`)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      {bubbles ? <Bubbles /> : null}
      {/* 顶部 scrim：给上方大字留出可读底 */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(8,58,86,0.62) 0%, rgba(8,58,86,0.28) 20%, rgba(8,58,86,0) 42%)',
          pointerEvents: 'none',
        }}
      />
      {/* 四角暗角 */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(8,58,86,0.38) 100%)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
