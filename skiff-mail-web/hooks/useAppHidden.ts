import { useState, useEffect } from 'react';

// Returns true if the app is hidden (in background) or not
export default function useAppHidden() {
  const [hidden, setHidden] = useState(false);
  const visibilitychange = () => {
    setHidden(document.hidden);
  };
  useEffect(() => {
    document.addEventListener('visibilitychange', visibilitychange);
    return () => document.removeEventListener('visibilitychange', visibilitychange);
  }, []);
  return hidden;
}
