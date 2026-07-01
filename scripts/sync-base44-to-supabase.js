/**
 * Smart sync: BASE44 → Supabase
 * Matches existing records by business keys, inserts only missing ones.
 * Foreign keys are resolved through the mapping.
 * Safe: inserts only, never deletes or overwrites existing data.
 *
 * Usage: node scripts/sync-base44-to-supabase.js
 */

import crypto from "crypto";

const BASE44_APP = "68dafceada48410b1d774f3f";
const BASE44_KEY = "a68fe27812194283b5c153f17aace541";
const SUPA_URL = "https://ywfyzqkoafldccdevsak.supabase.co";
const SUPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Znl6cWtvYWZsZGNjZGV2c2FrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkwNzEyMSwiZXhwIjoyMDk1NDgzMTIxfQ.wqBm5tu5kD_suDt4jXab4ghafkTU9UyLNZlnmGsEZ2k";

const idMap = {};

function newUUID() {
  return crypto.randomUUID();
}

function resolveId(base44Id) {
  if (!base44Id) return null;
  return idMap[base44Id] || null;
}

function mapPriority(p) {
  const m = {
    high: "גבוה",
    medium: "רגיל",
    low: "רגיל",
    urgent: "דחוף",
    "גבוה": "גבוה",
    "רגיל": "רגיל",
    "דחוף": "דחוף",
  };
  return m[(p || "").toLowerCase()] || "רגיל";
}

function cleanDate(val) {
  if (!val || val === "null" || val === "undefined") return null;
  return val;
}

function normalizePhone(p) {
  if (!p) return "";
  const d = p.replace(/\D/g, "");
  if (d.startsWith("972")) return d;
  if (d.startsWith("0")) return "972" + d.slice(1);
  return d;
}

async function fetchBase44(entity) {
  const res = await fetch(
    `https://app.base44.com/api/apps/${BASE44_APP}/entities/${entity}`,
    { headers: { Authorization: `Bearer ${BASE44_KEY}` } }
  );
  if (!res.ok) throw new Error(`BASE44 ${entity}: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchSupa(table, select = "*") {
  const all = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=${limit}&offset=${offset}`,
      {
        headers: {
          apikey: SUPA_KEY,
          Authorization: `Bearer ${SUPA_KEY}`,
        },
      }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

async function supaInsert(table, rows) {
  if (!rows.length) return 0;
  const BATCH = 30;
  let ok = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(batch),
    });
    if (res.ok) {
      ok += batch.length;
    } else {
      const err = await res.text();
      console.error(`  [${table}] insert error (batch ${i}):`, err.slice(0, 400));
    }
  }
  return ok;
}

