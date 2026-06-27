import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Briefcase, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function ProceduresDashboard() {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(null); // null = all, or specific filter name

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [casesData, clientsData] = await Promise.all([
      base44.entities.Case.list(),
      base44.entities.Client.list()
    ]);
    setCases(casesData.filter(c => c.status !== 'ארכיון'));
    setClients(clientsData);
    setIsLoading(false);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'לקוח לא ידוע';
  };

  // Define procedure stages in order
  const procedureStages = [
    {
      id: 'תיק נכנס',
      title: 'תיק נכנס',
      icon: '📥',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      id: 'עריכת כתב תביעה',
      title: 'עריכת כתב תביעה',
      icon: '📝',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    {
      id: 'מעקב מספר הליך בנט',
      title: 'מעקב מספר הליך בנט',
      icon: '🔍',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      id: 'מסירה אישית/דואר ישראל',
      title: 'מסירה',
      icon: '📮',
      color: 'bg-pink-100 text-pink-700 border-pink-200'
    },
    {
      id: 'הודעה על המצאה',
      title: 'הודעה על המצאה',
      icon: '📨',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    {
      id: 'תצהיר גילוי מסמכים',
      title: 'תצהיר גילוי מסמכים',
      icon: '📄',
      color: 'bg-amber-100 text-amber-700 border-amber-200'
    },
    {
      id: 'תצהיר עדות ראשית',
      title: 'תצהיר עדות ראשית',
      icon: '📋',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    {
      id: 'הוכחות',
      title: 'הוכחות',
      icon: '⚖️',
      color: 'bg-red-100 text-red-700 border-red-200'
    },
    {
      id: 'סיכומים',
      title: 'סיכומים',
      icon: '📊',
      color: 'bg-teal-100 text-teal-700 border-teal-200'
    },
    {
      id: 'פסק דין',
      title: 'פסק דין',
      icon: '🏛️',
      color: 'bg-green-100 text-green-700 border-green-200'
    }
  ];

  // Group cases by status
  const casesByStage = procedureStages.map(stage => ({
    ...stage,
    cases: cases.filter(c => c.status === stage.id)
  }));

  const totalActiveCases = cases.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight flex items-center gap-3">
            <FileText className="w-9 h-9 text-indigo-600" />
            דשבורד סדרי דין
          </h1>
          <p className="text-slate-500 text-lg">מעקב אחר שלבי התיקים בהליך המשפטי</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("Cases")}>
            <Button className="bg-slate-900 hover:bg-slate-800">
              לכל התיקים
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stats - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={`border-slate-200 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${selectedFilter === null ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}
          onClick={() => setSelectedFilter(null)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">תיקים פעילים</p>
                <p className="text-3xl font-bold text-slate-900">{totalActiveCases}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-slate-200 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-indigo-300 ${selectedFilter === 'תביעה' ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}`}
          onClick={() => setSelectedFilter(selectedFilter === 'תביעה' ? null : 'תביעה')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">בכתיבת תביעה</p>
                <p className="text-3xl font-bold text-slate-900">
                  {cases.filter(c => c.status === 'עריכת כתב תביעה').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-slate-200 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-amber-300 ${selectedFilter === 'מסמכים' ? 'ring-2 ring-amber-500 bg-amber-50/30' : ''}`}
          onClick={() => setSelectedFilter(selectedFilter === 'מסמכים' ? null : 'מסמכים')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">בגילוי מסמכים</p>
                <p className="text-3xl font-bold text-slate-900">
                  {cases.filter(c => c.status === 'תצהיר גילוי מסמכים').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-slate-200 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-red-300 ${selectedFilter === 'הוכחות' ? 'ring-2 ring-red-500 bg-red-50/30' : ''}`}
          onClick={() => setSelectedFilter(selectedFilter === 'הוכחות' ? null : 'הוכחות')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">בשלבי הוכחות</p>
                <p className="text-3xl font-bold text-slate-900">
                  {cases.filter(c => ['תצהיר עדות ראשית', 'הוכחות', 'סיכומים'].includes(c.status)).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-slate-200 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-green-300 ${selectedFilter === 'פסק דין' ? 'ring-2 ring-green-500 bg-green-50/30' : ''}`}
          onClick={() => setSelectedFilter(selectedFilter === 'פסק דין' ? null : 'פסק דין')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">פסק דין</p>
                <p className="text-3xl font-bold text-slate-900">
                  {cases.filter(c => c.status === 'פסק דין').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                🏛️
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Procedure Pipeline */}
      <div className="space-y-4">
        {casesByStage
          .filter(stage => {
            if (selectedFilter === null) return true;
            if (selectedFilter === 'תביעה') return stage.id === 'עריכת כתב תביעה';
            if (selectedFilter === 'מסמכים') return stage.id === 'תצהיר גילוי מסמכים';
            if (selectedFilter === 'הוכחות') return ['תצהיר עדות ראשית', 'הוכחות', 'סיכומים'].includes(stage.id);
            if (selectedFilter === 'פסק דין') return stage.id === 'פסק דין';
            return true;
          })
          .map((stage, stageIdx) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stageIdx * 0.05 }}
          >
            <Card className={`border-2 ${stage.cases.length > 0 ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-60'}`}>
              <CardHeader className={`${stage.color} border-b`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <span className="text-2xl">{stage.icon}</span>
                    <span>{stage.title}</span>
                  </CardTitle>
                  <Badge variant="outline" className={`${stage.color} font-bold text-base px-3 py-1`}>
                    {stage.cases.length}
                  </Badge>
                </div>
              </CardHeader>
              
              {stage.cases.length > 0 && (
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stage.cases.map((caseItem, idx) => (
                      <Link key={caseItem.id} to={createPageUrl(`CaseDetails?id=${caseItem.id}`)}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all duration-200 bg-white group"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex-1">
                              {caseItem.case_name}
                            </h4>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-slate-400 font-mono bg-slate-50 inline-block px-2 py-1 rounded">
                              #{caseItem.case_number}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              {getClientName(caseItem.client_id)}
                            </div>
                            {caseItem.assigned_to && (
                              <p className="text-xs text-slate-500">
                                אחראי: {caseItem.assigned_to}
                              </p>
                            )}
                            {caseItem.open_date && (
                              <p className="text-xs text-slate-400">
                                נפתח: {new Date(caseItem.open_date).toLocaleDateString('he-IL')}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              )}

              {stage.cases.length === 0 && (
                <CardContent className="p-6 text-center text-slate-400">
                  אין תיקים בשלב זה כרגע
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}