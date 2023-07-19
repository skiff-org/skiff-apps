import { Avatar, Typography } from '@skiff-org/skiff-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import styled, { css } from 'styled-components';

import { useDefaultEmailAlias } from '../../../hooks';

import DefaultEmailTag from './DefaultEmailTag';
import EmailAliasOptions from './EmailAliasOptions';

const EmailAliasesContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
  flex-direction: column;
  margin-bottom: 4px;
  ${isMobile &&
  css`
    background: var(--bg-l1-solid);
    border-radius: 12px;
    gap: 0px;
  `}
`;

const EmailAliasRow = styled.div<{ $isLastRow: boolean }>`
  display: flex;
  gap: 12px;
  height: 20%;
  width: 100%;
  ${(props) =>
    isMobile &&
    css`
      height: 52px;
      padding: 16px;
      box-sizing: border-box;
      border-bottom: ${props.$isLastRow ? 'none' : '1px solid var(--border-tertiary)'};
    `}
  justify-content: space-between;
`;

const EmailAliasRowEnd = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const EmailAliasUsername = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  // Prevent the alias from overflowing when the window is too narrow.
  // Note: The value we chose isn't sacred. We just need an explicit 'min-width'
  // that isn't too large.
  // For more, see https://css-tricks.com/flexbox-truncated-text/
  min-width: 100px;
`;

interface EmailAliasListProps {
  allAliases: string[];
  userID: string;
  deleteAlias: (alias: string) => Promise<void>;
  includeDeleteOption: boolean;
  onSetDefaultAlias?: (newValue: string) => void;
}

const EmailAliasList: React.FC<EmailAliasListProps> = ({
  allAliases,
  userID,
  deleteAlias,
  includeDeleteOption,
  onSetDefaultAlias
}) => {
  const [defaultEmailAlias] = useDefaultEmailAlias(userID);
  if (!allAliases.length) return <></>;

  return (
    <EmailAliasesContainer>
      {allAliases.map((alias, index) => {
        const isDefaultEmailAlias = defaultEmailAlias === alias;
        return (
          <EmailAliasRow key={alias} $isLastRow={index === allAliases.length - 1}>
            <EmailAliasUsername>
              <Avatar label={alias} />
              <Typography mono uppercase>
                {alias}
              </Typography>
            </EmailAliasUsername>
            <EmailAliasRowEnd>
              {isDefaultEmailAlias && <DefaultEmailTag />}
              <EmailAliasOptions
                alias={alias}
                deleteAlias={() => void deleteAlias(alias)}
                includeDeleteOption={includeDeleteOption}
                onSetDefaultAlias={onSetDefaultAlias}
                userID={userID}
              />
            </EmailAliasRowEnd>
          </EmailAliasRow>
        );
      })}
    </EmailAliasesContainer>
  );
};

export default EmailAliasList;
