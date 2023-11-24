import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { AccentColor, Avatar, Size, Skeleton, Typography, TypographySize } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { useGetFullAliasInfoQuery } from 'skiff-front-graphql';
import styled, { css } from 'styled-components';

import { useDefaultEmailAlias } from '../../../hooks';
import { SettingsPage } from '../../Settings/Settings.types';

import DefaultEmailTag from './DefaultEmailTag';
import EmailAliasOptions from './EmailAliasOptions';

const ALIAS_ROW_HEIGHT = 35;

const EmailAliasesContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  margin-bottom: 4px;

  ${isMobile &&
  `
    background: var(--bg-l1-solid);
    border-radius: 12px;
    gap: 0px;
  `}
`;

const EmailAliasRow = styled.div<{ $isLastRow: boolean; $selected?: boolean }>`
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  border-radius: 6px;
  gap: 12px;
  height: ${ALIAS_ROW_HEIGHT}px;
  background: ${({ $selected }) => ($selected ? 'var(--bg-overlay-tertiary)' : 'transparent')};
  padding: 8px;
  :hover {
    background: ${({ $selected }) => ($selected ? 'var(--bg-overlay-tertiary)' : 'var(--bg-overlay-quaternary)')};
  }
  ${({ $isLastRow }) =>
    isMobile &&
    css`
      height: 52px;
      padding: 16px;
      box-sizing: border-box;
      border-bottom: ${$isLastRow ? 'none' : '1px solid var(--border-tertiary)'};
    `}
`;

const EmailAliasRowEnd = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RowHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
`;

const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const NameContainer = styled.div`
  min-width: 0px;
`;

interface EmailAliasListProps {
  allAliases: string[];
  client: ApolloClient<NormalizedCacheObject>;
  includeDeleteOption: boolean;
  userID: string;
  deleteAlias: (alias: string) => Promise<void>;
  onSetDefaultAlias?: (newValue: string) => void;
  openSettings?: (page: SettingsPage) => void;
  setSelectedAddress?: (address: string | undefined) => void;
  selectedAddress?: string;
}

const EmailAliasList: React.FC<EmailAliasListProps> = ({
  allAliases,
  client,
  includeDeleteOption,
  userID,
  deleteAlias,
  openSettings,
  onSetDefaultAlias,
  setSelectedAddress,
  selectedAddress
}) => {
  const [defaultEmailAlias] = useDefaultEmailAlias(userID);
  const { data, loading } = useGetFullAliasInfoQuery();

  if (!allAliases.length) {
    return <></>;
  }

  return (
    <EmailAliasesContainer>
      {loading && (
        <SkeletonContainer>
          <Skeleton height={ALIAS_ROW_HEIGHT} width='100%' />
          <Skeleton height={ALIAS_ROW_HEIGHT} width='100%' />
        </SkeletonContainer>
      )}
      {!loading &&
        allAliases.map((alias, index) => {
          const isDefaultEmailAlias = defaultEmailAlias === alias;
          const dataForAlias = data?.fullAliasInfo?.find((aliasInfo) => aliasInfo.emailAlias === alias);
          const { displayName, displayPictureData } = dataForAlias || {};
          const onClick = () => {
            if (setSelectedAddress) {
              setSelectedAddress(alias);
            }
          };
          return (
            <EmailAliasRow
              $isLastRow={index === allAliases.length - 1}
              $selected={alias === selectedAddress}
              key={alias}
              onClick={onClick}
            >
              <RowHeader>
                <Avatar
                  color={(displayPictureData?.profileAccentColor as AccentColor) ?? 'orange'}
                  imageSrc={displayPictureData?.profileCustomURI ?? undefined}
                  label={alias}
                  size={Size.X_MEDIUM}
                />
                <NameContainer>
                  <Typography>{displayName ?? alias}</Typography>
                  {!!displayName && (
                    <Typography color='secondary' size={TypographySize.SMALL}>
                      {alias}
                    </Typography>
                  )}
                </NameContainer>
              </RowHeader>
              <EmailAliasRowEnd>
                {isDefaultEmailAlias && <DefaultEmailTag />}
                <EmailAliasOptions
                  alias={alias}
                  client={client}
                  deleteAlias={() => void deleteAlias(alias)}
                  includeDeleteOption={includeDeleteOption}
                  onSetDefaultAlias={onSetDefaultAlias}
                  openSettings={openSettings}
                  setSelectedAddress={setSelectedAddress}
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
