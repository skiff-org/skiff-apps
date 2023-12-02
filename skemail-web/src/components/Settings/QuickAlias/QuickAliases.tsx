import React, { useEffect } from 'react';
import { DEFAULT_WORKSPACE_EVENT_VERSION } from 'skiff-front-utils';
import { FullAliasInfo, WorkspaceEventType } from 'skiff-graphql';
import styled from 'styled-components';

import { storeWorkspaceEvent } from '../../../utils/userUtils';

import { AliasTagList } from './AliasTagList/AliasTagList';
import QuickAliasBanner from './QuickAliasBanner/QuickAliasBanner';
import QuickAliasList from './QuickAliasList/QuickAliasList';
import QuickAliasSelectedView from './QuickAliasSelectedView/QuickAliasSelectedView';

const QuickAliasLeft = styled.div<{ $selectedQuickAlias?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: ${({ $selectedQuickAlias }) => ($selectedQuickAlias ? '50%' : '100%')};
  height: 100%;
  justify-content: flex-start;
  align-items: flex-start;
  box-sizing: border-box;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const Gaps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const FullView = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  align-items: flex-start;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--bg-l1-solid);
`;

export default function QuickAliases() {
  const [selectedQuickAlias, setSelectedQuickAlias] = React.useState<FullAliasInfo | undefined>(undefined);

  useEffect(() => {
    void storeWorkspaceEvent(WorkspaceEventType.QuickAliasSettingsOpened, '', DEFAULT_WORKSPACE_EVENT_VERSION);
  }, []);

  return (
    <FullView>
      <QuickAliasLeft $selectedQuickAlias={!!selectedQuickAlias}>
        <QuickAliasBanner />
        <Gaps>
          <AliasTagList />
          <QuickAliasList selectedQuickAlias={selectedQuickAlias} setSelectedQuickAlias={setSelectedQuickAlias} />
        </Gaps>
      </QuickAliasLeft>
      {!!selectedQuickAlias && (
        <QuickAliasSelectedView selectedQuickAlias={selectedQuickAlias} setSelectedQuickAlias={setSelectedQuickAlias} />
      )}
    </FullView>
  );
}
