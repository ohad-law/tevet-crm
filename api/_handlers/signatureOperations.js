import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";

const GREEN_INSTANCE = process.env.GREEN_API_INSTANCE;
const GREEN_TOKEN = process.env.GREEN_API_TOKEN;
const APP_URL = process.env.APP_URL || "https://tevet-crm.vercel.app";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function sendWA(phone, message) {
  if (!GREEN_INSTANCE || !GREEN_TOKEN) return false;
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("972")
    ? digits
    : digits.startsWith("0")
    ? "972" + digits.slice(1)
    : digits;
  const chatId = `${normalized}@c.us`;
  try {
    const r = await fetch(
      `https://api.green-api.com/waInstance${GREEN_INSTANCE}/sendMessage/${GREEN_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
      }
    );
    return r.ok;
  } catch {
    return false;
  }
}

async function getPublic(supabase, token) {
  const { data, error } = await supabase
    .from("signature_requests")
    .select("*")
    .or(`access_token.eq.${token},token.eq.${token}`)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "בקשת חתימה לא נמצאה" };
  if (data.status === "signed") return { error: "המסמך כבר נחתם" };
  if (data.status === "expired") return { error: "פג תוקף הבקשה" };

  if (data.status === "sent") {
    await supabase
      .from("signature_requests")
      .update({ status: "viewed", viewed_date: new Date().toISOString() })
      .eq("id", data.id);
  }

  return {
    request: {
      id: data.id,
      document_name: data.document_name,
      client_name: data.client_name,
      original_file_url: data.original_file_url || data.original_url,
      file_url: data.original_file_url || data.original_url,
      status: data.status,
    },
  };
}

async function sendRequest(supabase, requestId) {
  const { data: req, error } = await supabase
    .from("signature_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !req) return { error: "בקשת חתימה לא נמצאה" };

  const token = req.access_token || req.token;
  const link = `${APP_URL}/SignDocument?token=${token}`;

  let whatsappSent = false;
  let emailSent = false;

  if (req.client_phone) {
    const msg = [
      `שלום ${req.client_name},`,
      ``,
      `משרד עו"ד טבת שלח לך מסמך לחתימה דיגיטלית:`,
      `📄 ${req.document_name}`,
      ``,
      `לחתימה לחץ כאן:`,
      link,
      ``,
      `בברכה,`,
      `משרד עורכי דין טבת`,
    ].join("\n");
    whatsappSent = await sendWA(req.client_phone, msg);
  }

  await supabase
    .from("signature_requests")
    .update({ status: "sent", sent_date: new Date().toISOString() })
    .eq("id", req.id);

  return { emailSent, whatsappSent, link };
}

async function finalize(supabase, token, fieldValues) {
  const { data: req, error } = await supabase
    .from("signature_requests")
    .select("*")
    .or(`access_token.eq.${token},token.eq.${token}`)
    .maybeSingle();

  if (error || !req) return { error: "בקשת חתימה לא נמצאה" };
  if (req.status === "signed") return { error: "המסמך כבר נחתם" };

  const signatureData = fieldValues?.signature;
  let signedFileUrl = null;
  let signatureImageUrl = null;

  if (signatureData) {
    const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, "");
    const sigBuffer = Buffer.from(base64Data, "base64");
    const sigFileName = `signatures/${req.id}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(sigFileName, sigBuffer, { contentType: "image/png", upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(sigFileName);
      signatureImageUrl = urlData.publicUrl;
    }

    const originalUrl = req.original_file_url || req.original_url;
    if (originalUrl && originalUrl.toLowerCase().endsWith(".pdf")) {
      try {
        const pdfResp = await fetch(originalUrl);
        const pdfBytes = new Uint8Array(await pdfResp.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pngImage = await pdfDoc.embedPng(sigBuffer);

        const pages = pdfDoc.getPages();
        const lastPage = pages[pages.length - 1];
        const { width: pageW, height: pageH } = lastPage.getSize();

        const sigW = Math.min(pngImage.width, pageW * 0.35);
        const sigH = (pngImage.height / pngImage.width) * sigW;

        lastPage.drawImage(pngImage, {
          x: pageW * 0.1,
          y: pageH * 0.05,
          width: sigW,
          height: sigH,
        });

        const signedPdfBytes = await pdfDoc.save();
        const signedFileName = `signed/${req.id}-signed-${Date.now()}.pdf`;

        const { error: pdfUploadError } = await supabase.storage
          .from("uploads")
          .upload(signedFileName, Buffer.from(signedPdfBytes), {
            contentType: "application/pdf",
            upsert: true,
          });

        if (!pdfUploadError) {
          const { data: pdfUrlData } = supabase.storage
            .from("uploads")
            .getPublicUrl(signedFileName);
          signedFileUrl = pdfUrlData.publicUrl;
        }
      } catch (pdfErr) {
        console.error("[signatureOperations] PDF embedding failed:", pdfErr);
      }
    }

    if (!signedFileUrl) {
      signedFileUrl = signatureImageUrl;
    }
  }

  await supabase
    .from("signature_requests")
    .update({
      status: "signed",
      signed_date: new Date().toISOString(),
      signed_at: new Date().toISOString(),
      signed_file_url: signedFileUrl,
      signed_url: signedFileUrl,
      signature_image_url: signatureImageUrl,
      signature_fields: JSON.stringify(fieldValues),
    })
    .eq("id", req.id);

  return { success: true, signedFileUrl };
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { action, token, requestId, fieldValues } = req.body || {};
  const supabase = supabaseAdmin();

  try {
    let result;
    switch (action) {
      case "get-public":
        result = await getPublic(supabase, token);
        break;
      case "send":
        result = await sendRequest(supabase, requestId);
        break;
      case "finalize":
        result = await finalize(supabase, token, fieldValues);
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    if (result.error) {
      return res.status(200).json({ data: { error: result.error } });
    }
    return res.status(200).json({ data: result });
  } catch (err) {
    console.error("[signatureOperations]", err);
    return res.status(200).json({ data: { error: err.message } });
  }
}
