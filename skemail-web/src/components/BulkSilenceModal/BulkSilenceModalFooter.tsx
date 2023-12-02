import { Button, Type } from 'nightwatch-ui';
import styled from 'styled-components';

type BulkSilenceModalFooterProps = {
  onClose: () => void;
  onBlock: () => void;
  disabled?: boolean;
};

const FooterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 20px;
  padding-top: 0px;
  box-sizing: border-box;
  justify-content: flex-end;
`;

/**
 * Actions for the footer of the unsubscribe modal.
 */
const BulkSilenceModalFooter = (props: BulkSilenceModalFooterProps) => {
  const { onClose, onBlock, disabled } = props;
  return (
    <FooterContainer>
      <Button onClick={onClose} type={Type.SECONDARY}>
        Close
      </Button>
      <Button disabled={disabled} onClick={onBlock} type={Type.PRIMARY}>
        Silence
      </Button>
    </FooterContainer>
  );
};

export default BulkSilenceModalFooter;
