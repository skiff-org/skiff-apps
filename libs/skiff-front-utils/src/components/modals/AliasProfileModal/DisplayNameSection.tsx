import { Icon, IconText, InputField, Typography } from 'nightwatch-ui';
import { useEffect, useRef, useState } from 'react';

import debounce from 'lodash/debounce';
import { useToast } from '../../../hooks';
import { SectionWrapper } from './AliasProfileModal.styles';
import { DisplayNameSectionProps } from './AliasProfileModal.types';

const DEBOUNCE_DELAY = 500;

function DisplayNameSection({
  displayedDisplayName,
  setNewDisplayName,
  forceTheme,
  selectedAddress
}: DisplayNameSectionProps) {
  const displayNameInputInnerRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(displayedDisplayName);

  const [hover, setHover] = useState(false);

  const { enqueueToast } = useToast();

  const onCopy = () => {
    void navigator.clipboard.writeText(displayedDisplayName);
    enqueueToast({
      title: 'Display name copied to clipboard'
    });
  };

  // Ref for the debounced function to persist it across renders
  const debouncedSetNewDisplayName = useRef(
    debounce((value) => {
      setNewDisplayName(value);
    }, DEBOUNCE_DELAY)
  ).current;

  // Effect to update the local state when the prop changes
  useEffect(() => {
    setInputValue(displayedDisplayName);
    debouncedSetNewDisplayName.flush();
  }, [displayedDisplayName]);

  // Effect for cleanup
  useEffect(() => {
    return () => {
      debouncedSetNewDisplayName.cancel();
    };
  }, [selectedAddress]);

  // Update debounced function only when user stops typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    debouncedSetNewDisplayName(e.target.value);
  };

  return (
    <SectionWrapper>
      <div>
        <Typography forceTheme={forceTheme}>Display name</Typography>
        <Typography color='secondary' forceTheme={forceTheme}>
          The name used when sending mail with this address.
        </Typography>
      </div>
      <div onMouseLeave={() => setHover(false)} onMouseOver={() => setHover(true)}>
        <InputField
          forceTheme={forceTheme}
          innerRef={displayNameInputInnerRef}
          onChange={handleChange}
          placeholder='Display name'
          endAdornment={hover ? <IconText startIcon={Icon.Copy} onClick={onCopy} forceTheme={forceTheme} /> : undefined}
          value={inputValue}
        />
      </div>
    </SectionWrapper>
  );
}

export default DisplayNameSection;
