import { Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import pluralize from 'pluralize';
import styled from 'styled-components';

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TitleContainer = styled.div`
  display: flex;
  gap: 4px;
`;

interface ImportMailStepHeaderProps {
  title: string;
  numItems?: number;
  description?: string;
  itemLabel?: string;
}

export const ImportMailStepHeader: React.FC<ImportMailStepHeaderProps> = ({
  title,
  numItems,
  description,
  itemLabel
}: ImportMailStepHeaderProps) => {
  return (
    <Header>
      <TitleContainer>
        <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
          {title}
        </Typography>
        {numItems !== undefined && numItems >= 0 && (
          <Typography color='link' size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
            {`${numItems.toLocaleString()}${itemLabel ? ` ${pluralize(itemLabel, numItems)}` : ''}`}
          </Typography>
        )}
      </TitleContainer>
      {!!description && (
        <Typography color='secondary' wrap>
          {description}
        </Typography>
      )}
    </Header>
  );
};
