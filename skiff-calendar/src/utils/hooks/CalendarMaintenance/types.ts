import { ToastProps } from 'nightwatch-ui';

import { DecryptedEventModel } from '../../../storage/models/event/DecryptedEventModel';

export type MaintenanceAction = {
  action: (events: DecryptedEventModel[]) => Promise<boolean> | boolean;
  id: string;
  toast?: ToastProps;
};
