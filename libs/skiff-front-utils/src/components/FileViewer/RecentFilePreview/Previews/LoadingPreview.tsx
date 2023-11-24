import { CircularProgress, CircularProgressSize, Size, ThemeMode } from 'nightwatch-ui';

export type LoadingPreviewProps = {
  progress?: number;
  size?: CircularProgressSize;
};

const LoadingPreview = ({ progress, size = Size.X_LARGE }: LoadingPreviewProps) => (
  <CircularProgress
    forceTheme={ThemeMode.DARK}
    progress={progress === 0 ? undefined : progress}
    size={size}
    spinner={progress === 0}
  />
);

export default LoadingPreview;
