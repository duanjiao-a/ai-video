import { Composition } from 'remotion';
import { Main, TOTAL } from './skeleton/Main';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={Main}
      durationInFrames={TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
