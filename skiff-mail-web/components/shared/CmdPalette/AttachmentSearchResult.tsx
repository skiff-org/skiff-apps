import dayjs from 'dayjs';
import { Icon, Icons, Typography } from 'nightwatch-ui';
import { formatTypeSize, getIconFromMIMEType } from 'skiff-front-utils';
import styled from 'styled-components';

import { SearchAttachment } from '../../../utils/searchWorkerUtils';

import { SEARCH_ITEM_DEFAULT_TYPOGRAPHY_LEVEL } from './constants';
import { DateText } from './DateText.styles';
import { Highlight } from './Highlight';
import { renderRowBackground } from './SearchResult';

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
  & span.outerText:first-child {
    color: white !important;
  }
`;

interface AttachmentSearchResultProps {
  subject: string;
  query: string;
  attachment: SearchAttachment;
  active: boolean;
  hover: boolean;
  style?: React.CSSProperties;
  rowHeight: number;
  onMouseUp: React.MouseEventHandler<HTMLDivElement>;
  setHover: (hover: boolean) => void;
}

export const AttachmentSearchResult = ({
  subject,
  query,
  attachment,
  active,
  hover,
  style,
  rowHeight,
  onMouseUp,
  setHover
}: AttachmentSearchResultProps) => {
  const { fileType, fileSize, fileName, email } = attachment;
  const { subject: emailSubject, createdAt } = email;
  const icon = fileType ? getIconFromMIMEType(fileType) : Icon.PaperClip;
  const formattedTypeAndSize = formatTypeSize(fileType, fileSize);
  return (
    <Container
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseUp={onMouseUp}
      style={style}
      tabIndex={-1}
    >
      {renderRowBackground(active, hover, rowHeight)}
      <IconContainer>
        <Icons color='white' icon={icon} />
      </IconContainer>
      <SearchResultContentArea data-test={`search-result-${subject}`}>
        <NameEmailBlock>
          <Highlight query={query} size='small' text={fileName} />
          <Typography
            color='secondary'
            level={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_LEVEL}
            themeMode='dark'
            type='label'
          >{` - ${emailSubject}`}</Typography>
        </NameEmailBlock>
        <DateText color='secondary' level={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_LEVEL} themeMode='dark'>
          {dayjs(createdAt).format('MMM D')}
        </DateText>
        <Typography color='secondary' level={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_LEVEL} themeMode='dark'>
          {formattedTypeAndSize}
        </Typography>
      </SearchResultContentArea>
    </Container>
  );
};
