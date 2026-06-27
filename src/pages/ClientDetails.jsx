import { useState, useEffect } from "react";
import { Client, Case } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Briefcase, Phone, Mail, MapPin, Calendar, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function ClientDetails() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [clientCases, setClientCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    const loadClientData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const clientId = urlParams.get('id');
      
      if (!clientId) {
        navigate(createPageUrl("Clients"));
        return;
      }

      const [clientData, allCases] = await Promise.all([
        Client.list(),
        Case.list()
      ]);

      const foundClient = clientData.find(c => c.id === clientId);
      if (!foundClient) {
        navigate(createPageUrl("Clients"));
        return;
      }

      const relatedCases = allCases.filter(c => c.client_id === clientId);

      setClient(foundClient);
      setClientCases(relatedCases);
      setIsLoading(false);
    };
    
    loadClientData();
  }, [navigate]);

  if (isLoading || !client) {
    return <div className="p-8">טוען...</div>;
  }

  const handleSendOnboardingEmail = async () => {
    if (!client.email) {
      toast.error("ללקוח אין כתובת מייל");
      return;
    }
    
    setIsSendingEmail(true);
    try {
      const firstCase = clientCases[0];
      const res = await base44.functions.invoke("sendClientOnboardingEmail", {
        clientId: client.id,
        clientName: client.full_name,
        clientEmail: client.email,
        caseName: firstCase?.case_name,
        caseType: firstCase?.case_type
      });
      
      if (res.data?.success) {
        toast.success("מייל onboarding נשלח בהצלחה!");
      } else {
        throw new Error(res.data?.error || "שגיאה בשליחה");
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בשליחת המייל: " + err.message);
    }
    setIsSendingEmail(false);
  };

  const caseStatusColors = {
    'הגשה': 'bg-blue-100 text-blue-800',
    'איסוף ראיות': 'bg-yellow-100 text-yellow-800',
    'משא ומתן': 'bg-purple-100 text-purple-800',
    'הליכים': 'bg-orange-100 text-orange-800',
    'סגירה': 'bg-green-100 text-green-800'
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Clients"))}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה ללקוחות
          </Button>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{client.full_name}</h1>
            {client.email && (
              <Button
                onClick={handleSendOnboardingEmail}
                disabled={isSendingEmail}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSendingEmail ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-2" />
                )}
                שלח מייל Onboarding
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">פרטי לקוח</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">תעודת זהות</p>
                  <p className="font-semibold">{client.id_number || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">סיווג</p>
                  <Badge className="bg-blue-100 text-blue-800">{client.classification}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">סטטוס</p>
                  <Badge variant={client.status === 'פעיל' ? 'default' : 'secondary'}>
                    {client.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">תאריך הצטרפות</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-semibold">
                      {client.join_date ? new Date(client.join_date).toLocaleDateString('he-IL') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold">פרטי התקשרות</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {client.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">טלפון</p>
                    <p className="font-semibold">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">אימייל</p>
                    <p className="font-semibold text-sm">{client.email}</p>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">כתובת</p>
                    <p className="font-semibold text-sm">{client.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                תיקים ({clientCases.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {clientCases.length > 0 ? (
              <div className="space-y-4">
                {clientCases.map((caseItem) => (
                  <Link key={caseItem.id} to={createPageUrl(`CaseDetails?id=${caseItem.id}`)}>
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{caseItem.case_name}</h3>
                          <p className="text-sm text-gray-500">תיק #{caseItem.case_number}</p>
                        </div>
                        <Badge className={caseStatusColors[caseItem.status]}>
                          {caseItem.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline">{caseItem.case_type}</Badge>
                        {caseItem.value && (
                          <Badge variant="outline" className="bg-green-50">
                            ₪{caseItem.value.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">אין תיקים רשומים ללקוח זה</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}