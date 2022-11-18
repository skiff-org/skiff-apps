import { Typography } from 'nightwatch-ui';
import styled from 'styled-components';

import { DATE_TEXT_RIGHT } from '../../../constants/search.constants';

export const DateText = styled(Typography)`
  position: absolute;
  right: ${DATE_TEXT_RIGHT};
`;
