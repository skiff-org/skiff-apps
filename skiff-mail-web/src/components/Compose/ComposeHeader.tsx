import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import { FilledVariant, Icon, IconText, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import { FC } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { ComposeExpandTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';

const ComposeHeaderContainer = styled.div<{ collapsed: boolean }>`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  min-height: 55px;
  cursor: ${(props) => (props.collapsed ? 'pointer' : 'default')};
  padding: ${(props) => (props.collapsed ? '10px 24px' : '16px 16px 0px')};
  box-sizing: border-box;
`;

const HeaderButtonsGroup = styled.div`
  display: flex;
  gap: 4px;
`;

type ComposeHeaderProps = {
  text?: string | null; // GraphQL
  onClose: () => void;
};

export const ComposeHeaderDataTest = {
  closeButton: 'close-compose-button'
};

const ComposeHeader: FC<ComposeHeaderProps> = (props) => {
  const { onClose, text } = props;
  const dispatch = useDispatch();
  const { replyComposeOpen } = useAppSelector((state) => state.modal);
  const expand = () => {
    dispatch(skemailModalReducer.actions.expand());
  };
  const fullExpand = () => {
    dispatch(skemailModalReducer.actions.fullExpand());
  };
  const collapse = () => {
    dispatch(skemailModalReducer.actions.collapse());
  };
  const { composeCollapseState } = useAppSelector((state) => state.modal);

  const collapsed = composeCollapseState === ComposeExpandTypes.Collapsed;
  const fullExpanded = composeCollapseState === ComposeExpandTypes.FullExpanded;
  const toggleCollapse = collapsed || fullExpanded ? expand : collapse;
  if (replyComposeOpen.open && !replyComposeOpen.popOut) return null;
  return (
    <ComposeHeaderContainer collapsed={collapsed} onClick={collapsed ? expand : undefined}>
      <Typography
        color='primary'
        size={collapsed ? TypographySize.LARGE : TypographySize.H4}
        weight={TypographyWeight.MEDIUM}
      >
        {text}
      </Typography>
      <HeaderButtonsGroup>
        <FloatingDelayGroup delay={{ open: 200, close: 200 }}>
          <IconText
            color='primary'
            onClick={toggleCollapse}
            startIcon={collapsed ? Icon.Expand : Icon.HorizontalRule}
            tooltip={collapsed ? 'Expand' : 'Minimize'}
            variant={FilledVariant.UNFILLED}
          />
          {composeCollapseState === ComposeExpandTypes.Expanded && (
            <IconText
              color='primary'
              onClick={fullExpand}
              startIcon={Icon.Expand}
              tooltip='Full screen'
              variant={FilledVariant.UNFILLED}
            />
          )}
          <IconText
            color='primary'
            dataTest={ComposeHeaderDataTest.closeButton}
            onClick={() => {
              onClose();
            }}
            startIcon={Icon.Close}
            tooltip='Close'
            variant={FilledVariant.UNFILLED}
          />
        </FloatingDelayGroup>
      </HeaderButtonsGroup>
    </ComposeHeaderContainer>
  );
};

export default ComposeHeader;
