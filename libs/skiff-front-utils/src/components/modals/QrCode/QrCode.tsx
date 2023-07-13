import { ThemeMode } from '@skiff-org/skiff-ui';
import React from 'react';
import { QRCode as ReactQrCode } from 'react-qrcode-logo';

import skiffBlackLogo from './images/skiffBlackLogo.png';
import skiffWhiteLogo from './images/skiffWhiteLogo.png';

interface QRCodeProps {
  link: string;
  theme: ThemeMode;
}

const QRCode: React.FC<QRCodeProps> = ({ link, theme }) => {
  return (
    <ReactQrCode
      bgColor={theme === ThemeMode.LIGHT ? 'white' : '#242424'}
      ecLevel='H'
      eyeRadius={50}
      fgColor={theme === ThemeMode.LIGHT ? '#242424' : 'white'}
      logoImage={theme === ThemeMode.LIGHT ? skiffBlackLogo : skiffWhiteLogo}
      logoWidth={80}
      removeQrCodeBehindLogo
      size={256}
      value={link}
    />
  );
};

export default QRCode;
