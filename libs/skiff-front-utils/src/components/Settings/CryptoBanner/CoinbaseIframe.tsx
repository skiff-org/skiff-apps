import React, { useState } from 'react';
import { MoonLoader } from 'react-spinners';
import styled from 'styled-components';

import { PLAN_CHANGE_POLL_INTERVAL } from '../../../constants';
import { useToast } from '../../../hooks';

const CoinbaseIframeContainer = styled.iframe`
  width: 100%;
  min-height: 800px;
`;

const MoonLoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  text-align: left;
`;

type IFrameProps = {
  userID: string;
  checkoutID: string;
  onModalClosed: () => void;
  setIsUpdatingPlan: (isUpdating: boolean) => void;
  startPolling: (pollInterval: number) => void;
};

type MessageData = {
  event: string;
  charge: any;
};

interface EncodeURIParamsParams {
  origin: string;
  version: string;
  buttonId: string;
  cacheDisabled: boolean;
  custom: string;
}

function encodeURIParams(params: EncodeURIParamsParams) {
  const encoded: string[] = [];
  const quote = window.encodeURIComponent;
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      encoded.push(quote(key) + '=' + quote(params[key as keyof typeof params]));
    }
  }
  return encoded.join('&');
}

const CB_COMMERCE_ORIGIN = 'https://commerce.coinbase.com';

/**
 * Component to display the Coinbase Commerce payment page in an iFrame. More or less a functional, custom version
 * of https://github.com/coinbase/react-coinbase-commerce with unused functionality removed.
 */
function CoinbaseIFrame(props: IFrameProps) {
  const { userID, checkoutID, onModalClosed, setIsUpdatingPlan, startPolling } = props;
  const [loading, setLoading] = useState(true);
  const hostName = `${window.location.protocol}//${window.location.hostname}${
    window.location.port ? ':' + window.location.port : ''
  }/`;
  const encoded = encodeURIParams({
    origin: hostName,
    version: '1',
    buttonId: 'undefined',
    cacheDisabled: false,
    custom: userID
  });
  const src = `${CB_COMMERCE_ORIGIN}/embed/checkout/${encodeURI(checkoutID)}?${encoded}`;
  const { enqueueToast } = useToast();

  const handleMessage = (message: { origin: string; data: MessageData }) => {
    if (message.data.event === 'checkout_modal_closed') {
      // this handles the (x) in the upper-right corner of the iFrame itself
      // we should treat this the same as someone clicking outside the modal
      onModalClosed();
    } else if (message.data.event === 'payment_detected') {
      // once we detect a payment, we want to close the modal and wait for a plan change in the
      // parent component
      startPolling(PLAN_CHANGE_POLL_INTERVAL);
      setIsUpdatingPlan(true);
      enqueueToast({
        title: 'Plan upgraded',
        body: `Account has been sucessfully upgraded.`
      });
      onModalClosed();
    }
  };
  window.addEventListener('message', handleMessage);

  return (
    <>
      {loading && src.length === 0 && (
        <MoonLoaderContainer>
          <MoonLoader color='var(--text-secondary)' loading size={12} speedMultiplier={0.6} />
        </MoonLoaderContainer>
      )}
      {src.length > 0 && (
        <CoinbaseIframeContainer frameBorder='no' onLoad={() => setLoading(false)} scrolling='no' src={src} />
      )}
    </>
  );
}

export default CoinbaseIFrame;
