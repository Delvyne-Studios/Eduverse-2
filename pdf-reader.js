// =================================================================
// PDF READER UTILITY
// Reads NCERT chapter PDFs and extracts text content
// Uses PDF.js library to extract text from PDF files
// =================================================================

class PDFReader {
    constructor() {
        // Base path for PDFs - relative path works for both local and deployed
        this.basePath = '/ncert-textbooks/';
        
        // Cache to avoid re-loading same PDF
        this.cache = new Map();
    }

    /**
     * Extract text from a PDF file
     * @param {string} pdfPath - Path to PDF (e.g., "physics-part1/keph107.pdf")
     * @returns {Promise<string>} - Extracted text content
     */
    async extractTextFromPDF(pdfPath) {
        try {
            // Check cache first
            if (this.cache.has(pdfPath)) {
                console.log(`📦 Using cached PDF: ${pdfPath}`);
                return this.cache.get(pdfPath);
            }

            const fullPath = this.basePath + pdfPath;
            console.log(`📖 Loading PDF from: ${fullPath}`);

            // Load the PDF
            const loadingTask = pdfjsLib.getDocument(fullPath);
            const pdf = await loadingTask.promise;

            console.log(`📄 PDF loaded: ${pdf.numPages} pages`);

            let fullText = '';

            // Extract text from each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Combine text items into a string
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');
                
                fullText += pageText + '\n\n';
            }

            console.log(`✅ Extracted ${fullText.length} characters from ${pdfPath}`);

            // Cache the result
            this.cache.set(pdfPath, fullText);

            return fullText;

        } catch (error) {
            console.error(`❌ Error reading PDF ${pdfPath}:`, error);
            return null;
        }
    }

    /**
     * Load chapter context from a specific PDF path
     * @param {string} chapterPath - Chapter path from AI (e.g., "physics-part1/keph107.pdf")
     * @returns {Promise<Object>} - Chapter text and info
     */
    async loadChapterFromPath(chapterPath) {
        try {
            console.log(`🎯 Loading chapter: ${chapterPath}`);

            // Get chapter info for display
            const chapterInfo = getChapterInfo(chapterPath);
            
            if (!chapterInfo) {
                console.warn(`⚠️ Could not parse chapter path: ${chapterPath}`);
                return null;
            }

            // Extract text from PDF
            const chapterText = await this.extractTextFromPDF(chapterPath);

            if (!chapterText) {
                console.warn(`⚠️ Could not load chapter text from: ${chapterPath}`);
                return null;
            }

            console.log(`✅ Chapter loaded: ${chapterInfo.subject}${chapterInfo.part} - ${chapterInfo.chapter}`);

            return {
                text: chapterText,
                info: chapterInfo,
                path: chapterPath
            };

        } catch (error) {
            console.error('❌ Error loading chapter:', error);
            return null;
        }
    }
}

// Create global instance
const pdfReader = new PDFReader();
