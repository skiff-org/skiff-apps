import { Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import styled from 'styled-components';
import { useQuickAliasForUserDefaultDomain } from '../../hooks';

const FilledPill = styled.div<{ $pillColor?: string }>`
  background: ${(props) => props?.$pillColor || 'var(--bg-l0-solid);'};
  border: 1px solid var(--border-primary);
  padding: 16px 32px;
  box-sizing: border-box;
  border-radius: 100px;
  height: 60px;
  box-shadow: var(--shadow-l1);
`;

const OutlinePill = styled.div`
  background: var(--bg-overlay-tertiary);
  border: 1px solid var(--border-secondary);
  padding: 16px 32px;
  box-sizing: border-box;
  border-radius: 100px;
  flex: none;
  width: 342px;
  height: 60px;
`;

const Container = styled.div<{ $margin?: string }>`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 60px;
  margin: ${(props) => props?.$margin || ''};
`;

const PillContainer = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`;

interface NameMarqueeProps {
  subdomain?: string;
  className?: string;
  pillColor?: string;
  pills?: Array<Array<string | null>>;
  hideSubdomain?: boolean;
  margin?: string;
}

const FALLBACK = 'maskmy.id';

export default function NameMarquee(props: NameMarqueeProps) {
  const { subdomain, className, pillColor, pills, hideSubdomain, margin } = props;
  const PILL_ROW_ONE = ['nootflix', null, 'couponcode'];
  const PILL_ROW_TWO = [null, 'anothernewsletter', null];
  const PILL_ROW_THREE = ['discounts', null, 'socialapp'];
  const defaultPills = [PILL_ROW_ONE, PILL_ROW_TWO, PILL_ROW_THREE];
  const { data: defaultDomain, loading } = useQuickAliasForUserDefaultDomain();

  const renderPill = (pill: string | null) => {
    return (
      <>
        {!!pill && (
          <FilledPill $pillColor={pillColor}>
            <Typography color='disabled' selectable={false} size={TypographySize.H3} weight={TypographyWeight.MEDIUM}>
              {pill}
              {hideSubdomain ? '' : `@${subdomain || 'mine'}.${loading ? FALLBACK : defaultDomain ?? FALLBACK}`}
            </Typography>
          </FilledPill>
        )}
        {!pill && <OutlinePill />}
      </>
    );
  };
  return (
    <Container className={className} $margin={margin}>
      {(pills || defaultPills).map((pillRow) => (
        <PillContainer>{pillRow.map(renderPill)}</PillContainer>
      ))}
    </Container>
  );
}
