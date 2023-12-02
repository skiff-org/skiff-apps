import { Icon, IconText, Type, Typography } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { Checkbox } from 'skiff-front-utils';
import styled from 'styled-components';

import { CheckboxContainer } from './BulkSilenceModal.styles';
import {
  BulkSilenceData,
  BulkSilenceEntry,
  BulkSilenceSenderSectionProps,
  BulkSilenceSortMode,
  isSilenceSenderIndividual,
  isSilenceSenderSuggestion
} from './BulkSilenceModal.types';
import BulkSilenceModalRow from './BulkSilenceModalRow';

const SectionHeader = styled.div<{ $disable: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  justify-content: space-between;
  cursor: ${(props) => (props.$disable ? 'default' : 'pointer')};
  padding: 8px 12px;
  box-sizing: border-box;
  background: var(--bg-overlay-tertiary);
`;

const EmptyContainer = styled.div<{ $noContainer?: boolean }>`
  padding: ${({ $noContainer }) => ($noContainer ? '8px 0px' : '8px 12px')};
  box-sizing: border-box;
`;

const SectionHeaderRadioTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const getSortedBulkSilenceData = (
  sortMode: BulkSilenceSortMode,
  bulkSilenceData: BulkSilenceData
): BulkSilenceEntry[] => {
  const entries = Object.entries(bulkSilenceData) as BulkSilenceEntry[];

  if (sortMode === BulkSilenceSortMode.Alphabetical) {
    return entries.sort(([domainA, senderDetailsA], [domainB, senderDetailsB]) => {
      if (isSilenceSenderSuggestion(senderDetailsA) && isSilenceSenderSuggestion(senderDetailsB)) {
        const sendersA = senderDetailsA.senders;
        const sendersB = senderDetailsB.senders;
        const addressA = sendersA.length === 1 ? sendersA[0]?.sender : domainA;
        const addressB = sendersB.length === 1 ? sendersB[0]?.sender : domainB;
        return (addressA || domainA).localeCompare(addressB || domainB);
      } else {
        return domainA.localeCompare(domainB);
      }
    });
  } else if (sortMode === BulkSilenceSortMode.NumEmails) {
    return entries.sort(([, senderDetailsA], [, senderDetailsB]) => {
      // Check if it's a SuggestedUnsubscribeSenderGroup
      if (isSilenceSenderSuggestion(senderDetailsA) && isSilenceSenderSuggestion(senderDetailsB)) {
        const totalA = Object.values(senderDetailsA.senders).reduce((acc, sender) => acc + sender.messageCount, 0);
        const totalB = Object.values(senderDetailsB.senders).reduce((acc, sender) => acc + sender.messageCount, 0);
        return totalB - totalA; // sorting in descending order by message count
      } else if (isSilenceSenderIndividual(senderDetailsA) && isSilenceSenderIndividual(senderDetailsB)) {
        // Handle the SilenceSenderBulkSuggestion case
        const individualA = senderDetailsA;
        const individualB = senderDetailsB;
        return individualB.messageCount - individualA.messageCount;
      } else {
        return 0;
      }
    });
  } else {
    return entries.sort(([domainA], [domainB]) => domainA.localeCompare(domainB));
  }
};

const BulkSilenceSenderSection = ({
  bulkSilenceData,
  sectionLabel,
  checkedItems,
  setCheckedItems,
  sortMode,
  emptyText
}: BulkSilenceSenderSectionProps) => {
  const allCheckedInSection =
    Object.keys(bulkSilenceData || []).every((domain) => (!!checkedItems ? checkedItems[domain] : undefined)) &&
    Object.keys(bulkSilenceData || [])?.length > 0;
  const [expandSection, setExpandSection] = useState(true);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(() => {
    if (!bulkSilenceData) return {};
    return Object.keys(bulkSilenceData).reduce((acc, domain) => {
      acc[domain] = true; // expand parents by default
      return acc;
    }, {} as Record<string, boolean>);
  });
  const [sortedbulkSilenceData, setSortedbulkSilenceData] = useState<BulkSilenceEntry[] | undefined>(undefined);

  useEffect(() => {
    if (!bulkSilenceData) return;
    const updatedSortedbulkSilenceData = getSortedBulkSilenceData(sortMode, bulkSilenceData);
    setSortedbulkSilenceData(updatedSortedbulkSilenceData);
  }, [sortMode, bulkSilenceData]);

  useEffect(() => {
    if (!bulkSilenceData) return;
    const newExpandedState = Object.keys(bulkSilenceData).reduce((acc, domain) => {
      if (expandedParents[domain] === undefined) {
        acc[domain] = true; // set expansion for new items
      }
      return acc;
    }, {} as Record<string, boolean>);

    if (Object.keys(newExpandedState).length) {
      setExpandedParents((prevState) => ({ ...prevState, ...newExpandedState }));
    }
  }, [bulkSilenceData]);

  const handleToggleCheckbox = (key: string, isChild = false) => {
    if (!setCheckedItems) return;
    setCheckedItems((prev) => {
      if (prev === null) return prev;
      const newState = { ...prev };
      if (!bulkSilenceData) return newState;
      // Handling child checkbox toggle
      if (isChild) {
        newState[key] = !prev[key];

        // Check parent domain status based on child checkboxes
        let parentDomain: string | undefined;
        for (const [domain, data] of Object.entries(bulkSilenceData)) {
          if (isSilenceSenderSuggestion(data) && data.senders.some((senderObj) => senderObj.sender === key)) {
            parentDomain = domain;
            break;
          }
        }

        const parentbulkSilenceData = bulkSilenceData[parentDomain || ''];
        // If all children are checked, check the parent. If any child is unchecked, uncheck the parent.
        if (parentDomain && !!parentbulkSilenceData && 'senders' in parentbulkSilenceData) {
          const allChildrenChecked = parentbulkSilenceData.senders?.every((senderObj) => newState[senderObj.sender]);
          newState[parentDomain] = allChildrenChecked;
        }
      }
      // Handling parent checkbox toggle
      else {
        newState[key] = !prev[key];
        const domainData = bulkSilenceData[key];
        if (domainData && isSilenceSenderSuggestion(domainData)) {
          for (const senderObj of domainData.senders) {
            newState[senderObj.sender] = newState[key] || false;
          }
        }
      }
      return newState;
    });
  };

  const handleToggleChildren = (domain: string, checked: boolean) => {
    if (!bulkSilenceData || !setCheckedItems) return;
    const domainData = bulkSilenceData[domain];
    if (!!domainData && isSilenceSenderSuggestion(domainData)) {
      const updatedCheckedItems = { ...checkedItems };

      domainData.senders.forEach((senderObj) => {
        updatedCheckedItems[senderObj.sender] = checked;
      });

      setCheckedItems(updatedCheckedItems);
    }
  };

  const handleToggleSection = () => {
    if (!setCheckedItems) return;
    if (allCheckedInSection) {
      setCheckedItems((prev) => {
        const newState = { ...prev };
        if (!bulkSilenceData) return newState;
        for (const domain of Object.keys(bulkSilenceData)) {
          newState[domain] = false;
          const domainData = bulkSilenceData[domain];
          if (domainData && isSilenceSenderSuggestion(domainData)) {
            domainData.senders.forEach((senderObj) => {
              newState[senderObj.sender] = false;
            });
          }
        }
        return newState;
      });
    } else {
      setCheckedItems((prev) => {
        const newState = { ...prev };
        if (!bulkSilenceData) return newState;
        for (const domain of Object.keys(bulkSilenceData)) {
          newState[domain] = true;
          const domainData = bulkSilenceData[domain];
          if (domainData && isSilenceSenderSuggestion(domainData)) {
            domainData.senders.forEach((senderObj) => {
              newState[senderObj.sender] = true;
            });
          }
        }
        return newState;
      });
    }
  };

  const sectionEmpty = sortedbulkSilenceData?.length === 0;

  return (
    <>
      {!!sectionLabel &&
        false && ( // TODO: unhide when we support multiple sections
          <SectionHeader $disable={sectionEmpty} onClick={() => handleToggleSection()}>
            <SectionHeaderRadioTitle>
              <CheckboxContainer
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleToggleSection();
                }}
              >
                <Checkbox
                  checked={allCheckedInSection}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleToggleSection();
                  }}
                />
              </CheckboxContainer>
              <Typography color='secondary' selectable={false}>
                {sectionLabel}
              </Typography>
            </SectionHeaderRadioTitle>
            {!sectionEmpty && (
              <IconText
                color={Type.SECONDARY}
                onClick={(e?: React.MouseEvent) => {
                  e?.stopPropagation();
                  setExpandSection((prev) => !prev);
                }}
                startIcon={expandSection ? Icon.ChevronDown : Icon.ChevronRight}
              />
            )}
          </SectionHeader>
        )}
      {sectionEmpty && (
        <EmptyContainer $noContainer={setCheckedItems === undefined}>
          <Typography color='disabled'>{emptyText ?? 'No senders to silence'}</Typography>
        </EmptyContainer>
      )}
      {expandSection &&
        !sectionEmpty &&
        !!sortedbulkSilenceData &&
        sortedbulkSilenceData.map(([domain, senderDetails], index) => {
          const isIndividualSender = !isSilenceSenderSuggestion(senderDetails);
          const isSingleSender = isSilenceSenderSuggestion(senderDetails) && senderDetails.senders.length === 1;
          const singleSenderEmail = isSingleSender ? senderDetails.senders[0]?.sender : null;

          // If it's an individual sender
          if (isIndividualSender) {
            const individual = senderDetails;
            return (
              <BulkSilenceModalRow
                checked={!!checkedItems ? checkedItems[individual.sender] || false : undefined}
                emailAddress={individual.sender}
                indentation={0}
                isLast={index === sortedbulkSilenceData.length - 1}
                key={individual.sender}
                messageCount={individual.messageCount}
                onClick={() => handleToggleCheckbox(individual.sender)}
              />
            );
          }
          return (
            <React.Fragment key={domain}>
              {/* Single sender handling */}
              {isSingleSender && (
                <BulkSilenceModalRow
                  checked={!!checkedItems ? checkedItems[singleSenderEmail || ''] || false : undefined}
                  emailAddress={singleSenderEmail || ''}
                  indentation={0}
                  isLast={index === sortedbulkSilenceData.length - 1}
                  messageCount={senderDetails.senders[0]?.messageCount || 0}
                  onClick={() => handleToggleCheckbox(singleSenderEmail || '')}
                />
              )}
              {/* Multiple senders handling */}
              {!isSingleSender && (
                <>
                  <BulkSilenceModalRow
                    checked={!!checkedItems ? checkedItems[domain] || false : undefined}
                    displayName={domain}
                    domainSenders={senderDetails?.senders}
                    emailAddress={`(${senderDetails.senders.length} addresses)`}
                    expanded={expandedParents[domain] || false}
                    indentation={0}
                    isLast={index === sortedbulkSilenceData.length - 1}
                    messageCount={senderDetails.senders.reduce((acc, sender) => acc + sender.messageCount, 0)}
                    onClick={() => {
                      if (!checkedItems) return;
                      handleToggleChildren(domain, !(checkedItems[domain] || false));
                      handleToggleCheckbox(domain);
                    }}
                    onExpand={() => {
                      setExpandedParents((prev) => ({
                        ...prev,
                        [domain]: !prev[domain]
                      }));
                    }}
                  />
                  {/* Check if 'senders' exists and if the parent domain is expanded, then list all senders */}
                  {expandedParents[domain] &&
                    senderDetails.senders.map((senderInfo) => (
                      <BulkSilenceModalRow
                        checked={!!checkedItems ? checkedItems[senderInfo.sender] || false : undefined}
                        emailAddress={senderInfo.sender}
                        indentation={1}
                        key={senderInfo.sender}
                        messageCount={senderInfo.messageCount}
                        onClick={() => handleToggleCheckbox(senderInfo.sender, true)}
                      />
                    ))}
                </>
              )}
            </React.Fragment>
          );
        })}
    </>
  );
};

export default BulkSilenceSenderSection;
