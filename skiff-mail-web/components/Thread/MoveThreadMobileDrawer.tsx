import { Drawer, IconText } from '@skiff-org/skiff-ui';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { SystemLabels } from '../../generated/graphql';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useAvailabeSystemLabels } from '../../hooks/useAvailableLabels';
import { useThreadActions } from '../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { upperCaseFirstLetter } from '../../utils/jsUtils';
import { DrawerOptions, DrawerOption } from '../shared/DrawerOptions';

interface MoveThreadMobileDrawerProps {
  thread: MailboxThreadInfo;
}
/**
 * Drawer for moving threads to different Pages/Threads
 */
export default function MoveThreadMobileDrawer({ thread }: MoveThreadMobileDrawerProps) {
  const { availableLabels: systemLabels } = useAvailabeSystemLabels();
  const { value: currentLabel } = useRouterLabelContext();
  const { moveThreads } = useThreadActions();

  const dispatch = useDispatch();
  const hideDrawer = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setShowMoveThreadDrawer(false));
  }, []);
  const show = useAppSelector((state) => state.mobileDrawer.showMoveThreadDrawer);

  return (
    <Drawer hideDrawer={hideDrawer} show={show} title='Move to'>
      <DrawerOptions>
        {systemLabels
          .filter((systemLabel) => systemLabel.value !== currentLabel)
          .map((systemLabel) => {
            return (
              <DrawerOption
                key={systemLabel.value}
                onClick={() => {
                  moveThreads(
                    [thread.threadID],
                    systemLabel,
                    currentLabel === SystemLabels.Drafts,
                    currentLabel === SystemLabels.Trash
                  );
                  hideDrawer();
                }}
              >
                <IconText
                  startIcon={systemLabel.icon}
                  label={'Move to ' + upperCaseFirstLetter(systemLabel.value)}
                  type='paragraph'
                  key={systemLabel.value}
                />
              </DrawerOption>
            );
          })}
      </DrawerOptions>
    </Drawer>
  );
}
