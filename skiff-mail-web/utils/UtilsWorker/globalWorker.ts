import { RemoteObject, wrap } from 'comlink';

import utilsWorkerExports from './workerContent';

let globalWorker: RemoteObject<typeof utilsWorkerExports>;

/**
 * This return a shared instance of a UtilsWorker usage anywhere in the app
 * The worker is lazily created on first usage
 */
const getGlobalWorker = () => {
  // Create worker and wrap with comlink
  if (!globalWorker) {
    if (typeof Worker === 'undefined') {
      // if there is no worker implementation (ie jest test), we export the same methods wrapped inside a Promise
      globalWorker = Object.fromEntries(
        Object.entries(utilsWorkerExports).map(([exportName, func]) => [
          exportName,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          (...args: Parameters<typeof func>) => new Promise((resolve) => resolve(func(...args)))
        ])
      ) as RemoteObject<typeof utilsWorkerExports>;
    } else {
      console.log('Creating global utils worker!');
      const worker = new Worker(new URL('./index', import.meta.url), {
        name: 'utilsWorker',
        type: 'module'
      });
      globalWorker = wrap<typeof utilsWorkerExports>(worker);
    }
  }

  return globalWorker;
};
export default getGlobalWorker;
