import { useState, useEffect } from "react";
import { Case, Client } from "@/entities/all";
import { Briefcase, Calendar, DollarSign, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatCurrency } from "@/components/utils/formatters";

export default function CasesPipeline() {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [casesData, clientsData] = await Promise.all([
        Case.list("-updated_date"),
        Client.list()
      ]);
      setCases(casesData);
      setClients(clientsData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'לא ידוע';
  };

  const getDaysSinceOpen = (openDate) => {
    if (!openDate) return 0;
    const days = Math.floor((Date.now() - new Date(openDate).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getPriorityColor = (days) => {
    if (days > 10) return 'border-red-500 bg-red-50';
    if (days > 5) return 'border-orange-500 bg-orange-50';
    if (days > 2) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-green-50';
  };

  const columns = [
    {
      id: 'new',
      title: 'תיק נכנס',
      color: 'bg-blue-500',
      statuses: ['תיק נכנס']
    },
    {
      id: 'in_progress',
      title: 'בטיפול',
      color: 'bg-purple-500',
      statuses: ['עריכת כתב תביעה', 'מעקב מספר הליך בנט', 'מסירה אישית/דואר ישראל', 'הודעה על המצאה', 'תצהיר גילוי מסמכים', 'תצהיר עדות ראשית']
    },
    {
      id: 'court',
      title: 'בבית משפט',
      color: 'bg-amber-500',
      statuses: ['הוכחות', 'סיכומים']
    },
    {
      id: 'verdict',
      title: 'פסק דין',
      color: 'bg-green-500',
      statuses: ['פסק דין']
    },
    {
      id: 'archive',
      title: 'ארכיון',
      color: 'bg-gray-500',
      statuses: ['ארכיון']
    }
  ];

  const getCasesForColumn = (columnStatuses) => {
    return cases.filter(c => columnStatuses.includes(c.status));
  };

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">צנרת תיקים</h1>
        <p className="text-gray-600">Cases Pipeline · Kanban Board</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {columns.map((col) => {
          const colCases = getCasesForColumn(col.statuses);
          const colValue = colCases.reduce((sum, c) => sum + (c.value || 0), 0);
          
          return (
            <Card key={col.id} className="shadow-lg border-none">
              <CardContent className="p-4">
                <div className={`w-3 h-3 rounded-full ${col.color} mb-2`} />
                <p className="text-sm text-gray-600 mb-1">{col.title}</p>
                <p className="text-2xl font-bold text-gray-900">{colCases.length}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(colValue)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {columns.map((col) => {
          const columnCases = getCasesForColumn(col.statuses);
          
          return (
            <div key={col.id} className="flex flex-col">
              <Card className={`shadow-lg border-none mb-3 ${col.color} bg-opacity-10`}>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <span>{col.title}</span>
                    <Badge className={`${col.color} text-white`}>{columnCases.length}</Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="space-y-3 flex-1 min-h-[500px] max-h-[calc(100vh-400px)] overflow-y-auto pb-4">
                <AnimatePresence>
                  {columnCases.map((caseItem) => {
                    const days = getDaysSinceOpen(caseItem.open_date);
                    const priorityColor = getPriorityColor(days);
                    
                    return (
                      <motion.div
                        key={caseItem.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link to={createPageUrl(`CaseDetails?id=${caseItem.id}`)}>
                          <Card className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-2 ${priorityColor}`}>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-bold text-sm text-gray-900 line-clamp-2">
                                    {caseItem.case_name}
                                  </p>
                                  {days > 5 && (
                                    <Badge className="bg-red-100 text-red-700 text-xs">
                                      {days}d
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-xs text-gray-600">
                                  תיק #{caseItem.case_number}
                                </p>

                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <User className="w-3 h-3" />
                                  <span className="truncate">{getClientName(caseItem.client_id)}</span>
                                </div>

                                {caseItem.value && (
                                  <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                                    <DollarSign className="w-3 h-3" />
                                    <span>{formatCurrency(caseItem.value)}</span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{days} ימים</span>
                                  </div>
                                  {caseItem.assigned_to && (
                                    <Badge variant="outline" className="text-xs">
                                      {caseItem.assigned_to}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {columnCases.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">אין תיקים</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}