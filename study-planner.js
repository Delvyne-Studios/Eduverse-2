// ================================================================
// EDUVERSE - STUDY PLANNER
// AI-Powered Personalized Study Schedule Generator
// ================================================================

const NCERT_CHAPTERS = {
    physics: [
        "Physical World",
        "Units and Measurements",
        "Motion in a Straight Line",
        "Motion in a Plane",
        "Laws of Motion",
        "Work, Energy and Power",
        "System of Particles and Rotational Motion",
        "Gravitation",
        "Mechanical Properties of Solids",
        "Mechanical Properties of Fluids",
        "Thermal Properties of Matter",
        "Thermodynamics",
        "Kinetic Theory",
        "Oscillations",
        "Waves"
    ],
    chemistry: [
        "Some Basic Concepts of Chemistry",
        "Structure of Atom",
        "Classification of Elements and Periodicity",
        "Chemical Bonding and Molecular Structure",
        "States of Matter",
        "Thermodynamics",
        "Equilibrium",
        "Redox Reactions",
        "Hydrogen",
        "The s-Block Elements",
        "The p-Block Elements",
        "Organic Chemistry - Basic Principles",
        "Hydrocarbons",
        "Environmental Chemistry"
    ],
    math: [
        "Sets",
        "Relations and Functions",
        "Trigonometric Functions",
        "Principle of Mathematical Induction",
        "Complex Numbers and Quadratic Equations",
        "Linear Inequalities",
        "Permutations and Combinations",
        "Binomial Theorem",
        "Sequences and Series",
        "Straight Lines",
        "Conic Sections",
        "Introduction to Three Dimensional Geometry",
        "Limits and Derivatives",
        "Mathematical Reasoning",
        "Statistics",
        "Probability"
    ]
};

let plannerState = {
    currentStep: 1,
    availabilityMode: 'simple',
    selectedDay: 'monday',
    timeSlots: {
        simple: [{ start: '06:00', end: '08:00' }],
        monday: [{ start: '06:00', end: '08:00' }],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
    },
    subjectWeights: { physics: 33, chemistry: 34, math: 33 },
    selectedChapters: { physics: {}, chemistry: {}, math: {} },
    currentSubject: 'physics',
    generatedSchedule: null
};

// Initialize Study Planner
function initializeStudyPlanner() {
    populateChapterLists();
    initializeAdvancedDays();
}

// Availability Mode Toggle
function setAvailabilityMode(mode) {
    plannerState.availabilityMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.availability-mode').forEach(m => m.classList.remove('active'));
    if (mode === 'simple') {
        document.getElementById('simpleMode').classList.add('active');
    } else {
        document.getElementById('advancedMode').classList.add('active');
    }
}

// Time Slot Management
function addTimeSlot() {
    const container = document.querySelector('#simpleMode .time-slots-container');
    const newSlot = createTimeSlotElement('06:00', '08:00');
    container.appendChild(newSlot);
    plannerState.timeSlots.simple.push({ start: '06:00', end: '08:00' });
}

function addDayTimeSlot(day) {
    const container = document.getElementById(`${day}-slots`) || createDayContainer(day);
    const newSlot = createTimeSlotElement('06:00', '08:00');
    container.appendChild(newSlot);
    
    if (!plannerState.timeSlots[day]) {
        plannerState.timeSlots[day] = [];
    }
    plannerState.timeSlots[day].push({ start: '06:00', end: '08:00' });
}

