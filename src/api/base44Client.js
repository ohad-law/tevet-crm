import { supabase } from './supabaseClient';

const ENTITY_TABLE_MAP = {
  Case: 'cases',
  Client: 'clients',
  Lead: 'leads',
  Task: 'tasks',
  Attendance: 'attendance',
  WorkLog: 'work_logs',
  CaseMilestone: 'case_milestones',
  SystemSettings: 'system_settings',
  User: 'user_permissions',
  UserPermission: 'user_permissions',
  SignatureRequest: 'signature_requests',
  SignatureField: 'signature_fields',
  Income: 'income',
  Expense: 'expenses',
  MarketingCampaign: 'marketing_campaigns',
  WorkerIntakeForm: 'worker_intake_forms',
  Folder: 'folders',
  Message: 'messages',
  NotificationLog: 'notification_log',
  CaseDocument: 'case_documents',
  Invoice: 'invoices',
  // Dropped entities — stubs that return empty arrays
  LeadTalush: null,
  LeadShatafYaniv: null,
  NetHamishpatEmail: null,
  VideoScript: null,
  InternalMessage: null,
  SocialMediaAccount: null,
  SocialMediaPost: null,
  WebsiteAnalytics: null,
  ContentArticle: null,
  ContentIdea: null,
};

// Cases have nested arrays in BASE44 that are separate tables in Supabase
const CASE_NESTED_TABLES = {
  hearings: 'hearings',
  documents: 'case_documents',
  timeline: 'case_timeline',
};

// BASE44 uses different column names than Supabase in some places
const COLUMN_MAP = {
  created_date: 'created_at',
  updated_date: 'updated_at',
  date: 'created_at',
};

function mapColumn(col) {
  return COLUMN_MAP[col] || col;
}

function parseSortParam(sortStr) {
  if (!sortStr || typeof sortStr !== 'string') return null;
  const desc = sortStr.startsWith('-');
  const column = desc ? sortStr.slice(1) : sortStr;
  return { column: mapColumn(column), ascending: !desc };
}

async function assembleNestedForCases(cases) {
  if (!cases || cases.length === 0) return cases;
  const caseIds = cases.map(c => c.id);

  const nestedPromises = Object.entries(CASE_NESTED_TABLES).map(async ([field, table]) => {
    try {
      const { data } = await supabase
        .from(table)
        .select('*')
        .in('case_id', caseIds);
      return { field, data: data || [] };
    } catch {
      return { field, data: [] };
    }
  });

  const nestedResults = await Promise.all(nestedPromises);
  const nestedMap = {};
  for (const { field, data } of nestedResults) {
    for (const row of data) {
      if (!nestedMap[row.case_id]) nestedMap[row.case_id] = {};
      if (!nestedMap[row.case_id][field]) nestedMap[row.case_id][field] = [];
      nestedMap[row.case_id][field].push(row);
    }
  }

  return cases.map(c => ({
    ...c,
    hearings: nestedMap[c.id]?.hearings || c.hearings || [],
    documents: nestedMap[c.id]?.documents || c.documents || [],
    timeline: nestedMap[c.id]?.timeline || c.timeline || [],
  }));
}

