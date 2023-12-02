import {
  Dialog,
  FilledVariant,
  Icon,
  IconText,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight,
  getThemedColor
} from 'nightwatch-ui';
import { useToast, parseHeaders } from 'skiff-front-utils';
import styled from 'styled-components';

const HeadersContainer = styled.div`
  max-height: 400px;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
  overflow: auto;
  border-top: 1px solid ${getThemedColor('var(--border-secondary)', ThemeMode.DARK)};
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  padding-bottom: 0px;
  box-sizing: border-box;
  width: 100%;
`;

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ValueContainer = styled.div`
  background: ${getThemedColor('var(--bg-overlay-tertiary)', ThemeMode.DARK)};
  padding: 16px;
  border-radius: 6px;
`;

const TitleCopy = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
`;

const VeriticalDivider = styled.div`
  width: 1px;
  height: 20px;
  background: ${getThemedColor('var(--border-secondary)', ThemeMode.DARK)};
`;

const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

type EmailHeaderDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  runDownloadMime: () => Promise<void>;
  rawMimeContent: string;
};

export const EmailHeaderDialog = (props: EmailHeaderDialogProps) => {
  const { open, setOpen, rawMimeContent, runDownloadMime } = props;
  const headers = parseHeaders(rawMimeContent);
  const { enqueueToast } = useToast();

  // if we don't have this, the thread flickers
  if (!open) {
    return <></>;
  }

  return (
    <Dialog
      customContent
      forceTheme={ThemeMode.DARK}
      hideCloseButton
      noPadding
      onClose={() => {
        setOpen(false);
      }}
      open={open}
      size={Size.LARGE}
    >
      <Title>
        <Typography forceTheme={ThemeMode.DARK} size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
          Message headers
        </Typography>
        <RightActions>
          <IconText
            forceTheme={ThemeMode.DARK}
            onClick={async () => runDownloadMime()}
            startIcon={Icon.Download}
            variant={FilledVariant.UNFILLED}
          />
          <VeriticalDivider />
          <IconText
            forceTheme={ThemeMode.DARK}
            onClick={() => {
              setOpen(false);
            }}
            startIcon={Icon.Close}
            variant={FilledVariant.UNFILLED}
          />
        </RightActions>
      </Title>
      <HeadersContainer>
        {Object.entries(headers).map(([key, value]) => (
          <HeaderSection key={key}>
            <TitleCopy>
              <Typography
                color='secondary'
                forceTheme={ThemeMode.DARK}
                key={key}
                mono
                size={TypographySize.CAPTION}
                uppercase
                weight={TypographyWeight.MEDIUM}
              >
                {key}
              </Typography>
              <IconText
                forceTheme={ThemeMode.DARK}
                onClick={() => {
                  void navigator.clipboard.writeText(value);
                  enqueueToast({ title: 'Copied to clipboard', body: `${key} saved` });
                }}
                startIcon={Icon.Copy}
                variant={FilledVariant.UNFILLED}
              />
            </TitleCopy>
            <ValueContainer>
              <Typography forceTheme={ThemeMode.DARK} mono size={TypographySize.SMALL} wrap>
                {value}
              </Typography>
            </ValueContainer>
          </HeaderSection>
        ))}
      </HeadersContainer>
    </Dialog>
  );
};
