import { createClient } from "@supabase/supabase-js";
import { IncomingForm } from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const uploaded = files.file?.[0] || files.file;
    if (!uploaded) return res.status(400).json({ error: "No file uploaded" });

    const originalName = uploaded.originalFilename || uploaded.newFilename || "file";
    const ext = originalName.split(".").pop() || "bin";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const fileBuffer = fs.readFileSync(uploaded.filepath);

    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(path, fileBuffer, {
        contentType: uploaded.mimetype || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return res.status(500).json({ error: error.message });
    }

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);

    return res.status(200).json({ file_url: urlData.publicUrl });
  } catch (err) {
    console.error("upload-file error:", err);
    return res.status(500).json({ error: err.message });
  }
}
