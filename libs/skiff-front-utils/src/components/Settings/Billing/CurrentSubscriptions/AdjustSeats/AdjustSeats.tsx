import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  Icon,
  IconButton,
  Layout,
  Type,
  Typography,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useAdjustBusinessPlanMutation } from 'skiff-front-graphql';
import { RequestStatus, SubscriptionInterval } from 'skiff-graphql';
import { PlanPrices, TierName, getMaxUsersPerWorkspace } from 'skiff-utils';
import styled from 'styled-components';

import { useCurrentOrganization, useToast } from '../../../../../hooks';
import { ConfirmModal } from '../../../../modals';

interface AdjustSeatsModalProps {
  open: boolean;
  onClose: () => void;
  activeSubscriptionBillingInterval: SubscriptionInterval | null | undefined;
  allocatedSeats: number | null | undefined;
  refetch: () => void;
}

const ItemContainer = styled.div`
  display: flex;
  align-items: center;
  box-sizing: border-box;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  gap: 16px;
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
`;

const LinkColor = styled.span`
  color: var(--text-link);
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const SeatContainer = styled.div<{ $border?: boolean }>`
  width: 31px;
  height: 31px;
  border: 1px solid transparent;
  cursor: text;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  ${(props) => props.$border && `border: 1px solid var(--border-secondary);`}
`;

const NoStyleInput = styled.input`
  border: none;
  outline: none;
  width: 30px;
  height: 30px;
  box-sizing: border-box;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  background: var(--bg-l3-solid);
  color: var(--text-primary);
  caret-color: var(--icon-link);
  ::placeholder {
    color: var(--text-disabled);
  }
`;

const AdjustButtons = styled.div`
  display: flex;
  align-items: center;
  box-sizing: border-box;
  gap: 12px;
