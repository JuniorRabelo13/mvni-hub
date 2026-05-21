import { TelecomProvider, TelecomResponse } from "../adapter.ts";

export class VivoProvider implements TelecomProvider {
  async activateLine(msisdn: string): Promise<TelecomResponse> {
    console.log(`[VIVO] Activating line: ${msisdn}`);
    // Simulação de delay de rede
    await new Promise(r => setTimeout(r, 500));
    return { success: true, status: 'active', message: 'Ativado via Vivo Empresas' };
  }

  async suspendLine(msisdn: string): Promise<TelecomResponse> {
    console.log(`[VIVO] Suspending line: ${msisdn}`);
    await new Promise(r => setTimeout(r, 500));
    return { success: true, status: 'suspended', message: 'Suspenso via Vivo Empresas' };
  }

  async reactivateLine(msisdn: string): Promise<TelecomResponse> {
    console.log(`[VIVO] Reactivating line: ${msisdn}`);
    await new Promise(r => setTimeout(r, 500));
    return { success: true, status: 'active', message: 'Reativado via Vivo Empresas' };
  }

  async getLineStatus(msisdn: string): Promise<TelecomResponse> {
    console.log(`[VIVO] Checking status: ${msisdn}`);
    await new Promise(r => setTimeout(r, 300));
    return { success: true, status: 'active' };
  }
}
