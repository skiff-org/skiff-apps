import { ThemeMode, getThemedColor } from 'nightwatch-ui';
import React, { useState } from 'react';
import styled from 'styled-components';

import ActivationChecklistPane from './ActivationChecklistPane';
import ActivationPaneShortcuts from './ActivationPaneShortcuts';

const Wrapper = styled.div`
  width: 400px;
  border-radius: 8px;
  border: 1px solid ${getThemedColor('var(--border-secondary)', ThemeMode.DARK)};
  box-sizing: border-box;
  background: var(--bg-emphasis);
  box-shadow: var(--shadow-l3);
`;

enum ActivationPaneTabs {
  CHECKLIST = 'checklist',
  SHORTCUTS = 'shortcuts'
}

const ActivationPane: React.FC = () => {
  const [currOpenTab, setCurrOpenTab] = useState<ActivationPaneTabs>(ActivationPaneTabs.CHECKLIST);

  return (
    <Wrapper>
      {currOpenTab === ActivationPaneTabs.CHECKLIST && (
        <ActivationChecklistPane onOpenShortcuts={() => setCurrOpenTab(ActivationPaneTabs.SHORTCUTS)} />
      )}
      {currOpenTab === ActivationPaneTabs.SHORTCUTS && (
        <ActivationPaneShortcuts onBack={() => setCurrOpenTab(ActivationPaneTabs.CHECKLIST)} />
      )}
    </Wrapper>
  );
};

export default ActivationPane;
