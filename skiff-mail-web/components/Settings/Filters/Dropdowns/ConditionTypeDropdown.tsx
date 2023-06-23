import { Dropdown, DropdownItem } from '@skiff-org/skiff-ui';

import { DROPDOWN_ANCHOR_GAP, ConditionType, CONDITION_TYPE_TO_LABEL } from '../Filters.constants';
import { getAvailableConditionTypes } from '../Filters.utils';

interface ConditionTypeDropdownProps {
  buttonRef: React.MutableRefObject<HTMLDivElement | null>;
  setShowDropdown: (state: boolean) => void;
  showDropdown: boolean;
  activeConditionTypes: ConditionType[];
  onClickConditionType: (type: ConditionType) => void;
  hasFrontendMailFilteringFeatureFlag?: boolean;
  isTypeActive?: (type: ConditionType) => boolean;
}

export const ConditionTypeDropdown: React.FC<ConditionTypeDropdownProps> = ({
  buttonRef,
  setShowDropdown,
  showDropdown,
  activeConditionTypes,
  onClickConditionType,
  hasFrontendMailFilteringFeatureFlag,
  isTypeActive
}: ConditionTypeDropdownProps) => {
  const availableConditionTypes = getAvailableConditionTypes(!!hasFrontendMailFilteringFeatureFlag);

  return (
    <Dropdown
      buttonRef={buttonRef}
      gapFromAnchor={DROPDOWN_ANCHOR_GAP}
      portal
      setShowDropdown={setShowDropdown}
      showDropdown={showDropdown}
    >
      {availableConditionTypes.map((type) => (
        <DropdownItem
          active={isTypeActive ? isTypeActive(type) : false}
          disabled={activeConditionTypes.includes(type)}
          key={type}
          label={CONDITION_TYPE_TO_LABEL[type]}
          onClick={() => {
            onClickConditionType(type);
            setShowDropdown(false);
          }}
          value={type}
        />
      ))}
    </Dropdown>
  );
};
