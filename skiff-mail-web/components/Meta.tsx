import Head from 'next/head';

function Meta() {
  return (
    <Head>
      <meta content='/mail/favicon/browserconfig.xml' name='msapplication-config' />
      <link href='/mail/favicon/apple-touch-icon.png' rel='apple-touch-icon' sizes='180x180' />
      <link href='/mail/favicon/favicon-32x32.png' rel='icon' sizes='32x32' type='image/png' />
      <link href='/mail/favicon/favicon-16x16.png' rel='icon' sizes='16x16' type='image/png' />
      <link href='/mail/favicon/site.webmanifest' rel='manifest' />
      <link color='#5bbad5' href='/mail/favicon/safari-pinned-tab.svg' rel='mask-icon' />
      <meta content='#ffffff' name='msapplication-TileColor' />
      <meta content='#ffffff' name='theme-color' />
      <link href='/mail/favicon.ico' rel='shortcut icon' />
    </Head>
  );
}

export default Meta;
