import { JoyrideStepID } from '../../../redux/reducers/joyrideReducer';

import { IdentifiedJoyrideStep } from './QuickAliasMailbox.types';

export const FILTER_BY_ALIAS_STEP_CLASSNAME = 'filter-by-alias';
export const MANAGE_ALIASES_STEP_CLASSNAME = 'manage-aliases';

export const QUICK_ALIAS_JOYRIDE_STEPS: IdentifiedJoyrideStep[] = [
  {
    target: `.${FILTER_BY_ALIAS_STEP_CLASSNAME}`,
    content: "Find aliases you've created here once they've received an email",
    title: 'Your new Quick Alias',
    disableBeacon: true,
    placement: 'left',
    id: JoyrideStepID.FILTER_BY_ALIAS
  },
  {
    target: `.${MANAGE_ALIASES_STEP_CLASSNAME}`,
    content: 'Review and control your quick aliases in settings',
    title: 'Manage your aliases',
    disableBeacon: true,
    id: JoyrideStepID.MANAGE_ALIASES
  }
];

export const customJoyrideTooltipStyle = {
  arrowColor: 'transparent',
  filter: 'none',
  overlayColor: 'transparent'
};
