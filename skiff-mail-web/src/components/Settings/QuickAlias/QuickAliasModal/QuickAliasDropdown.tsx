import { Dropdown, DropdownItem, Icon } from 'nightwatch-ui';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetUserQuickAliasDomainsQuery,
  useGetUserQuickAliasesQuery,
  useUpdateEmailAliasSendReceiveEnabledStateMutation,
  useUpdateQuickAliasActiveStateMutation
} from 'skiff-front-graphql';
import { ConfirmModal, useAsyncHcaptcha, useToast } from 'skiff-front-utils';
import { FullAliasInfo } from 'skiff-graphql';

import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { ModalType } from '../../../../redux/reducers/modalTypes';
import { ConditionComparator, ConditionType } from '../../Filters/Filters.constants';

interface QuickAliasDropdownProps {
  showOptionDropdown: boolean;
  setShowOptionDropdown: (show: boolean) => void;
  quickAlias: FullAliasInfo;
  buttonRef: React.RefObject<HTMLDivElement>;
  setSelectedQuickAlias?: (alias: FullAliasInfo) => void;
}

export default function QuickAliasDropdown(props: QuickAliasDropdownProps) {
  const { showOptionDropdown, setShowOptionDropdown, quickAlias, buttonRef, setSelectedQuickAlias } = props;
  const { enqueueToast } = useToast();
  const { refetch } = useGetUserQuickAliasesQuery();
  const dispatch = useDispatch();
  const { data: domainData } = useGetUserQuickAliasDomainsQuery();
  const userDomainID = domainData?.currentUser?.anonymousSubdomains?.find(
    (domain) => domain.domain === quickAlias.emailAlias.split('@')[1]
  )?.domainID;

  const openNewFilterModal = () => {
    setShowOptionDropdown(false);
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.Filter,
        activeConditions: [
          {
            id: '0',
            type: ConditionType.To,
            comparator: ConditionComparator.Is,
            value: {
              label: quickAlias.emailAlias,
              value: quickAlias.emailAlias
            }
          }
        ]
      })
    );
  };

  const isDisabled = quickAlias.isDisabled ?? false;

  const [showDeleteAlias, setShowDeleteAlias] = useState<boolean>(false);
  const [showDisableAlias, setShowDisableAlias] = useState<boolean>(false);

  const [updateQuickAliasActiveState] = useUpdateQuickAliasActiveStateMutation();
  const [updateEmailAliasSendReceiveEnabledState] = useUpdateEmailAliasSendReceiveEnabledStateMutation();
  const [hcaptchaToken, setHcaptchaToken] = useState<string>('');

  const { requestHcaptchaToken } = useAsyncHcaptcha(true);

  useEffect(() => {
    // get a token to send later when sending a message
    const getHcaptchaToken = async () => {
      try {
        const token = await requestHcaptchaToken();
        setHcaptchaToken(token);
      } catch (error) {
        console.error('Failed to get hcaptcha token', error);
      }
    };
    if (!hcaptchaToken) {
      void getHcaptchaToken();
    }
  }, [hcaptchaToken, requestHcaptchaToken]);

  const disableAlias = async (enable?: boolean) => {
    if (!quickAlias) {
      return;
    }
    try {
      await updateEmailAliasSendReceiveEnabledState({
        variables: {
          request: {
            emailAlias: quickAlias.emailAlias,
            enabled: enable ?? false
          }
        }
      });
      setShowDisableAlias(false);
      void refetch();
    } catch {
      enqueueToast({
        title: 'Failed to disable Quick Alias',
        body: 'Please try again later.'
      });
      setShowDisableAlias(false);
    }
  };

  const deleteAlias = async () => {
    try {
      if (!userDomainID) return;
      await updateQuickAliasActiveState({
        variables: {
          request: {
            emailAlias: quickAlias.emailAlias,
            captchaToken: hcaptchaToken,
            userDomainID,
            isActive: false
          }
        }
      });
      enqueueToast({
        title: `Deleted ${quickAlias.emailAlias}`,
        body: 'You will no longer receive emails from this alias.'
      });
      setShowDeleteAlias(false);
      void refetch();
    } catch {
      setShowDeleteAlias(false);
      enqueueToast({
        title: 'Failed to delete Quick Alias',
        body: 'Please try again later.'
      });
    }
  };

  return (
    <>
      <Dropdown
        buttonRef={buttonRef}
        minWidth={200}
        portal
        setShowDropdown={setShowOptionDropdown}
        showDropdown={showOptionDropdown}
      >
        {!!setSelectedQuickAlias && (
          <DropdownItem
            icon={Icon.Edit}
            label='View details'
            onClick={() => {
              setShowOptionDropdown(false);
              setSelectedQuickAlias(quickAlias);
            }}
          />
        )}
        {!isDisabled && <DropdownItem icon={Icon.Filter} label='Create filter' onClick={openNewFilterModal} />}
        <DropdownItem
          icon={isDisabled ? Icon.CheckCircle : Icon.Remove}
          label={`${isDisabled ? 'Enable' : 'Disable'} alias`}
          onClick={() => {
            setShowOptionDropdown(false);
            setShowDisableAlias(true);
          }}
        />
        <DropdownItem
          color='destructive'
          icon={Icon.Trash}
          label='Delete alias'
          onClick={() => {
            setShowOptionDropdown(false);
            setShowDeleteAlias(true);
          }}
        />
      </Dropdown>
      <ConfirmModal
        confirmName='Delete'
        description='This cannot be undone.'
        destructive
        onClose={() => setShowDeleteAlias(false)}
        onConfirm={deleteAlias}
        open={showDeleteAlias}
        title='Delete Quick Alias?'
      />
      <ConfirmModal
        confirmName={isDisabled ? 'Enable' : 'Disable'}
        description={
          isDisabled
            ? 'Re-enable this alias to receive emails from it again.'
            : 'You will not receive any emails from this alias. You can re-enable in settings anytime.'
        }
        destructive={!isDisabled}
        onClose={() => setShowDisableAlias(false)}
        onConfirm={async () => {
          await disableAlias(isDisabled);
          void refetch();
        }}
        open={showDisableAlias}
        title={`${isDisabled ? 'Enable' : 'Disable'} Quick Alias?`}
      />
    </>
  );
}