function createTimeSlotElement(start, end) {
    const slot = document.createElement('div');
    slot.className = 'time-slot glass-card';
    slot.innerHTML = `
        <div class="time-inputs">
            <input type="time" class="time-input" value="${start}">
            <span class="time-separator">to</span>
            <input type="time" class="time-input" value="${end}">
        </div>
        <button class="delete-slot-btn" onclick="deleteTimeSlot(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    return slot;
}

function deleteTimeSlot(btn) {
    const slot = btn.closest('.time-slot');
    const container = slot.parentElement;
    
    // Don't allow deleting the last slot
    if (container.children.length <= 1) {
        showToast('You must have at least one time slot', 'error');
        return;
    }
    
    slot.remove();
}

function initializeAdvancedDays() {
    const advancedMode = document.getElementById('advancedMode');
    if (!advancedMode) return;
    
    // Check if days already exist
    if (advancedMode.querySelector('[data-day="tuesday"]')) return;
    
    const days = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
        const daySchedule = document.createElement('div');
        daySchedule.className = 'day-schedule';
        daySchedule.setAttribute('data-day', day);
        daySchedule.innerHTML = `
            <div class="time-slots-container" id="${day}-slots"></div>
            <button class="add-slot-btn" onclick="addDayTimeSlot('${day}')">
                <i class="fas fa-plus"></i> Add Slot for ${day.charAt(0).toUpperCase() + day.slice(1)}
            </button>
        `;
        advancedMode.appendChild(daySchedule);
    });
}

function selectDay(day) {
    plannerState.selectedDay = day;
    document.querySelectorAll('.day-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.day-schedule').forEach(schedule => {
        schedule.classList.remove('active');
    });
    const selectedSchedule = document.querySelector(`.day-schedule[data-day="${day}"]`);
    if (selectedSchedule) {
        selectedSchedule.classList.add('active');
    }
}

// Subject Weightage
function updateWeightage(subject, value) {
    value = parseInt(value);
    plannerState.subjectWeights[subject] = value;
    
    // Update UI
    document.getElementById(`${subject}WeightNum`).value = value;
    document.querySelector(`#${subject}Weight`).value = value;
    document.querySelector(`.${subject}-bg`).style.width = value + '%';
    
    validateTotalWeightage();
}

function updateWeightageFromInput(subject, value) {
    value = parseInt(value) || 0;
    if (value > 100) value = 100;
    if (value < 0) value = 0;
    
    plannerState.subjectWeights[subject] = value;
    document.getElementById(`${subject}Weight`).value = value;
    document.querySelector(`.${subject}-bg`).style.width = value + '%';
    
    validateTotalWeightage();
}

function validateTotalWeightage() {
    const total = Object.values(plannerState.subjectWeights).reduce((a, b) => a + b, 0);
    const totalEl = document.querySelector('#totalWeightage .total-value');
    const icon = document.querySelector('#totalWeightage .valid-icon');
    const nextBtn = document.getElementById('step2NextBtn');
    
    if (!totalEl || !nextBtn) return;
    
    totalEl.textContent = total + '%';
    
    if (total === 100) {
        totalEl.style.color = '#10b981';
        icon.className = 'fas fa-check-circle valid-icon';
        icon.style.color = '#10b981';
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
    } else {
        totalEl.style.color = '#f59e0b';
        icon.className = 'fas fa-exclamation-circle valid-icon';
        icon.style.color = '#f59e0b';
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
    }
}

// Chapter Selection
function populateChapterLists() {
    Object.keys(NCERT_CHAPTERS).forEach(subject => {
        const container = document.getElementById(`${subject}ChaptersList`);
        if (!container) return;
        
        container.innerHTML = '';
        
        NCERT_CHAPTERS[subject].forEach((chapter, index) => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'chapter-item glass-card';
            chapterItem.innerHTML = `
                <div class="chapter-checkbox">
                    <input type="checkbox" id="${subject}-ch-${index}" 
                           onchange="toggleChapter('${subject}', ${index}, this.checked)">
                    <label for="${subject}-ch-${index}">${index + 1}. ${chapter}</label>
                </div>
                <div class="chapter-weightage">
                    <input type="number" class="chapter-weight-input" 
                           min="0" max="100" value="0" 
                           id="${subject}-weight-${index}"
                           oninput="updateChapterWeight('${subject}', ${index}, this.value)"
                           disabled>
                    <span class="weight-unit">%</span>
                </div>
            `;
            container.appendChild(chapterItem);
        });
    });
}

