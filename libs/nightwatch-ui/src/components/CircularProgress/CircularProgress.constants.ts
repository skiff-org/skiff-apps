import { CircularProgressSize, CircularProgressSizeStyles } from './CircularProgress.types';

export const PROGRESS_SIZE: Record<CircularProgressSize, number> = {
  small: 16,
  medium: 20,
  xmedium: 30,
  large: 40,
  xlarge: 100
};

export const SIZE_VALUES: Record<CircularProgressSize, CircularProgressSizeStyles> = {
  small: {
    rootSize: 16,
    trackThickness: 3,
    progressThickness: 3,
    borderWidth: 0.5
  },
  medium: {
    rootSize: 24,
    trackThickness: 2,
    progressThickness: 2,
    borderWidth: 0.5
  },
  xmedium: {
    rootSize: 30,
    trackThickness: 3,
    progressThickness: 3,
    borderWidth: 0.5
  },
  large: {
    rootSize: 40,
    trackThickness: 4,
    progressThickness: 4,
    borderWidth: 0.5
  },
  xlarge: {
    rootSize: 100,
    trackThickness: 8,
    progressThickness: 8,
    borderWidth: 0.5
  }
};
