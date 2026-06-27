import { base44 } from '@/api/base44Client';

export async function facebookAdsAI(args) {
  return base44.functions.invoke('facebookAdsAI', args);
}
