import { base44 } from '@/api/base44Client';

export async function facebookAdsFetch(args) {
  return base44.functions.invoke('facebookAdsFetch', args);
}
