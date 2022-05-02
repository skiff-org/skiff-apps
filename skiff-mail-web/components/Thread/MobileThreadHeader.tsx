import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { Icon, IconButton, Typography } from '../../../skiff-ui/src';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';

const BackButtonTitleContainer = styled.div<{ hasUserLabels?: boolean }>`
  ${(props) => {
    if (!props.hasUserLabels) {
      return `
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;`;
    }
  }}
  .icon-button {
    padding: 0;
    justify-content: flex-start;
  }
`;

const HeaderButtonsGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: space-between;
`;

/**
 * Contains the backwards and more options button as well
 * as the title of the thread on mobile devices
 * returns a differnt component depending on whether the thread has labels
 */
export default function MobileThreadHeader({ onClose, hasUserLabels, text }: MobileThreadHeaderTitleProps) {
  const dispatch = useDispatch();
  const showMoreOptions = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowMoreThreadOptionsDrawer(true));
  };
  return (
    <>
      <HeaderButtonsGroup>
        <BackButtonTitleContainer hasUserLabels={hasUserLabels}>
          <IconButton
            icon={Icon.Backward}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            size='large'
          />
          {!hasUserLabels && <Typography level={0}>{text}</Typography>}
        </BackButtonTitleContainer>
        <IconButton
          icon={Icon.OverflowH}
          onClick={(e) => {
            e.stopPropagation();
            showMoreOptions();
          }}
          size='large'
        />
      </HeaderButtonsGroup>
      {hasUserLabels && <Typography level={0}>{text}</Typography>}
    </>
  );
}
interface MobileThreadHeaderTitleProps {
  onClose: () => void;
  hasUserLabels?: boolean;
  text: string | null | undefined;
}
