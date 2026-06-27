import { base44 } from '@/api/base44Client';

export async function generateLegalDocument(args) {
  return base44.functions.invoke('generateLegalDocument', args);
}
