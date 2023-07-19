import { Icon, Icons, IconText, Typography } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

import { PreviewSize } from '../RecentFilePreview.types';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

export interface ErrorPreviewProps {
  error: string;
  size: PreviewSize;
  refetch?: () => void;
}

const ErrorPreview = ({ error, refetch, size }: ErrorPreviewProps) => {
  if (size === PreviewSize.Small) {
    return (
      <ErrorContainer>
        <Icons color='link' icon={Icon.Reload} onClick={refetch} />
      </ErrorContainer>
    );
  }

  return (
    <ErrorContainer>
      <Typography mono uppercase>
        {' '}
        Error: {error}{' '}
      </Typography>
      <IconText color='link' disableHover endIcon={Icon.Reload} label='Try fetching again' onClick={refetch} />
    </ErrorContainer>
  );
};

export default ErrorPreview;
