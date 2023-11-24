import { Dropdown, DropdownItem, Icon } from 'nightwatch-ui';
import { RefObject } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetBillingPortalSessionUrlLazyQuery } from 'skiff-front-graphql';
import { Drawer, useCurrentUserIsOrgAdmin, useToast } from 'skiff-front-utils';

interface ManageCustomDomainDropdownProps {
  buttonRef: RefObject<HTMLDivElement>;
  showDropdown: boolean;
  setShowDropdown: (value: boolean) => void;
  openDeleteDomainModal: () => void;
  skiffManaged: boolean;
  renewsAuto: boolean;
  showAddAliasOption: boolean;
  setShowAddAlias: (value: boolean) => void;
}

const ManageCustomDomainDropdown: React.FC<ManageCustomDomainDropdownProps> = ({
  buttonRef,
  showDropdown,
  setShowDropdown,
  openDeleteDomainModal,
  skiffManaged,
  showAddAliasOption,
  setShowAddAlias,
  renewsAuto
}: ManageCustomDomainDropdownProps) => {
  const [getBillingPortalSessionUrl] = useGetBillingPortalSessionUrlLazyQuery();
  const { enqueueToast } = useToast();
  const isCurrentUserOrgAdmin = useCurrentUserIsOrgAdmin();

  const renderDropdownItems = () => {
    return (
      <>
        {showAddAliasOption && (
          <DropdownItem
            icon={Icon.At}
            label='Add address'
            onClick={() => {
              setShowAddAlias(true);
              setShowDropdown(false);
            }}
          />
        )}
        {skiffManaged && isCurrentUserOrgAdmin && (
          <DropdownItem
            icon={Icon.Reload}
            label={`${renewsAuto ? 'Turn off' : 'Turn on'} auto-renew`}
            onClick={async () => {
              // Open Stripe portal to set subscription to cancel at period end
              // or un-cancel subscription previously set to cancel
              const { data } = await getBillingPortalSessionUrl({
                variables: { request: { redirectURL: window.location.href } }
              });
              if (data?.billingPortal?.url) {
                window.location.href = data.billingPortal.url;
              } else {
                enqueueToast({
                  title: 'Failed to open billing portal',
                  body: 'Please refresh and try again.'
                });
              }
            }}
          />
        )}
        {isCurrentUserOrgAdmin && (
          <DropdownItem
            color='destructive'
            icon={Icon.Trash}
            label='Delete'
            onClick={() => {
              openDeleteDomainModal();
              setShowDropdown(false);
            }}
          />
        )}
      </>
    );
  };

  return !isMobile ? (
    <Dropdown buttonRef={buttonRef} portal setShowDropdown={setShowDropdown} showDropdown={showDropdown}>
      {renderDropdownItems()}
    </Dropdown>
  ) : (
    <Drawer hideDrawer={() => setShowDropdown(false)} show={showDropdown}>
      {renderDropdownItems()}
    </Drawer>
  );
};

export default ManageCustomDomainDropdown;
