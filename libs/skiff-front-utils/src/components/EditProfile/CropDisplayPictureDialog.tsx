import { Button, Dialog, DialogTypes, Type, Typography } from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import ReactCrop, { PercentCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import styled from 'styled-components';

import { dataURLtoFile } from '../../utils/fileUtils';
// NOTE: don't forget to import the css file to your app.tsx on your project.
type CropDisplayPictureDialogProps = {
  handleClose: (e?: React.MouseEvent) => void;
  imageSrc: string;
  onSubmit: (file: File) => Promise<void>;
};

const ImageEditArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 350px;
  background: var(--bg-l0-solid);
`;

const CropArea = styled(ReactCrop)`
  & > div {
    height: 350px;
  }
`;

const ImageToCrop = styled.img`
  height: 100%;
`;

const ButtonsContainer = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
`;

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 100
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function CropDisplayPictureDialog(props: CropDisplayPictureDialogProps) {
  const { imageSrc, handleClose, onSubmit } = props;
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PercentCrop>();
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const invalidCrop = !completedCrop || !completedCrop.width || !completedCrop.height;

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerAspectCrop(width, height, 1);
    setCrop(initialCrop as PercentCrop);
  };

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUploading(true);
    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!image || !completedCrop || !ctx) {
      setError('Unable to get image data. Please refresh and try again.');
      return;
    }
    const targetX = (image.naturalWidth * completedCrop.x) / 100;
    const targetY = (image.naturalHeight * completedCrop.y) / 100;
    const targetWidth = (image.naturalWidth * completedCrop.width) / 100;
    const targetHeight = (image.naturalHeight * completedCrop.height) / 100;

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    try {
      ctx.drawImage(image, targetX, targetY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
      const croppedImgUrl = canvas.toDataURL('image/webp', 1);
      const file = dataURLtoFile(croppedImgUrl);
      await onSubmit(file);
    } catch (e) {
      console.error(e);
      setError('An error occurred while cropping. Please refresh and try again.');
      setIsUploading(false);
      return;
    }
    handleClose();
  };

  return (
    <Dialog customContent onClose={handleClose} open title='Edit Image' type={DialogTypes.Default}>
      <ImageEditArea>
        <CropArea
          aspect={1}
          crop={crop}
          onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
          onComplete={(_pixelCrop, percentCrop) => setCompletedCrop(percentCrop)}
        >
          <ImageToCrop alt='test' onLoad={onImageLoad} ref={imageRef} src={imageSrc} />
        </CropArea>
      </ImageEditArea>
      {error && <Typography color='destructive'>{error}</Typography>}
      <ButtonsContainer>
        <Button onClick={handleClose} type={Type.SECONDARY}>
          Cancel
        </Button>
        <Button disabled={isUploading || invalidCrop} onClick={handleApply} type={Type.PRIMARY}>
          {isUploading ? 'Applying...' : 'Apply'}
        </Button>
      </ButtonsContainer>
    </Dialog>
  );
}
