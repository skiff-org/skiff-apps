import { createContext, useContext } from 'react';

import { Label } from '../utils/label';

export const RouterLabelContext = createContext<Label>(undefined!);

export const useRouterLabelContext = () => useContext(RouterLabelContext);
