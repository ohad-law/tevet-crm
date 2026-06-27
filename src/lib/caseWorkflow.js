// תבנית רצף העבודה בתיק עבודה — מקור אמת יחיד.
// משמש בשלושה מקומות: המרת ליד לתיק, הצעת הצעד הבא בסיום משימה, וקידום סטטוס התיק.
//
// כל צעד:
//   id                 — מזהה פנימי קבוע
//   label              — שם המשימה (משמש גם כתיאור המשימה, וגם לזיהוי הצעד לפי התיאור)
//   task_type          — סוג המשימה (תואם לרשימת הסוגים בטפסים)
//   dueOffsetDays      — תאריך יעד יחסי בימים, או null אם תלוי בית משפט
//   requiresManualDate — true אם התאריך נקבע ע"י בית המשפט וצריך הזנה ידנית
//   next               — id של הצעד הבא בשרשרת ברירת המחדל, או null
//   caseStatus         — סטטוס תיק לקידום אוטומטי בעת פתיחת הצעד, או null

export const CASE_WORKFLOW = [
  { id: 'collect_docs',         label: 'איסוף מסמכים',                        task_type: 'איסוף מסמכים', dueOffsetDays: 7,    requiresManualDate: false, next: 'claim',               caseStatus: 'עריכת כתב תביעה' },
  { id: 'claim',                label: 'כתב תביעה / מכתב דרישה',               task_type: 'הכנת מסמך',    dueOffsetDays: 14,   requiresManualDate: false, next: 'disclosure_affidavit', caseStatus: 'עריכת כתב תביעה' },
  { id: 'disclosure_affidavit', label: 'תצהיר גילוי מסמכים (לפני קדם)',        task_type: 'הכנת מסמך',    dueOffsetDays: null, requiresManualDate: true,  next: 'pretrial',            caseStatus: 'תצהיר גילוי מסמכים' },
  { id: 'pretrial',             label: 'דיון קדם',                            task_type: 'פגישה',       dueOffsetDays: null, requiresManualDate: true,  next: 'disclosure_demand',   caseStatus: null },
  { id: 'disclosure_demand',    label: 'דרישה לגילוי ועיון (לפי כתבי הטענות)',  task_type: 'הכנת מסמך',    dueOffsetDays: 30,   requiresManualDate: false, next: 'evidence_affidavit',  caseStatus: null },
  { id: 'evidence_affidavit',   label: 'תצהיר עדות ראשית',                     task_type: 'הכנת מסמך',    dueOffsetDays: null, requiresManualDate: true,  next: 'cross_prep',          caseStatus: 'תצהיר עדות ראשית' },
  { id: 'cross_prep',           label: 'הכנה לחקירות (לפי תצהירי הצדדים)',       task_type: 'בדיקה משפטית', dueOffsetDays: null, requiresManualDate: true,  next: 'summations',          caseStatus: 'הוכחות' },
  { id: 'summations',           label: 'סיכומים',                             task_type: 'הכנת מסמך',    dueOffsetDays: null, requiresManualDate: true,  next: null,                  caseStatus: 'סיכומים' },
  // צעד נוסף שאינו בשרשרת הקבועה — נבחר ידנית דרך "בחר אחר" (למשל כתב תביעה + תחשיבים יחד)
  { id: 'calculations',         label: 'תחשיבים',                             task_type: 'תחשיבים',     dueOffsetDays: 14,   requiresManualDate: false, next: null,                  caseStatus: null },
];

export const FIRST_STEP_ID = 'collect_docs';

export function getStep(id) {
  return CASE_WORKFLOW.find(s => s.id === id) || null;
}

// מאתר צעד לפי תיאור המשימה (לא שומרים שדה ייעודי בישות, מזהים לפי השם)
export function getStepByLabel(label) {
  if (!label) return null;
  return CASE_WORKFLOW.find(s => s.label === label) || null;
}

export function getNextStep(id) {
  const step = getStep(id);
  if (!step || !step.next) return null;
  return getStep(step.next);
}

// מחשב תאריך יעד יחסי (YYYY-MM-DD), או '' אם הצעד תלוי בתאריך בית משפט
export function computeDueDate(step, fromDate = new Date()) {
  if (!step || step.requiresManualDate || step.dueOffsetDays == null) return '';
  const d = new Date(fromDate);
  d.setDate(d.getDate() + step.dueOffsetDays);
  return d.toISOString().split('T')[0];
}

// בונה אובייקט משימה מתוך צעד בתבנית
export function buildTaskFromStep(step, { caseId, assignedTo, dueDate } = {}) {
  return {
    description: step.label,
    case_id: caseId,
    task_type: step.task_type,
    priority: step.id === FIRST_STEP_ID ? 'גבוה' : 'רגיל',
    due_date: dueDate != null && dueDate !== '' ? dueDate : computeDueDate(step),
    status: 'לביצוע',
    assigned_to: assignedTo || null,
    auto_deadline_info: step.requiresManualDate ? 'יש להזין תאריך לפי מועד בית המשפט' : '',
  };
}

// פותח את המשימות הבאות שנבחרו ומקדם את סטטוס התיק בהתאם.
// מקבל את ה-client של base44 כדי לשמור את המודול עצמו נקי מתלות ישירה.
// selections: מערך של { step, dueDate }; completedTask: המשימה שהושלמה (למקור case_id והמשויך).
export async function applyNextSteps(base44, selections, completedTask) {
  const caseId = completedTask?.case_id || null;
  for (const { step, dueDate } of selections) {
    await base44.entities.Task.create(
      buildTaskFromStep(step, {
        caseId,
        assignedTo: completedTask?.assigned_to || null,
        dueDate,
      })
    );
    if (step.caseStatus && caseId) {
      try {
        await base44.entities.Case.update(caseId, { status: step.caseStatus });
      } catch (e) {
        console.error('Case status update failed:', e);
      }
    }
  }
}
