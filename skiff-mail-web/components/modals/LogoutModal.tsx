import { ButtonGroupItem, Dialog, DialogTypes } from '@skiff-org/skiff-ui';
import { useDispatch } from 'react-redux';

import client from '../../apollo/client';
import { removeCurrentUserData } from '../../apollo/currentUser';
import { useClearSessionCacheMutation } from '../../generated/graphql';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { getEditorBasePath } from '../../utils/linkToEditorUtils';

const LogoutModal: React.FC = ({}) => {
  const { openModal } = useAppSelector((state) => state.modal);
  const isOpen = openModal?.type === ModalType.Logout;

  const dispatch = useDispatch();
  const onClose = () => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  };

  const [clearSessionCache] = useClearSessionCacheMutation();

  const logout = async () => {
    await clearSessionCache({ variables: { request: {} } });
    await client.clearStore();
    removeCurrentUserData();
    onClose();
    window.location.replace(getEditorBasePath());
  };

  return (
    <Dialog onClose={onClose} open={isOpen} title='Logout?' type={DialogTypes.Confirm}>
      <ButtonGroupItem destructive key='logout' label={'Logout'} onClick={logout} />
      <ButtonGroupItem key='cancel-logout' label='Cancel' onClick={onClose} />
    </Dialog>
  );
};

export default LogoutModal;
