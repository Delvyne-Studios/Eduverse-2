// =================================================================
// EDUVERSE - GAMIFICATION SYSTEM
// Real Level & XP Management with Activity Tracking
// =================================================================

class GamificationSystem {
    constructor() {
        this.userData = this.loadUserData();
        this.init();
    }
    
    init() {
        this.updateUI();
        this.setupEventListeners();
        this.loadTodayChecklist();
    }
    
    // =================================================================
    // USER DATA MANAGEMENT
    // =================================================================
    loadUserData() {
        const saved = localStorage.getItem('eduverse_gamification');
        if (saved) {
            const data = JSON.parse(saved);
            // Ensure activities array exists (for backwards compatibility)
            if (!data.activities) {
                data.activities = [];
            }
            return data;
        }
        
        // Default data - starting fresh
        return {
            level: 1,
            xp: 0,
            totalXP: 0,
            activities: []
        };
    }
    
    saveUserData() {
        localStorage.setItem('eduverse_gamification', JSON.stringify(this.userData));
    }
    
    // =================================================================
    // XP & LEVELING SYSTEM
    // =================================================================
    getXPForNextLevel(level) {
        // XP required increases with each level: 100, 150, 225, 338, 507...
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }
    
    addXP(amount, activityName) {
        this.userData.xp += amount;
        this.userData.totalXP += amount;
        
        // Log activity
        this.userData.activities.push({
            type: activityName,
            xp: amount,
            timestamp: new Date().toISOString()
        });
        
        // Check for level up
        const xpNeeded = this.getXPForNextLevel(this.userData.level);
        if (this.userData.xp >= xpNeeded) {
            this.levelUp();
        }
        
        this.saveUserData();
        this.updateUI();
        this.showXPNotification(amount, activityName);
    }
    
    levelUp() {
        const overflow = this.userData.xp - this.getXPForNextLevel(this.userData.level);
        this.userData.level++;
        this.userData.xp = overflow;
        
        this.showLevelUpNotification();
        this.saveUserData();
    }
    
    updateUI() {
        // Update level display
        const levelEl = document.getElementById('userLevel');
        const levelTitleEl = document.getElementById('userLevelTitle');
        const xpFillEl = document.getElementById('xpFill');
        const xpTextEl = document.getElementById('xpText');
        
        if (!levelEl) return;
        
        const xpNeeded = this.getXPForNextLevel(this.userData.level);
        const percentage = Math.min((this.userData.xp / xpNeeded) * 100, 100);
        
        levelEl.textContent = this.userData.level;
        levelTitleEl.textContent = `Scholar Level ${this.userData.level}`;
        xpFillEl.style.width = percentage + '%';
        xpTextEl.textContent = `${this.userData.xp} / ${xpNeeded} XP`;
    }
    
