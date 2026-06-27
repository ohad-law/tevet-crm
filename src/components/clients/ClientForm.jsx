import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";

export default function ClientForm({ client, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(client || {
    full_name: "",
    id_number: "",
    phone: "",
    email: "",
    address: "",
    classification: "",
    status: "פעיל",
    join_date: new Date().toISOString().split('T')[0]
  });

  const [showCustomClassification, setShowCustomClassification] = useState(
    client?.classification && !['פרטי', 'תאגיד', 'עובד זר', 'מעסיק'].includes(client.classification)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClassificationChange = (value) => {
    if (value === 'custom') {
      setShowCustomClassification(true);
      setFormData(prev => ({ ...prev, classification: '' }));
    } else {
      setShowCustomClassification(false);
      setFormData(prev => ({ ...prev, classification: value }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="shadow-2xl border-none">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {client ? 'עריכת לקוח' : 'לקוח חדש'}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">שם מלא *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="שם מלא"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number">תעודת זהות</Label>
                <Input
                  id="id_number"
                  value={formData.id_number}
                  onChange={(e) => handleChange('id_number', e.target.value)}
                  placeholder="ת.ז."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">טלפון *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="מספר טלפון"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="כתובת אימייל"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">כתובת</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="כתובת מלאה"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classification">סיווג *</Label>
                {!showCustomClassification ? (
                  <Select 
                    value={formData.classification} 
                    onValueChange={handleClassificationChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סיווג או הוסף חדש" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="פרטי">פרטי</SelectItem>
                      <SelectItem value="תאגיד">תאגיד</SelectItem>
                      <SelectItem value="עובד זר">עובד זר</SelectItem>
                      <SelectItem value="מעסיק">מעסיק</SelectItem>
                      <SelectItem value="custom">➕ הוסף סיווג חדש...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={formData.classification}
                      onChange={(e) => handleChange('classification', e.target.value)}
                      placeholder="הקלד סיווג חדש"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCustomClassification(false);
                        setFormData(prev => ({ ...prev, classification: 'פרטי' }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  בחר מהרשימה או הוסף סיווג משלך
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">סטטוס</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="פעיל">פעיל</SelectItem>
                    <SelectItem value="לא פעיל">לא פעיל</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="join_date">תאריך הצטרפות</Label>
                <Input
                  id="join_date"
                  type="date"
                  value={formData.join_date}
                  onChange={(e) => handleChange('join_date', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-gray-100 p-6 bg-gray-50">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 ml-2" />
              ביטול
            </Button>
            <Button type="submit" className="bg-blue-900 hover:bg-blue-800">
              <Save className="w-4 h-4 ml-2" />
              {client ? 'עדכון' : 'יצירה'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}