function selectSubject(subject) {
    plannerState.currentSubject = subject;
    
    document.querySelectorAll('.subject-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.chapters-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`${subject}Chapters`).classList.add('active');
}

function toggleChapter(subject, index, checked) {
    const weightInput = document.getElementById(`${subject}-weight-${index}`);
    
    if (checked) {
        weightInput.disabled = false;
        weightInput.style.opacity = '1';
        // Auto-distribute weight
        const selectedCount = Object.keys(plannerState.selectedChapters[subject]).length + 1;
        const autoWeight = Math.floor(100 / selectedCount);
        weightInput.value = autoWeight;
        plannerState.selectedChapters[subject][index] = {
            name: NCERT_CHAPTERS[subject][index],
            weight: autoWeight
        };
    } else {
        weightInput.disabled = true;
        weightInput.style.opacity = '0.3';
        weightInput.value = 0;
        delete plannerState.selectedChapters[subject][index];
    }
    
    updateChapterWeightageTotal(subject);
}

function updateChapterWeight(subject, index, value) {
    value = parseInt(value) || 0;
    if (value > 100) value = 100;
    if (value < 0) value = 0;
    
    if (plannerState.selectedChapters[subject][index]) {
        plannerState.selectedChapters[subject][index].weight = value;
    }
    
    updateChapterWeightageTotal(subject);
}

function updateChapterWeightageTotal(subject) {
    const total = Object.values(plannerState.selectedChapters[subject])
        .reduce((sum, ch) => sum + ch.weight, 0);
    
    const totalEl = document.getElementById(`${subject}ChapterTotal`);
    const statusEl = document.getElementById(`${subject}Status`);
    
    if (!totalEl || !statusEl) return;
    
    totalEl.textContent = total + '%';
    
    if (total === 100 && Object.keys(plannerState.selectedChapters[subject]).length > 0) {
        totalEl.style.color = '#10b981';
        statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Valid';
        statusEl.style.color = '#10b981';
    } else if (total === 0) {
        totalEl.style.color = '#94a3b8';
        statusEl.innerHTML = '<i class="fas fa-info-circle"></i> Select chapters';
        statusEl.style.color = '#94a3b8';
    } else {
        totalEl.style.color = '#f59e0b';
        statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Must total 100%';
        statusEl.style.color = '#f59e0b';
    }
    
    validateStep3();
}

function validateStep3() {
    const nextBtn = document.getElementById('step3NextBtn');
    if (!nextBtn) return true;
    
    let allValid = true;
    
    Object.keys(plannerState.selectedChapters).forEach(subject => {
        const total = Object.values(plannerState.selectedChapters[subject])
            .reduce((sum, ch) => sum + ch.weight, 0);
        const hasChapters = Object.keys(plannerState.selectedChapters[subject]).length > 0;
        
        if (plannerState.subjectWeights[subject] > 0 && (!hasChapters || total !== 100)) {
            allValid = false;
        }
    });
    
    nextBtn.disabled = !allValid;
    nextBtn.style.opacity = allValid ? '1' : '0.5';
    return allValid;
}

// Step Navigation
function goToStep(stepNumber) {
    // Validate current step before proceeding
    if (stepNumber > plannerState.currentStep) {
        if (!validateCurrentStep()) {
            return;
        }
    }
    
    plannerState.currentStep = stepNumber;
    
    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach(step => {
        const num = parseInt(step.getAttribute('data-step'));
        if (num === stepNumber) {
            step.classList.add('active');
        } else if (num < stepNumber) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    // Show correct step
    document.querySelectorAll('.planner-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step${stepNumber}`).classList.add('active');
}

function validateCurrentStep() {
    if (plannerState.currentStep === 1) {
        // Validate time slots
        return true; // Always valid for step 1
    } else if (plannerState.currentStep === 2) {
        const total = Object.values(plannerState.subjectWeights).reduce((a, b) => a + b, 0);
        if (total !== 100) {
            showToast('Subject weightage must total 100%', 'error');
            return false;
        }
    } else if (plannerState.currentStep === 3) {
        return validateStep3();
    }
    return true;
}

// Schedule Generation
function generateSchedule() {
    const generateBtn = document.getElementById('generateScheduleBtn');
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.6';
    }
    
    showToast('Generating your AI-powered schedule...', 'info');
    
    // Simulate AI processing
    setTimeout(() => {
        const schedule = createAISchedule();
        plannerState.generatedSchedule = schedule;
        displaySchedule(schedule);
        
        document.getElementById('generateSection').style.display = 'none';
        document.getElementById('scheduleResult').style.display = 'block';
        showToast('Schedule generated successfully!', 'success');
        
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
        }
    }, 1500);
}

function createAISchedule() {
    const schedule = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const slots = plannerState.availabilityMode === 'simple' 
            ? plannerState.timeSlots.simple 
            : (plannerState.timeSlots[day] || []);
        
        slots.forEach(slot => {
            const duration = calculateDuration(slot.start, slot.end);
            const sessions = distributeTimeByWeight(duration);
            
            let currentTime = slot.start;
            sessions.forEach(session => {
                const endTime = addMinutes(currentTime, session.duration);
                const chapter = selectWeightedChapter(session.subject);
                
                schedule[day].push({
                    start: currentTime,
                    end: endTime,
                    subject: session.subject,
                    chapter: chapter,
                    duration: session.duration
                });
                
                currentTime = endTime;
            });
        });
    });
    
    return schedule;
}

