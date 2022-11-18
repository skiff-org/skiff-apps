import { Icon, Icons, IconButton, DropdownItem } from 'nightwatch-ui';
import { FC, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { UserLabel, UserLabelFolder } from '../../utils/label';

import LabelOptionsDropdown from './LabelOptionsDropdown';

const IconButtonWrapper = styled.div`
  ${!isMobile &&
  `
  width: 26px;
  height: 26px;
  `}
`;

interface PlainLabelDropdownItemProps {
  label: UserLabel;
  active: boolean;
  hover?: boolean;
  isSubMenu?: boolean;
  removeUserLabel: (label: UserLabel) => Promise<void>;
  applyUserLabel: (label: UserLabel) => Promise<void>;
}

export const PlainLabelDropdownItem: FC<PlainLabelDropdownItemProps> = ({
  label,
  active,
  removeUserLabel,
  applyUserLabel,
  hover,
  isSubMenu
}: PlainLabelDropdownItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const { theme: currentTheme } = useTheme();
  const theme = isMobile ? currentTheme : 'dark';

  const dispatch = useDispatch();

  const mobileOpenEditLabelModal = () => {
    // Hide label drawer and open edit modal
    dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(null));
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CreateOrEditLabelOrFolder, label: label }));
  };

  const handleOnClick = async (e: any) => {
    e.stopPropagation();
    if (active) {
      await removeUserLabel(label);
    } else {
      await applyUserLabel(label);
    }
  };

  const optionsButton = (
    <IconButtonWrapper>
      <IconButton
        icon={Icon.OverflowH}
        onClick={(e) => {
          e.stopPropagation();
          // On mobile open modal, on browser open dropdown
          if (isMobile) {
            mobileOpenEditLabelModal();
          } else {
            setShowDropdown((prev) => !prev);
          }
        }}
        ref={ref}
        size={isMobile ? 'large' : 'small'}
        themeMode={theme}
      />
    </IconButtonWrapper>
  );

  return (
    <>
      <DropdownItem
        endElement={optionsButton}
        hover={hover}
        icon={<Icons color={label.color} icon={Icon.Dot} themeMode={theme} />}
        key={label.value}
        label={label.name}
        onClick={handleOnClick}
        startElement={
          <Icons
            color={active ? 'primary' : 'secondary'}
            icon={active ? Icon.CheckboxFilled : Icon.CheckboxEmpty}
            onClick={handleOnClick}
            size={isMobile ? 'large' : 'small'}
            themeMode={theme}
          />
        }
        themeMode={theme}
      />
      <LabelOptionsDropdown
        buttonRef={ref}
        isSubMenu={isSubMenu}
        label={label}
        setShowDropdown={setShowDropdown}
        showDropdown={showDropdown}
      />
    </>
  );
};

interface FolderLabelDropdownItemProps {
  label: UserLabelFolder;
  active: boolean;
  isSubMenu?: boolean;
  hover?: boolean;
  moveThreads: () => void;
}

export const FolderLabelDropdownItem: FC<FolderLabelDropdownItemProps> = ({
  label,
  active,
  moveThreads,
  hover,
  isSubMenu
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const { theme: currentTheme } = useTheme();
  const theme = isMobile ? currentTheme : 'dark';
  const maxDropdownItemWidth = 200;

  const dispatch = useDispatch();

  const mobileOpenEditorFolderModal = () => {
    // Hide label drawer and open edit modal
    dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(null));
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.CreateOrEditLabelOrFolder,
        folder: true,
        label: label
      })
    );
  };

  const handleOnClick = async (e: any) => {
    e.stopPropagation();
    if (!active) moveThreads();
  };

  const optionsButton = (
    <IconButtonWrapper>
      <IconButton
        icon={Icon.OverflowH}
        onClick={(e) => {
          e.stopPropagation();
          // On mobile open modal, on browser open dropdown
          if (isMobile) {
            mobileOpenEditorFolderModal();
          } else {
            setShowDropdown((prev) => !prev);
          }
        }}
        ref={ref}
        size={isMobile ? 'large' : 'small'}
        themeMode={theme}
      />
    </IconButtonWrapper>
  );

  return (
    <>
      <DropdownItem
        active={active}
        endElement={optionsButton}
        hover={hover}
        key={label.value}
        label={label.name}
        maxWidth={maxDropdownItemWidth}
        onClick={handleOnClick}
        startElement={<Icons color={label.color} icon={Icon.Folder} themeMode={theme} />}
        themeMode={theme}
      />
      <LabelOptionsDropdown
        buttonRef={ref}
        isSubMenu={isSubMenu}
        label={label}
        setShowDropdown={setShowDropdown}
        showDropdown={showDropdown}
      />
    </>
  );
};
