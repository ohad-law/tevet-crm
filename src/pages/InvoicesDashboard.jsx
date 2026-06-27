import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Receipt, Download, RefreshCw, Search, FileText, 
    Calendar, Building2, DollarSign, Mail, CheckCircle2,
    AlertCircle, Eye, Loader2, Filter, Trash2
} from "lucide-react";
import { 
    Table, TableBody, TableCell, TableHead, 
    TableHeader, TableRow 
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export default function InvoicesDashboard() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await base44.entities.Invoice.list("-email_date");
            setInvoices(data);
        } catch (error) {
            console.error("Error loading invoices:", error);
        }
        setLoading(false);
    };

    const handleImportFromEmail = async () => {
        setImporting(true);
        setImportResult(null);
        try {
            const res = await base44.functions.invoke("fetchInvoicesFromEmail", { daysBack: 30 });
            setImportResult(res.data);
            if (res.data?.imported > 0) {
                await loadInvoices();
            }
        } catch (error) {
            console.error("Import error:", error);
            setImportResult({ error: error.message });
        }
        setImporting(false);
    };

    const handleStatusChange = async (invoiceId, newStatus) => {
        try {
            await base44.entities.Invoice.update(invoiceId, { status: newStatus });
            setInvoices(prev => prev.map(inv => 
                inv.id === invoiceId ? { ...inv, status: newStatus } : inv
            ));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDelete = async (invoiceId) => {
        if (!confirm("האם למחוק את החשבונית?")) return;
        try {
            await base44.entities.Invoice.delete(invoiceId);
            setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = !searchTerm || 
            inv.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.email_subject?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
        const matchesType = typeFilter === "all" || inv.invoice_type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });

    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalVat = filteredInvoices.reduce((sum, inv) => sum + (inv.vat_amount || 0), 0);

    const getStatusBadge = (status) => {
        const styles = {
            'חדש': 'bg-blue-100 text-blue-800 border-blue-200',
            'מעובד': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'מאושר': 'bg-green-100 text-green-800 border-green-200',
            'נדחה': 'bg-red-100 text-red-800 border-red-200'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const getTypeBadge = (type) => {
        const styles = {
            'חשבונית מס': 'bg-purple-100 text-purple-800',
            'חשבונית מס קבלה': 'bg-indigo-100 text-indigo-800',
            'קבלה': 'bg-teal-100 text-teal-800',
            'חשבונית עסקה': 'bg-orange-100 text-orange-800',
            'חשבונית': 'bg-blue-100 text-blue-800',
            'אחר': 'bg-gray-100 text-gray-800'
        };
        return styles[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Receipt className="w-8 h-8 text-blue-600" />
                        ניהול חשבוניות
                    </h1>
                    <p className="text-slate-500 mt-1">ייבוא וניהול חשבוניות מהמייל</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={loadInvoices} 
                        variant="outline"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                        רענן
                    </Button>
                    <Button 
                        onClick={handleImportFromEmail}
                        disabled={importing}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {importing ? (
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        ) : (
                            <Mail className="w-4 h-4 ml-2" />
                        )}
                        ייבא מהמייל
                    </Button>
                </div>
            </div>

            {/* Import Result */}
            <AnimatePresence>
                {importResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <Card className={`border-2 ${importResult.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                            <CardContent className="p-4 flex items-center gap-3">
                                {importResult.error ? (
                                    <>
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-red-800">שגיאה: {importResult.error}</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <span className="text-green-800">{importResult.message}</span>
                                        {importResult.total_scanned > 0 && (
                                            <span className="text-green-600 text-sm">
                                                (נסרקו {importResult.total_scanned} מיילים)
                                            </span>
                                        )}
                                    </>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="mr-auto"
                                    onClick={() => setImportResult(null)}
                                >
                                    סגור
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">סה"כ חשבוניות</p>
                                <p className="text-3xl font-bold text-blue-900">{filteredInvoices.length}</p>
                            </div>
                            <FileText className="w-10 h-10 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">סה"כ סכום</p>
                                <p className="text-3xl font-bold text-green-900">{totalAmount.toLocaleString()} ₪</p>
                            </div>
                            <DollarSign className="w-10 h-10 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-600 font-medium">סה"כ מע"מ</p>
                                <p className="text-3xl font-bold text-purple-900">{totalVat.toLocaleString()} ₪</p>
                            </div>
                            <Receipt className="w-10 h-10 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-amber-600 font-medium">ממתינות לאישור</p>
                                <p className="text-3xl font-bold text-amber-900">
                                    {invoices.filter(i => i.status === 'חדש').length}
                                </p>
                            </div>
                            <AlertCircle className="w-10 h-10 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="חיפוש לפי שם ספק, מספר חשבונית..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="סטטוס" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">כל הסטטוסים</SelectItem>
                                <SelectItem value="חדש">חדש</SelectItem>
                                <SelectItem value="מעובד">מעובד</SelectItem>
                                <SelectItem value="מאושר">מאושר</SelectItem>
                                <SelectItem value="נדחה">נדחה</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="סוג מסמך" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">כל הסוגים</SelectItem>
                                <SelectItem value="חשבונית מס">חשבונית מס</SelectItem>
                                <SelectItem value="חשבונית מס קבלה">חשבונית מס קבלה</SelectItem>
                                <SelectItem value="קבלה">קבלה</SelectItem>
                                <SelectItem value="חשבונית">חשבונית</SelectItem>
                                <SelectItem value="אחר">אחר</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-12">
                            <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">לא נמצאו חשבוניות</p>
                            <Button 
                                onClick={handleImportFromEmail} 
                                className="mt-4"
                                disabled={importing}
                            >
                                <Mail className="w-4 h-4 ml-2" />
                                ייבא חשבוניות מהמייל
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-right">תאריך</TableHead>
                                    <TableHead className="text-right">ספק</TableHead>
                                    <TableHead className="text-right">מספר</TableHead>
                                    <TableHead className="text-right">סוג</TableHead>
                                    <TableHead className="text-right">סכום</TableHead>
                                    <TableHead className="text-right">מע"מ</TableHead>
                                    <TableHead className="text-right">סטטוס</TableHead>
                                    <TableHead className="text-center">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvoices.map((invoice) => (
                                    <TableRow key={invoice.id} className="hover:bg-slate-50">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {invoice.invoice_date ? 
                                                    new Date(invoice.invoice_date).toLocaleDateString('he-IL') :
                                                    new Date(invoice.email_date).toLocaleDateString('he-IL')
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{invoice.vendor_name || '-'}</p>
                                                {invoice.ai_extracted && (
                                                    <span className="text-xs text-blue-500">🤖 AI</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {invoice.invoice_number || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getTypeBadge(invoice.invoice_type)}>
                                                {invoice.invoice_type || 'לא ידוע'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {invoice.amount ? `${invoice.amount.toLocaleString()} ₪` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {invoice.vat_amount ? `${invoice.vat_amount.toLocaleString()} ₪` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={invoice.status}
                                                onValueChange={(val) => handleStatusChange(invoice.id, val)}
                                            >
                                                <SelectTrigger className={`w-28 h-8 ${getStatusBadge(invoice.status)}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="חדש">חדש</SelectItem>
                                                    <SelectItem value="מעובד">מעובד</SelectItem>
                                                    <SelectItem value="מאושר">מאושר</SelectItem>
                                                    <SelectItem value="נדחה">נדחה</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedInvoice(invoice)}
                                                    title="צפייה"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {invoice.file_url && (
                                                    <a href={invoice.file_url} target="_blank" rel="noreferrer">
                                                        <Button variant="ghost" size="icon" title="הורדה">
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(invoice.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="מחיקה"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Invoice Detail Modal */}
            <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-blue-600" />
                            פרטי חשבונית
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedInvoice && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-slate-500">ספק</p>
                                        <p className="font-bold text-lg">{selectedInvoice.vendor_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">ח.פ/ע.מ</p>
                                        <p className="font-medium">{selectedInvoice.vendor_id || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">מספר חשבונית</p>
                                        <p className="font-medium">{selectedInvoice.invoice_number || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">תאריך</p>
                                        <p className="font-medium">
                                            {selectedInvoice.invoice_date ? 
                                                new Date(selectedInvoice.invoice_date).toLocaleDateString('he-IL') : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-slate-500">סוג מסמך</p>
                                        <Badge className={getTypeBadge(selectedInvoice.invoice_type)}>
                                            {selectedInvoice.invoice_type}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">סכום לפני מע"מ</p>
                                        <p className="font-bold">{selectedInvoice.amount_before_vat?.toLocaleString() || '-'} ₪</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">מע"מ</p>
                                        <p className="font-bold text-purple-600">{selectedInvoice.vat_amount?.toLocaleString() || '-'} ₪</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">סכום כולל</p>
                                        <p className="font-bold text-xl text-green-600">{selectedInvoice.amount?.toLocaleString() || '-'} ₪</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-sm text-slate-500 mb-2">פרטי המייל</p>
                                <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                                    <p><strong>נושא:</strong> {selectedInvoice.email_subject}</p>
                                    <p><strong>שולח:</strong> {selectedInvoice.email_sender}</p>
                                    <p><strong>תאריך:</strong> {new Date(selectedInvoice.email_date).toLocaleString('he-IL')}</p>
                                </div>
                            </div>

                            {selectedInvoice.file_url && (
                                <div className="border-t pt-4">
                                    <p className="text-sm text-slate-500 mb-2">תצוגת מסמך</p>
                                    <iframe
                                        src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedInvoice.file_url)}&embedded=true`}
                                        className="w-full h-96 border rounded-lg"
                                        title="תצוגת חשבונית"
                                    />
                                    <a href={selectedInvoice.file_url} target="_blank" rel="noreferrer">
                                        <Button variant="outline" className="mt-2 w-full">
                                            <Download className="w-4 h-4 ml-2" />
                                            הורד קובץ
                                        </Button>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}