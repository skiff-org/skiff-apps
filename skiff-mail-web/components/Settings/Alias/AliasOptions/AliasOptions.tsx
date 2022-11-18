import { Dropdown, DropdownItem, Icon, IconButton } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { ConfirmModal, copyToClipboardWebAndMobile, useToast, formatEmailAddress } from 'skiff-front-utils';
import { RequestStatus } from 'skiff-graphql';
import { useGetCurrentUserEmailAliasesQuery, useUpdateEmailAliasActiveStateMutation } from 'skiff-mail-graphql';

import { updateEmailAliases } from '../../../../utils/cache/cache';

interface AliasOptionsProps {
  emailAlias: string;
  userID: string;
  requestHcaptchaToken: () => Promise<string>;
}

export default function AliasOptions(props: AliasOptionsProps) {
  const { emailAlias, userID, requestHcaptchaToken } = props;
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [updateEmailAliasActiveState] = useUpdateEmailAliasActiveStateMutation();
  const { data } = useGetCurrentUserEmailAliasesQuery();
  const fetchedAliases = data?.currentUser?.emailAliases ?? [];
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const { enqueueToast } = useToast();

  const copyToClipboard = () => {
    copyToClipboardWebAndMobile(emailAlias);
    enqueueToast({
      body: `Email alias copied.`,
      icon: Icon.Copy
    });
  };

  const deleteAlias = async () => {
    setShowConfirmDelete(false);
    const captchaToken = await requestHcaptchaToken();
    const errorToast = {
      body: 'An error occurred while deleting alias',
      icon: Icon.Warning
    };
    try {
      await updateEmailAliasActiveState({
        variables: {
          request: {
            captchaToken,
            emailAlias,
            isActive: false
          }
        },
        update: (cache, response) => {
          if (response.errors) {
            enqueueToast({
              body: 'Failed to delete alias',
              icon: Icon.Warning
            });
          } else if (response.data?.updateEmailAliasActiveState?.status !== RequestStatus.Success) {
            enqueueToast(errorToast);
          } else {
            const updatedEmailAliases = fetchedAliases.filter((alias) => alias !== emailAlias);
            updateEmailAliases(cache, userID, updatedEmailAliases);
            enqueueToast({
              body: 'Successfully deleted alias',
              icon: Icon.Check
            });
          }
        }
      });
    } catch (_e: unknown) {
      enqueueToast(errorToast);
    }
  };

  return (
    <>
      <ConfirmModal
        confirmName='Delete'
        description='Deleting is a permanent action and this alias cannot be claimed again.'
        destructive
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={deleteAlias}
        open={showConfirmDelete}
        title={`Delete ${formatEmailAddress(emailAlias)}?`}
      />
      <div>
        <IconButton
          color='secondary'
          icon={Icon.OverflowH}
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown((prev) => !prev);
          }}
          ref={buttonRef}
        />
        {showDropdown && (
          <Dropdown buttonRef={buttonRef} hasSubmenu portal setShowDropdown={setShowDropdown}>
            <DropdownItem
              icon={Icon.Clipboard}
              label='Copy'
              onClick={() => {
                setShowDropdown(false);
                copyToClipboard();
              }}
            />
            {/* Only allow deleting aliases if we have more than one active */}
            {fetchedAliases.length > 1 && (
              <DropdownItem
                icon={Icon.Trash}
                label='Delete'
                onClick={() => {
                  setShowDropdown(false);
                  setShowConfirmDelete(true);
                }}
              />
            )}
          </Dropdown>
        )}
      </div>
    </>
  );
}