    // =================================================================
    // NOTIFICATIONS
    // =================================================================
    showXPNotification(amount, activityName) {
        const notification = document.createElement('div');
        notification.className = 'xp-notification';
        notification.innerHTML = `
            <div class="xp-notif-content">
                <i class="fas fa-star"></i>
                <span>+${amount} XP</span>
            </div>
            <div class="xp-notif-activity">${activityName}</div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 5rem;
            right: 2rem;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(99, 102, 241, 0.4);
            z-index: 10000;
            animation: slideInRight 0.4s ease, fadeOut 0.4s ease 2.6s;
            font-weight: 600;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
        
        // Also add to social notifications if available
        if (window.socialManager) {
            window.socialManager.addNotification({
                type: 'xp_earned',
                title: 'XP Earned!',
                message: `You earned ${amount} XP from ${activityName}`,
                icon: 'fa-star',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'levelup-notification';
        notification.innerHTML = `
            <div class="levelup-content">
                <i class="fas fa-trophy"></i>
                <h3>LEVEL UP!</h3>
                <p>You've reached Level ${this.userData.level}</p>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #f59e0b, #f97316);
            color: white;
            padding: 2rem 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(245, 158, 11, 0.5);
            z-index: 10001;
            animation: scaleIn 0.5s ease, fadeOut 0.5s ease 2.5s;
            text-align: center;
            font-weight: 700;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
        
        // Add to social notifications
        if (window.socialManager) {
            window.socialManager.addNotification({
                type: 'level_up',
                title: 'Level Up! 🎉',
                message: `Congratulations! You've reached Level ${this.userData.level}`,
                icon: 'fa-trophy',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // =================================================================
    // ACTIVITY TRACKING
    // =================================================================
    setupEventListeners() {
        // Track friend actions
        this.trackFriendActions();
        
        // Track study planner usage
        this.trackStudyPlanner();
        
        // Track mock test completion
        this.trackMockTests();
        
        // Track material generation
        this.trackMaterialGeneration();
    }
    
    trackFriendActions() {
        // Hook into social manager after it loads
        const checkSocialManager = setInterval(() => {
            if (window.socialManager) {
                clearInterval(checkSocialManager);
                
                const originalSendFriend = window.socialManager.sendFriendRequest.bind(window.socialManager);
                window.socialManager.sendFriendRequest = function(handle) {
                    originalSendFriend(handle);
                    if (window.gamification) {
                        window.gamification.addXP(20, 'Sent friend request');
                    }
                };
                
                const originalSendDM = window.socialManager.sendDM.bind(window.socialManager);
                window.socialManager.sendDM = function(friendId) {
                    originalSendDM(friendId);
                    if (window.gamification) {
                        window.gamification.addXP(8, 'Sent a message');
                    }
                };
            }
        }, 500);
    }
    
    trackStudyPlanner() {
        // Hook into study planner
        const checkPlanner = setInterval(() => {
            if (window.generateSchedule) {
                clearInterval(checkPlanner);
                
                const originalGenerate = window.generateSchedule;
                window.generateSchedule = function() {
                    originalGenerate();
                    if (window.gamification) {
                        window.gamification.addXP(30, 'Generated study schedule');
                    }
                };
                
                const originalSave = window.saveSchedule;
                if (originalSave) {
                    window.saveSchedule = function() {
                        originalSave();
                        if (window.gamification) {
                            window.gamification.addXP(15, 'Saved study schedule');
                        }
                    };
                }
            }
        }, 500);
    }
    
    trackMockTests() {
        // Track when mock test is submitted
        const checkMockTest = setInterval(() => {
            if (window.submitMockTest) {
                clearInterval(checkMockTest);
                
                const originalSubmit = window.submitMockTest;
                window.submitMockTest = function() {
                    originalSubmit();
                    if (window.gamification) {
                        window.gamification.addXP(50, 'Completed mock test');
                    }
                };
            }
        }, 500);
    }
    
    trackMaterialGeneration() {
        // Track study material generation
        const checkMaterial = setInterval(() => {
            if (window.generateStudyMaterial) {
                clearInterval(checkMaterial);
                
                const originalGenerate = window.generateStudyMaterial;
                window.generateStudyMaterial = function() {
                    originalGenerate();
                    if (window.gamification) {
                        window.gamification.addXP(40, 'Generated study material');
                    }
                };
            }
        }, 500);
    }
    
    // =================================================================
    // TODAY'S CHECKLIST SYSTEM
    // =================================================================
    loadTodayChecklist() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('eduverse_checklist');
        let checklist = saved ? JSON.parse(saved) : {};
        
        // Reset if it's a new day
        if (!checklist.date || checklist.date !== today) {
            checklist = {
                date: today,
                items: [
                    { id: 1, text: 'Complete today\'s study session', checked: false },
                    { id: 2, text: 'Review notes', checked: false },
                    { id: 3, text: 'Practice problems', checked: false }
                ]
            };
            localStorage.setItem('eduverse_checklist', JSON.stringify(checklist));
        }
        
        this.renderChecklist(checklist.items);
    }
    
    renderChecklist(items) {
        const container = document.getElementById('todayChecklist');
        if (!container) return;
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
                    <i class="fas fa-list-check" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No tasks yet. Click + to add your first task!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = items.map(item => `
            <div class="checklist-item" data-item-id="${item.id}">
                <input type="checkbox" ${item.checked ? 'checked' : ''} 
                       onchange="gamification.toggleChecklistItem(${item.id})">
                <input type="text" class="checklist-text ${item.checked ? 'checked' : ''}" 
                       value="${item.text}" 
                       onblur="gamification.updateChecklistText(${item.id}, this.value)">
                <button class="btn-delete-checklist" onclick="gamification.deleteChecklistItem(${item.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
    
    toggleChecklistItem(itemId) {
        const saved = localStorage.getItem('eduverse_checklist');
        const checklist = JSON.parse(saved);
        const item = checklist.items.find(i => i.id === itemId);
        
        if (item) {
            item.checked = !item.checked;
            
            // Award XP for completing task
            if (item.checked) {
                this.addXP(15, `Completed: ${item.text.substring(0, 30)}`);
            }
            
            localStorage.setItem('eduverse_checklist', JSON.stringify(checklist));
            this.renderChecklist(checklist.items);
        }
    }
    
    updateChecklistText(itemId, newText) {
        const saved = localStorage.getItem('eduverse_checklist');
        const checklist = JSON.parse(saved);
        const item = checklist.items.find(i => i.id === itemId);
        
        if (item) {
            item.text = newText;
            localStorage.setItem('eduverse_checklist', JSON.stringify(checklist));
        }
    }
    
    deleteChecklistItem(itemId) {
        const saved = localStorage.getItem('eduverse_checklist');
        const checklist = JSON.parse(saved);
        checklist.items = checklist.items.filter(i => i.id !== itemId);
        
        localStorage.setItem('eduverse_checklist', JSON.stringify(checklist));
        this.renderChecklist(checklist.items);
    }
}

// Global function for adding checklist items
function addChecklistItem() {
    const saved = localStorage.getItem('eduverse_checklist');
    const checklist = JSON.parse(saved);
    
    const newId = Math.max(0, ...checklist.items.map(i => i.id)) + 1;
    checklist.items.push({
        id: newId,
        text: 'New task',
        checked: false
    });
    
    localStorage.setItem('eduverse_checklist', JSON.stringify(checklist));
    window.gamification.renderChecklist(checklist.items);
    
    // Focus on the new item
    setTimeout(() => {
        const newItem = document.querySelector(`[data-item-id="${newId}"] .checklist-text`);
        if (newItem) {
            newItem.focus();
            newItem.select();
        }
    }, 100);
}

// Initialize gamification system
let gamification;
document.addEventListener('DOMContentLoaded', () => {
    gamification = new GamificationSystem();
    window.gamification = gamification;
});

console.log('🎮 Gamification system loaded');
