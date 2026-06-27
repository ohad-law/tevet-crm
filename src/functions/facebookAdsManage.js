import { base44 } from '@/api/base44Client';

export async function facebookAdsManage(args) {
  return base44.functions.invoke('facebookAdsManage', args);
}
