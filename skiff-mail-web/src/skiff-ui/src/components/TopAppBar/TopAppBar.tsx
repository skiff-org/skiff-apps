import {
  FilledVariant,
  Icon,
  IconButton,
  Size,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import styled from 'styled-components';

import { ClientAttachment } from '../../../../components/Attachments';

const TopAppBarContainer = styled.div`
  width: 100%;
  padding: 16px 12px;
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

interface TopAppBarProps {
  onLeftItemClick: () => void;
  title: string;
  currentAttachment: ClientAttachment;
  downloadAttachment: (id: string, contentType: string, filename: string) => Promise<void>;
}

export default function TopAppBar({ onLeftItemClick, title, currentAttachment, downloadAttachment }: TopAppBarProps) {
  return (
    <TopAppBarContainer>
      <TopRow>
        <Typography
          color='link'
          dataTest='attachment-preview-done'
          onClick={onLeftItemClick}
          size={TypographySize.LARGE}
          weight={TypographyWeight.MEDIUM}
        >
          Done
        </Typography>
        <IconButton
          icon={Icon.Download}
          onClick={() => {
            const { id, contentType, name } = currentAttachment;
            void downloadAttachment(id, contentType, name);
          }}
          size={Size.LARGE}
          type={Type.SECONDARY}
          variant={FilledVariant.UNFILLED}
        />
      </TopRow>
      <Typography size={TypographySize.H3} weight={TypographyWeight.BOLD} wrap>
        {title}
      </Typography>
    </TopAppBarContainer>
  );
}
