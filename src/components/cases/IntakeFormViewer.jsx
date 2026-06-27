import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IntakeFormViewer({ formData }) {
  if (!formData) return null;

  const isHebrew = formData.form_language === "עברית";

  const downloadAsPDF = () => {
    // Create printable HTML version
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>שאלון עובד זר - ${formData.full_name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            text-align: right;
            padding: 40px;
            line-height: 1.8;
          }
          h1 {
            color: #1e3a8a;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          h2 {
            color: #3b82f6;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .field {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .label {
            font-weight: bold;
            color: #475569;
            display: block;
            margin-bottom: 5px;
          }
          .value {
            background: #f1f5f9;
            padding: 10px;
            border-radius: 5px;
            border-right: 4px solid #3b82f6;
          }
          .header-info {
            background: #dbeafe;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>📋 שאלון קליטת עובד זר</h1>
        
        <div class="header-info">
          <p><strong>תאריך הגשה:</strong> ${new Date(formData.submission_date).toLocaleString('he-IL')}</p>
          <p><strong>זמן מילוי:</strong> ${Math.floor(formData.form_duration_seconds / 60)} דקות</p>
          <p><strong>שפת מילוי:</strong> ${formData.form_language}</p>
        </div>

        <h2>1️⃣ פרטים אישיים</h2>
        <div class="field">
          <span class="label">שם מלא:</span>
          <div class="value">${formData.full_name}</div>
        </div>
        <div class="field">
          <span class="label">תעודת זהות:</span>
          <div class="value">${formData.id_number}</div>
        </div>
        <div class="field">
          <span class="label">טלפון:</span>
          <div class="value">${formData.phone}</div>
        </div>
        <div class="field">
          <span class="label">כתובת:</span>
          <div class="value">${formData.address}</div>
        </div>

        <h2>2️⃣ פרטי המעסיק</h2>
        <div class="field">
          <span class="label">שם החברה:</span>
          <div class="value">${formData.employer_name}</div>
        </div>
        <div class="field">
          <span class="label">תחום עיסוק החברה:</span>
          <div class="value">${formData.employer_business}</div>
        </div>
        <div class="field">
          <span class="label">טלפון המעסיק:</span>
          <div class="value">${formData.employer_phone}</div>
        </div>
        <div class="field">
          <span class="label">תיאור התפקיד:</span>
          <div class="value">${formData.job_description}</div>
        </div>

        <h2>3️⃣ שכר ותשלום</h2>
        <div class="field">
          <span class="label">סוג תשלום:</span>
          <div class="value">${formData.payment_type}</div>
        </div>
        <div class="field">
          <span class="label">גובה השכר:</span>
          <div class="value">₪${formData.salary_amount}</div>
        </div>
        <div class="field">
          <span class="label">אופן התשלום:</span>
          <div class="value">${formData.payment_method}</div>
        </div>
        <div class="field">
          <span class="label">קיבל תלושי שכר:</span>
          <div class="value">${formData.received_payslips ? 'כן' : 'לא'}</div>
        </div>

        <h2>4️⃣ תקופת עבודה ושעות</h2>
        <div class="field">
          <span class="label">תאריך התחלה:</span>
          <div class="value">${formData.work_start_date ? new Date(formData.work_start_date).toLocaleDateString('he-IL') : '-'}</div>
        </div>
        <div class="field">
          <span class="label">תאריך סיום:</span>
          <div class="value">${formData.work_end_date ? new Date(formData.work_end_date).toLocaleDateString('he-IL') : '-'}</div>
        </div>
        <div class="field">
          <span class="label">שעות עבודה יומיות:</span>
          <div class="value">${formData.daily_hours_details}</div>
        </div>
        <div class="field">
          <span class="label">ימי עבודה שבועיים:</span>
          <div class="value">${formData.weekly_days_details}</div>
        </div>

        <h2>5️⃣ סיום עבודה</h2>
        <div class="field">
          <span class="label">סיבת סיום:</span>
          <div class="value">${formData.termination_reason}</div>
        </div>
        <div class="field">
          <span class="label">סוג הפסקה:</span>
          <div class="value">${formData.termination_type}</div>
        </div>
        ${formData.termination_explanation ? `
        <div class="field">
          <span class="label">הסבר מפורט:</span>
          <div class="value">${formData.termination_explanation}</div>
        </div>
        ` : ''}

        <h2>6️⃣ תנאי מגורים ואישורים</h2>
        <div class="field">
          <span class="label">תנאי מגורים:</span>
          <div class="value">${formData.accommodation_details}</div>
        </div>
        <div class="field">
          <span class="label">אישור עבודה:</span>
          <div class="value">${formData.had_work_permit ? 'כן' : 'לא'}</div>
        </div>
        ${formData.work_permit_payment ? `
        <div class="field">
          <span class="label">תשלום אישור עבודה:</span>
          <div class="value">${formData.work_permit_payment}</div>
        </div>
        ` : ''}

        <h2>7️⃣ מסמכים שהועלו</h2>
        <div class="field">
          <span class="label">מספר קבצים:</span>
          <div class="value">${formData.uploaded_documents?.length || 0} קבצים</div>
        </div>
        ${formData.uploaded_documents?.map((doc, i) => `
          <div class="field">
            <span class="label">קובץ ${i + 1}:</span>
            <div class="value">${doc.name}</div>
          </div>
        `).join('') || ''}

        <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px;">
            מסמך זה נוצר אוטומטית ממערכת LegalFlow CRM<br>
            תאריך הדפסה: ${new Date().toLocaleString('he-IL')}
          </p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            שאלון קליטת עובד זר
          </CardTitle>
          <Button onClick={downloadAsPDF} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 ml-2" />
            הדפס / שמור PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">תאריך הגשה</p>
              <p className="font-semibold">{new Date(formData.submission_date).toLocaleString('he-IL')}</p>
            </div>
            <div>
              <p className="text-gray-600">זמן מילוי</p>
              <p className="font-semibold">{Math.floor(formData.form_duration_seconds / 60)} דקות</p>
            </div>
            <div>
              <p className="text-gray-600">שפת מילוי</p>
              <p className="font-semibold">{formData.form_language}</p>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div>
          <h3 className="font-bold text-lg mb-3 text-gray-900">1. פרטים אישיים</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded border-r-4 border-blue-500">
              <p className="text-sm text-gray-600">שם מלא</p>
              <p className="font-semibold">{formData.full_name}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-blue-500">
              <p className="text-sm text-gray-600">תעודת זהות</p>
              <p className="font-semibold">{formData.id_number}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-blue-500">
              <p className="text-sm text-gray-600">טלפון</p>
              <p className="font-semibold">{formData.phone}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-blue-500">
              <p className="text-sm text-gray-600">כתובת</p>
              <p className="font-semibold">{formData.address}</p>
            </div>
          </div>
        </div>

        {/* Employer Details */}
        <div>
          <h3 className="font-bold text-lg mb-3 text-gray-900">2. פרטי המעסיק</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded border-r-4 border-purple-500">
              <p className="text-sm text-gray-600">שם החברה</p>
              <p className="font-semibold">{formData.employer_name}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-purple-500">
              <p className="text-sm text-gray-600">טלפון המעסיק</p>
              <p className="font-semibold">{formData.employer_phone}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-purple-500 md:col-span-2">
              <p className="text-sm text-gray-600">תחום עיסוק</p>
              <p className="font-semibold">{formData.employer_business}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-purple-500 md:col-span-2">
              <p className="text-sm text-gray-600">תיאור התפקיד</p>
              <p className="font-semibold whitespace-pre-line">{formData.job_description}</p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div>
          <h3 className="font-bold text-lg mb-3 text-gray-900">3. שכר ותשלום</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded border-r-4 border-green-500">
              <p className="text-sm text-gray-600">סוג תשלום</p>
              <p className="font-semibold">{formData.payment_type}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-green-500">
              <p className="text-sm text-gray-600">גובה השכר</p>
              <p className="font-semibold text-green-700">₪{formData.salary_amount}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-green-500">
              <p className="text-sm text-gray-600">אופן התשלום</p>
              <p className="font-semibold">{formData.payment_method}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-green-500">
              <p className="text-sm text-gray-600">תלושי שכר</p>
              <p className="font-semibold">{formData.received_payslips ? 'כן' : 'לא'}</p>
            </div>
          </div>
        </div>

        {/* Work Period */}
        <div>
          <h3 className="font-bold text-lg mb-3 text-gray-900">4. תקופת עבודה ושעות</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded border-r-4 border-orange-500">
              <p className="text-sm text-gray-600">תאריך התחלה</p>
              <p className="font-semibold">{formData.work_start_date ? new Date(formData.work_start_date).toLocaleDateString('he-IL') : '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-orange-500">
              <p className="text-sm text-gray-600">תאריך סיום</p>
              <p className="font-semibold">{formData.work_end_date ? new Date(formData.work_end_date).toLocaleDateString('he-IL') : '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-orange-500 md:col-span-2">
              <p className="text-sm text-gray-600">שעות עבודה יומיות</p>
              <p className="font-semibold whitespace-pre-line">{formData.daily_hours_details}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-orange-500 md:col-span-2">
              <p className="text-sm text-gray-600">ימי עבודה שבועיים</p>
              <p className="font-semibold">{formData.weekly_days_details}</p>
            </div>
          </div>
        </div>

        {/* Termination */}
        <div>
          <h3 className="font-bold text-lg mb-3 text-gray-900">5. סיום עבודה</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-50 p-3 rounded border-r-4 border-red-500">
              <p className="text-sm text-gray-600">סיבת סיום</p>
              <p className="font-semibold whitespace-pre-line">{formData.termination_reason}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-red-500">
              <p className="text-sm text-gray-600">סוג הפסקה</p>
              <p className="font-semibold">{formData.termination_type}</p>
            </div>
            {formData.termination_explanation && (
              <div className="bg-gray-50 p-3 rounded border-r-4 border-red-500">
                <p className="text-sm text-gray-600">הסבר מפורט</p>
                <p className="font-semibold whitespace-pre-line">{formData.termination_explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Accommodation */}
        <div>
          <h3 className="font-bold text-lg mb-3 text-gray-900">6. תנאי מגורים ואישורים</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded border-r-4 border-indigo-500 md:col-span-2">
              <p className="text-sm text-gray-600">תנאי מגורים</p>
              <p className="font-semibold whitespace-pre-line">{formData.accommodation_details}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-r-4 border-indigo-500">
              <p className="text-sm text-gray-600">אישור עבודה</p>
              <p className="font-semibold">{formData.had_work_permit ? 'כן' : 'לא'}</p>
            </div>
            {formData.work_permit_payment && (
              <div className="bg-gray-50 p-3 rounded border-r-4 border-indigo-500">
                <p className="text-sm text-gray-600">תשלום אישור עבודה</p>
                <p className="font-semibold">{formData.work_permit_payment}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}