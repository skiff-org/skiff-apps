import { Drawer, Icon, IconText } from 'nightwatch-ui';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { DrawerOption, DrawerOptions } from 'skiff-front-utils';
import { UserLabelVariant } from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';

import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useAvailableSystemLabels } from '../../hooks/useAvailableLabels';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';

interface MoveThreadMobileDrawerProps {
  threadID: string;
}
/**
 * Drawer for moving threads to different Pages/Threads
 */
export default function MoveThreadMobileDrawer({ threadID }: MoveThreadMobileDrawerProps) {
  const { availableLabels: systemLabels } = useAvailableSystemLabels();
  const { value: currentLabel } = useRouterLabelContext();
  const { moveThreads } = useThreadActions();

  const dispatch = useDispatch();
  const hideDrawer = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setShowMoveThreadDrawer(false));
  }, [dispatch]);

  const showMoveToDrawer = () => {
    hideDrawer();
    dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(UserLabelVariant.Folder));
  };

  const show = useAppSelector((state) => state.mobileDrawer.showMoveThreadDrawer);

  return (
    <Drawer hideDrawer={hideDrawer} show={show} title='Move to'>
      <DrawerOptions>
        {systemLabels
          .filter((systemLabel) => systemLabel.value !== currentLabel)
          .map((systemLabel) => (
            <DrawerOption
              key={systemLabel.value}
              onClick={() => {
                void moveThreads([threadID], systemLabel, [currentLabel]);
                hideDrawer();
              }}
            >
              <IconText
                key={systemLabel.value}
                label={'Move to ' + upperCaseFirstLetter(systemLabel.value)}
                level={1}
                startIcon={systemLabel.icon}
                type='paragraph'
              />
            </DrawerOption>
          ))}
        <DrawerOption onClick={showMoveToDrawer}>
          <IconText label='Move to folder' level={1} startIcon={Icon.FolderArrow} type='paragraph' />
        </DrawerOption>
      </DrawerOptions>
    </Drawer>
  );
}