function createEntityProxy(entityName) {
  const tableName = ENTITY_TABLE_MAP[entityName];

  if (tableName === null) {
    return {
      list: async () => [],
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => {},
      get: async () => null,
    };
  }

  if (!tableName) {
    console.warn(`[base44 shim] Unknown entity: ${entityName}`);
    return {
      list: async () => [],
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => {},
      get: async () => null,
    };
  }

  const isCase = entityName === 'Case';

  return {
    async list(sortBy, limit) {
      let query = supabase.from(tableName).select('*');
      const sort = parseSortParam(sortBy);
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      if (typeof limit === 'number') {
        query = query.limit(limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return isCase ? assembleNestedForCases(data) : data;
    },

    async filter(filterObj, sortBy, limit) {
      let query = supabase.from(tableName).select('*');
      if (filterObj && typeof filterObj === 'object') {
        for (const [key, value] of Object.entries(filterObj)) {
          const col = mapColumn(key);
          if (Array.isArray(value)) {
            query = query.in(col, value);
          } else {
            query = query.eq(col, value);
          }
        }
      }
      const sort = parseSortParam(sortBy);
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      if (typeof limit === 'number') {
        query = query.limit(limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return isCase ? assembleNestedForCases(data) : data;
    },

    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (isCase && data) {
        const assembled = await assembleNestedForCases([data]);
        return assembled[0];
      }
      return data;
    },

    async create(record) {
      if (isCase) {
        const { hearings, documents, timeline, ...caseFields } = record;
        const { data, error } = await supabase
          .from(tableName)
          .insert(caseFields)
          .select()
          .single();
        if (error) throw error;
        if (hearings?.length) {
          await supabase.from('hearings').insert(
            hearings.map(h => ({ ...h, case_id: data.id }))
          );
        }
        if (documents?.length) {
          await supabase.from('case_documents').insert(
            documents.map(d => ({ ...d, case_id: data.id }))
          );
        }
        if (timeline?.length) {
          await supabase.from('case_timeline').insert(
            timeline.map(t => ({ ...t, case_id: data.id }))
          );
        }
        return data;
      }
      const { data, error } = await supabase
        .from(tableName)
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      if (isCase) {
        const { hearings, documents, timeline, ...caseFields } = updates;
        const hasNested = hearings !== undefined || documents !== undefined || timeline !== undefined;

        if (Object.keys(caseFields).length > 0) {
          const { error } = await supabase
            .from(tableName)
            .update(caseFields)
            .eq('id', id);
          if (error) throw error;
        }

        if (hearings !== undefined) {
          await supabase.from('hearings').delete().eq('case_id', id);
          if (hearings.length) {
            await supabase.from('hearings').insert(
              hearings.map(h => {
                const { id: _hid, ...rest } = h;
                return { ...rest, case_id: id };
              })
            );
          }
        }
        if (documents !== undefined) {
          await supabase.from('case_documents').delete().eq('case_id', id);
          if (documents.length) {
            await supabase.from('case_documents').insert(
              documents.map(d => {
                const { id: _did, ...rest } = d;
                return { ...rest, case_id: id };
              })
            );
          }
        }
        if (timeline !== undefined) {
          await supabase.from('case_timeline').delete().eq('case_id', id);
          if (timeline.length) {
            await supabase.from('case_timeline').insert(
              timeline.map(t => {
                const { id: _tid, ...rest } = t;
                return { ...rest, case_id: id };
              })
            );
          }
        }

        const { data } = await supabase.from(tableName).select('*').eq('id', id).single();
        return isCase ? (await assembleNestedForCases([data]))[0] : data;
      }

      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  };
}

// Entities proxy — lazily creates entity handlers
const entitiesProxy = new Proxy({}, {
  get(target, entityName) {
    if (typeof entityName !== 'string') return undefined;
    if (!target[entityName]) {
      target[entityName] = createEntityProxy(entityName);
    }
    return target[entityName];
  }
});

// Auth shim — Supabase Auth
const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error('Not authenticated');
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      ...user.user_metadata,
    };
  },

  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) {
      window.location.href = '/login';
    }
  },

  redirectToLogin(returnUrl) {
    const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    window.location.href = `/login${params}`;
  },
};

// Functions shim — calls our Vercel API routes at /api/<functionName>
const functions = {
  async invoke(functionName, args) {
    const resp = await fetch(`/api/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.error || `Function ${functionName} failed`);
    return json;
  },
};

// The main export — drop-in replacement for base44 SDK client
export const base44 = {
  entities: entitiesProxy,
  auth,
  functions,
  integrations: {
    Core: {
      async InvokeLLM(params) {
        return functions.invoke('invoke-llm', params);
      },
      async SendEmail(params) {
        return functions.invoke('send-email', params);
      },
      async SendSMS(params) {
        return functions.invoke('send-sms', params);
      },
      async UploadFile(params) {
        return functions.invoke('upload-file', params);
      },
      async GenerateImage(params) {
        return functions.invoke('generate-image', params);
      },
      async ExtractDataFromUploadedFile(params) {
        return functions.invoke('extract-data', params);
      },
    },
  },
};
