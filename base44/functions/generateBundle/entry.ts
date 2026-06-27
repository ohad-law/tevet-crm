import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { PDFDocument, rgb } from 'npm:pdf-lib@1.17.1';
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1';

// כתובות קבועות לפונטים - David Libre מהעזרים למערכת
const FONT_REGULAR_URL = "https://base44.app/api/apps/68dafceada48410b1d774f3f/files/public/68dafceada48410b1d774f3f/caf890dc8_DavidLibre-Regular1.ttf";
const FONT_BOLD_URL = "https://base44.app/api/apps/68dafceada48410b1d774f3f/files/public/68dafceada48410b1d774f3f/2040b8569_DavidLibre-Bold1.ttf";

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    try {
        const input = await req.json();
        const { mainDocUrl, appendices } = input;

        const fetchFile = async (url) => {
            console.log(`Fetching file from: ${url}`);
            const res = await fetch(url, { headers: { 'User-Agent': 'Base44-PDF-Gen' } });
            if (!res.ok) throw new Error(`Failed to fetch ${url} (Status: ${res.status})`);
            return await res.arrayBuffer();
        };

        const appendixList = appendices || [];
        
        // טעינת כל הקבצים
        const [mainPdfBytes, fontBytes, fontBoldBytes, ...appendicesBytes] = await Promise.all([
            fetchFile(mainDocUrl),
            fetchFile(FONT_REGULAR_URL),
            fetchFile(FONT_BOLD_URL),
            ...appendixList.map(app => fetchFile(app.url))
        ]);

        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);
        
        const customFont = await pdfDoc.embedFont(fontBytes);
        const customFontBold = await pdfDoc.embedFont(fontBoldBytes);

        // ===== מכאן הלוגיקה הרגילה של בניית המסמך =====
        const mainPdf = await PDFDocument.load(mainPdfBytes, { ignoreEncryption: true });
        const mainPagesToCopy = await pdfDoc.copyPages(mainPdf, mainPdf.getPageIndices());
        
        // הכנה לתוכן עניינים
        // סדר: מסמך ראשי (mainPagesToCopy.length עמודים) -> תוכן עניינים (1 עמוד) -> נספחים
        const appendixData = [];
        let currentPageCounter = mainPagesToCopy.length + 1 + 1; // מסמך ראשי + תוכן עניינים + 1
        const tocEntries = [];

        for (let i = 0; i < appendixList.length; i++) {
            const appPdf = await PDFDocument.load(appendicesBytes[i], { ignoreEncryption: true });
            const appPagesToCopy = await pdfDoc.copyPages(appPdf, appPdf.getPageIndices());
            const title = appendixList[i].title || `נספח ${i + 1}`;
            
            tocEntries.push({ index: i + 1, title: title, startPage: currentPageCounter });
            appendixData.push({ 
                index: i + 1, 
                title: title, 
                pages: appPagesToCopy, 
                contentStartPage: currentPageCounter + 1,
                contentEndPage: currentPageCounter + appPagesToCopy.length 
            });
            currentPageCounter += 1 + appPagesToCopy.length;
        }

        // 1. הוספת המסמך הראשי קודם
        for (const page of mainPagesToCopy) pdfDoc.addPage(page);

        // 2. יצירת דף תוכן עניינים
        const tocPage = pdfDoc.addPage([595, 842]);
        const { width, height } = tocPage.getSize();

        // כותרת תוכן עניינים
        const tocTitle = "תוכן עניינים";
        tocPage.drawText(tocTitle, {
            x: (width - customFontBold.widthOfTextAtSize(tocTitle, 28)) / 2,
            y: height - 80, size: 28, font: customFontBold, color: rgb(0, 0, 0),
        });

        // טבלה RTL - הגדרות
        const tableLeft = 50;
        const tableRight = width - 50;
        const tableWidth = tableRight - tableLeft;
        const colPageWidth = 60;  // עמודת עמוד (שמאל)
        const colNumWidth = 60;   // עמודת מספר (ימין)
        const colTitleWidth = tableWidth - colPageWidth - colNumWidth; // עמודת שם נספח (אמצע)
        
        const headerY = height - 140;
        const rowHeight = 30;
        
        // ציור קו עליון של הטבלה
        tocPage.drawLine({ start: { x: tableLeft, y: headerY + 15 }, end: { x: tableRight, y: headerY + 15 }, thickness: 1, color: rgb(0, 0, 0) });
        
        // כותרות הטבלה (RTL: מספר בימין, שם באמצע, עמוד בשמאל)
        tocPage.drawText("מספר", { x: tableRight - colNumWidth + 10, y: headerY, size: 14, font: customFontBold });
        tocPage.drawText("שם הנספח", { x: tableLeft + colPageWidth + (colTitleWidth / 2) - 30, y: headerY, size: 14, font: customFontBold });
        tocPage.drawText("עמוד", { x: tableLeft + 10, y: headerY, size: 14, font: customFontBold });
        
        // ציור קו מתחת לכותרות
        tocPage.drawLine({ start: { x: tableLeft, y: headerY - 10 }, end: { x: tableRight, y: headerY - 10 }, thickness: 1, color: rgb(0, 0, 0) });

        // מילוי שורות הטבלה
        let currentY = headerY - 35;
        for (const entry of tocEntries) {
            // מספר נספח (ימין)
            tocPage.drawText(entry.index.toString(), { x: tableRight - colNumWidth + 25, y: currentY, size: 12, font: customFont });
            
            // שם נספח (אמצע - מיושר לימין)
            tocPage.drawText(entry.title, { x: tableRight - colNumWidth - 20 - customFont.widthOfTextAtSize(entry.title, 12), y: currentY, size: 12, font: customFont });
            
            // מספר עמוד (שמאל)
            tocPage.drawText(entry.startPage.toString(), { x: tableLeft + 25, y: currentY, size: 12, font: customFont });
            
            // קו מפריד בין שורות
            tocPage.drawLine({ start: { x: tableLeft, y: currentY - 10 }, end: { x: tableRight, y: currentY - 10 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
            
            currentY -= rowHeight;
        }
        
        // קווים אנכיים של הטבלה
        const tableBottom = currentY + rowHeight - 10;
        tocPage.drawLine({ start: { x: tableLeft, y: headerY + 15 }, end: { x: tableLeft, y: tableBottom }, thickness: 1, color: rgb(0, 0, 0) });
        tocPage.drawLine({ start: { x: tableRight, y: headerY + 15 }, end: { x: tableRight, y: tableBottom }, thickness: 1, color: rgb(0, 0, 0) });
        tocPage.drawLine({ start: { x: tableLeft + colPageWidth, y: headerY + 15 }, end: { x: tableLeft + colPageWidth, y: tableBottom }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
        tocPage.drawLine({ start: { x: tableRight - colNumWidth, y: headerY + 15 }, end: { x: tableRight - colNumWidth, y: tableBottom }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });

        // 3. הוספת הנספחים עם דפי חיוץ
        for (const appData of appendixData) {
            const coverPage = pdfDoc.addPage([595, 842]);
            const cWidth = coverPage.getSize().width;
            const cHeight = coverPage.getSize().height;

            // מיקום באמצע העמוד
            const centerY = cHeight / 2;
            
            // שורה 1: "נספח X" - גודל 24 Bold
            const line1 = `נספח ${appData.index}`;
            coverPage.drawText(line1, { x: (cWidth - customFontBold.widthOfTextAtSize(line1, 24)) / 2, y: centerY + 60, size: 24, font: customFontBold });
            
            // שורה 2: שם הנספח - גודל 24 Bold
            const line2 = appData.title;
            coverPage.drawText(line2, { x: (cWidth - customFontBold.widthOfTextAtSize(line2, 24)) / 2, y: centerY, size: 24, font: customFontBold });
            
            // שורה 3: עמודים X עד Y או עמוד X (אם עמוד בודד) - גודל 24 Bold
            // מציירים כל חלק בנפרד כדי לשלוט בסדר התצוגה
            const startPage = appData.contentStartPage;
            const endPage = appData.contentEndPage;
            
            if (startPage === endPage) {
                const line3 = `עמוד ${startPage}`;
                coverPage.drawText(line3, { x: (cWidth - customFontBold.widthOfTextAtSize(line3, 24)) / 2, y: centerY - 60, size: 24, font: customFontBold });
            } else {
                // מציירים בנפרד: "עמודים" + מספר התחלה + "עד" + מספר סוף
                const textPages = "עמודים";
                const textTo = "עד";
                const startStr = startPage.toString();
                const endStr = endPage.toString();
                
                // חישוב רוחב כולל
                const totalWidth = customFontBold.widthOfTextAtSize(textPages, 24) + 10 +
                                   customFontBold.widthOfTextAtSize(startStr, 24) + 10 +
                                   customFontBold.widthOfTextAtSize(textTo, 24) + 10 +
                                   customFontBold.widthOfTextAtSize(endStr, 24);
                
                // נקודת התחלה (מימין לשמאל בעברית)
                let xPos = (cWidth + totalWidth) / 2;
                
                // מציירים מימין לשמאל
                xPos -= customFontBold.widthOfTextAtSize(textPages, 24);
                coverPage.drawText(textPages, { x: xPos, y: centerY - 60, size: 24, font: customFontBold });
                
                xPos -= 10 + customFontBold.widthOfTextAtSize(startStr, 24);
                coverPage.drawText(startStr, { x: xPos, y: centerY - 60, size: 24, font: customFontBold });
                
                xPos -= 10 + customFontBold.widthOfTextAtSize(textTo, 24);
                coverPage.drawText(textTo, { x: xPos, y: centerY - 60, size: 24, font: customFontBold });
                
                xPos -= 10 + customFontBold.widthOfTextAtSize(endStr, 24);
                coverPage.drawText(endStr, { x: xPos, y: centerY - 60, size: 24, font: customFontBold });
            }

            for (const page of appData.pages) pdfDoc.addPage(page);
        }

        // מספור עמודים
        const allPages = pdfDoc.getPages();
        for (let i = 0; i < allPages.length; i++) {
            const numText = `${i + 1}`; 
            allPages[i].drawText(numText, { x: allPages[i].getSize().width / 2, y: 20, size: 10, font: customFont, color: rgb(0, 0, 0) });
        }

        const pdfBytes = await pdfDoc.save();
        const base44 = createClientFromRequest(req);
        const fileName = `bundle-${Date.now()}.pdf`;
        const file = new File([pdfBytes], fileName, { type: 'application/pdf' });
        const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });

        return new Response(JSON.stringify({ url: uploadRes.file_url }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Critical Error:", error);
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500 });
    }
});