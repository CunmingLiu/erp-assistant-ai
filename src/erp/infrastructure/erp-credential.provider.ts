import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../common/request-context.js';
import { AppConfigService } from '../../config/app-config.service.js';

export const ERP_CREDENTIAL_PROVIDER = Symbol('ERP_CREDENTIAL_PROVIDER');

export interface ErpCredentialProvider {
  getCredential(context: RequestContext): Promise<{ accessToken: string; tenantId?: string }>;
}

@Injectable()
export class EnvironmentErpCredentialProvider implements ErpCredentialProvider {
  constructor(private readonly config: AppConfigService) {}

  async getCredential(_context: RequestContext): Promise<{ accessToken: string }> {
    return { accessToken: this.config.getErpConfig().accessToken };
  }
}
