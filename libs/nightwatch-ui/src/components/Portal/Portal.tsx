import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

type PortalProps = {
  children: React.ReactNode;
};

export default function Portal(props: PortalProps) {
  const { children } = props;
  // necessary for autofocus props
  const [mounted, setMounted] = useState(false);
  const [container] = useState(() =>
    // This will be executed only on the initial render
    // https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
    document.createElement('div')
  );

  useEffect(() => {
    document.body.appendChild(container);
    setMounted(true);
    return () => {
      document.body.removeChild(container);
      setMounted(false);
    };
  }, []);

  return ReactDOM.createPortal(mounted ? children : null, container);
}
