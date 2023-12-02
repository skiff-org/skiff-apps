import { config, enums } from 'openpgp';

config.preferredCompressionAlgorithm = enums.compression.zlib;

export * from './keyManagement';
export * from './encrypt';
