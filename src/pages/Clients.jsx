import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Search, Mail, Phone, MapPin, Download, FileSpreadsheet, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import ClientForm from "../components/clients/ClientForm";
import DataImporter from "../components/import/DataImporter";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClassification, setFilterClassification] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    const data = await base44.entities.Client.list("-created_date");
    setClients(data);
    setIsLoading(false);
  };

  const handleSubmit = async (clientData) => {
    let action = 'create';
    if (editingClient) {
      await base44.entities.Client.update(editingClient.id, clientData);
      action = 'update';
    } else {
      await base44.entities.Client.create(clientData);
    }

    // Notify Admin
    base44.functions.invoke('notifyAdmin', {
        entity: 'Client',
        action: action,
        details: `${action === 'create' ? 'נוצר' : 'עודכן'} לקוח:\nשם: ${clientData.full_name}\nטלפון: ${clientData.phone}`
    });

    setShowForm(false);
    setEditingClient(null);
    loadClients();
  };

  const handleImport = async (data) => {
    await base44.entities.Client.bulkCreate(data);
    setShowImporter(false);
    loadClients();
  };

  const downloadExcel = async () => {
    setIsExporting(true);
    const exportData = filteredClients.map(client => ({
      'שם מלא': client.full_name,
      'תעודת זהות': client.id_number || '',
      'טלפון': client.phone,
      'אימייל': client.email || '',
      'כתובת': client.address || '',
      'סיווג': client.classification,
      'סטטוס': client.status,
      'תאריך הצטרפות': client.join_date ? new Date(client.join_date).toLocaleDateString('he-IL') : ''
    }));

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => {
        const value = row[header];
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `לקוחות_${new Date().toLocaleDateString('he-IL')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm);
    
    const matchesStatus = filterStatus === "all" || client.status === filterStatus;
    const matchesClassification = filterClassification === "all" || client.classification === filterClassification;
    
    return matchesSearch && matchesStatus && matchesClassification;
  });

  const classificationColors = {
    'פרטי': 'bg-blue-50 text-blue-700 border-blue-200',
    'תאגיד': 'bg-purple-50 text-purple-700 border-purple-200',
    'עובד זר': 'bg-amber-50 text-amber-700 border-amber-200'
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight">לקוחות</h1>
          <p className="text-slate-500 text-sm md:text-lg">מאגר לקוחות וניהול קשרי לקוחות</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowImporter(true)}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 flex-1 md:flex-none text-xs md:text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 ml-1 md:ml-2" />
            ייבוא
          </Button>
          <Button
            variant="outline"
            onClick={downloadExcel}
            disabled={isExporting || filteredClients.length === 0}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 flex-1 md:flex-none text-xs md:text-sm"
          >
            <Download className="w-4 h-4 ml-1 md:ml-2" />
            ייצוא
          </Button>
          <Button
            onClick={() => {
              setEditingClient(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 text-white w-full md:w-auto text-sm"
          >
            <Plus className="w-5 h-5 ml-2" />
            לקוח חדש
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <ClientForm
            client={editingClient}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingClient(null);
            }}
          />
        )}
        {showImporter && (
          <DataImporter
            entityName="Client"
            schema={base44.entities.Client.schema()}
            onImportComplete={handleImport}
            onCancel={() => setShowImporter(false)}
          />
        )}
      </AnimatePresence>

      <Card className="mb-6 shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-600">סינון וחיפוש</span>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="חיפוש לפי שם, טלפון או מייל..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 border-slate-200 focus:border-blue-500"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="פעיל">פעיל</SelectItem>
                <SelectItem value="לא פעיל">לא פעיל</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterClassification} onValueChange={setFilterClassification}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="סיווג" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסיווגים</SelectItem>
                <SelectItem value="פרטי">פרטי</SelectItem>
                <SelectItem value="תאגיד">תאגיד</SelectItem>
                <SelectItem value="עובד זר">עובד זר</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <AnimatePresence>
          {filteredClients.map((client) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="hover:shadow-md transition-all duration-300 border border-slate-200 bg-white group">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <Link to={createPageUrl(`ClientDetails?id=${client.id}`)} className="flex-1 w-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0 border border-blue-100">
                          <span className="text-lg font-bold text-blue-600">
                            {client.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{client.full_name}</h3>
                            <Badge variant={client.status === 'פעיל' ? 'default' : 'secondary'} className={client.status === 'פעיל' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                              {client.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>הצטרף: {client.join_date ? new Date(client.join_date).toLocaleDateString('he-IL') : '-'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <Badge variant="outline" className={`${classificationColors[client.classification]} border shadow-none font-normal`}>
                              {client.classification}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          {client.phone ? (
                            <a 
                              href={`https://wa.me/972${client.phone.replace(/^0/, '').replace(/[-\s]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-green-600 hover:text-green-700 hover:underline flex items-center gap-1"
                            >
                              {client.phone}
                              <span className="text-xs">💬</span>
                            </a>
                          ) : (
                            <span className="font-medium text-slate-700">-</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-slate-700 truncate">{client.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-400">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-slate-700 truncate">{client.address || '-'}</span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingClient(client);
                          setShowForm(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full md:w-auto border-slate-200 hover:bg-slate-50 text-slate-700"
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        ערוך פרטים
                      </Button>
                      <Link to={createPageUrl(`ClientDetails?id=${client.id}`)}>
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white"
                        >
                          תיק לקוח
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredClients.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">לא נמצאו לקוחות</h3>
            <p className="text-slate-500">נסה לשנות את מונחי החיפוש או הסינון</p>
          </div>
        )}
      </div>
    </div>
  );
}