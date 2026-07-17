import { Module } from '@nestjs/common';
import { ERP_READ_GATEWAY } from './domain/erp-read.gateway.js';
import { ErpController } from './erp.controller.js';
import { ERP_CREDENTIAL_PROVIDER, EnvironmentErpCredentialProvider } from './infrastructure/erp-credential.provider.js';
import { ErpHttpClient } from './infrastructure/erp-http.client.js';

@Module({
  controllers: [ErpController],
  providers: [
    EnvironmentErpCredentialProvider,
    ErpHttpClient,
    { provide: ERP_CREDENTIAL_PROVIDER, useExisting: EnvironmentErpCredentialProvider },
    { provide: ERP_READ_GATEWAY, useExisting: ErpHttpClient }
  ],
  exports: [ERP_READ_GATEWAY]
})
export class ErpModule {}
