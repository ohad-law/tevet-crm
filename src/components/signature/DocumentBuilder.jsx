import React, { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import {
    Type, PenTool, Calendar, Hash, CheckSquare, Trash2,
    Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

export default function DocumentBuilder({ fileUrl, fields, setFields }) {
    const [scale, setScale] = useState(1.0);
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [activeToolType, setActiveToolType] = useState(null);
    const pageContainerRef = useRef(null);

    const onDocumentLoadSuccess = useCallback(({ numPages }) => {
        setNumPages(numPages);
        setIsLoading(false);
        setLoadError(null);
    }, []);

    const onDocumentLoadError = useCallback((error) => {
        console.error("PDF load error:", error);
        setIsLoading(false);
        setLoadError(error?.message || "שגיאה בטעינת המסמך");
    }, []);

    // Click on page to place field
    const handlePageClick = (e) => {
        if (!activeToolType) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newField = {
            id: crypto.randomUUID(),
            type: activeToolType,
            page: currentPage,
            x: Math.min(Math.max(x - 10, 0), 80),
            y: Math.min(Math.max(y - 2.5, 0), 90),
            width: 20,
            height: 5,
            label: getLabelForType(activeToolType)
        };

        setFields([...fields, newField]);
        // Keep tool active for multiple placements, user can press ESC or click tool again to deselect
    };

    // Keyboard shortcut to cancel tool
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setActiveToolType(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const removeField = (id) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const handleFieldDrag = (e, fieldId) => {
        e.preventDefault();
        const field = fields.find(f => f.id === fieldId);
        if (!field || !pageContainerRef.current) return;

        const pageRect = pageContainerRef.current.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const startFieldX = field.x;
        const startFieldY = field.y;

        const onMouseMove = (moveEvent) => {
            const deltaX = ((moveEvent.clientX - startX) / pageRect.width) * 100;
            const deltaY = ((moveEvent.clientY - startY) / pageRect.height) * 100;

            setFields(prevFields => prevFields.map(f => {
                if (f.id !== fieldId) return f;
                return {
                    ...f,
                    x: Math.min(Math.max(startFieldX + deltaX, 0), 80),
                    y: Math.min(Math.max(startFieldY + deltaY, 0), 90)
                };
            }));
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const getIconForType = (type) => {
        switch(type) {
            case 'signature': return <PenTool className="w-4 h-4" />;
            case 'text': return <Type className="w-4 h-4" />;
            case 'date': return <Calendar className="w-4 h-4" />;
            case 'checkbox': return <CheckSquare className="w-4 h-4" />;
            case 'full_name': return <Type className="w-4 h-4" />;
            case 'id_number': return <Hash className="w-4 h-4" />;
            default: return <Hash className="w-4 h-4" />;
        }
    };

    const getLabelForType = (type) => {
        const labels = {
            signature: "חתימה",
            text: "טקסט",
            date: "תאריך",
            checkbox: "סימון",
            full_name: "שם מלא",
            id_number: "ת.ז."
        };
        return labels[type] || type;
    };

    const toolButtons = [
        { type: 'signature', label: 'חתימה', icon: <PenTool className="w-4 h-4" />, color: 'blue' },
        { type: 'date', label: 'תאריך', icon: <Calendar className="w-4 h-4" />, color: 'slate' },
        { type: 'text', label: 'טקסט', icon: <Type className="w-4 h-4" />, color: 'slate' },
    ];

    return (
        <div className="flex flex-col h-[80vh] border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
            {/* Top Toolbar */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">הוסף שדה:</span>
                    {toolButtons.map(tool => (
                        <Button
                            key={tool.type}
                            variant={activeToolType === tool.type ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveToolType(activeToolType === tool.type ? null : tool.type)}
                            className={cn(
                                "gap-2",
                                activeToolType === tool.type && "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            {tool.icon}
                            {tool.label}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setScale(s => Math.max(0.5, s - 0.1))} disabled={scale <= 0.5}>
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium w-14 text-center">{Math.round(scale * 100)}%</span>
                    <Button variant="ghost" size="sm" onClick={() => setScale(s => Math.min(1.5, s + 0.1))} disabled={scale >= 1.5}>
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Active Tool Indicator */}
            {activeToolType && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-700">
                        <PenTool className="w-4 h-4" />
                        <span className="text-sm font-medium">מצב ציור: לחץ על העמוד כדי למקם {getLabelForType(activeToolType)}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveToolType(null)} className="text-blue-700 hover:text-blue-900">
                        ביטול (Esc)
                    </Button>
                </div>
            )}

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto flex justify-center p-6 bg-slate-200/50">
                <div className="relative">
                    <Document
                        file={fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                            <div className="flex items-center justify-center h-[600px] w-[500px] bg-white rounded shadow">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        }
                        error={
                            <div className="flex flex-col items-center justify-center h-[600px] w-[500px] bg-white rounded shadow text-red-500 gap-2">
                                <span>שגיאה בטעינת המסמך</span>
                                {loadError && <span className="text-xs text-slate-400">{loadError}</span>}
                            </div>
                        }
                    >
                        <div 
                            ref={pageContainerRef}
                            className={cn(
                                "relative bg-white shadow-lg rounded",
                                activeToolType && "cursor-crosshair"
                            )}
                            onClick={handlePageClick}
                        >
                            <Page 
                                pageNumber={currentPage} 
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />
                            
                            {/* Fields Overlay */}
                            {fields.filter(f => f.page === currentPage).map((field) => (
                                <div
                                    key={field.id}
                                    className={cn(
                                        "absolute cursor-move group",
                                        field.type === 'signature' 
                                            ? "border-2 border-dashed border-blue-500 bg-blue-50/30" 
                                            : "border-2 border-dashed border-slate-400 bg-slate-50/30"
                                    )}
                                    style={{
                                        left: `${field.x}%`,
                                        top: `${field.y}%`,
                                        width: `${field.width}%`,
                                        minHeight: '40px',
                                        padding: '8px'
                                    }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleFieldDrag(e, field.id);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center gap-1 text-xs font-medium h-full",
                                        field.type === 'signature' ? "text-blue-600" : "text-slate-600"
                                    )}>
                                        {getIconForType(field.type)}
                                        {field.label}
                                    </div>
                                    
                                    {/* Delete button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-600"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Document>
                </div>
            </div>

            {/* Page Navigation */}
            {numPages > 1 && (
                <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                        עמוד {currentPage} מתוך {numPages}
                    </span>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                        disabled={currentPage >= numPages}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}