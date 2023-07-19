import { Typography, TypographyWeight } from '@skiff-org/skiff-ui';
import EmptyInvoiceIllustration from './assets/empty-invoice.svg';

import { Center, MailTypography } from './EmptyInvoice.styles';

interface EmptyIllustrationProps {
  title: string;
  subtitle: string;
}
const EmptyInvoice = (props: EmptyIllustrationProps) => {
  const { title, subtitle } = props;
  return (
    <Center>
      <EmptyInvoiceIllustration />
      <MailTypography>
        <Typography mono uppercase color='secondary' selectable={false} weight={TypographyWeight.MEDIUM}>
          {title}
        </Typography>
        <Typography mono uppercase color='disabled' selectable={false}>
          {subtitle}
        </Typography>
      </MailTypography>
    </Center>
  );
};

export default EmptyInvoice;