function calculateDuration(start, end) {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
}

function addMinutes(time, minutes) {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function distributeTimeByWeight(totalMinutes) {
    const sessions = [];
    const subjects = Object.entries(plannerState.subjectWeights)
        .filter(([_, weight]) => weight > 0)
        .sort((a, b) => b[1] - a[1]);
    
    subjects.forEach(([subject, weight]) => {
        const duration = Math.round((weight / 100) * totalMinutes);
        if (duration > 0) {
            sessions.push({ subject, duration });
        }
    });
    
    return sessions;
}

function selectWeightedChapter(subject) {
    const chapters = Object.values(plannerState.selectedChapters[subject]);
    if (chapters.length === 0) return 'General Study';
    
    // Weighted random selection
    const totalWeight = chapters.reduce((sum, ch) => sum + ch.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const chapter of chapters) {
        random -= chapter.weight;
        if (random <= 0) {
            return chapter.name;
        }
    }
    
    return chapters[0].name;
}

function displaySchedule(schedule) {
    const grid = document.getElementById('scheduleGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach((dayName, index) => {
        const dayKey = dayName.toLowerCase();
        const dayCard = document.createElement('div');
        dayCard.className = 'schedule-day-card glass-card';
        
        let sessionsHTML = '';
        if (schedule[dayKey].length > 0) {
            sessionsHTML = schedule[dayKey].map(session => `
                <div class="schedule-session ${session.subject}-session">
                    <div class="session-time">${session.start} - ${session.end}</div>
                    <div class="session-subject">
                        <i class="fas fa-${getSubjectIcon(session.subject)}"></i>
                        ${capitalizeFirst(session.subject)}
                    </div>
                    <div class="session-chapter">${session.chapter}</div>
                </div>
            `).join('');
        } else {
            sessionsHTML = '<div class="no-sessions">No study time</div>';
        }
        
        dayCard.innerHTML = `
            <div class="day-header">${dayName}</div>
            <div class="day-sessions">${sessionsHTML}</div>
        `;
        
        grid.appendChild(dayCard);
    });
}

function getSubjectIcon(subject) {
    const icons = { physics: 'atom', chemistry: 'flask', math: 'calculator' };
    return icons[subject] || 'book';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function regenerateSchedule() {
    generateSchedule();
}

function saveSchedule() {
    localStorage.setItem('eduverse_study_schedule', JSON.stringify(plannerState.generatedSchedule));
    showToast('Schedule saved!', 'success');
}

function saveAndApply() {
    saveSchedule();
    updateDashboardSchedule();
    showToast('Schedule applied to dashboard!', 'success');
    
    setTimeout(() => {
        closeTool();
        navigateTo('dashboard-page');
    }, 1500);
}

function updateDashboardSchedule() {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todaySchedule = plannerState.generatedSchedule[today] || [];
    
    localStorage.setItem('eduverse_today_schedule', JSON.stringify(todaySchedule));
    
    // Trigger dashboard refresh if on dashboard
    if (typeof refreshDashboardSchedule === 'function') {
        refreshDashboardSchedule();
    }
}

function startOver() {
    if (confirm('Start over? This will clear your current progress.')) {
        plannerState = {
            currentStep: 1,
            availabilityMode: 'simple',
            selectedDay: 'monday',
            timeSlots: {
                simple: [{ start: '06:00', end: '08:00' }],
                monday: [{ start: '06:00', end: '08:00' }],
                tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
            },
            subjectWeights: { physics: 33, chemistry: 34, math: 33 },
            selectedChapters: { physics: {}, chemistry: {}, math: {} },
            currentSubject: 'physics',
            generatedSchedule: null
        };
        
        document.getElementById('scheduleResult').style.display = 'none';
        document.getElementById('generateSection').style.display = 'block';
        goToStep(1);
        initializeStudyPlanner();
    }
}

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInUp 0.3s ease;
        font-weight: 500;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize when tool is opened
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
        const plannerTool = document.getElementById('studyPlannerTool');
        if (plannerTool && plannerTool.style.display === 'block') {
            initializeStudyPlanner();
        }
    });
    
    const plannerTool = document.getElementById('studyPlannerTool');
    if (plannerTool) {
        observer.observe(plannerTool, { attributes: true, attributeFilter: ['style'] });
    }
});

console.log('📅 Study Planner module loaded');
