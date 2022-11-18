import Head from 'next/head';

export default function MobileHead() {
  return (
    <Head>
      <meta
        content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0,viewport-fit=cover'
        name='viewport'
      />
    </Head>
  );
}
