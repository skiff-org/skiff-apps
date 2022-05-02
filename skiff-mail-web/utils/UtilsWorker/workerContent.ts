import {
  add as searchAdd,
  remove as searchRemove,
  search,
  setup as searchSetup,
  teardown as searchTeardown
} from '../searchUtils';

const utilsWorkerExports = {
  searchAdd,
  searchRemove,
  searchSetup,
  searchTeardown,
  search
};

export default utilsWorkerExports;
