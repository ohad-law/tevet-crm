/**
 * POST /api/googleDriveV2
 * Google Drive operations: check_connection, list_files, create_folder, upload_file
 */
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getAccessToken(supabase) {
  const { data } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "google_oauth_tokens")
    .maybeSingle();

  if (!data?.setting_value) return null;

  const tokens = typeof data.setting_value === "string" ? JSON.parse(data.setting_value) : data.setting_value;

  if (Date.now() < tokens.expiry_date - 60000) {
    return tokens.access_token;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const newTokens = await res.json();
  if (newTokens.error) return null;

  const updated = {
    access_token: newTokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: Date.now() + newTokens.expires_in * 1000,
  };

  await supabase
    .from("system_settings")
    .update({ setting_value: JSON.stringify(updated), updated_at: new Date().toISOString() })
    .eq("setting_key", "google_oauth_tokens");

  return newTokens.access_token;
}

async function driveApi(accessToken, path, options = {}) {
  const base = "https://www.googleapis.com/drive/v3";
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  return res.json();
}

async function checkConnection(supabase) {
  const token = await getAccessToken(supabase);
  if (!token) return { connected: false };

  const res = await driveApi(token, "/about?fields=user");
  return { connected: !!res.user, email: res.user?.emailAddress };
}

async function listFiles(supabase, folderId) {
  const token = await getAccessToken(supabase);
  if (!token) return { error: "Not connected" };

  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent("files(id,name,mimeType,webViewLink,iconLink,modifiedTime,size)");
  const data = await driveApi(token, `/files?q=${q}&fields=${fields}&orderBy=modifiedTime+desc&pageSize=100`);
  return { files: data.files || [] };
}

async function createFolder(supabase, parentId, folderName) {
  const token = await getAccessToken(supabase);
  if (!token) return { error: "Not connected" };

  const data = await driveApi(token, "/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  return { folderId: data.id, name: data.name, webViewLink: data.webViewLink };
}

async function listFolders(supabase, parentId) {
  const token = await getAccessToken(supabase);
  if (!token) return { error: "Not connected" };

  const q = encodeURIComponent(
    `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const fields = encodeURIComponent("files(id,name,webViewLink)");
  const data = await driveApi(token, `/files?q=${q}&fields=${fields}&orderBy=name&pageSize=200`);
  return { folders: data.files || [] };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, folderId, parentId, folderName } = req.body || {};
  const supabase = supabaseAdmin();

  try {
    let result;
    switch (action) {
      case "check_connection":
        result = await checkConnection(supabase);
        break;
      case "list_files":
        result = await listFiles(supabase, folderId);
        break;
      case "create_folder":
        result = await createFolder(supabase, parentId, folderName);
        break;
      case "list_folders":
        result = await listFolders(supabase, parentId || folderId);
        break;
      default:
        return res.status(400).json({ data: { error: `Unknown action: ${action}` } });
    }
    return res.status(200).json({ data: result });
  } catch (err) {
    console.error("[googleDriveV2]", err);
    return res.status(200).json({ data: { error: err.message } });
  }
}
