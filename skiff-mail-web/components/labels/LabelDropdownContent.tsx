import { Button, Divider, Icon, InputField } from '@skiff-org/skiff-ui';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useAvailableUserLabels } from '../../hooks/useAvailableLabels';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { useGetCachedThreads } from '../../utils/cache';
import { DropdownBody, DropdownFooter, SearchInputField } from './Dropdown.styles';
import LabelDropdownItem from './LabelDropdownItem';

interface LabelDropdownContentProps {
  // If threadID is not passed in, it will apply labels to all selected threads
  threadID?: string;
}

const LabelDropdownContent: React.FC<LabelDropdownContentProps> = ({ threadID }) => {
  const dispatch = useDispatch();
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const threadIDs = threadID ? [threadID] : selectedThreadIDs;

  const threadFragments = useGetCachedThreads(threadIDs);

  const { existingLabels, availableLabels } = useAvailableUserLabels();
  const allUserLabels = [...existingLabels, ...availableLabels];

  const [search, setSearch] = useState('');

  const getFilteredLabels = () => {
    if (search) {
      return allUserLabels.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()));
    } else {
      return allUserLabels;
    }
  };

  const filteredLabels = getFilteredLabels();

  return (
    <>
      <SearchInputField>
        <InputField
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder='Search'
          size='small'
          value={search}
        />
      </SearchInputField>
      <Divider />
      {filteredLabels.length > 0 && (
        <>
          <DropdownBody>
            {filteredLabels.map((label) => {
              // Label is active if every selected thread already has it applied
              const active =
                !!threadIDs.length &&
                threadFragments.every((thread) =>
                  thread?.attributes.userLabels.some(({ labelID }) => labelID === label.value)
                );

              return <LabelDropdownItem active={active} key={label.value} label={label} threadIDs={threadIDs} />;
            })}
          </DropdownBody>
          <Divider />
        </>
      )}
      <DropdownFooter>
        <Button
          fullWidth
          onClick={(e) => {
            e.stopPropagation(); // necessary so the click doesn't propogate to the incoming modal (which may trigger 'handleClickOutside')
            dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CreateOrEditUserLabel, threadIDs }));
          }}
          size='small'
          startIcon={Icon.Plus}
          type='navigation'
        >
          Create new label
        </Button>
      </DropdownFooter>
    </>
  );
};

export default LabelDropdownContent;
