// get tokens for Zendesk upload
export async function getFeedbackTokens(supportingFiles: File[]) {
  const zendeskUploadTokens: Array<string> = [];
  const res = await Promise.allSettled(
    supportingFiles?.map(async (file) => {
      const resp = (await (
        await fetch(`https://skiff.zendesk.com/api/v2/uploads?filename=${file.name}`, {
          method: 'POST',
          body: file
        })
      ).json()) as { upload: { token: string } };
      if (resp?.upload?.token) {
        return resp.upload.token;
      }
      throw new Error('Failed to receive upload token from Zendesk');
    })
  );
  res.forEach((r) => {
    if (r.status === 'fulfilled') {
      zendeskUploadTokens.push(r.value);
    }
  });
  return zendeskUploadTokens;
}
