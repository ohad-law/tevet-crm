const handlers = {
  sendWhatsApp: () => import('../_handlers/sendWhatsApp.js'),
  facebookAdsFetch: () => import('../_handlers/facebookAdsFetch.js'),
  facebookAdsManage: () => import('../_handlers/facebookAdsManage.js'),
  fetchTikTokStats: () => import('../_handlers/fetchTikTokStats.js'),
  'invoke-llm': () => import('../_handlers/invoke-llm.js'),
  generateLegalDocument: () => import('../_handlers/generateLegalDocument.js'),
  facebookAdsAI: () => import('../_handlers/facebookAdsAI.js'),
  generateViralScript: () => import('../_handlers/generateViralScript.js'),
  signatureOperations: () => import('../_handlers/signatureOperations.js'),
  googleDriveV2: () => import('../_handlers/googleDriveV2.js'),
  googleCalendar: () => import('../_handlers/googleCalendar.js'),
};

export default async function handler(req, res) {
  const { name } = req.query;

  const loader = handlers[name];
  if (!loader) {
    return res.status(404).json({ error: `Unknown function: ${name}` });
  }

  const mod = await loader();
  return mod.default(req, res);
}