`;

const AdjustSeatsModal: React.FC<AdjustSeatsModalProps> = (props) => {
  const { open, onClose, activeSubscriptionBillingInterval, allocatedSeats, refetch } = props;
  const maxSeatCount = getMaxUsersPerWorkspace(TierName.Business);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const { data: currentOrg, loading: orgLoading } = useCurrentOrganization();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showInputBorder, setShowInputBorder] = useState(false);
  const orgName = currentOrg?.organization.name ?? '';
  // set minimum to number of members in org
  const minimumSeats = currentOrg?.organization?.everyoneTeam?.rootDocument?.collaborators?.length || 1;
  const [adjustBusinessPlan] = useAdjustBusinessPlanMutation();

  // controls seat count number
  const [newSeatCount, setNewSeatCount] = useState((allocatedSeats || minimumSeats) + 1);
  // handles input logic for edit seat count
  const [inputValue, setInputValue] = useState(`${newSeatCount}`);

  const [confirmModal, setConfirmModal] = useState(false);
  const { enqueueToast } = useToast();
  const isMonthly = activeSubscriptionBillingInterval === SubscriptionInterval.Monthly;
  const pricePerSeat = isMonthly ? PlanPrices.BusinessMonthly : PlanPrices.BusinessYearly;
  const seatDifference = newSeatCount - (allocatedSeats || 0);
  // convert string to currency formatted string (with comma)
  const formattedTotalPriceDifference = (seatDifference * pricePerSeat).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const handleAdjustBusinessPlan = async () => {
    if (newSeatCount < minimumSeats) return;
    setConfirmLoading(true);
    const { data } = await adjustBusinessPlan({
      variables: {
        request: {
          requestedQuantity: newSeatCount
        }
      }
    });
    setConfirmLoading(false);
    const { status, seats } = data?.adjustBusinessPlan || {};
    if ((status === RequestStatus.Success || status === RequestStatus.Saved) && !!seats) {
      refetch();
      enqueueToast({
        title: 'Seats successfully adjusted',
        body: `You now have ${seats} seat${seats > 1 ? 's' : ''} in “${orgName || 'workspace'}”`
      });
      onClose();
    } else {
      enqueueToast({
        title: 'Error adjusting seats',
        body: `There was an error adjusting seats. Please try again later.`
      });
    }
    setConfirmModal(false);
  };

  useEffect(() => {
    // keep input value in sync with newSeatCount
    setInputValue(`${newSeatCount}`);
  }, [newSeatCount]);

  const updateNewSeatNumberFromInput = () => {
    inputRef.current?.blur();
    setShowInputBorder(false);
    // invalid number
    if (Number.isNaN(Number(inputValue))) {
      enqueueToast({
        title: 'Invalid seat count',
        body: `Please enter a valid number of seats.`
      });
      setInputValue(`${newSeatCount}`);

      return;
    }
    // too small
    if (Number(inputValue) < minimumSeats) {
      enqueueToast({
        title: 'Seat count too low',
        body: `You cannot have fewer seats than members in your workspace.`
      });
      setInputValue(`${newSeatCount}`);
      return;
    }
    // too big
    if (Number(inputValue) > maxSeatCount) {
      enqueueToast({
        title: 'Seat count too high',
        body: `You cannot have more than ${maxSeatCount} seats in your workspace.`
      });
      setInputValue(`${newSeatCount}`);
      return;
    }
    setNewSeatCount(Number(inputValue));
  };

  return (
    <>
      <Dialog
        customContent
        description='Add or decrease seats in your workspace. Your seats cannot be below your member count.'
        onClose={onClose}
        open={open}
        title='Adjust seats'
      >
        <ItemContainer>
          <Typography weight={TypographyWeight.MEDIUM}>Current usage</Typography>
          <Typography>
            <LinkColor>{`${minimumSeats} of ${allocatedSeats}`}</LinkColor> seats used
          </Typography>
        </ItemContainer>
        <ItemContainer>
          <Typography weight={TypographyWeight.MEDIUM}>Adjust seats</Typography>
          <AdjustButtons>
            {!!activeSubscriptionBillingInterval && (
              <PriceContainer>
                {seatDifference > 0 && (
                  <Typography color='secondary'>{`(plus ${formattedTotalPriceDifference} / ${
                    isMonthly ? 'month' : 'year'
                  })`}</Typography>
                )}
              </PriceContainer>
            )}
            <IconButton
              disabled={newSeatCount === minimumSeats || orgLoading}
              icon={Icon.Minus}
              onClick={(e) => {
                e.stopPropagation();
                setNewSeatCount((prev) => prev - 1);
              }}
              type={Type.SECONDARY}
            />
            <SeatContainer
              $border={showInputBorder}
              onMouseEnter={() => {
                if (isMobile) return;
                setShowInputBorder(true);
              }}
              onMouseLeave={() => {
                if (isMobile) return;
                updateNewSeatNumberFromInput();
                setShowInputBorder(false);
              }}
            >
              <NoStyleInput
                disabled={isMobile}
                onChange={(e) => {
                  setShowInputBorder(true);
                  setInputValue(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    updateNewSeatNumberFromInput();
                  }
                }}
                ref={inputRef}
                value={inputValue}
              />
            </SeatContainer>
            <IconButton
              disabled={newSeatCount === maxSeatCount || orgLoading}
              icon={Icon.Plus}
              onClick={(e) => {
                e.stopPropagation();
                setNewSeatCount((prev) => prev + 1);
              }}
              type={Type.SECONDARY}
            />
          </AdjustButtons>
        </ItemContainer>
        <ButtonGroup layout={Layout.INLINE}>
          <ButtonGroupItem
            disabled={orgLoading}
            key='update'
            label='Update'
            onClick={() => {
              if (allocatedSeats === newSeatCount) {
                onClose();
              } else {
                setConfirmModal(true);
              }
            }}
          />
          <ButtonGroupItem key='cancel' label='Cancel' onClick={() => onClose()} />
        </ButtonGroup>
      </Dialog>
      <ConfirmModal
        confirmName='Confirm'
        description='You will receive an updated invoice immediately after confirming.'
        loading={confirmLoading}
        onClose={() => {
          setConfirmModal(false);
        }}
        onConfirm={handleAdjustBusinessPlan}
        open={confirmModal}
        title={`Adjust plan to ${newSeatCount} seat${newSeatCount > 1 ? 's' : ''}?`}
      />
    </>
  );
};

export default AdjustSeatsModal;
