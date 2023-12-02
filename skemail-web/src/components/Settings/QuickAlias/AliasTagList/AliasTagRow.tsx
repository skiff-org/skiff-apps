import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  DialogType,
  Dropdown,
  DropdownItem,
  Icon,
  IconText,
  Icons,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import {
  AnonymousSubdomain,
  GetUserQuickAliasDomainsDocument,
  useDeleteQuickAliasDomainMutation
} from 'skiff-front-graphql';
import { SettingValue, TabPage, useToast } from 'skiff-front-utils';
import styled from 'styled-components';

import pluralize from 'pluralize';
import { useSettings } from '../../useSettings';

const DomainRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
`;

const IconDomain = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  padding-bottom: 0px;
`;

const FooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;
`;

const ButtonContainer = styled.div`
  display: flex;
  padding: 20px;
  padding-top: 0px;
  width: 100%;
  box-sizing: border-box;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  background: var(--bg-overlay-tertiary);
  border: 1px solid var(--border-tertiary);
  border-left-width: 0px;
  border-right-width: 0px;
  height: 44px;
  padding: 8px 24px;
  box-sizing: border-box;
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--bg-emphasis);
  flex-direction: column;
`;

interface AliasTagRowProps {
  domain: AnonymousSubdomain;
  refetchNumInactiveSubdomains: () => void;
  remainingDeletions: number;
}

export const AliasTagRow: React.FC<AliasTagRowProps> = ({
  domain,
  remainingDeletions,
  refetchNumInactiveSubdomains
}) => {
  const { enqueueToast } = useToast();
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const [deleteDomain] = useDeleteQuickAliasDomainMutation();
  const { openSettings } = useSettings();
  const openPlansTab = () => openSettings({ tab: TabPage.Plans, setting: SettingValue.SubscriptionPlans });
  const hasOneDeletionRemaining = remainingDeletions === 1;

  const deleteDomainHandler = async () => {
    try {
      await deleteDomain({
        variables: { userDomainID: domain.domainID },
        refetchQueries: [{ query: GetUserQuickAliasDomainsDocument }]
      });
      refetchNumInactiveSubdomains();
    } catch (e) {
      enqueueToast({
        title: 'Could not delete Quick Alias domain',
        body: 'Please try again.'
      });
    }
  };

  const copyDomain = () => {
    const atPrependedDomain = `@${domain.domain}`;
    void navigator.clipboard.writeText(atPrependedDomain);
    enqueueToast({
      title: 'Copied Quick Alias domain',
      body: `Successfully copied ${atPrependedDomain} to clipboard`
    });
  };

  return (
    <DomainRow>
      <IconDomain>
        <IconContainer>
          <Icons color='white' icon={Icon.Bolt} />
        </IconContainer>
        <Typography>@{domain.domain}</Typography>
      </IconDomain>
      <IconText onClick={() => setShowMoreOptions(true)} ref={overflowRef} startIcon={Icon.OverflowH} />
      <Dropdown buttonRef={overflowRef} portal setShowDropdown={setShowMoreOptions} showDropdown={showMoreOptions}>
        <DropdownItem
          icon={Icon.Copy}
          label='Copy domain'
          onClick={() => {
            copyDomain();
            setShowMoreOptions(false);
          }}
        />
        <DropdownItem
          color='destructive'
          icon={Icon.Trash}
          label='Delete domain'
          onClick={() => {
            if (remainingDeletions <= 0) {
              enqueueToast({
                title: "You've already deleted the maximum domains",
                body: 'Upgrade to get access to more.',
                actions: [{ label: 'Upgrade', onClick: openPlansTab }]
              });
            } else {
              setShowDeleteConfirm(true);
              setShowMoreOptions(false);
            }
          }}
        />
      </Dropdown>
      <Dialog
        customContent
        onClose={() => setShowDeleteConfirm(false)}
        open={showDeleteConfirm}
        type={DialogType.CONFIRM}
        noPadding
      >
        <Container>
          <Text>
            <Typography wrap size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
              {hasOneDeletionRemaining ? 'Delete final domain?' : 'Permanently delete domain?'}
            </Typography>
            <Typography wrap color='secondary'>
              {hasOneDeletionRemaining
                ? 'This is the final domain you can delete. Are you sure you wish to delete the domain and all associated Quick Aliases?'
                : 'This will delete the domain and all Quick Aliases associated with it. This cannot be undone.'}
            </Typography>
          </Text>
        </Container>
        <FooterContainer>
          <Footer>
            <Typography wrap color='secondary' size={TypographySize.SMALL}>
              {`${pluralize('delete', remainingDeletions, true)} remaining`}
            </Typography>
          </Footer>
          <ButtonContainer>
            <ButtonGroup>
              <ButtonGroupItem
                label='Delete'
                onClick={() => {
                  void deleteDomainHandler();
                  setShowDeleteConfirm(false);
                }}
                type={Type.DESTRUCTIVE}
              />
              <ButtonGroupItem label='Cancel' onClick={() => setShowDeleteConfirm(false)} />
            </ButtonGroup>
          </ButtonContainer>
        </FooterContainer>
      </Dialog>
    </DomainRow>
  );
};
