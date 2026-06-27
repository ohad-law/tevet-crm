import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Save, Plus, UserPlus, FolderPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function IncomeForm({ cases, clients, onSubmit, onCancel, onDataRefresh }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    case_id: "",
    client_id: "",
    amount: 0,
    amount_before_vat: 0,
    includes_vat: true,
    status: "ממתין",
    description: ""
  });
  
  const VAT_RATE = 0.18;
  
  const handleAmountChange = (value, isWithVat) => {
    const numValue = parseFloat(value) || 0;
    if (isWithVat) {
      setFormData({
        ...formData,
        amount: numValue,
        amount_before_vat: Math.round(numValue / (1 + VAT_RATE))
      });
    } else {
      setFormData({
        ...formData,
        amount_before_vat: numValue,
        amount: Math.round(numValue * (1 + VAT_RATE))
      });
    }
  };
  
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [newClientData, setNewClientData] = useState({ full_name: "", phone: "", email: "" });
  const [newCaseData, setNewCaseData] = useState({ case_name: "", case_type: "אזרחי - אחר", client_id: "" });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCreateClient = async () => {
    if (!newClientData.full_name || !newClientData.phone) {
      alert("נא למלא שם וטלפון");
      return;
    }
    setIsCreating(true);
    try {
      const client = await base44.entities.Client.create({
        ...newClientData,
        classification: "פרטי",
        status: "פעיל",
        join_date: new Date().toISOString().split('T')[0]
      });
      setFormData({ ...formData, client_id: client.id });
      setShowNewClientDialog(false);
      setNewClientData({ full_name: "", phone: "", email: "" });
      if (onDataRefresh) onDataRefresh();
      alert("לקוח נוצר בהצלחה!");
    } catch (error) {
      alert("שגיאה ביצירת לקוח: " + error.message);
    }
    setIsCreating(false);
  };

  const handleCreateCase = async () => {
    if (!newCaseData.case_name) {
      alert("נא למלא שם תיק");
      return;
    }
    setIsCreating(true);
    try {
      // Generate case number
      const allCases = await base44.entities.Case.list();
      const maxNum = allCases.reduce((max, c) => {
        const num = parseInt(c.case_number) || 0;
        return num > max ? num : max;
      }, 0);
      const newCaseNumber = String(maxNum + 1).padStart(4, '0');

      const newCase = await base44.entities.Case.create({
        ...newCaseData,
        case_number: newCaseNumber,
        status: "תיק נכנס",
        open_date: new Date().toISOString().split('T')[0]
      });
      setFormData({ ...formData, case_id: newCase.id, client_id: newCaseData.client_id });
      setShowNewCaseDialog(false);
      setNewCaseData({ case_name: "", case_type: "אזרחי - אחר", client_id: "" });
      if (onDataRefresh) onDataRefresh();
      alert("תיק נוצר בהצלחה!");
    } catch (error) {
      alert("שגיאה ביצירת תיק: " + error.message);
    }
    setIsCreating(false);
  };

  return (
    <>
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">תאריך</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">סכום</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-slate-500">כולל מע"מ (₪)</span>
                      </div>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => handleAmountChange(e.target.value, true)}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-slate-500">לפני מע"מ (₪)</span>
                      </div>
                      <Input
                        type="number"
                        value={formData.amount_before_vat}
                        onChange={(e) => handleAmountChange(e.target.value, false)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">מע"מ: {(formData.amount - formData.amount_before_vat).toLocaleString()} ₪</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="client_id">לקוח</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs text-blue-600 hover:text-blue-700"
                    onClick={() => setShowNewClientDialog(true)}
                  >
                    <UserPlus className="w-3 h-3 ml-1" />
                    לקוח חדש
                  </Button>
                </div>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח (אופציונלי)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>ללא לקוח</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="case_id">תיק</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs text-blue-600 hover:text-blue-700"
                    onClick={() => setShowNewCaseDialog(true)}
                  >
                    <FolderPlus className="w-3 h-3 ml-1" />
                    תיק חדש
                  </Button>
                </div>
                <Select value={formData.case_id} onValueChange={(value) => setFormData({...formData, case_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תיק (אופציונלי)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>ללא תיק</SelectItem>
                    {cases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.case_name} (#{caseItem.case_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">סטטוס</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ממתין">ממתין</SelectItem>
                    <SelectItem value="שולם">שולם</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">תיאור (אופציונלי)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="תיאור ההכנסה"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                <X className="w-4 h-4 ml-2" />
                ביטול
              </Button>
              <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 ml-2" />
                שמור
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              לקוח חדש
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם מלא *</Label>
              <Input
                value={newClientData.full_name}
                onChange={(e) => setNewClientData({...newClientData, full_name: e.target.value})}
                placeholder="שם הלקוח"
              />
            </div>
            <div className="space-y-2">
              <Label>טלפון *</Label>
              <Input
                value={newClientData.phone}
                onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                placeholder="050-0000000"
              />
            </div>
            <div className="space-y-2">
              <Label>אימייל</Label>
              <Input
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                placeholder="email@example.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>ביטול</Button>
              <Button onClick={handleCreateClient} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                {isCreating ? "יוצר..." : "צור לקוח"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Case Dialog */}
      <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-green-600" />
              תיק חדש
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם התיק *</Label>
              <Input
                value={newCaseData.case_name}
                onChange={(e) => setNewCaseData({...newCaseData, case_name: e.target.value})}
                placeholder="שם התיק"
              />
            </div>
            <div className="space-y-2">
              <Label>סוג תיק</Label>
              <Select value={newCaseData.case_type} onValueChange={(value) => setNewCaseData({...newCaseData, case_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="דיני עבודה - תביעה">דיני עבודה - תביעה</SelectItem>
                  <SelectItem value="דיני עבודה - עובדים זרים">דיני עבודה - עובדים זרים</SelectItem>
                  <SelectItem value="דיני עבודה - פיטורים">דיני עבודה - פיטורים</SelectItem>
                  <SelectItem value="דיני עבודה - שכר">דיני עבודה - שכר</SelectItem>
                  <SelectItem value="תביעה כספית">תביעה כספית</SelectItem>
                  <SelectItem value="חדלות פירעון">חדלות פירעון</SelectItem>
                  <SelectItem value="אזרחי - אחר">אזרחי - אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>לקוח</Label>
              <Select value={newCaseData.client_id} onValueChange={(value) => setNewCaseData({...newCaseData, client_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר לקוח (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא לקוח</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewCaseDialog(false)}>ביטול</Button>
              <Button onClick={handleCreateCase} disabled={isCreating} className="bg-green-600 hover:bg-green-700">
                {isCreating ? "יוצר..." : "צור תיק"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}