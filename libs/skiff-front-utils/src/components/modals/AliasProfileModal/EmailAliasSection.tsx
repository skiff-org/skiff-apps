import { Icon, IconText, InputField, Typography } from 'nightwatch-ui';

import { NewEmailAliasInput } from '../../NewEmailAliasInput';

import { useState } from 'react';
import { useToast } from '../../../hooks';
import { SectionWrapper } from './AliasProfileModal.styles';
import { EmailAliasSectionProps } from './AliasProfileModal.types';

function EmailAliasSection({
  alias,
  isAddAliasConfirmOpen,
  setIsAddAliasConfirmOpen,
  updateAliasInfo,
  addAlias,
  // New email alias props
  username,
  setAlias,
  setPreSubmitError,
  setPostSubmitError,
  forceTheme,
  ...newEmailAliasInputProps
}: EmailAliasSectionProps) {
  // Whether the user is creating a new alias or editing the profile of an existing one
  const isEditing = !addAlias;
  const [hover, setHover] = useState(false);

  const { enqueueToast } = useToast();

  const onCopy = () => {
    void navigator.clipboard.writeText(alias);
    enqueueToast({
      title: 'Email address copied to clipboard'
    });
  };

  return (
    <SectionWrapper>
      <div>
        <Typography forceTheme={forceTheme}>Email address</Typography>
        <Typography color='secondary' forceTheme={forceTheme}>{`${
          isEditing ? 'A' : 'Create a'
        }n additional address for sending and receiving mail.`}</Typography>
      </div>
      {!isEditing && username !== undefined && setAlias && setPreSubmitError && setPostSubmitError && (
        <NewEmailAliasInput
          addAlias={async () => {
            const success = await addAlias();
            // If the alias was created successfully, update alias display name and display picture data and generate a PGP key
            if (success) {
              void updateAliasInfo();
            }
          }}
          confirmModalControls={{
            isOpen: isAddAliasConfirmOpen,
            setIsOpen: setIsAddAliasConfirmOpen
          }}
          forceTheme={forceTheme}
          hideAddAliasButton
          newAlias={alias}
          setAlias={setAlias}
          setPostSubmitError={setPostSubmitError}
          setPreSubmitError={setPreSubmitError}
          username={username}
          {...newEmailAliasInputProps}
        />
      )}
      {isEditing && (
        <div onMouseLeave={() => setHover(false)} onMouseOver={() => setHover(true)}>
          <InputField
            disabled
            forceTheme={forceTheme}
            value={alias}
            endAdornment={
              hover ? <IconText startIcon={Icon.Copy} onClick={onCopy} forceTheme={forceTheme} /> : undefined
            }
          />
        </div>
      )}
    </SectionWrapper>
  );
}

export default EmailAliasSection;
