import { Step } from 'react-joyride';

import { JoyrideStepID } from '../../../redux/reducers/joyrideReducer';

//add an id field to generic react-joyride step type
export interface IdentifiedJoyrideStep extends Step {
  id: JoyrideStepID;
}
