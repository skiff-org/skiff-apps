import { FileImportFailures, handleFileUploadErrors } from '../src';

describe('handleFileUploadErrors', () => {
  let mockSetPaywallOpen: () => void;
  let mockEnqueueToast: () => void;
  beforeEach(() => {
    mockSetPaywallOpen = jest.fn();
    mockEnqueueToast = jest.fn();
  });
  it('opens paywall if not upgraded', () => {
    const fileUploadErrors = [{ code: FileImportFailures.TOO_LARGE, message: 'message' }];
    const blob = new Blob([''], { type: 'application/octet-stream' });
    handleFileUploadErrors(fileUploadErrors, mockEnqueueToast, <File>blob, mockSetPaywallOpen);
    expect(mockSetPaywallOpen).toHaveBeenLastCalledWith(true);
    expect(mockEnqueueToast).not.toHaveBeenCalled();
  });
  it('opens toast if bad file type', () => {
    const fileUploadErrors = [{ code: FileImportFailures.INVALID_TYPE, message: 'message' }];
    const blob = new Blob([''], { type: 'application/octet-stream' });
    handleFileUploadErrors(fileUploadErrors, mockEnqueueToast, <File>blob, mockSetPaywallOpen);
    expect(mockSetPaywallOpen).not.toHaveBeenCalled();
    expect(mockEnqueueToast).toHaveBeenLastCalledWith({
      title: 'Import failed',
      body: 'undefined types are not accepted.'
    });
  });
});
