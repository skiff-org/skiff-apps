import { Button, Drawer, Icon } from 'nightwatch-ui';
import { FC } from 'react';
import { useDispatch } from 'react-redux';
import { DrawerOption, DrawerOptions } from 'skiff-front-utils';
import { UserLabelVariant } from 'skiff-graphql';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useAvailableUserLabels } from '../../hooks/useAvailableLabels';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { useGetCachedThreads } from '../../utils/cache/cache';
import { isFolder, isLabelActive, isUserLabel, UserLabel, UserLabelFolder } from '../../utils/label';
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

  const { existingLabels, availableLabels } = useAvailableUserLabels(isMoveToFolder ? isFolder : isUserLabel);
  const userLabels = [...existingLabels, ...availableLabels];

  if (!show) return null;

  return (
    <Drawer hideDrawer={hideDrawer} show={!!show} title={isMoveToFolder ? 'Move to folder' : 'Add labels'}>
      <DrawerOptions>
        {userLabels.map((label) => {
          return (
            <DrawerOption key={`drawer-option-${label.value}`}>
              {isMoveToFolder ? (
                <FolderLabelDropdownItem
                  active={isLabelActive(label, threadFragments)}
                  key={label.value}
                  label={label as UserLabelFolder}
                  moveThreads={async () => {
                    await moveThreads(threadIDs, label as UserLabelFolder, currentSystemLabels);
                    hideDrawer();
                  }}
                />
              ) : (
                <PlainLabelDropdownItem
                  active={isLabelActive(label, threadFragments)}
                  applyUserLabel={async (labelToAdd: UserLabel) => applyUserLabel(threadIDs, [labelToAdd])}
                  key={label.value}
                  label={label as UserLabel}
                  removeUserLabel={async (labelToRemove: UserLabel) => removeUserLabel(threadIDs, [labelToRemove])}
                />
              )}
            </DrawerOption>
          );
        })}
        <DropdownFooter>
          <Button
            fullWidth
            onClick={(e) => {
              e.stopPropagation(); // necessary so the click doesn't propogate to the incoming modal (which may trigger 'handleClickOutside')
              dispatch(
                skemailModalReducer.actions.setOpenModal({
                  type: ModalType.CreateOrEditLabelOrFolder,
                  threadIDs,
                  folder: isMoveToFolder
                })
              );
              hideDrawer(); // hide the drawer after the modal is opened to enable focus
            }}
            size='large'
            startIcon={Icon.Plus}
            type='navigation'
          >
            {`Create new ${isMoveToFolder ? 'folder' : 'label'}`}
          </Button>
        </DropdownFooter>
      </DrawerOptions>
    </Drawer>
  );
};

export default ApplyUserLabelDrawer;
