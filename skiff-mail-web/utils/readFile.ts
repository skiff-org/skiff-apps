interface ReadResolveValue {
  file: File;
  content?: string;
}

interface ReadRejectValue {
  file: File;
  error: any;
}

export const readFile = (file: File, progress?: (event: ProgressEvent<FileReader>) => void) =>
  new Promise((resolve: (value: ReadResolveValue) => void, reject: (value: ReadRejectValue) => void) => {
    const reader = new FileReader();

    reader.addEventListener('progress', (event) => {
      progress?.(event);
    });

    reader.addEventListener('load', () => {
      const result = reader.result as ArrayBuffer;
      const resultStr = Buffer.from(result).toString('base64');
      resolve({ content: resultStr, file });
    });

    reader.addEventListener('error', (error) => {
      reject({ file, error });
    });

    reader.addEventListener('abort', (error) => {
      reject({ file, error });
    });

    reader.readAsArrayBuffer(file);
  });
