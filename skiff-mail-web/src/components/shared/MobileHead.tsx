import { Helmet } from 'react-helmet';

export default function MobileHead() {
  return (
    <Helmet>
      <meta
        content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0,viewport-fit=cover'
        name='viewport'
      />
    </Helmet>
  );
}
