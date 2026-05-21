export type TelecomStatus = 'pending_activation' | 'active' | 'suspended' | 'cancelled' | 'blocked' | 'inactive';

export interface TelecomResponse {
  success: boolean;
  status?: TelecomStatus;
  message?: string;
  provider_data?: any;
}

export interface TelecomProvider {
  activateLine(msisdn: string): Promise<TelecomResponse>;
  suspendLine(msisdn: string): Promise<TelecomResponse>;
  reactivateLine(msisdn: string): Promise<TelecomResponse>;
  getLineStatus(msisdn: string): Promise<TelecomResponse>;
}

import { VivoProvider } from "./providers/vivo.ts";
import { ClaroProvider } from "./providers/claro.ts";
import { TimProvider } from "./providers/tim.ts";

export function getProvider(name: string): TelecomProvider {
  const provider = name.toLowerCase();
  if (provider.includes('vivo')) return new VivoProvider();
  if (provider.includes('claro')) return new ClaroProvider();
  if (provider.includes('tim')) return new TimProvider();
  
  throw new Error(`Provider ${name} not supported`);
}
