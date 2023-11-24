import { Icon, Icons, IconText, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

const ColumnValue = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : '')};
  box-sizing: border-box;
`;

const LabelContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const IconsWrapper = styled.div`
  margin-bottom: 2px;
`;

const NameRow = styled.div<{ isSmallGap?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ isSmallGap }) => (isSmallGap ? '4px' : '12px')};
`;

interface ContactUserProfileSectionRowProps {
  label?: string;
  children: React.ReactNode;
  isE2EE?: boolean;
  onAdd?: () => void;
}

const ContactUserProfileSectionRow: React.FC<ContactUserProfileSectionRowProps> = ({
  label,
  children,
  isE2EE,
  onAdd
}) => {
  return (
    <ColumnValue>
      {label && (
        <LabelContainer>
          <LabelRow>
            {isE2EE && (
              <IconsWrapper>
                <Icons color='disabled' icon={Icon.Lock} size={Size.X_SMALL} tooltip='End-to-end encrypted' />
              </IconsWrapper>
            )}
            <Typography color='disabled' mono size={TypographySize.CAPTION} uppercase weight={TypographyWeight.MEDIUM}>
              {label}
            </Typography>
          </LabelRow>
          {onAdd && (
            <IconText
              onClick={() => {
                if (onAdd) {
                  onAdd();
                }
              }}
              startIcon={Icon.Plus}
            />
          )}
        </LabelContainer>
      )}
      <NameRow>{children}</NameRow>
    </ColumnValue>
  );
};

export default ContactUserProfileSectionRow;
