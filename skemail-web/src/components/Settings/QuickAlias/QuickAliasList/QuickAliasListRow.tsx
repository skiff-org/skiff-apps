import { AccentColor, Avatar, Icon, IconText, Size, Typography, TypographySize } from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import { FullAliasInfo } from 'skiff-front-graphql';
import { Checkbox } from 'skiff-front-utils';
import styled from 'styled-components';

import QuickAliasDropdown from '../QuickAliasModal/QuickAliasDropdown';

const ALIAS_ROW_HEIGHT = 56;

const EmailAliasRow = styled.div<{ $isLastRow?: boolean; $selected?: boolean }>`
  display: flex;
  height: ${ALIAS_ROW_HEIGHT}px;
  cursor: pointer;
  padding: 12px;
  box-sizing: border-box;
  align-items: center;
  border-bottom: ${({ $isLastRow }) => ($isLastRow ? 'none' : '1px solid var(--border-tertiary)')};
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? 'var(--bg-overlay-tertiary)' : '')};
  :hover {
    background: var(--bg-overlay-tertiary);
  }
  justify-content: space-between;
`;

const AliasData = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const NameContainer = styled.div`
  min-width: 0px;
  padding-right: 8px;
`;

const CheckPadding = styled.div`
  padding: 18px 12px;
  margin: -18px -12px;
`;

interface QuickAliasListRowProps {
  quickAlias: FullAliasInfo;
  isSelected: boolean;
  isChecked: boolean;
  onSelectAlias: (aliasStr: string) => void;
  setSelectedQuickAlias: (alias: FullAliasInfo) => void;
  isLast?: boolean;
}

const QuickAliasListRow: React.FC<QuickAliasListRowProps> = ({
  quickAlias,
  isSelected,
  isChecked,
  onSelectAlias,
  setSelectedQuickAlias,
  isLast
}: QuickAliasListRowProps) => {
  const overflowButtonRef = useRef<HTMLDivElement>(null);
  const { emailAlias: alias, displayName, displayPictureData } = quickAlias;
  const [showOptionDropdown, setShowOptionDropdown] = useState(false);
  return (
    <EmailAliasRow
      $isLastRow={isLast}
      $selected={isSelected}
      key={alias}
      onClick={(e) => {
        e?.stopPropagation();
        setSelectedQuickAlias(quickAlias);
      }}
    >
      <AliasData>
        <CheckPadding
          onClick={(e) => {
            e?.stopPropagation();
            onSelectAlias(alias);
          }}
        >
          <Checkbox
            checked={isChecked}
            onClick={(e) => {
              e?.stopPropagation();
              onSelectAlias(alias);
            }}
          />
        </CheckPadding>
        <Avatar
          color={(displayPictureData?.profileAccentColor as AccentColor) ?? undefined}
          imageSrc={displayPictureData?.profileCustomURI ?? undefined}
          label={displayName || alias}
          size={Size.X_MEDIUM}
        />
        <NameContainer>
          <Typography selectable={false}>{displayName || alias}</Typography>
          {!!displayName && (
            <Typography color='secondary' selectable={false} size={TypographySize.SMALL}>
              {alias}
            </Typography>
          )}
        </NameContainer>
      </AliasData>
      <IconText
        color='secondary'
        onClick={(e) => {
          e?.stopPropagation();
          setShowOptionDropdown(true);
        }}
        ref={overflowButtonRef}
        startIcon={Icon.OverflowH}
      />
      <QuickAliasDropdown
        buttonRef={overflowButtonRef}
        quickAlias={quickAlias}
        setSelectedQuickAlias={setSelectedQuickAlias}
        setShowOptionDropdown={setShowOptionDropdown}
        showOptionDropdown={showOptionDropdown}
      />
    </EmailAliasRow>
  );
};

export default QuickAliasListRow;
