import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';

type DrawerContextType = {
  drawerOpen: boolean;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
};

// Context to store whether the bottom compose drawer is open
export const DrawerContext = createContext<DrawerContextType>(undefined!);

type DrawerProviderProps = {
  children: ReactNode;
};

export const DrawerProvider = (props: DrawerProviderProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return <DrawerContext.Provider value={{ drawerOpen, setDrawerOpen }}>{props.children}</DrawerContext.Provider>;
};

export const useDrawerContext = () => useContext(DrawerContext);
