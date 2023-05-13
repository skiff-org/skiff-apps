import dayjs from 'dayjs';
import { Icon, Icons, ThemeMode, Typography, TypographyWeight } from 'nightwatch-ui';
import { formatTypeSize, getIconFromMIMEType } from 'skiff-front-utils';
import styled from 'styled-components';

import { SearchAttachment } from '../../../utils/searchWorkerUtils';

import { SEARCH_ITEM_DEFAULT_TYPOGRAPHY_SIZE } from './constants';
import { DateText } from './DateText.styles';
import { Highlight } from './Highlight';

const Container = styled.div`
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NameEmailBlock = styled.div`
  display: flex;
  width: 80%;
  max-width: 80%;
  gap: 4px;
  align-items: center;
  overflow: hidden;
  flex-direction: row;
`;

const IconContainer = styled.div`
  padding-left: 8px;
`;

const SearchResultContentArea = styled.div`
  flex: 1;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  min-width: 0;
  pointer-events: none;
`;

interface AttachmentSearchResultProps {
  subject: string;
  query: string;
  attachment: SearchAttachment;
  style?: React.CSSProperties;
  onMouseUp: React.MouseEventHandler<HTMLDivElement>;
}

export const AttachmentSearchResult = ({
  subject,
  query,
  attachment,
  style,
  onMouseUp
}: AttachmentSearchResultProps) => {
  const { fileType, fileSize, fileName, email } = attachment;
  const { subject: emailSubject, createdAt } = email;
  const icon = fileType ? getIconFromMIMEType(fileType) : Icon.PaperClip;
  const formattedTypeAndSize = formatTypeSize(fileType, fileSize);
  return (
    <Container onMouseUp={onMouseUp} style={style} tabIndex={-1}>
      <IconContainer>
        <Icons color='white' icon={icon} />
      </IconContainer>
      <SearchResultContentArea data-test={`search-result-${subject}`}>
        <NameEmailBlock>
          <Highlight customColor='white' query={query} size='small' text={fileName} />
          <Typography
            color='secondary'
            forceTheme={ThemeMode.DARK}
            size={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_SIZE}
            weight={TypographyWeight.MEDIUM}
          >{` - ${emailSubject}`}</Typography>
        </NameEmailBlock>
        <DateText>
          <Typography color='secondary' forceTheme={ThemeMode.DARK} size={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_SIZE}>
            {dayjs(createdAt).format('MMM D')}
          </Typography>
        </DateText>
        <Typography color='secondary' forceTheme={ThemeMode.DARK} size={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_SIZE}>
          {formattedTypeAndSize}
        </Typography>
      </SearchResultContentArea>
    </Container>
  );
};
