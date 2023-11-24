import { Icon, Icons, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import styled from 'styled-components';

import { useQuickAliasForUserDefaultDomain } from 'skiff-front-utils';
import QuickAliasRotatingTag from '../../../../QuickAliasRotatingTag';

const IllustrationPage = styled.div`
  background: var(--bg-l1-solid);
  border-radius: 10px;
  border: 1px solid var(--border-tertiary);
  box-shadow: var(--shadow-l3);
  display: flex;
  flex-direction: column;
  padding: 12px;
  align-items: flex-start;
  overflow: hidden;
  gap: 10px;
  height: 100%;
  width: 440px;
  margin-top: 20px;
`;

const BackPage = styled.div`
  background: var(--bg-l1-solid);
  border-radius: 10px;
  border: 1px solid var(--border-tertiary);
  box-shadow: var(--shadow-l3);
  display: flex;
  flex-direction: column;
  padding: 12px;
  align-items: flex-start;
  overflow: hidden;
  gap: 10px;
  height: 280px;
  width: 440px;
  margin-top: 20px;
`;

const BackPageLeftContainer = styled.div`
  height: 280px;
  display: flex;
  position: absolute;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  right: 180px;
  bottom: -54px;
  z-index: -1;
`;

const BackPageRightContainer = styled.div`
  height: 280px;
  display: flex;
  position: absolute;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  left: 180px;
  bottom: -54px;
  z-index: -1;
`;

const IllustrationPageContainer = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  margin-top: 60px;
`;

const IllustrationIconTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IllustrationIconContainer = styled.div`
  background: var(--bg-l1-solid);
  border-radius: 6px;
  border: 1px solid var(--border-secondary);
  border-bottom-width: 2px;
  padding: 4px;
  box-sizing: border-box;
`;

const IllustrationSection = styled.div<{ $height?: number }>`
  display: flex;
  height: ${({ $height }) => ($height ? `${$height}px` : '132px')};
  width: 100%;
  background: var(--bg-overlay-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
`;

const IllustrationPopOutRelative = styled.div`
  position: relative;
`;

const IllustrationPopOut = styled.div`
  position: absolute;
  display: flex;
  top: 112px;
  right: 124px;
  z-index: 1;
  transform: scale(2.2);
  border-radius: 6px;
  background: var(--bg-l3-solid);
  border: 0.5px solid var(--border-primary);
  padding: 8px 10px;
  box-shadow: var(--shadow-l3);
`;

export default function AliasOnboardIllustration() {
  const { data: defaultDomain } = useQuickAliasForUserDefaultDomain();

  return (
    <IllustrationPageContainer>
      <IllustrationPage>
        <IllustrationIconTitle>
          <IllustrationIconContainer>
            <Icons icon={Icon.Cart} size={20} />
          </IllustrationIconContainer>
          <Typography color='secondary' selectable={false} size={TypographySize.LARGE}>
            Sign up today
          </Typography>
        </IllustrationIconTitle>
        <IllustrationSection />
      </IllustrationPage>
      <BackPageLeftContainer>
        <BackPage>
          <IllustrationIconTitle>
            <IllustrationIconContainer>
              <Icons icon={Icon.MegaphoneSlash} size={16} />
            </IllustrationIconContainer>
            <Typography color='secondary' selectable={false} size={TypographySize.LARGE}>
              Newsletters
            </Typography>
          </IllustrationIconTitle>
          <IllustrationSection $height={38} />
        </BackPage>
      </BackPageLeftContainer>
      <BackPageRightContainer>
        <BackPage>
          <IllustrationIconTitle>
            <IllustrationIconContainer>
              <Icons icon={Icon.Cart} size={20} />
            </IllustrationIconContainer>
            <Typography color='secondary' selectable={false} size={TypographySize.LARGE}>
              Sign up today
            </Typography>
          </IllustrationIconTitle>
          <IllustrationSection $height={38} />
        </BackPage>
      </BackPageRightContainer>
      <IllustrationPopOutRelative>
        <IllustrationPopOut>
          <QuickAliasRotatingTag color='secondary' selectable={false} weight={TypographyWeight.MEDIUM} />
          <Typography color='secondary' selectable={false} weight={TypographyWeight.MEDIUM}>
            {`@tag.${defaultDomain}`}
          </Typography>
        </IllustrationPopOut>
      </IllustrationPopOutRelative>
    </IllustrationPageContainer>
  );
}
