import { expose } from 'comlink';

import utilsWorkerExports from './workerContent';

expose(utilsWorkerExports);
