import { Button, Icon, IconButton } from 'nightwatch-ui';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';

import MobileOptionsDrawer from './ComposeToolbarOptions/MobileOptionsDrawer';

const ButtonBar = styled.div`
  width: 100%;
  display: flex;
  border-top: 1px solid var(--border-secondary);
  box-sizing: border-box;
  grid-row: 1;
  border-style: none;
  padding: 0px;
  height: 45px;
  background: var(--bg-l3-solid);
  gap: 8px;
`;

const IconButtons = styled.div`
  display: flex;
`;

const CloseButtonContainer = styled.div`
  margin-right: auto;
`;

type Size = 'small' | 'medium' | 'large';

interface MobileButtonBarProps {
  messageSizeExceeded: boolean;
  handleSendClick: () => Promise<void>;
  onAttachmentsClick: () => void;
  discardDraft: (hideToast?: boolean) => Promise<void>;
  insertImage: () => void;
}
export default function MobileButtonBar({
  messageSizeExceeded,
  handleSendClick,
  onAttachmentsClick,
  discardDraft,
  insertImage
}: MobileButtonBarProps) {
  const dispatch = useDispatch();
  const showMoreOptionsDrawer = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowComposeMoreOptionsDrawer(true));
  };
  const mobileDrawerOptions = {
    image: {
      icon: Icon.Image,
      size: 'large' as Size,
      onClick: insertImage,
      tooltip: 'Insert image'
    },
    trash: {
      icon: Icon.Trash,
      onClick: discardDraft,
      size: 'large' as Size,
      tooltip: 'Discard draft'
    }
  };

  return (
    <ButtonBar>
      <CloseButtonContainer>
        <IconButton
          icon={Icon.Close}
          onClick={() => {
            dispatch(skemailModalReducer.actions.closeCompose());
          }}
          size='large'
          tooltip='Close'
        />
      </CloseButtonContainer>
      <IconButtons>
        <IconButton
          dataTest='add-attachment'
          icon={Icon.PaperClip}
          onClick={onAttachmentsClick}
          size='large'
          tooltip='Add attachments'
        />
        <IconButton icon={Icon.OverflowH} onClick={showMoreOptionsDrawer} size='large' />
      </IconButtons>
      <Button dataTest='send-button' disabled={messageSizeExceeded} onClick={() => void handleSendClick()}>
        Send
      </Button>
      <MobileOptionsDrawer moreBottomBarOptions={mobileDrawerOptions} />
    </ButtonBar>
  );
}
