import { TypedUseSelectorHook, useSelector } from 'react-redux';

import { RootState } from '../../redux/store/types';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