async function supaUpdate(table, id, data) {
  const res = await fetch(
    `${SUPA_URL}/rest/v1/${table}?id=eq.${id}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(data),
    }
  );
  return res.ok;
}

// ─── Step 1: Clients ───
async function syncClients() {
  console.log("\n--- Clients ---");
  const b44 = await fetchBase44("Client");
  const supa = await fetchSupa("clients", "id,full_name,phone,id_number");

  const supaByPhone = {};
  const supaByName = {};
  for (const s of supa) {
    if (s.phone) supaByPhone[normalizePhone(s.phone)] = s.id;
    if (s.full_name) {
      const key = s.full_name.trim().toLowerCase();
      if (!supaByName[key]) supaByName[key] = s.id;
    }
  }

  let matched = 0;
  let toInsert = [];

  for (const b of b44) {
    const phone = normalizePhone(b.phone);
    const nameKey = (b.full_name || "").trim().toLowerCase();
    let supaId = null;

    if (phone && supaByPhone[phone]) {
      supaId = supaByPhone[phone];
      matched++;
    } else if (nameKey && supaByName[nameKey]) {
      supaId = supaByName[nameKey];
      matched++;
    }

    if (supaId) {
      idMap[b.id] = supaId;
    } else {
      const uuid = newUUID();
      idMap[b.id] = uuid;
      toInsert.push({
        id: uuid,
        full_name: b.full_name || null,
        id_number: b.id_number || null,
        phone: b.phone || null,
        email: b.email || null,
        address: b.address || null,
        status: b.status || "פעיל",
        classification: b.classification || null,
        join_date: b.join_date || null,
        created_at: b.created_date || new Date().toISOString(),
        updated_at: b.updated_date || new Date().toISOString(),
      });
    }
  }

  const inserted = await supaInsert("clients", toInsert);
  console.log(
    `  BASE44: ${b44.length} | Supabase: ${supa.length} | Matched: ${matched} | New: ${toInsert.length} | Inserted: ${inserted}`
  );
}

// ─── Step 2: Cases ───
async function syncCases() {
  console.log("\n--- Cases ---");
  const b44 = await fetchBase44("Case");
  const supa = await fetchSupa("cases", "id,case_number,case_name,client_id");

  const supaByCaseNum = {};
  const supaByName = {};
  for (const s of supa) {
    if (s.case_number) supaByCaseNum[s.case_number] = s.id;
    if (s.case_name) {
      const key = s.case_name.trim().toLowerCase();
      if (!supaByName[key]) supaByName[key] = s.id;
    }
  }

  let matched = 0;
  let toInsert = [];

  for (const b of b44) {
    let supaId = null;

    if (b.case_number && supaByCaseNum[b.case_number]) {
      supaId = supaByCaseNum[b.case_number];
      matched++;
    } else if (b.case_name) {
      const key = b.case_name.trim().toLowerCase();
      if (supaByName[key]) {
        supaId = supaByName[key];
        matched++;
      }
    }

    if (supaId) {
      idMap[b.id] = supaId;
    } else {
      const uuid = newUUID();
      idMap[b.id] = uuid;
      toInsert.push({
        id: uuid,
        case_number: b.case_number || null,
        case_name: b.case_name || null,
        client_id: resolveId(b.client_id),
        case_type: b.case_type || null,
        status: b.status || null,
        parties: b.parties || null,
        case_description: b.case_description || null,
        case_detailed_description: b.case_detailed_description || null,
        defendant_name: b.defendant_name || null,
        defendant_id: b.defendant_id || null,
        defendant_phone: b.defendant_phone || null,
        defendant_address: b.defendant_address || null,
        defendant_contact: b.defendant_contact || null,
        value: b.value || null,
        potential_fee: b.potential_fee || null,
        open_date: b.open_date || null,
        target_close_date: b.target_close_date || null,
        last_status_change_date: b.last_status_change_date || null,
        assigned_to: b.assigned_to || null,
        net_hamishpat_number: b.net_hamishpat_number || null,
        fee_status: b.fee_status || null,
        fee_amount: b.fee_amount || null,
        fee_paid_date: b.fee_paid_date || null,
        fee_receipt: b.fee_receipt || null,
        fee_refund_date: b.fee_refund_date || null,
        fee_refund_amount: b.fee_refund_amount || null,
        fee_refund_receipt: b.fee_refund_receipt || null,
        fee_notes: b.fee_notes || null,
        google_drive_folder_id: b.google_drive_folder_id || null,
        folder_id: b.folder_id || null,
        subfolder_id: b.subfolder_id || null,
        employment_start_date: b.employment_start_date || null,
        employment_end_date: b.employment_end_date || null,
        created_at: b.created_date || new Date().toISOString(),
        updated_at: b.updated_date || new Date().toISOString(),
      });
    }
  }

  const inserted = await supaInsert("cases", toInsert);
  console.log(
    `  BASE44: ${b44.length} | Supabase: ${supa.length} | Matched: ${matched} | New: ${toInsert.length} | Inserted: ${inserted}`
  );
}

// ─── Step 3: Tasks ───
async function syncTasks() {
  console.log("\n--- Tasks ---");
  const b44 = await fetchBase44("Task");
  const supa = await fetchSupa("tasks", "id,description,case_id");

  const supaByDesc = {};
  for (const s of supa) {
    if (s.description && s.case_id) {
      const key = (s.description || "").trim().slice(0, 80) + "|" + s.case_id;
      supaByDesc[key] = s.id;
    }
  }

  let matched = 0;
  let toInsert = [];

  for (const b of b44) {
    const caseUUID = resolveId(b.case_id);
    const key = (b.description || "").trim().slice(0, 80) + "|" + caseUUID;
    let supaId = supaByDesc[key];

    if (supaId) {
      idMap[b.id] = supaId;
      matched++;
    } else {
      const uuid = newUUID();
      idMap[b.id] = uuid;
      toInsert.push({
        id: uuid,
        description: b.description || null,
        case_id: caseUUID,
        assigned_to: b.assigned_to || null,
        status: b.status || "todo",
        priority: mapPriority(b.priority),
        due_date: b.due_date || null,
        task_type: b.task_type || null,
        auto_deadline_info: b.auto_deadline_info || null,
        lead_id: resolveId(b.lead_id),
        created_at: b.created_date || new Date().toISOString(),
        updated_at: b.updated_date || new Date().toISOString(),
      });
    }
  }

  const inserted = await supaInsert("tasks", toInsert);
  console.log(
    `  BASE44: ${b44.length} | Supabase: ${supa.length} | Matched: ${matched} | New: ${toInsert.length} | Inserted: ${inserted}`
  );
}

// ─── Step 4: Signature Requests ───
async function syncSignatureRequests() {
  console.log("\n--- SignatureRequests ---");
  const b44 = await fetchBase44("SignatureRequest");
  const supa = await fetchSupa("signature_requests", "id,access_token,token,document_name,client_name");

  const supaByToken = {};
  const supaByNameDoc = {};
  for (const s of supa) {
    if (s.access_token) supaByToken[s.access_token] = s.id;
    if (s.token) supaByToken[s.token] = s.id;
    const key = (s.client_name || "") + "|" + (s.document_name || "");
    if (!supaByNameDoc[key]) supaByNameDoc[key] = s.id;
  }

  let matched = 0;
  let toInsert = [];

  for (const b of b44) {
    let supaId = null;
    if (b.access_token && supaByToken[b.access_token]) {
      supaId = supaByToken[b.access_token];
      matched++;
    } else {
      const key = (b.client_name || "") + "|" + (b.document_name || "");
      if (supaByNameDoc[key]) {
        supaId = supaByNameDoc[key];
        matched++;
      }
    }

    if (supaId) {
      idMap[b.id] = supaId;
    } else {
      const uuid = newUUID();
      idMap[b.id] = uuid;
      toInsert.push({
        id: uuid,
        case_id: resolveId(b.case_id),
        client_id: resolveId(b.client_id),
        document_name: b.document_name || null,
        original_file_url: b.original_file_url || null,
        original_url: b.original_file_url || null,
        signed_file_url: b.signed_file_url || null,
        signed_url: b.signed_file_url || null,
        access_token: b.access_token || null,
        token: b.access_token || null,
        status: b.status || "draft",
        client_name: b.client_name || null,
        client_email: b.client_email || null,
        client_phone: b.client_phone || null,
        message: b.message || null,
        sent_date: b.sent_date || null,
        viewed_date: b.viewed_date || null,
        signed_date: b.signed_date || null,
        signed_at: b.signed_date || null,
        signature_image_url: b.signature_image_url || null,
        created_at: b.created_date || new Date().toISOString(),
      });
    }
  }

  const inserted = await supaInsert("signature_requests", toInsert);
  console.log(
    `  BASE44: ${b44.length} | Supabase: ${supa.length} | Matched: ${matched} | New: ${toInsert.length} | Inserted: ${inserted}`
  );
}

// ─── Step 5: Signature Fields ───
async function syncSignatureFields() {
  console.log("\n--- SignatureFields ---");
  const b44 = await fetchBase44("SignatureField");
  const supa = await fetchSupa("signature_fields", "id,request_id,page,x,y");

  const supaByKey = {};
  for (const s of supa) {
    const key = `${s.request_id}|${s.page}|${s.x}|${s.y}`;
    supaByKey[key] = s.id;
  }

  let matched = 0;
  let toInsert = [];

  for (const b of b44) {
    const reqUUID = resolveId(b.request_id);
    const key = `${reqUUID}|${b.page}|${b.x}|${b.y}`;
    let supaId = supaByKey[key];

    if (supaId) {
      idMap[b.id] = supaId;
      matched++;
    } else {
      const uuid = newUUID();
      idMap[b.id] = uuid;
      toInsert.push({
        id: uuid,
        request_id: reqUUID,
        type: b.type || "signature",
        page: b.page || 1,
        x: b.x ?? 0,
        y: b.y ?? 0,
        width: b.width ?? 20,
        height: b.height ?? 5,
        label: b.label || null,
        required: b.required ?? true,
        value: b.value || null,
        created_at: b.created_date || new Date().toISOString(),
      });
    }
  }

  const inserted = await supaInsert("signature_fields", toInsert);
  console.log(
    `  BASE44: ${b44.length} | Supabase: ${supa.length} | Matched: ${matched} | New: ${toInsert.length} | Inserted: ${inserted}`
  );
}

// ─── Step 6: Invoices ───
async function syncInvoices() {
  console.log("\n--- Invoices ---");
  const b44 = await fetchBase44("Invoice");
  if (!b44.length) {
    console.log("  No invoices in BASE44");
    return;
  }

  const toInsert = b44.map((b) => ({
    id: newUUID(),
    email_message_id: b.email_message_id || null,
    invoice_number: b.invoice_number || null,
    invoice_type: b.invoice_type || null,
    vendor_name: b.vendor_name || null,
    vendor_id: b.vendor_id || null,
    amount: b.amount || null,
    amount_before_vat: b.amount_before_vat || null,
    vat_amount: b.vat_amount || null,
    invoice_date: cleanDate(b.invoice_date),
    email_date: cleanDate(b.email_date),
    email_subject: b.email_subject || null,
    email_sender: b.email_sender || null,
    file_url: b.file_url || null,
    file_name: b.file_name || null,
    status: b.status || "חדש",
    category: b.category || null,
    notes: b.notes || null,
    linked_expense_id: b.linked_expense_id || null,
    ai_extracted: b.ai_extracted ?? false,
    ai_confidence: b.ai_confidence || null,
    created_at: b.created_date || new Date().toISOString(),
  }));

  const inserted = await supaInsert("invoices", toInsert);
  console.log(`  BASE44: ${b44.length} | Inserted: ${inserted}`);
}

// ─── Step 7: WorkLogs ───
async function syncWorkLogs() {
  console.log("\n--- WorkLogs ---");
  const b44 = await fetchBase44("WorkLog");
  if (!b44.length) {
    console.log("  No work logs in BASE44");
    return;
  }

  const toInsert = b44.map((b) => ({
    id: newUUID(),
    case_id: resolveId(b.case_id),
    user_email: b.user_email || b.created_by || null,
    user_name: b.user_name || null,
    activity_type: b.activity_type || null,
    activity_description: b.activity_description || b.description || null,
    start_time: b.start_time || null,
    end_time: b.end_time || null,
    duration_minutes: b.duration_minutes || null,
    is_active: b.is_active ?? false,
    notes: b.notes || null,
    created_at: b.created_date || new Date().toISOString(),
  }));

  const inserted = await supaInsert("work_logs", toInsert);
  console.log(`  BASE44: ${b44.length} | Inserted: ${inserted}`);
}

// ─── Step 8: LeadTalush ───
async function syncLeadTalush() {
  console.log("\n--- LeadTalush ---");
  const b44 = await fetchBase44("LeadTalush");
  const supa = await fetchSupa("leads_talush", "id,full_name,phone");

  const supaByPhone = {};
  for (const s of supa) {
    if (s.phone) supaByPhone[normalizePhone(s.phone)] = s.id;
  }

  let matched = 0;
  let toInsert = [];

  for (const b of b44) {
    const phone = normalizePhone(b.phone);
    if (phone && supaByPhone[phone]) {
      idMap[b.id] = supaByPhone[phone];
      matched++;
    } else {
      const uuid = newUUID();
      idMap[b.id] = uuid;
      toInsert.push({
        id: uuid,
        full_name: b.full_name || null,
        phone: b.phone || null,
        source: b.source || null,
        status: b.status || "חדש",
        notes: b.notes || null,
        followup_stage: b.followup_stage ?? 0,
        followup_next_at: b.followup_next_at || null,
        followup_stopped: b.followup_stopped ?? false,
        followup_opted_out: b.followup_opted_out ?? false,
        created_at: b.created_date || new Date().toISOString(),
      });
    }
  }

  const inserted = await supaInsert("leads_talush", toInsert);
  console.log(
    `  BASE44: ${b44.length} | Supabase: ${supa.length} | Matched: ${matched} | New: ${toInsert.length} | Inserted: ${inserted}`
  );
}

// ─── Step 9: Attendance ───
async function syncAttendance() {
  console.log("\n--- Attendance ---");
  const b44 = await fetchBase44("Attendance");
  const supa = await fetchSupa("attendance", "id,date,user_email");

  const supaByKey = {};
  for (const s of supa) {
    const key = `${s.date}|${s.user_email}`;
    supaByKey[key] = s.id;
  }

  let matched = 0;
  let toInsert = [];

  for (const b of b44) {
    const key = `${b.date}|${b.user_email || b.created_by}`;
    if (supaByKey[key]) {
      idMap[b.id] = supaByKey[key];
      matched++;
    } else {
      const uuid = newUUID();
      idMap[b.id] = uuid;
      toInsert.push({
        id: uuid,
        user_email: b.user_email || b.created_by || null,
        user_name: b.user_name || null,
        date: b.date || null,
        check_in: b.check_in || null,
        check_out: b.check_out || null,
        total_hours: b.total_hours || null,
        status: b.status || null,
        notes: b.notes || null,
        created_at: b.created_date || new Date().toISOString(),
      });
    }
  }

  const inserted = await supaInsert("attendance", toInsert);
  console.log(
    `  BASE44: ${b44.length} | Supabase: ${supa.length} | Matched: ${matched} | New: ${toInsert.length} | Inserted: ${inserted}`
  );
}

async function main() {
  console.log("=== BASE44 → Supabase Smart Sync ===");
  console.log(`Started: ${new Date().toISOString()}`);

  await syncClients();
  await syncCases();
  await syncTasks();
  await syncSignatureRequests();
  await syncSignatureFields();
  await syncInvoices();
  await syncWorkLogs();
  await syncLeadTalush();
  await syncAttendance();

  console.log(`\n=== Mapping stats: ${Object.keys(idMap).length} BASE44 IDs mapped ===`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch(console.error);
