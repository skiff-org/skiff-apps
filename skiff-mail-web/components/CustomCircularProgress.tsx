import { Box, CircularProgress, circularProgressClasses } from '@mui/material';
import { FC } from 'react';

enum ProgressSizes {
  Large = 40,
  Normal = 20
}

interface CustomCircularProgressProps {
  progress: number;
  size?: ProgressSizes;
}

const CustomCircularProgress: FC<CustomCircularProgressProps> = ({ progress, size = ProgressSizes.Normal }) => (
  <Box sx={{ position: 'relative' }}>
    <CircularProgress
      size={size}
      sx={{
        color: 'var(--border-secondary)'
      }}
      thickness={4}
      value={100}
      variant='determinate'
    />
    <CircularProgress
      disableShrink
      size={size}
      sx={{
        color: 'var(--text-link)',
        position: 'absolute',
        left: 0,
        [`& .${circularProgressClasses.circle}`]: {
          strokeLinecap: 'round'
        }
      }}
      thickness={4}
      value={progress}
      variant='determinate'
    />
  </Box>
);

export default CustomCircularProgress;
