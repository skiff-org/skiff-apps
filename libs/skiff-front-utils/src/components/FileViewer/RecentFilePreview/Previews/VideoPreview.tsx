import React from 'react';

import { PreviewComponent, PreviewComponentProps } from '../RecentFilePreview.types';

export const VIDEO_UNSUPPORTED_FORMATS = [
  'video/x-msvideo',
  'video/mpeg',
  'video/ogg',
  'video/mp2t',
  'video/webm',
  'video/3gpp',
  'video/3gpp2'
];

const VideoPreview: PreviewComponent = ({ data }: PreviewComponentProps) => (
  <video controls src={data} width={'100%'}>
    <track kind='captions' />
  </video>
);

export default VideoPreview;
