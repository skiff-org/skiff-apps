const DynamicIcon = (imageURL: string, width?: number, height?: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const date = new Date();
    const dayOfMonth = date.getDate().toString();

    const canvas = document.createElement('canvas');
    canvas.width = width || 48;
    canvas.height = height || 48;

    const ctx = canvas.getContext('2d');
    const image = new Image();

    image.onload = () => {
      ctx!.drawImage(image, 0, 0, canvas.width, canvas.height);

      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillStyle = '#C279A0';
      ctx!.font = `30px Arial`;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 10;

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

export { DynamicIcon};
