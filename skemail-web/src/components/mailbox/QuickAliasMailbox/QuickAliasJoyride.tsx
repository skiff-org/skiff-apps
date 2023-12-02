import Joyride, { CallBackProps, Props } from 'react-joyride';

import { QuickAliasJoyrideTooltip } from './QuickAliasJoyrideTooltip';
import { customJoyrideTooltipStyle } from './QuickAliasMailbox.constants';
import { IdentifiedJoyrideStep } from './QuickAliasMailbox.types';

interface QuickAliasJoyrideProps extends Props {
  steps: IdentifiedJoyrideStep[];
  run: boolean;
  callback: (data: CallBackProps) => void;
}

/**
 * Wrapper component for Quick Alias joyride to enforce typing on steps and apply custom styles.
 */

export const QuickAliasJoyride: React.FC<QuickAliasJoyrideProps> = (props: QuickAliasJoyrideProps) => {
  return (
    <Joyride
      {...props}
      continuous
      disableScrollParentFix // IMPORTANT: removal of this prop breaks scrolling behavior following Joyride mount
      disableScrolling
      floaterProps={{
        disableAnimation: true
      }}
      hideBackButton
      styles={{
        options: customJoyrideTooltipStyle
      }}
      tooltipComponent={QuickAliasJoyrideTooltip}
    />
  );
};
