import styled from 'styled-components';

import Compose from '../Compose/Compose';
import ComposePanel from '../Compose/ComposePanel';

const ComposeContainer = styled.div`
  box-sizing: border-box;
  height: 100%;
`;

interface ComposeAndComposePanelProps {
  composeOpen: boolean;
}

const ComposeAndComposePanel = (props: ComposeAndComposePanelProps) => {
  const { composeOpen } = props;
  return (
    <ComposePanel open={composeOpen}>
      <ComposeContainer>
        <Compose />
      </ComposeContainer>
    </ComposePanel>
  );
};

export default ComposeAndComposePanel;
