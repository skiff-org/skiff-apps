import { DropdownItem, Icon, InputField } from 'nightwatch-ui';
import { FC, useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { UserLabelVariant } from 'skiff-graphql';
import { trimAndLowercase } from 'skiff-utils';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useAvailableUserLabels } from '../../hooks/useAvailableLabels';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { useGetCachedThreads } from '../../utils/cache/cache';
import { isFolder, isLabelActive, isUserLabel, UserLabel, UserLabelFolder } from '../../utils/label';

import { FolderLabelDropdownItem, PlainLabelDropdownItem } from './LabelDropdownItem';

interface LabelDropdownContentProps {
  // If threadID is not passed in, it will apply labels to all selected threads
  threadID?: string;
  variant: UserLabelVariant;
  currentSystemLabels: string[];
  isSubMenu?: boolean;
}

const LabelDropdownContent: FC<LabelDropdownContentProps> = ({ threadID, variant, currentSystemLabels, isSubMenu }) => {
  const dispatch = useDispatch();
  const openEditFolderModal = () =>
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.CreateOrEditLabelOrFolder,
        threadIDs,
        folder: variant === UserLabelVariant.Folder,
        initialName: search
      })
    );

  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const threadIDs = threadID ? [threadID] : selectedThreadIDs;
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const threadFragments = useGetCachedThreads(threadIDs);
  const { applyUserLabel, removeUserLabel, moveThreads } = useThreadActions();

  const { existingLabels, availableLabels } = useAvailableUserLabels(
    variant === UserLabelVariant.Plain ? isUserLabel : isFolder
  );
  const allUserLabels = [...existingLabels, ...availableLabels];

  const [search, setSearch] = useState('');

  const getFilteredLabels = () => {
    if (search) {
      return allUserLabels.filter((item) => item.name.toLowerCase().includes(trimAndLowercase(search)));
    } else {
      return allUserLabels;
    }
  };

  const filteredLabels = getFilteredLabels().sort((l1, l2) => l1.name.localeCompare(l2.name));

  const handleArrowUp = useCallback(() => {
    setHoveredIndex((oldIndex) => (oldIndex === 0 ? filteredLabels.length - 1 : Math.max(0, oldIndex - 1)));
  }, [filteredLabels]);

  const handleArrowDown = useCallback(() => {
    setHoveredIndex((oldIndex) =>
      oldIndex === filteredLabels.length - 1 ? 0 : Math.min(filteredLabels.length - 1, oldIndex + 1)
    );
  }, [filteredLabels]);

  const handleEnter = useCallback(async () => {
    const label: UserLabel | UserLabelFolder = filteredLabels[hoveredIndex];
    if (!label) return;

    const isActive = isLabelActive(label, threadFragments);
    switch (label.variant) {
      case UserLabelVariant.Folder:
        if (isActive) return;
        void moveThreads(threadIDs, label, currentSystemLabels);
        break;
      case UserLabelVariant.Plain:
        if (isActive) await removeUserLabel(threadIDs, [label]);
        else await applyUserLabel(threadIDs, [label]);
        break;
    }
  }, [filteredLabels, threadFragments]);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          handleArrowUp();
          return;
        case 'ArrowDown':
          handleArrowDown();
          return;
        case 'Enter':
          void handleEnter();
          return;
        default: {
          return;
        }
      }
    },
    [handleArrowUp, handleArrowDown, handleEnter]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <>
      <InputField
        autoFocus={true}
        onChange={(e) => setSearch(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder='Search'
        size='small'
        style={{ marginBottom: '4px', borderRadius: '8px' }}
        themeMode='dark'
        value={search}
      />
      {filteredLabels.length > 0 &&
        filteredLabels.map((label, index) => {
          return isFolder(label) ? (
            <FolderLabelDropdownItem
              active={isFolder(label) && isLabelActive(label, threadFragments)}
              hover={index === hoveredIndex}
              isSubMenu={isSubMenu}
              key={label.value}
              label={label}
              moveThreads={() => void moveThreads(threadIDs, label, currentSystemLabels)}
            />
          ) : (
            <PlainLabelDropdownItem
              active={isLabelActive(label, threadFragments)}
              applyUserLabel={async (labelID: UserLabel) => applyUserLabel(threadIDs, [labelID])}
              hover={index === hoveredIndex}
              isSubMenu={isSubMenu}
              key={label.value}
              label={label}
              removeUserLabel={async (labelID: UserLabel) => removeUserLabel(threadIDs, [labelID])}
            />
          );
        })}
      {filteredLabels.every((label) => label.name.toLowerCase() !== search.toLowerCase()) && (
        <DropdownItem
          icon={Icon.Plus}
          label={search ? `"${search}"` : `New ${variant === UserLabelVariant.Plain ? 'label' : 'folder'}`}
          onClick={(e) => {
            e.stopPropagation(); // necessary so the click doesn't propogate to the incoming modal (which may trigger 'handleClickOutside')
            openEditFolderModal();
          }}
        />
      )}
    </>
  );
};

export default LabelDropdownContent;
