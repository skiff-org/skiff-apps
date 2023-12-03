const DynamicIcon = (imageURL: string, showMonth = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    const date = new Date();
    const dayOfMonth = date.getDate().toString();
    const month = date.toLocaleString('default', { month: 'short' });

    const canvas = document.createElement('canvas');
    canvas.width = 260;
    canvas.height = 260;

    const ctx = canvas.getContext('2d');
    const image = new Image();

    image.onload = () => {
      ctx!.drawImage(image, 0, 0, canvas.width, canvas.height);

      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      if (showMonth) {
        ctx!.fillStyle = '#FFFFFF';
        ctx!.font = `55px Arial`;
        ctx!.fillText(month, canvas.width / 2, 42);
      }

      ctx!.fillStyle = '#C279A0';
      ctx!.font = `Bold 175px Arial`;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 44;

      ctx!.fillText(dayOfMonth, centerX, centerY);
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };

    image.onerror = (err) => {
      reject(err);
    };

    image.src = imageURL;
  });
};

export { DynamicIcon };
