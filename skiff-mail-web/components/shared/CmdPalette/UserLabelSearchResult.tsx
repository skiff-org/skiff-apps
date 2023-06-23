import { Icon, Icons, ThemeMode } from '@skiff-org/skiff-ui';
import { UserLabelVariant } from 'skiff-graphql';
import styled from 'styled-components';

import { SearchLabelOrFolder } from '../../../utils/searchWorkerUtils';

import { Highlight } from './Highlight';

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
`;

interface UserLabelSearchResultProps {
  subject: string;
  query: string;
  label: SearchLabelOrFolder;
  onMouseUp: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}

export const UserLabelSearchResult = (props: UserLabelSearchResultProps) => {
  const { subject, query, label, style, onMouseUp } = props;
  const iconFromVariantType = label.variant === UserLabelVariant.Plain ? Icon.Tag : Icon.Folder;

  return (
    <Container onMouseUp={onMouseUp} style={style} tabIndex={-1}>
      <LabelIcon>
        <Icons color={label.color} forceTheme={ThemeMode.DARK} icon={iconFromVariantType} />
      </LabelIcon>
      <SearchResultContentArea data-test={`search-result-${subject}`}>
        <Highlight customColor='white' query={query} size='small' text={label.name} />
      </SearchResultContentArea>
    </Container>
  );
};
