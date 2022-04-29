import { DropdownItem, Icon, IconButton, Icons } from '@skiff-org/skiff-ui';
import { useRef, useState } from 'react';
import styled from 'styled-components';

import { useApplyLabelsMutation, useRemoveLabelsMutation } from '../../generated/graphql';
import { updateThreadsWithModifiedLabels } from '../../utils/cache';
import { UserLabel } from '../../utils/label';
import LabelOptionsDropdown from './LabelOptionsDropdown';

interface LabelDropdownItemProps {
  label: UserLabel;
  active: boolean;
  threadIDs: string[];
}

const DropdownWrapper = styled.div`
  margin-top: -4px;
`;

const IconButtonWrapper = styled.div`
  width: 26px;
  height: 26px;
`;

const LabelDropdownItem: React.FC<LabelDropdownItemProps> = ({ label, active, threadIDs }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const [applyLabel] = useApplyLabelsMutation();
  const [removeLabel] = useRemoveLabelsMutation();

  const applyUserLabel = async (labelID: string) => {
    await applyLabel({
      variables: {
        request: {
          threadIDs,
          userLabels: [labelID]
        }
      },
      update: (cache, response) =>
        updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.applyLabels?.updatedThreads,
          errors: response.errors
        })
    });
  };

  const removeUserLabel = async (labelID: string) => {
    await removeLabel({
      variables: {
        request: {
          threadIDs,
          userLabels: [labelID]
        }
      },
      update: (cache, response) =>
        updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.removeLabels?.updatedThreads,
          errors: response.errors
        })
    });
  };

  const handleOnClick = async (e: any) => {
    e.stopPropagation();
    if (active) {
      await removeUserLabel(label.value);
    } else {
      await applyUserLabel(label.value);
    }
  };

  return (
    <>
      <DropdownItem
        endElement={
          <IconButtonWrapper>
            <IconButton
              icon={Icon.OverflowH}
              onClick={(e) => {
                setShowDropdown((prev) => !prev);
                e.stopPropagation();
              }}
              ref={ref}
              size='small'
            />
          </IconButtonWrapper>
        }
        key={label.value}
        label={label.name}
        onClick={handleOnClick}
        startElement={
          <>
            <Icons
              color={active ? 'primary' : 'secondary'}
              icon={active ? Icon.CheckboxFilled : Icon.CheckboxEmpty}
              onClick={handleOnClick}
            />
            <Icons color={label.color} icon={Icon.Dot} />
          </>
        }
      />
      {showDropdown && (
        <DropdownWrapper>
          <LabelOptionsDropdown buttonRef={ref} label={label} setShowDropdown={setShowDropdown} />
        </DropdownWrapper>
      )}
    </>
  );
};

export default LabelDropdownItem;
