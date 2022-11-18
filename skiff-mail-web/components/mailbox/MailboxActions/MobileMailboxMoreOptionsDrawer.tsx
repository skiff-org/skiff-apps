import { Drawer, Icon, IconText } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useTheme, DrawerOption, DrawerOptions } from 'skiff-front-utils';
import { SystemLabels, UserLabelVariant } from 'skiff-graphql';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { LABEL_TO_SYSTEM_LABEL, SystemLabel } from '../../../utils/label';

interface MobileMailboxMoreOptionsDrawerProps {
  selectedThreadsIds: string[];
  label: string;
}

export default function MobileMailboxMoreOptionsDrawer({
  selectedThreadsIds,
  label
}: MobileMailboxMoreOptionsDrawerProps) {
  const dispatch = useDispatch();
  const show = useAppSelector((state) => state.mobileDrawer.showMailboxMoreOptionsDrawer);
  const { moveThreads } = useThreadActions();

  const { theme } = useTheme();

  const setSelectedThreadIDs = (selectedThreadIDs: string[]) =>
    dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs }));
  const closeMultiSelectMenu = () => {
    // Set mult item selector to false and clear selected threads
    dispatch(skemailMobileDrawerReducer.actions.setMultipleItemSelector(false));
    setSelectedThreadIDs([]);
  };
  const moveSelectedTo = (target: SystemLabel) => {
    void moveThreads(selectedThreadsIds, target, [label]);
  };
  const hideDrawer = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowMailboxMoreOptionsDrawer(false));
  };
  const showLabelDrawer = () => {
    hideDrawer();
    dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(UserLabelVariant.Plain));
  };

  const showMoveToDrawer = () => {
    hideDrawer();
    dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(UserLabelVariant.Folder));
  };

  const isTrash = label === SystemLabels.Trash;

  const options = [
    {
      label: 'Add label',
      icon: Icon.Tag,
      onClick: () => {
        showLabelDrawer();
      }
    },
    {
      label: 'Move to folder',
      icon: Icon.FolderArrow,
      onClick: showMoveToDrawer
    }
  ];

  if (label === SystemLabels.Inbox || isTrash) {
    options.unshift({
      label: 'Move to Spam',
      icon: Icon.Spam,
      onClick: () => {
        moveSelectedTo(LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam]);
        closeMultiSelectMenu();
        hideDrawer();
      }
    });
    options.unshift({
      label: 'Archive',
      icon: Icon.Archive,
      onClick: () => {
        moveSelectedTo(LABEL_TO_SYSTEM_LABEL[SystemLabels.Archive]);
        closeMultiSelectMenu();
        hideDrawer();
      }
    });
  }
  if (label === SystemLabels.Spam || isTrash || label === SystemLabels.Archive) {
    options.unshift({
      label: 'Move to inbox',
      icon: Icon.Inbox,
      onClick: () => {
        moveSelectedTo(LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox]);
        closeMultiSelectMenu();
        hideDrawer();
      }
    });
  }

  return (
    <Drawer hideDrawer={hideDrawer} show={show} title={'More options'}>
      <DrawerOptions>
        {options.map((option) => {
          return (
            <DrawerOption key={option.label} onClick={option.onClick}>
              <IconText
                label={option.label}
                level={1}
                startIcon={option.icon}
                themeMode={isMobile ? theme : 'dark'}
                type='paragraph'
              />
            </DrawerOption>
          );
        })}
      </DrawerOptions>
    </Drawer>
  );
}
