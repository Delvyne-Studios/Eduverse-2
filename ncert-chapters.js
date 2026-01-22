// =================================================================
// NCERT CHAPTER DATABASE
// Complete list of all NCERT chapters for AI to autonomously select
// The AI analyzes the user's question and decides which chapter to load
// =================================================================

const ncertChapters = {
    chemistry: {
        part1: [
            { num: 1, title: "Some Basic Concepts of Chemistry", pdf: "kech101.pdf" },
            { num: 2, title: "Structure of Atom", pdf: "kech102.pdf" },
            { num: 3, title: "Classification of Elements and Periodicity in Properties", pdf: "kech103.pdf" },
            { num: 4, title: "Chemical Bonding and Molecular Structure", pdf: "kech104.pdf" },
            { num: 5, title: "Thermodynamics", pdf: "kech105.pdf" },
            { num: 6, title: "Equilibrium", pdf: "kech106.pdf" }
        ],
        part2: [
            { num: 1, title: "Redox Reactions", pdf: "kech201.pdf" },
            { num: 2, title: "Organic Chemistry – Some Basic Principles and Techniques", pdf: "kech202.pdf" },
            { num: 3, title: "Hydrocarbons", pdf: "kech203.pdf" }
        ]
    },
    physics: {
        part1: [
            { num: 1, title: "Units and Measurements", pdf: "keph101.pdf" },
            { num: 2, title: "Motion in a Straight Line", pdf: "keph102.pdf" },
            { num: 3, title: "Motion in a Plane", pdf: "keph103.pdf" },
            { num: 4, title: "Laws of Motion", pdf: "keph104.pdf" },
            { num: 5, title: "Work, Energy and Power", pdf: "keph105.pdf" },
            { num: 6, title: "System of Particles and Rotational Motion", pdf: "keph106.pdf" },
            { num: 7, title: "Gravitation", pdf: "keph107.pdf" }
        ],
        part2: [
            { num: 1, title: "Mechanical Properties of Solids", pdf: "keph201.pdf" },
            { num: 2, title: "Mechanical Properties of Fluids", pdf: "keph202.pdf" },
            { num: 3, title: "Thermal Properties of Matter", pdf: "keph203.pdf" },
            { num: 4, title: "Thermodynamics", pdf: "keph204.pdf" },
            { num: 5, title: "Kinetic Theory", pdf: "keph205.pdf" },
            { num: 6, title: "Oscillations", pdf: "keph206.pdf" },
            { num: 7, title: "Waves", pdf: "keph207.pdf" }
        ]
    },
    mathematics: [
        { num: 1, title: "Sets", pdf: "kemh101.pdf" },
        { num: 2, title: "Relations and Functions", pdf: "kemh102.pdf" },
        { num: 3, title: "Trigonometric Functions", pdf: "kemh103.pdf" },
        { num: 4, title: "Complex Numbers and Quadratic Equations", pdf: "kemh104.pdf" },
        { num: 5, title: "Linear Inequalities", pdf: "kemh105.pdf" },
        { num: 6, title: "Permutations and Combinations", pdf: "kemh106.pdf" },
        { num: 7, title: "Binomial Theorem", pdf: "kemh107.pdf" },
        { num: 8, title: "Sequences and Series", pdf: "kemh108.pdf" },
        { num: 9, title: "Straight Lines", pdf: "kemh109.pdf" },
        { num: 10, title: "Conic Sections", pdf: "kemh110.pdf" },
        { num: 11, title: "Introduction to Three Dimensional Geometry", pdf: "kemh111.pdf" },
        { num: 12, title: "Limits and Derivatives", pdf: "kemh112.pdf" },
        { num: 13, title: "Statistics", pdf: "kemh113.pdf" },
        { num: 14, title: "Probability", pdf: "kemh114.pdf" }
    ]
};

// Generate formatted chapter list for LLM to read and choose from
function getChapterListForAI() {
    let chapterList = "# NCERT TEXTBOOK CHAPTERS\n\n";
    
    chapterList += "## CHEMISTRY PART 1:\n";
    ncertChapters.chemistry.part1.forEach(ch => {
        chapterList += `- Chapter ${ch.num}: ${ch.title} [chemistry-part1/${ch.pdf}]\n`;
    });
    
    chapterList += "\n## CHEMISTRY PART 2:\n";
    ncertChapters.chemistry.part2.forEach(ch => {
        chapterList += `- Chapter ${ch.num}: ${ch.title} [chemistry-part2/${ch.pdf}]\n`;
    });
    
    chapterList += "\n## PHYSICS PART 1:\n";
    ncertChapters.physics.part1.forEach(ch => {
        chapterList += `- Chapter ${ch.num}: ${ch.title} [physics-part1/${ch.pdf}]\n`;
    });
    
    chapterList += "\n## PHYSICS PART 2:\n";
    ncertChapters.physics.part2.forEach(ch => {
        chapterList += `- Chapter ${ch.num}: ${ch.title} [physics-part2/${ch.pdf}]\n`;
    });
    
    chapterList += "\n## MATHEMATICS:\n";
    ncertChapters.mathematics.forEach(ch => {
        chapterList += `- Chapter ${ch.num}: ${ch.title} [mathematics/${ch.pdf}]\n`;
    });
    
    return chapterList;
}

// Parse AI's chapter selection from its response
// Expected format: subject-part/pdfname OR just the path shown in brackets
function parseChapterSelection(aiResponse) {
    // Look for patterns like "physics-part1/keph107.pdf" or "[physics-part1/keph107.pdf]"
    const patterns = [
        /\[(?:chemistry-part[12]|physics-part[12]|mathematics)\/ke[cpm]h[12]?\d{2}\.pdf\]/i,
        /(?:chemistry-part[12]|physics-part[12]|mathematics)\/ke[cpm]h[12]?\d{2}\.pdf/i
    ];
    
    for (const pattern of patterns) {
        const match = aiResponse.match(pattern);
        if (match) {
            // Remove brackets if present and return the full path
            const path = match[0].replace(/[\[\]]/g, '');
            return path;
        }
    }
    
    return null;
}

// Get full chapter information from a path (e.g., "physics-part1/keph107.pdf")
function getChapterInfo(chapterPath) {
    if (!chapterPath) return null;
    
    // Parse the path
    const match = chapterPath.match(/(chemistry|physics|mathematics)(?:-part([12]))?\/ke[cpm]h([12])?\d{2}\.pdf/i);
    if (!match) return null;
    
    const subject = match[1].toLowerCase();
    const part = match[2] || '1';
    const pdfFile = chapterPath.split('/')[1];
    
    // Find the chapter
    let chapter = null;
    if (subject === 'chemistry' || subject === 'physics') {
        const partKey = `part${part}`;
        chapter = ncertChapters[subject][partKey].find(ch => ch.pdf === pdfFile);
    } else if (subject === 'mathematics') {
        chapter = ncertChapters.mathematics.find(ch => ch.pdf === pdfFile);
    }
    
    if (!chapter) return null;
    
    return {
        subject: subject.charAt(0).toUpperCase() + subject.slice(1),
        part: subject === 'mathematics' ? '' : ` Part ${part}`,
        chapter: `Chapter ${chapter.num}: ${chapter.title}`,
        fullPath: chapterPath
    };
}
