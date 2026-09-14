import { Composition } from 'remotion';
import { WlMain, WL_TOTAL } from './wl/Main';

export const Root: React.FC = () => {
  return (
    <Composition
      id="WeightLoss"
      component={WlMain}
      durationInFrames={WL_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
