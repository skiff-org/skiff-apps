import { AnimatePresence } from 'framer-motion';
import { Icon, Icons, ThemeMode, Typography, TypographySize, TypographyWeight, getThemedColor } from 'nightwatch-ui';
import { useMediaQuery } from 'skiff-front-utils';
import styled from 'styled-components';

import { useQuickAliasForUserDefaultDomain } from 'skiff-front-utils';
import QuickAliasRotatingTag from '../QuickAliasRotatingTag';

const IllustrationPage = styled.div`
  background: ${getThemedColor(`var(--bg-l1-solid)`, ThemeMode.LIGHT)};
  border-radius: 6px;
  border: 1px solid ${getThemedColor(`var(--border-tertiary)`, ThemeMode.LIGHT)};
  display: flex;
  flex-direction: column;
  padding: 12px;
  align-items: flex-start;
  gap: 10px;
  height: 140px;
  width: 220px;
`;

const IllustrationPageRelative = styled.div`
  position: relative;
  margin-bottom: -20px;
`;

const IllustrationPageAbsolute = styled.div<{ top?: number; left?: number; right?: number; bottom?: number }>`
  position: absolute;
  top: ${(props) => props.top ?? 0}px;
  right: ${(props) => props.right ?? 48}px;
`;

const IllustrationIconTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IllustrationIconContainer = styled.div`
  background: ${getThemedColor(`var(--bg-l1-solid)`, ThemeMode.LIGHT)};
  border-radius: 6px;
  border: 1px solid ${getThemedColor(`var(--border-secondary)`, ThemeMode.LIGHT)};
  border-bottom-width: 2px;
  padding: 4px;
  box-sizing: border-box;
`;

const IllustrationSection = styled.div`
  display: flex;
  height: 68px;
  width: 100%;
  background: ${getThemedColor(`var(--bg-overlay-tertiary)`, ThemeMode.LIGHT)};
  border: 1px solid ${getThemedColor(`var(--border-secondary)`, ThemeMode.LIGHT)};
  border-radius: 4px;
`;

const IllustrationPopOut = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 260px;
  top: 56px;
  left: 0px;
  z-index: 1;
  transform: scale(1.2);
  border-radius: 6px;
  background: ${getThemedColor(`var(--bg-l2-solid)`, ThemeMode.LIGHT)};
  border: 1px solid ${getThemedColor(`var(--border-primary)`, ThemeMode.LIGHT)};
  padding: 8px 0px;
  box-shadow: ${getThemedColor(`var(--shadow-l3)`, ThemeMode.LIGHT)};
`;

const BoltShape = styled.div<{ top?: number; left?: number; right?: number; bottom?: number }>`
  width: 36px;
  height: 48px;
  position: absolute;
  top: ${(props) => props.top ?? 0}px;
  left: ${(props) => props.left ?? 0}px;
  right: ${(props) => props.right ?? 0}px;
  bottom: ${(props) => props.bottom ?? 0}px;
  background: linear-gradient(
    165deg,
    rgba(255, 255, 255, 0) 11.56%,
    rgba(255, 255, 255, 0.31) 53.19%,
    rgba(255, 255, 255, 0.07) 91.49%
  );
  clip-path: polygon(68% 0, 66% 46%, 93% 43%, 35% 98%, 49% 56%, 20% 62%);
`;

const COMPACT_ILLUSTRATION_BREAKPOINT = 1120;

interface AddAliasIllustrationProps {
  top?: number;
  right?: number;
  alwaysShow?: boolean;
}

export default function AddAliasIllustration(props: AddAliasIllustrationProps) {
  const { top, right, alwaysShow } = props;
  const { data: defaultDomain } = useQuickAliasForUserDefaultDomain();
  const isCompact = useMediaQuery(`(min-width:${COMPACT_ILLUSTRATION_BREAKPOINT}px)`, { noSsr: true });

  if (!isCompact && !alwaysShow) return null;

  const page = (
    <>
      <IllustrationPage>
        <BoltShape left={-58} top={72} />
        <BoltShape left={254} top={-12} />
        <IllustrationIconTitle>
          <IllustrationIconContainer>
            <Icons forceTheme={ThemeMode.LIGHT} icon={Icon.Cart} size={12} />
          </IllustrationIconContainer>
          <Typography color='secondary' forceTheme={ThemeMode.LIGHT} selectable={false} size={TypographySize.SMALL}>
            Sign up today
          </Typography>
        </IllustrationIconTitle>
        <IllustrationSection />
      </IllustrationPage>
      <AnimatePresence>
        <IllustrationPopOut>
          <QuickAliasRotatingTag
            color='secondary'
            forceTheme={ThemeMode.LIGHT}
            selectable={false}
            weight={TypographyWeight.MEDIUM}
          />
          <Typography
            color='secondary'
            forceTheme={ThemeMode.LIGHT}
            selectable={false}
            weight={TypographyWeight.MEDIUM}
          >
            {`@tag.${defaultDomain}`}
          </Typography>
        </IllustrationPopOut>
      </AnimatePresence>
    </>
  );

  return (
    <IllustrationPageRelative>
      <IllustrationPageAbsolute right={right} top={top}>
        {page}
      </IllustrationPageAbsolute>
    </IllustrationPageRelative>
  );
}
