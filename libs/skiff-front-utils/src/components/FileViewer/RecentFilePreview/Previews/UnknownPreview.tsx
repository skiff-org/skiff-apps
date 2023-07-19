import { Icon, Icons, Size, ThemeMode, Typography, TypographyWeight } from '@skiff-org/skiff-ui';
import styled from 'styled-components';
import PreviewEmpty from './PreviewEmpty/preview-empty.svg';

import { getIconFromMIMEType } from '../../../../utils/fileUtils';
import { PreviewObject } from '../RecentFilePreview.types';

const NotFoundIcon = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 16px;
  padding: 36px 0px;
`;

const UnknownContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;
const UnknownPreview = ({
  contentType,
  tooLargeForPreview,
  showEmptyIllustration
}: PreviewObject & { showEmptyIllustration?: boolean }) => {
  if (showEmptyIllustration)
    return (
      <UnknownContainer>
        <PreviewEmpty />
        <Typography mono uppercase color='secondary' forceTheme={ThemeMode.DARK} weight={TypographyWeight.MEDIUM}>
          No preview available
        </Typography>
        <Typography mono uppercase color='disabled' forceTheme={ThemeMode.DARK}>
          Previews for this file type are not supported.
        </Typography>
      </UnknownContainer>
    );
  return (
    <NotFoundIcon>
      <Icons
        color='disabled'
        forceTheme={ThemeMode.DARK}
        icon={contentType ? getIconFromMIMEType(contentType) : Icon.File}
        size={Size.X_LARGE}
      />
      {tooLargeForPreview && (
        <Typography mono uppercase color='disabled' forceTheme={ThemeMode.DARK}>
          Too large to preview
        </Typography>
      )}
    </NotFoundIcon>
  );
};
export default UnknownPreview;
