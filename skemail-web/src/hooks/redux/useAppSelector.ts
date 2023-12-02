import { TypedUseSelectorHook, useSelector } from 'react-redux';

import { AppState } from '../../redux/store/types';

export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
