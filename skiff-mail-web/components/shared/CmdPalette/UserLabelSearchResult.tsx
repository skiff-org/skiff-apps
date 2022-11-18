import { Icon, Icons } from 'nightwatch-ui';
import { UserLabelVariant } from 'skiff-graphql';
import styled from 'styled-components';

import { SearchLabelOrFolder } from '../../../utils/searchWorkerUtils';

import { Highlight } from './Highlight';
import { renderRowBackground } from './SearchResult';

const Container = styled.div`
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LabelIcon = styled.div`
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

interface UserLabelSearchResultProps {
  subject: string;
  query: string;
  label: SearchLabelOrFolder;
  active: boolean;
  hover: boolean;
  rowHeight: number;
  onMouseUp: React.MouseEventHandler<HTMLDivElement>;
  setHover: (hover: boolean) => void;
  style?: React.CSSProperties;
}

export const UserLabelSearchResult = (props: UserLabelSearchResultProps) => {
  const { subject, query, label, active, hover, style, rowHeight, onMouseUp, setHover } = props;
  const iconFromVariantType = label.variant === UserLabelVariant.Plain ? Icon.Tag : Icon.Folder;

  return (
    <Container
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseUp={onMouseUp}
      style={style}
      tabIndex={-1}
    >
      {renderRowBackground(active, hover, rowHeight)}
      <LabelIcon>
        <Icons color={label.color} icon={iconFromVariantType} themeMode='dark' />
      </LabelIcon>
      <SearchResultContentArea data-test={`search-result-${subject}`}>
        <Highlight query={query} size='small' text={label.name} />
      </SearchResultContentArea>
    </Container>
  );
};
