import { Icon, IconButton, Typography } from '@skiff-org/skiff-ui';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';

const ComposeHeaderContainer = styled.div<{ collapsed: boolean }>`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  cursor: ${(props) => (props.collapsed ? 'pointer' : 'default')};
  padding: ${(props) => (props.collapsed ? '10px 24px' : '24px 0px')};
  box-sizing: border-box;
`;

const HeaderButtonsGroup = styled.div`
  display: flex;
  gap: 8px;
`;

type ComposeHeaderProps = {
  text?: string | null; // GraphQL
  onClose: () => void;
};

const ComposeHeader: React.FC<ComposeHeaderProps> = (props) => {
  const { onClose, text } = props;
  const dispatch = useDispatch();
  const expand = () => dispatch(skemailModalReducer.actions.expand());
  const collapse = () => dispatch(skemailModalReducer.actions.collapse());
  const { isComposeCollapsed } = useAppSelector((state) => state.modal);
  const toggleCollapse = isComposeCollapsed ? expand : collapse;

  return (
    <ComposeHeaderContainer collapsed={isComposeCollapsed} onClick={isComposeCollapsed ? expand : undefined}>
      <Typography color={isComposeCollapsed ? 'white' : 'primary'} level={isComposeCollapsed ? 1 : 0}>
        {text}
      </Typography>
      <HeaderButtonsGroup>
        <IconButton
          color={isComposeCollapsed ? 'white' : 'primary'}
          icon={isComposeCollapsed ? Icon.Expand : Icon.Minus}
          onClick={toggleCollapse}
          tooltip={isComposeCollapsed ? 'Expand' : 'Minimize'}
        />
        <IconButton
          color={isComposeCollapsed ? 'white' : 'primary'}
          dataTest='bottom-drawer-close-button'
          icon={Icon.Close}
          onClick={() => {
            onClose();
          }}
          tooltip='Close'
        />
      </HeaderButtonsGroup>
    </ComposeHeaderContainer>
  );
};

export default ComposeHeader;
