// =================================================================
// STUDY SESSION & SLEEP DETECTOR
// Features: Pomodoro Timer, Eye Detection, Sleep Alert
// =================================================================

class StudySession {
    constructor() {
        this.studyTime = 25; // minutes
        this.breakTime = 5; // minutes
        this.currentSet = 0;
        this.totalSets = 0;
        this.isStudying = false;
        this.isOnBreak = false;
        this.timerInterval = null;
        this.remainingSeconds = 0;
        
        // Sleep Detection
        this.videoStream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasContext = null;
        this.faceDetectionModel = null;
        this.eyesClosedStartTime = null;
        this.eyesClosedThreshold = 2 * 1000; // 2 seconds in milliseconds
        this.eyeClosedEARThreshold = 0.27; // Default EAR threshold for closed eyes
        this.detectionInterval = null;
        this.alarmAudio = null;
        this.isAlarmPlaying = false;
        
        // Stats
        this.totalStudyMinutes = 0;
        this.sessionsCompleted = 0;
        
        this.init();
    }
    
    async init() {
        // Modal not needed - direct start only
        this.createCameraModal();
        this.loadStats();
        this.setupAlarm();
        await this.loadFaceDetection();
    }
    
    // =================================================================
    // UI CREATION
    // =================================================================
    
    createCameraModal() {
        const modal = document.createElement('div');
        modal.id = 'cameraModal';
        modal.className = 'camera-container-pro';
        modal.innerHTML = `
            <div class="camera-pro-header">
                <div class="camera-pro-status">
                    <span id="eyeStatus" class="status-badge-pro detecting">
                        <i class="fas fa-eye"></i> Monitoring
                    </span>
                    <span id="timerDisplay" class="timer-display-pro">25:00</span>
                </div>
                <div class="camera-pro-controls">
                    <button class="icon-btn-pro" onclick="studySession.pauseSession()" title="Pause" id="pauseBtn">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="icon-btn-pro danger-btn" onclick="studySession.stopSession()" title="Stop Session">
                        <i class="fas fa-stop"></i>
                    </button>
                </div>
            </div>
            
            <div class="camera-pro-body">
                <video id="studyVideo" autoplay playsinline></video>
                <canvas id="detectionCanvas" style="display:none;"></canvas>
                
                <div class="detection-overlay-pro">
                    <div class="eye-indicator-pro" id="leftEye">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div class="eye-indicator-pro" id="rightEye">
                        <i class="fas fa-eye"></i>
                    </div>
                </div>
                
                <div class="session-info-pro">
                    <div class="info-item-pro">
                        <i class="fas fa-layer-group"></i>
                        <span>Set <span id="currentSetDisplay">1</span>/<span id="totalSetsDisplay">4</span></span>
                    </div>
                    <div class="info-item-pro">
                        <i class="fas fa-brain"></i>
                        <span id="phaseDisplay">Study Mode</span>
                    </div>
                </div>
            </div>
            
            <div class="alarm-notification" id="alarmNotification" style="display:none;">
                <i class="fas fa-bell"></i>
                <span>Wake Up! Eyes have been closed for too long!</span>
                <button onclick="studySession.dismissAlarm()">I'm Awake</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        this.videoElement = document.getElementById('studyVideo');
        this.canvasElement = document.getElementById('detectionCanvas');
        this.canvasContext = this.canvasElement.getContext('2d');
    }
    
    // =================================================================
    // SESSION MANAGEMENT
    // =================================================================
    async startSessionDirectly() {
        // Start with default classic pomodoro settings
        this.studyTime = 25;
        this.breakTime = 5;
        this.totalSets = 4;
        this.currentSet = 1;
        this.eyeClosedEARThreshold = 0.27;
        
        // Award XP for starting study session
        if (window.gamification) {
            window.gamification.addXP(25, 'Started study session');
        }
        
        // Request camera permission and start
        try {
            await this.startCamera();
            this.isStudying = true;
            this.startStudyPhase();
            this.showToast('Study session started! Stay focused! 📚', 'success');
        } catch (error) {
            console.error('Camera access error:', error);
            this.showToast('Camera access denied. Sleep detector disabled.', 'error');
            // Continue without camera
            this.isStudying = true;
            this.startStudyPhase();
        }
    }
    
    // =================================================================
    // SESSION & TIMER PHASES
    // =================================================================
    
    startStudyPhase() {
        this.isOnBreak = false;
        this.remainingSeconds = this.studyTime * 60;
        
        document.getElementById('phaseDisplay').innerHTML = '<i class="fas fa-book-reader"></i> Study Time';
        document.getElementById('currentSetDisplay').textContent = this.currentSet;
        document.getElementById('totalSetsDisplay').textContent = this.totalSets;
        
        this.startTimer();
        this.startSleepDetection();
    }
    
    startBreakPhase() {
        this.isOnBreak = true;
        this.remainingSeconds = this.breakTime * 60;
        
        document.getElementById('phaseDisplay').innerHTML = '<i class="fas fa-coffee"></i> Break Time';
        
        this.stopSleepDetection();
        this.playNotificationSound();
        this.showToast('Break time! Rest your eyes and stretch 🧘', 'info');
        
        this.startTimer();
    }
    
    startTimer() {
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.remainingSeconds--;
            
            if (this.remainingSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.handlePhaseComplete();
            }
            
            this.updateTimerDisplay();
        }, 1000);
    }
    
    handlePhaseComplete() {
        if (this.isOnBreak) {
            // Break complete, start next study set
            this.currentSet++;
            
            if (this.currentSet > this.totalSets) {
                this.completeSession();
            } else {
                this.playNotificationSound();
                this.showToast(`Starting Set ${this.currentSet}/${this.totalSets}`, 'success');
                this.startStudyPhase();
            }
        } else {
            // Study phase complete, start break
            this.totalStudyMinutes += this.studyTime;
            this.startBreakPhase();
        }
    }
    
    pauseSession() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.stopSleepDetection();
            document.querySelector('#pauseBtn i').className = 'fas fa-play';
            this.showToast('Session paused', 'info');
        } else {
            this.startTimer();
            if (!this.isOnBreak) {
                this.startSleepDetection();
            }
            document.querySelector('#pauseBtn i').className = 'fas fa-pause';
            this.showToast('Session resumed', 'success');
        }
    }
    
    stopSession() {
        if (confirm('Are you sure you want to end this study session?')) {
            this.isStudying = false;
            clearInterval(this.timerInterval);
            this.stopSleepDetection();
            this.stopCamera();
            document.getElementById('cameraModal').style.display = 'none';
            
            if (this.currentSet > 1) {
                this.totalStudyMinutes += Math.floor((this.studyTime * 60 - this.remainingSeconds) / 60);
                this.sessionsCompleted++;
                this.saveStats();
            }
            
            this.showToast('Study session ended', 'info');
        }
    }
    
    completeSession() {
        this.isStudying = false;
        clearInterval(this.timerInterval);
        this.stopSleepDetection();
        this.stopCamera();
        
        this.sessionsCompleted++;
        this.saveStats();
        
        document.getElementById('cameraModal').style.display = 'none';
        
        this.showToast(`🎉 Session complete! You studied for ${this.studyTime * this.totalSets} minutes!`, 'success');
        this.playCompletionSound();
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = display;
        
        // Update page title
        document.title = `${display} - ${this.isOnBreak ? 'Break' : 'Study'} | EduVerse`;
    }
    
    // =================================================================
    // CAMERA & SLEEP DETECTION
    // =================================================================
    async startCamera() {
        try {
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            this.videoElement.srcObject = this.videoStream;
            document.getElementById('cameraModal').style.display = 'block';
            
            // Wait for video to load
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.canvasElement.width = this.videoElement.videoWidth;
                    this.canvasElement.height = this.videoElement.videoHeight;
                    resolve();
                };
            });
            
        } catch (error) {
            throw new Error('Camera access denied or not available');
        }
    }
    
    stopCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
    }
    
    async loadFaceDetection() {
        // Load face-api.js from CDN for eye detection
        if (typeof faceapi === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.min.js';
            document.head.appendChild(script);
            
            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }
        
        try {
            // Load models
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model');
            await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model');
            
            console.log('Face detection models loaded');
        } catch (error) {
            console.error('Failed to load face detection models:', error);
        }
    }
    
    startSleepDetection() {
        if (!this.videoStream) return;
        
        this.eyesClosedStartTime = null;
        
        this.detectionInterval = setInterval(() => {
            this.detectEyes();
        }, 500); // Check every 500ms
    }
    
    stopSleepDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        this.eyesClosedStartTime = null;
        this.stopAlarm();
    }
    
    async detectEyes() {
        if (!this.videoElement || this.videoElement.paused) return;
        
        try {
            const detections = await faceapi
                .detectSingleFace(this.videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks();
            
            if (detections) {
                const landmarks = detections.landmarks;
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();
                
                // Calculate eye aspect ratio (EAR) to detect if eyes are closed
                const leftEAR = this.calculateEAR(leftEye);
                const rightEAR = this.calculateEAR(rightEye);
                const avgEAR = (leftEAR + rightEAR) / 2;
                
                // Debug logging
                console.log(`EAR - Left: ${leftEAR.toFixed(3)}, Right: ${rightEAR.toFixed(3)}, Avg: ${avgEAR.toFixed(3)}, Threshold: ${this.eyeClosedEARThreshold}`);
                
                // Use user-configured threshold
                const eyesClosed = avgEAR < this.eyeClosedEARThreshold;
                
                this.updateEyeStatus(eyesClosed, true, avgEAR);
                
                if (eyesClosed) {
                    if (!this.eyesClosedStartTime) {
                        this.eyesClosedStartTime = Date.now();
                        console.log('Eyes closed detected - starting timer');
                    } else {
                        const closedDuration = Date.now() - this.eyesClosedStartTime;
                        console.log(`Eyes closed for ${closedDuration}ms`);
                        
                        if (closedDuration >= this.eyesClosedThreshold && !this.isAlarmPlaying) {
                            this.triggerAlarm();
                        }
                    }
                } else {
                    if (this.eyesClosedStartTime) {
                        console.log('Eyes opened - resetting timer');
                    }
                    this.eyesClosedStartTime = null;
                    this.stopAlarm();
                }
            } else {
                this.updateEyeStatus(false, false);
            }
        } catch (error) {
            console.error('Eye detection error:', error);
        }
    }
    
    calculateEAR(eyePoints) {
        // Eye Aspect Ratio calculation
        // Formula: EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
        const p1 = eyePoints[0];
        const p2 = eyePoints[1];
        const p3 = eyePoints[2];
        const p4 = eyePoints[3];
        const p5 = eyePoints[4];
        const p6 = eyePoints[5];
        
        const vertical1 = this.euclideanDistance(p2, p6);
        const vertical2 = this.euclideanDistance(p3, p5);
        const horizontal = this.euclideanDistance(p1, p4);
        
        const ear = (vertical1 + vertical2) / (2.0 * horizontal);
        return ear;
    }
    
    euclideanDistance(point1, point2) {
        return Math.sqrt(
            Math.pow(point1.x - point2.x, 2) +
            Math.pow(point1.y - point2.y, 2)
        );
    }
    
    updateEyeStatus(eyesClosed, faceDetected, avgEAR = 0) {
        const statusBadge = document.getElementById('eyeStatus');
        const leftEye = document.getElementById('leftEye');
        const rightEye = document.getElementById('rightEye');
        
        if (!faceDetected) {
            statusBadge.className = 'status-badge no-detection';
            statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Eyes Not Detected';
            leftEye.className = 'eye-indicator inactive';
            rightEye.className = 'eye-indicator inactive';
        } else if (eyesClosed) {
            statusBadge.className = 'status-badge eyes-closed';
            statusBadge.innerHTML = `<i class="fas fa-eye-slash"></i> Eyes Closed (${avgEAR.toFixed(2)})`;
            leftEye.className = 'eye-indicator closed';
            rightEye.className = 'eye-indicator closed';
        } else {
            statusBadge.className = 'status-badge eyes-open';
            statusBadge.innerHTML = `<i class="fas fa-eye"></i> Eyes Open (${avgEAR.toFixed(2)})`;
            leftEye.className = 'eye-indicator open';
            rightEye.className = 'eye-indicator open';
        }
    }
    
    // =================================================================
    // ALARM SYSTEM
    // =================================================================
    setupAlarm() {
        // Create alarm audio element with a proper alarm sound
        this.alarmAudio = new Audio();
        // Create an oscillator-based alarm sound using Web Audio API
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        
        // Fallback beep sound
        this.alarmAudio.src = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
        this.alarmAudio.loop = true;
        this.alarmAudio.volume = 1.0;
    }
    
    triggerAlarm() {
        if (this.isAlarmPlaying) return;
        
        this.isAlarmPlaying = true;
        
        // Play audio file alarm
        this.alarmAudio.play().catch(e => {
            console.error('Alarm play error:', e);
            // Fallback to Web Audio API beep
            this.playBeepAlarm();
        });
        
        document.getElementById('alarmNotification').style.display = 'flex';
        
        // Flash the screen
        document.body.classList.add('alarm-flash');
        
        this.showToast('⚠️ WAKE UP! You appear to be falling asleep!', 'error');
    }
    
    playBeepAlarm() {
        try {
            // Create Web Audio API beep as fallback
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.oscillator = this.audioContext.createOscillator();
            this.gainNode = this.audioContext.createGain();
            
            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            this.oscillator.frequency.value = 800; // Frequency in Hz (annoying beep)
            this.gainNode.gain.value = 0.5;
            this.oscillator.type = 'square'; // Square wave for annoying sound
            
            this.oscillator.start();
            
            // Beep pattern
            this.beepInterval = setInterval(() => {
                this.gainNode.gain.value = this.gainNode.gain.value === 0.5 ? 0 : 0.5;
            }, 300);
        } catch (e) {
            console.error('Web Audio API error:', e);
        }
    }
    
    stopAlarm() {
        if (!this.isAlarmPlaying) return;
        
        this.isAlarmPlaying = false;
        
        // Stop audio file
        this.alarmAudio.pause();
        this.alarmAudio.currentTime = 0;
        
        // Stop Web Audio API beep
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator = null;
        }
        if (this.beepInterval) {
            clearInterval(this.beepInterval);
            this.beepInterval = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        document.getElementById('alarmNotification').style.display = 'none';
        document.body.classList.remove('alarm-flash');
    }
    
    dismissAlarm() {
        this.stopAlarm();
        this.eyesClosedStartTime = null;
        this.showToast('Alarm dismissed. Stay alert! 💪', 'success');
    }
    
    // =================================================================
    // UI CONTROLS
    // =================================================================
    toggleCameraSize() {
        const container = document.getElementById('cameraModal');
        const icon = document.getElementById('cameraSizeIcon');
        
        if (container.classList.contains('minimized')) {
            container.classList.remove('minimized');
            container.classList.add('maximized');
            icon.className = 'fas fa-compress';
        } else {
            container.classList.add('minimized');
            container.classList.remove('maximized');
            icon.className = 'fas fa-expand';
        }
    }
    
    // =================================================================
    // STATS & STORAGE
    // =================================================================
    loadStats() {
        const stats = localStorage.getItem('studyStats');
        if (stats) {
            const data = JSON.parse(stats);
            this.totalStudyMinutes = data.totalStudyMinutes || 0;
            this.sessionsCompleted = data.sessionsCompleted || 0;
        }
    }
    
    saveStats() {
        const stats = {
            totalStudyMinutes: this.totalStudyMinutes,
            sessionsCompleted: this.sessionsCompleted
        };
        localStorage.setItem('studyStats', JSON.stringify(stats));
    }
    
    // =================================================================
    // UTILITIES
    // =================================================================
    showToast(message, type = 'info') {
        // Use existing toast system from app
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
    
    playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU4AAAA=');
        audio.play().catch(e => {});
    }
    
    playCompletionSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU4AAAA=');
        audio.play().catch(e => {});
    }
}

// Initialize study session instance (lazy loaded)
let studySession = null;

// Initialize only when needed
function initStudySession() {
    if (!studySession) {
        studySession = new StudySession();
    }
    return studySession;
}

// Initialize on page load to ensure it's ready
document.addEventListener('DOMContentLoaded', () => {
    // Pre-initialize study session so it's ready when button is clicked
    studySession = new StudySession();
});

// Helper functions for page-based controls
function applyPresetToPage(preset) {
    const presets = {
        classic: { hours: 0, minutes: 25, breakMinutes: 5, sets: 4 },
        extended: { hours: 0, minutes: 50, breakMinutes: 10, sets: 3 },
        short: { hours: 0, minutes: 15, breakMinutes: 3, sets: 6 },
        ultra: { hours: 1, minutes: 30, breakMinutes: 20, sets: 2 }
    };
    
    const config = presets[preset];
    document.getElementById('studyHoursPage').value = config.hours;
    document.getElementById('studyMinutesPage').value = config.minutes;
    document.getElementById('breakMinutesPage').value = config.breakMinutes;
    document.getElementById('numSetsPage').value = config.sets;
    
    if (window.app && window.app.showToast) {
        window.app.showToast(`Applied ${preset.charAt(0).toUpperCase() + preset.slice(1)} Pomodoro preset`, 'success');
    }
}

async function startStudySessionFromPage() {
    const session = initStudySession();
    
    // Get settings from page
    const hours = parseInt(document.getElementById('studyHoursPage').value) || 0;
    const minutes = parseInt(document.getElementById('studyMinutesPage').value) || 25;
    const breakMinutes = parseInt(document.getElementById('breakMinutesPage').value) || 5;
    const numSets = parseInt(document.getElementById('numSetsPage').value) || 4;
    const sensitivity = parseFloat(document.getElementById('eyeSensitivityPage').value) || 0.27;
    
    // Set to session
    session.studyTime = (hours * 60) + minutes;
    session.breakTime = breakMinutes;
    session.totalSets = numSets;
    session.currentSet = 1;
    session.eyeClosedEARThreshold = sensitivity;
    
    console.log(`Eye detection threshold set to: ${session.eyeClosedEARThreshold}`);
    
    if (session.studyTime < 1) {
        if (window.app && window.app.showToast) {
            window.app.showToast('Please set at least 1 minute for study time', 'error');
        }
        return;
    }
    
    // Start camera and session
    try {
        await session.startCamera();
        session.isStudying = true;
        session.startStudyPhase();
        if (window.app && window.app.showToast) {
            window.app.showToast('Study session started! Stay focused! 📚', 'success');
        }
    } catch (error) {
        console.error('Camera access error:', error);
        if (window.app && window.app.showToast) {
            window.app.showToast('Camera access denied. Sleep detector disabled.', 'error');
        }
        // Continue without camera
        session.isStudying = true;
        session.startStudyPhase();
    }
}
