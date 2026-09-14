import { Composition } from 'remotion';
import { HgMain, HG_TOTAL } from './hg/Main';

export const Root: React.FC = () => {
  return (
    <Composition
      id="HongGuanTiaoKong"
      component={HgMain}
      durationInFrames={HG_TOTAL}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
