import { TelecomProvider, TelecomResponse } from "../adapter.ts";

export class ClaroProvider implements TelecomProvider {
  async activateLine(msisdn: string): Promise<TelecomResponse> {
    console.log(`[CLARO] Activating line: ${msisdn}`);
    await new Promise(r => setTimeout(r, 500));
    return { success: true, status: 'active', message: 'Ativado via Claro Empresas' };
  }

  async suspendLine(msisdn: string): Promise<TelecomResponse> {
    console.log(`[CLARO] Suspending line: ${msisdn}`);
    await new Promise(r => setTimeout(r, 500));
    return { success: true, status: 'suspended', message: 'Suspenso via Claro Empresas' };
  }

  async reactivateLine(msisdn: string): Promise<TelecomResponse> {
    console.log(`[CLARO] Reactivating line: ${msisdn}`);
    await new Promise(r => setTimeout(r, 500));
    return { success: true, status: 'active', message: 'Reativado via Claro Empresas' };
  }

  async getLineStatus(msisdn: string): Promise<TelecomResponse> {
    console.log(`[CLARO] Checking status: ${msisdn}`);
    await new Promise(r => setTimeout(r, 300));
    return { success: true, status: 'active' };
  }
}
