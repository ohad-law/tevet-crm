import { base44 } from '@/api/base44Client';

export async function generateViralScript(args) {
  return base44.functions.invoke('generateViralScript', args);
}
