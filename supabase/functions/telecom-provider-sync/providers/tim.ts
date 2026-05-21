import { TelecomProvider, TelecomResponse } from "../adapter.ts";

export class TimProvider implements TelecomProvider {
  async activateLine(msisdn: string): Promise<TelecomResponse> {
    console.log(`[TIM] Activating line: ${msisdn}`);
    await new Promise(r => setTimeout(r, 500));
    return { success: true, status: 'active', message: 'Ativado via TIM Empresas' };
  }

  async suspendLine(msisdn: string): Promise<TelecomResponse> {
    console.log(`[TIM] Suspending line: ${msisdn}`);
    await new Promise(r => setTimeout(r, 500));
    return { success: true, status: 'suspended', message: 'Suspenso via TIM Empresas' };
  }

  async reactivateLine(msisdn: string): Promise<TelecomResponse> {
    console.log(`[TIM] Reactivating line: ${msisdn}`);
    await new Promise(r => setTimeout(r, 500));
    return { success: true, status: 'active', message: 'Reativado via TIM Empresas' };
  }

  async getLineStatus(msisdn: string): Promise<TelecomResponse> {
    console.log(`[TIM] Checking status: ${msisdn}`);
    await new Promise(r => setTimeout(r, 300));
    return { success: true, status: 'active' };
  }
}
