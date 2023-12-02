import { Icon, IconText, Size, ThemeMode } from 'nightwatch-ui';
import { FC } from 'react';
import { useDispatch } from 'react-redux';
import { Drawer, DrawerOption, DrawerOptions } from 'skiff-front-utils';
import { UserLabelVariant } from 'skiff-graphql';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useAvailableUserLabels } from '../../hooks/useAvailableLabels';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { useGetCachedThreads } from '../../utils/cache/cache';
import { isFolder, isLabelActive, isPlainLabel, UserLabelPlain, UserLabelFolder } from '../../utils/label';
import { DropdownFooter } from '../labels/Dropdown.styles';
import { FolderLabelDropdownItem, PlainLabelDropdownItem } from '../labels/LabelDropdownItem';

interface ApplyLabelDrawerProps {
  // If threadID is not passed in, it will apply labels to all selected threads
  threadID?: string;
  currentSystemLabels: string[];
}

const ApplyUserLabelDrawer: FC<ApplyLabelDrawerProps> = ({ threadID, currentSystemLabels }) => {
  const dispatch = useDispatch();
  const show = useAppSelector((state) => state.mobileDrawer.showApplyLabelDrawer);

  const isMoveToFolder = show === UserLabelVariant.Folder;
  const hideDrawer = () => dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(null));
  const { applyUserLabel, removeUserLabel, moveThreads } = useThreadActions();

  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const threadIDs = threadID ? [threadID] : selectedThreadIDs;

  const threadFragments = useGetCachedThreads(threadIDs);

  const { existingLabels, availableLabels } = useAvailableUserLabels(isMoveToFolder ? isFolder : isPlainLabel);
  const userLabels = [...existingLabels, ...availableLabels];

  if (!show) return null;
  return (
    <Drawer hideDrawer={hideDrawer} show={!!show} title={isMoveToFolder ? 'Move to folder' : 'Add labels'}>
      <DrawerOptions>
        {userLabels
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((label) => {
            return (
              <DrawerOption key={`drawer-option-${label.value}`}>
                {isMoveToFolder ? (
                  <FolderLabelDropdownItem
                    active={isLabelActive(label, threadFragments)}
                    key={label.value}
                    label={label as UserLabelFolder}
                    onClick={async () => {
                      await moveThreads(threadIDs, label as UserLabelFolder, currentSystemLabels);
                      hideDrawer();
                    }}
                  />
                ) : (
                  <PlainLabelDropdownItem
                    active={isLabelActive(label, threadFragments)}
                    key={label.value}
                    label={label as UserLabelPlain}
                    onClick={async () => {
                      if (!isPlainLabel(label)) return;
                      if (isLabelActive(label, threadFragments)) {
                        await removeUserLabel(threadIDs, [label]);
                      } else {
                        const { rejectedForDelinquency } = await applyUserLabel(threadIDs, [label]);
                        if (rejectedForDelinquency) {
                          if (!!hideDrawer) {
                            hideDrawer();
                          }
                        }
                      }
                    }}
                  />
                )}
              </DrawerOption>
            );
          })}
        <DropdownFooter>
          <IconText
            disableHover
            forceTheme={ThemeMode.DARK}
            label={`Create new ${isMoveToFolder ? 'folder' : 'label'}`}
            onClick={(e) => {
              e?.stopPropagation(); // necessary so the click doesn't propagate to the incoming modal (which may trigger 'handleClickOutside')
              dispatch(
                skemailModalReducer.actions.setOpenModal({
                  type: ModalType.CreateOrEditLabelOrFolder,
                  threadIDs,
                  folder: isMoveToFolder,
                  onClose: () => {
                    // open the label drawer again
                    dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(UserLabelVariant.Plain));
                  }
                })
              );
              hideDrawer(); // hide the drawer after the modal is opened to enable focus
            }}
            size={Size.LARGE}
            startIcon={Icon.Plus}
          />
        </DropdownFooter>
      </DrawerOptions>
    </Drawer>
  );
};

export default ApplyUserLabelDrawer;
