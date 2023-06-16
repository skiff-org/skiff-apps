import {
  Button,
  CircularProgress,
  InputComponent,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import styled, { css } from 'styled-components';

const ListHeaders = styled.div`
  display: flex;
  width: 100%;
  padding: 0px 0px 6px 0px;
  border-bottom: 1px solid var(--border-tertiary);
  align-items: center;

  gap: 4px;

  ${isMobile &&
  css`
    justify-content: space-between;
  `};
`;

const ListHeader = styled.span<{ $isFirst: boolean }>`
  ${({ $isFirst }) =>
    isMobile &&
    css`
      min-width: fit-content;
      padding-right: ${!$isFirst ? 72 : 0}px;
    `};
  ${({ $isFirst }) =>
    !isMobile &&
    css`
      width: 100%;
      padding-left: ${$isFirst ? 4 : 12}px;
    `};
`;

const SearchButton = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const NumberLabel = styled.span`
  color: var(--text-disabled);
`;

const NoMembersText = styled.div`
  padding-top: 8px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const LoadingContainer = styled.div`
  padding: 6px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: row;
`;

export interface UserListTableSection {
  columnHeaders: string[];
  rows: React.ReactNode[];
  emptyText?: string;
}

interface UserListTableProps {
  sections: UserListTableSection[];
  header: string;
  showAddButton: boolean;
  inputField: InputComponent;
  addButtonLabel: string;
  onAddButtonClick: () => void;
  headerNumber?: number;
  addButtonDataTest?: string;
  loading?: boolean;
}

const UserListTable: React.FC<UserListTableProps> = ({
  sections,
  header,
  headerNumber,
  showAddButton,
  inputField,
  addButtonLabel,
  onAddButtonClick,
  addButtonDataTest,
  loading
}) => {
  return (
    <Container>
      <SearchButton>
        <Typography size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM}>
          {header} {!!headerNumber && <NumberLabel>{headerNumber}</NumberLabel>}
        </Typography>
        <ButtonContainer>
          {showAddButton && (
            <Button dataTest={addButtonDataTest} onClick={onAddButtonClick} type={Type.SECONDARY}>
              {addButtonLabel}
            </Button>
          )}
        </ButtonContainer>
      </SearchButton>
      {inputField}
      {sections.map(({ columnHeaders, rows, emptyText }) => (
        <div key={columnHeaders.join(',')}>
          <ListHeaders>
            {columnHeaders.map((columnHeader, index) => (
              <ListHeader $isFirst={!index} key={`list-header-${header}-${columnHeader}`}>
                <Typography
                  color='disabled'
                  mono
                  size={TypographySize.CAPTION}
                  weight={TypographyWeight.MEDIUM}
                  width={isMobile ? undefined : '50%'}
                >
                  {columnHeader}
                </Typography>
              </ListHeader>
            ))}
          </ListHeaders>
          {!loading && (
            <>
              {rows}
              {!rows.length && !!emptyText && (
                <Typography color='disabled'>
                  <NoMembersText>{emptyText}</NoMembersText>
                </Typography>
              )}
            </>
          )}
          {loading && (
            <LoadingContainer>
              <CircularProgress />
            </LoadingContainer>
          )}
        </div>
      ))}
    </Container>
  );
};

export default UserListTable;
