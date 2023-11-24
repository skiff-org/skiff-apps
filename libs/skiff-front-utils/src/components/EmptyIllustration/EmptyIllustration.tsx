import { motion } from 'framer-motion';
import range from 'lodash/range';
import { Button, Icon, Icons, Size, Type, Typography, TypographyWeight } from 'nightwatch-ui';

import {
  AvatarNameSection,
  EmptyAvatar,
  EmptyDate,
  EmptyMailbox,
  EmptyMessage,
  EmptyName,
  EmptyRows,
  EmptySubject,
  LowOpacityIcons,
  MailTypography
} from './EmptyIllustration.styles';

interface EmptyIllustrationProps {
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
    setIsHovered?: (isHovered: boolean) => void;
    isHovered?: boolean;
  };
  illustration?: React.ReactNode;
}

const EmptyIllustration: React.FC<EmptyIllustrationProps> = ({
  title,
  subtitle,
  action,
  illustration
}: EmptyIllustrationProps) => {
  const customIllustration = (
    <>
      {illustration && !!action?.setIsHovered ? (
        <motion.div
          animate={action?.isHovered ? { rotate: -12, y: 30 } : { rotate: 0, y: 0 }}
          style={{ transformOrigin: 'center' }} // set the transform origin to center
        >
          {illustration}
        </motion.div>
      ) : (
        illustration
      )}
    </>
  );
  return (
    <EmptyMailbox>
      {!!illustration ? (
        customIllustration
      ) : (
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
      )}
      <MailTypography>
        <Typography color='secondary' selectable={false} weight={TypographyWeight.MEDIUM}>
          {title}
        </Typography>
        <Typography color='disabled' selectable={false}>
          {subtitle}
        </Typography>
      </MailTypography>
      {action && (
        <div
          onMouseEnter={() => {
            if (action?.setIsHovered) action?.setIsHovered(true);
          }} // set state to true when mouse enters
          onMouseLeave={() => {
            if (action?.setIsHovered) action?.setIsHovered(false);
          }} // set state back to false when mouse leaves
        >
          <Button onClick={action.onClick} type={Type.SECONDARY}>
            {action.label}
          </Button>
        </div>
      )}
    </EmptyMailbox>
  );
};

export default EmptyIllustration;
