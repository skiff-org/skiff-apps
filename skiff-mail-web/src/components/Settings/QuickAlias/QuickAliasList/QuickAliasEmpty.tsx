import { Alignment, Typography, TypographyWeight } from 'nightwatch-ui';
import styled from 'styled-components';

const EmptyTextSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 650px;
  max-width: 100%;
  align-self: center;
`;

const EmptyTextTitle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 4px;
`;

export default function QuickAliasEmpty() {
  return (
    <EmptyTextSection>
      <EmptyTextTitle>
        <Typography color='secondary' weight={TypographyWeight.MEDIUM}>
          No Quick Aliases yet
        </Typography>
        <Typography align={Alignment.CENTER} color='disabled' wrap>
          Protect your privacy when signing up for shopping sites, newsletters, and any service you prefer to keep at
          arm&apos;s length.
        </Typography>
      </EmptyTextTitle>
    </EmptyTextSection>
  );
}
