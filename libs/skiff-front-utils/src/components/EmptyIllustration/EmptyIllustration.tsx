import range from 'lodash/range';
import { Icons, Icon, Size, Typography, TypographyWeight } from '@skiff-org/skiff-ui';

import {
  EmptyMailbox,
  EmptyRows,
  EmptyMessage,
  LowOpacityIcons,
  AvatarNameSection,
  EmptyAvatar,
  EmptyName,
  EmptySubject,
  EmptyDate,
  MailTypography
} from './EmptyIllustration.styles';

interface EmptyIllustrationProps {
  title: string;
  subtitle: string;
}
const EmptyIllustration = (props: EmptyIllustrationProps) => {
  const { title, subtitle } = props;
  return (
    <EmptyMailbox>
      <EmptyRows>
        {range(3).map((item) => {
          return (
            <EmptyMessage key={`empty-illustration-${item}`}>
              <LowOpacityIcons>
                <Icons color='disabled' icon={Icon.CheckboxEmpty} size={Size.SMALL} />
              </LowOpacityIcons>
              <AvatarNameSection>
                <EmptyAvatar />
                <EmptyName />
              </AvatarNameSection>
              <EmptySubject />
              <EmptyDate />
            </EmptyMessage>
          );
        })}
      </EmptyRows>
      <MailTypography>
        <Typography color='secondary' selectable={false} weight={TypographyWeight.MEDIUM}>
          {title}
        </Typography>
        <Typography color='disabled' selectable={false}>
          {subtitle}
        </Typography>
      </MailTypography>
    </EmptyMailbox>
  );
};

export default EmptyIllustration;
