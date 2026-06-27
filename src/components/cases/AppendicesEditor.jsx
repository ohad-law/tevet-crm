import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
    FileText, 
    Upload, 
    Trash2, 
    GripVertical, 
    FilePlus, 
    Download, 
    Loader2, 
    FileCheck,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AppendicesEditor({ caseId }) {
    const [mainFile, setMainFile] = useState(null);
    const [appendices, setAppendices] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const mainInputRef = useRef(null);
    const appendInputRef = useRef(null);

    const handleFileUpload = async (file, type) => {
        try {
            // Upload to storage first
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            if (type === 'main') {
                setMainFile({
                    file,
                    url: file_url,
                    name: file.name
                });
            } else {
                setAppendices(prev => [...prev, {
                    id: `app-${Date.now()}`,
                    file,
                    url: file_url,
                    name: file.name,
                    title: file.name.split('.').slice(0, -1).join('.') // Default title without extension
                }]);
            }
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("שגיאה בהעלאת הקובץ");
        }
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        
        const items = Array.from(appendices);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        setAppendices(items);
    };

    const fetchPdfBytes = async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch PDF: ${url}`);
        return await response.arrayBuffer();
    };

    const handleGenerate = async () => {
        if (!mainFile) {
            toast.error("נא להעלות כתב טענות ראשי");
            return;
        }

        setIsGenerating(true);
        setDownloadUrl(null);

        try {
            // Use pre-uploaded Heebo Hebrew font
            const hebrewFontUrl = "https://base44.app/api/apps/68dafceada48410b1d774f3f/files/public/68dafceada48410b1d774f3f/20ef13ab6_Heebo-Bold.ttf";
            const fontBytes = await fetch(hebrewFontUrl).then(r => r.arrayBuffer());

            // Load all PDFs first (to know page counts for TOC)
            const mainBytes = await fetchPdfBytes(mainFile.url);
            const mainPdf = await PDFDocument.load(mainBytes);

            const appendixPdfs = [];
            for (const app of appendices) {
                const bytes = await fetchPdfBytes(app.url);
                const pdf = await PDFDocument.load(bytes);
                appendixPdfs.push(pdf);
            }

            const mergedPdf = await PDFDocument.create();
            // Register fontkit for custom Hebrew font embedding
            const fontkitModule = await import("@pdf-lib/fontkit");
            mergedPdf.registerFontkit(fontkitModule.default || fontkitModule);
            const hebrewFont = await mergedPdf.embedFont(fontBytes);
            const numFont = await mergedPdf.embedFont(StandardFonts.Helvetica);

            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;

            // Helper: no-op — Heebo font handles Hebrew natively
            const rtl = (text) => text;

            // Calculate page start positions for each appendix
            const mainPageCount = mainPdf.getPageCount();
            // TOC page will be added after main doc
            // Each appendix gets a separator page + its content
            let pageCounter = mainPageCount + 1; // +1 for TOC page
            const appendixInfo = appendices.map((app, i) => {
                const separatorPage = pageCounter + 1; // the separator page number
                const startPage = separatorPage + 1;
                const endPage = startPage + appendixPdfs[i].getPageCount() - 1;
                pageCounter = endPage;
                return { ...app, separatorPage, startPage, endPage, index: i + 1 };
            });

            // Copy main doc pages
            const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
            mainPages.forEach(p => mergedPdf.addPage(p));

            // Add TOC page (after main doc)
            if (appendices.length > 0) {
                const tocPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
                // Title: נספחים
                const title = rtl("נספחים");
                const titleWidth = hebrewFont.widthOfTextAtSize(title, 28);
                tocPage.drawText(title, {
                    x: A4_WIDTH / 2 - titleWidth / 2,
                    y: A4_HEIGHT - 120,
                    size: 28,
                    font: hebrewFont,
                    color: rgb(0, 0, 0),
                });

                // Table rows
                appendixInfo.forEach((info, idx) => {
                    const rowY = A4_HEIGHT - 200 - idx * 50;
                    // Separator line
                    tocPage.drawLine({
                        start: { x: 70, y: rowY + 18 },
                        end: { x: A4_WIDTH - 70, y: rowY + 18 },
                        thickness: 0.5,
                        color: rgb(0.75, 0.75, 0.75),
                    });

                    // "נספח X" label (right side)
                    const label = rtl(`נספח ${info.index}`);
                    tocPage.drawText(label, {
                        x: A4_WIDTH - 70 - hebrewFont.widthOfTextAtSize(label, 13),
                        y: rowY,
                        size: 13,
                        font: hebrewFont,
                        color: rgb(0.1, 0.1, 0.1),
                    });

                    // Title (center-right)
                    const titleText = rtl(info.title);
                    const titleTextWidth = hebrewFont.widthOfTextAtSize(titleText, 13);
                    tocPage.drawText(titleText, {
                        x: A4_WIDTH / 2 - titleTextWidth / 2 + 30,
                        y: rowY,
                        size: 13,
                        font: hebrewFont,
                        color: rgb(0.15, 0.15, 0.15),
                    });

                    // Page number (left side)
                    const pageText = `${info.startPage}`;
                    tocPage.drawText(rtl(`עמוד ${pageText}`), {
                        x: 70,
                        y: rowY,
                        size: 13,
                        font: hebrewFont,
                        color: rgb(0.3, 0.3, 0.3),
                    });
                });
                // Bottom separator line
                const lastRowY = A4_HEIGHT - 200 - appendixInfo.length * 50;
                tocPage.drawLine({
                    start: { x: 70, y: lastRowY + 18 },
                    end: { x: A4_WIDTH - 70, y: lastRowY + 18 },
                    thickness: 0.5,
                    color: rgb(0.75, 0.75, 0.75),
                });
            }

            // For each appendix: add separator page then its pages
            for (let i = 0; i < appendices.length; i++) {
                const info = appendixInfo[i];
                const appPdf = appendixPdfs[i];

                // Separator page
                const sepPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
                const numText = rtl(`נספח ${info.index}`);
                const numWidth = hebrewFont.widthOfTextAtSize(numText, 24);
                sepPage.drawText(numText, {
                    x: A4_WIDTH / 2 - numWidth / 2,
                    y: A4_HEIGHT / 2 + 80,
                    size: 24,
                    font: hebrewFont,
                    color: rgb(0, 0, 0),
                });

                const titleRtl = rtl(info.title);
                const titleRtlWidth = hebrewFont.widthOfTextAtSize(titleRtl, 20);
                sepPage.drawText(titleRtl, {
                    x: A4_WIDTH / 2 - titleRtlWidth / 2,
                    y: A4_HEIGHT / 2 + 20,
                    size: 20,
                    font: hebrewFont,
                    color: rgb(0, 0, 0),
                });

                const pagesText = `${info.endPage} - ${info.startPage}`;
                const pagesLabel = rtl(`עמודים ${pagesText}`);
                const pagesWidth = hebrewFont.widthOfTextAtSize(pagesLabel, 16);
                sepPage.drawText(pagesLabel, {
                    x: A4_WIDTH / 2 - pagesWidth / 2,
                    y: A4_HEIGHT / 2 - 40,
                    size: 16,
                    font: hebrewFont,
                    color: rgb(0.3, 0.3, 0.3),
                });

                // Appendix content pages
                const appPages = await mergedPdf.copyPages(appPdf, appPdf.getPageIndices());
                appPages.forEach(p => mergedPdf.addPage(p));
            }

            // Add page numbers at bottom of every page
            const totalPages = mergedPdf.getPageCount();
            mergedPdf.getPages().forEach((page, i) => {
                const { width } = page.getSize();
                page.drawText(`${i + 1} / ${totalPages}`, {
                    x: width / 2 - 18,
                    y: 18,
                    size: 10,
                    font: numFont,
                    color: rgb(0.5, 0.5, 0.5),
                });
            });

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            toast.success("הקובץ נוצר בהצלחה! לחץ להורדה");

        } catch (error) {
            console.error("Generation failed", error);
            toast.error("שגיאה ביצירת הקובץ המאוחד: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        עורך נספחים
                    </h2>
                    <p className="text-slate-500">צור קובץ מאוחד עם תוכן עניינים ומספור עמודים אוטומטי</p>
                </div>
                {downloadUrl && (
                    <a href={downloadUrl} download={`bundle-${caseId || 'merged'}.pdf`} target="_blank" rel="noreferrer">
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Download className="w-4 h-4 ml-2" />
                            הורד קובץ מוכן
                        </Button>
                    </a>
                )}
            </div>

            {/* Step 1: Main Document */}
            <Card className={cn("border-dashed border-2 transition-colors", mainFile ? "border-blue-200 bg-blue-50/30" : "border-slate-200")}>
                <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                        <h3 className="font-bold text-lg">כתב טענות ראשי</h3>
                    </div>
                    
                    {!mainFile ? (
                        <div 
                            className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => mainInputRef.current?.click()}
                        >
                            <Upload className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-lg font-medium text-slate-700">העלה או גרור קובץ</p>
                            <p className="text-sm text-slate-400">PDF בלבד</p>
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                className="hidden" 
                                ref={mainInputRef}
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'main')}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-200 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <FileText className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{mainFile.name}</p>
                                    <p className="text-xs text-slate-500">מסמך ראשי</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setMainFile(null)} className="text-red-500 hover:bg-red-50">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Step 2: Appendices */}
            <Card className="border-slate-200">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                            <h3 className="font-bold text-lg">נספחים</h3>
                        </div>
                        <Button variant="outline" onClick={() => appendInputRef.current?.click()}>
                            <Plus className="w-4 h-4 ml-2" />
                            הוסף נספח
                        </Button>
                        <input 
                            type="file" 
                            accept="application/pdf" 
                            multiple
                            className="hidden" 
                            ref={appendInputRef}
                            onChange={(e) => {
                                Array.from(e.target.files || []).forEach(file => handleFileUpload(file, 'appendix'));
                            }}
                        />
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="appendices">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                    {appendices.map((app, index) => (
                                        <Draggable key={app.id} draggableId={app.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={cn(
                                                        "flex items-center gap-4 p-3 bg-white border rounded-xl group hover:border-blue-300 transition-colors",
                                                        snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500" : "border-slate-200"
                                                    )}
                                                >
                                                    <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-600 cursor-grab">
                                                        <GripVertical className="w-5 h-5" />
                                                    </div>
                                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-mono font-bold text-slate-500 text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <Input 
                                                            value={app.title}
                                                            onChange={(e) => {
                                                                const newApps = [...appendices];
                                                                newApps[index].title = e.target.value;
                                                                setAppendices(newApps);
                                                            }}
                                                            className="border-transparent hover:border-slate-200 focus:border-blue-500 h-9 font-medium"
                                                            placeholder="שם הנספח"
                                                        />
                                                    </div>
                                                    <div className="text-xs text-slate-400 px-2 max-w-[150px] truncate" title={app.name}>
                                                        {app.name}
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => {
                                                            setAppendices(prev => prev.filter(item => item.id !== app.id));
                                                        }}
                                                        className="text-slate-400 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {appendices.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                            <FilePlus className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">לא נוספו נספחים עדיין</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Button 
                    size="lg" 
                    onClick={handleGenerate} 
                    disabled={!mainFile || isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 text-lg px-8 py-6 h-auto rounded-xl"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                            מעבד מסמכים...
                        </>
                    ) : (
                        <>
                            <FileCheck className="w-5 h-5 ml-2" />
                            צור קובץ מאוחד
                        </>
                    )}
                </Button>
            </div>
            
            {/* Warning/Info Box */}
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>
                    שים לב: תהליך יצירת הקובץ עשוי לקחת מספר שניות בהתאם לגודל המסמכים.
                    <br />
                    תוכן העניינים ייווצר אוטומטית בעמוד שאחרי כתב הטענות הראשי.
                    <br />
                    מספור עמודים יתווסף לכל המסמך בתחתית העמוד.
                </p>
            </div>
        </div>
    );
}

// Icon import helper
function Plus(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}