// =================================================================
// STUDY MATERIAL - CHAPTER-WISE NOTES VIEWER
// =================================================================

class StudyMaterial {
    constructor() {
        this.currentChapter = null;
        this.init();
    }

    async init() {
        await this.loadChapters();
    }

    async loadChapters() {
        // Get chemistry database
        const db = window.__CHEMISTRY_DB__;
        console.log('Database loaded:', db);
        
        if (!db) {
            console.error('Chemistry database not loaded');
            return;
        }

        // Check for both 'Chemistry' and 'chemistry' keys
        const chemistry = db.Chemistry || db.chemistry;
        
        if (!chemistry) {
            console.error('Chemistry subject not found in database. Available keys:', Object.keys(db));
            return;
        }

        const chapterList = document.getElementById('chapter-list');
        if (!chapterList) {
            console.error('Chapter list element not found');
            return;
        }

        const chapters = Object.keys(chemistry);
        console.log('Found chapters:', chapters);

        chapterList.innerHTML = '';

        chapters.forEach((chapterName, index) => {
            const chapterObj = chemistry[chapterName];
            const topicCount = chapterObj.topics ? Object.keys(chapterObj.topics).length : 0;

            const chapterItem = document.createElement('div');
            chapterItem.className = 'chapter-item glass-btn';
            chapterItem.innerHTML = `
                <div class="chapter-number">${index + 1}</div>
                <div class="chapter-info">
                    <h4>${chapterName}</h4>
                    <p>${topicCount} topics</p>
                </div>
                <i class="fas fa-chevron-right"></i>
            `;

            chapterItem.addEventListener('click', () => {
                this.showChapterNotes(chapterName, chapterObj);
            });

            chapterList.appendChild(chapterItem);
        });
        
        console.log('Chapters loaded successfully');
    }

    showChapterNotes(chapterName, chapterObj) {
        this.currentChapter = chapterName;

        // Show fullscreen view
        const fullscreenDiv = document.getElementById('notes-fullscreen');
        const titleEl = document.getElementById('fullscreen-chapter-title');
        const contentEl = document.getElementById('fullscreen-notes-content');

        titleEl.textContent = chapterName;

        // Build notes content
        let notesHTML = '';

        if (chapterObj.topics) {
            const topics = chapterObj.topics;

            Object.keys(topics).forEach((topicKey, index) => {
                const topic = topics[topicKey];
                const topicName = topicKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                notesHTML += `
                    <div class="topic-section">
                        <h3 class="topic-title">
                            <span class="topic-number">${index + 1}</span>
                            ${topicName}
                        </h3>
                        <div class="topic-content">
                `;

                if (topic.context && topic.context.length > 0) {
                    topic.context.forEach(line => {
                        notesHTML += `<p class="note-line">${this.formatNoteLine(line)}</p>`;
                    });
                }

                notesHTML += `
                        </div>
                    </div>
                `;
            });
        }

        contentEl.innerHTML = notesHTML;
        fullscreenDiv.style.display = 'flex';

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    formatNoteLine(line) {
        // Format chemical formulas and special characters
        let formatted = line;

        // Bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Chemical formulas (simple detection)
        formatted = formatted.replace(/([A-Z][a-z]?)₂/g, '$1<sub>2</sub>');
        formatted = formatted.replace(/([A-Z][a-z]?)₃/g, '$1<sub>3</sub>');
        formatted = formatted.replace(/([A-Z][a-z]?)₄/g, '$1<sub>4</sub>');
        formatted = formatted.replace(/([A-Z][a-z]?)₅/g, '$1<sub>5</sub>');
        formatted = formatted.replace(/([A-Z][a-z]?)₆/g, '$1<sub>6</sub>');

        // Arrows
        formatted = formatted.replace(/→/g, ' → ');
        formatted = formatted.replace(/←/g, ' ← ');
        formatted = formatted.replace(/↔/g, ' ↔ ');

        // Highlight formulas in code style
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="formula-inline">$1</code>');

        return formatted;
    }
}

// Global function to close fullscreen
function closeNotesFullscreen() {
    const fullscreenDiv = document.getElementById('notes-fullscreen');
    fullscreenDiv.style.display = 'none';
    document.body.style.overflow = '';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for database to load (it's loaded via script tag before this file)
    setTimeout(() => {
        if (window.__CHEMISTRY_DB__) {
            window.studyMaterial = new StudyMaterial();
            console.log('Study Material initialized with database');
        } else {
            console.error('Database not available yet, retrying...');
            // Retry after a bit more time
            setTimeout(() => {
                window.studyMaterial = new StudyMaterial();
            }, 1000);
        }
    }, 100);
});
