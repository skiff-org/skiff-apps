import { useDispatch } from 'react-redux';

import { AppDispatch } from '../../redux/store/types';

export const useAppDispatch: () => AppDispatch = useDispatch;
