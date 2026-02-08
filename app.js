// =================================================================
// EDUVERSE - UI INTERACTIONS ONLY
// Premium Animations & Visual Effects
// =================================================================

// Auto-hide Navbar on Scroll
(function() {
    const navbar = document.getElementById('mainNavbar');
    const hoverZone = document.getElementById('navHoverZone');
    if (!navbar) return;
    
    let lastScrollY = 0;
    let scrollTimeout;
    let isHovering = false;
    
    // Show navbar on hover zone
    if (hoverZone) {
        hoverZone.addEventListener('mouseenter', () => {
            isHovering = true;
            navbar.classList.remove('nav-hidden');
        });
    }
    
    navbar.addEventListener('mouseenter', () => {
        isHovering = true;
        navbar.classList.remove('nav-hidden');
    });
    
    navbar.addEventListener('mouseleave', () => {
        isHovering = false;
        // Re-hide after mouse leaves if scrolled down
        if (window.scrollY > 120) {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (!isHovering) navbar.classList.add('nav-hidden');
            }, 800);
        }
    });
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 120 && currentScrollY > lastScrollY) {
            // Scrolling down - hide
            if (!isHovering) {
                navbar.classList.add('nav-hidden');
            }
        } else if (currentScrollY < lastScrollY - 5) {
            // Scrolling up - show
            navbar.classList.remove('nav-hidden');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (currentScrollY > 120 && !isHovering) {
                    navbar.classList.add('nav-hidden');
                }
            }, 2500);
        }
        
        if (currentScrollY <= 20) {
            navbar.classList.remove('nav-hidden');
        }
        
        lastScrollY = currentScrollY;
    }, { passive: true });
})();

// Theme Management - Cycles through 6 themes
let currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

const themes = ['dark', 'light', 'minimal', 'purple', 'red', 'neon'];
const themeIcons = {
    'dark': 'fas fa-moon',
    'light': 'fas fa-sun',
    'minimal': 'fas fa-circle',
    'purple': 'fas fa-gem',
    'red': 'fas fa-fire',
    'neon': 'fas fa-star'
};

const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
    // Update icon based on current theme
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', () => {
        // Cycle through themes
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        currentTheme = themes[nextIndex];
        
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateThemeIcon(currentTheme);
        
        // Add a pulse animation to the button
        themeToggle.style.animation = 'none';
        setTimeout(() => {
            themeToggle.style.animation = '';
        }, 10);
    });
}

function updateThemeIcon(theme) {
    const icon = themeToggle?.querySelector('i');
    if (icon) {
        icon.className = themeIcons[theme] || 'fas fa-palette';
    }
}

// Page Navigation System
function navigateToPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigation Link Handlers
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = link.getAttribute('data-page');
        if (pageName) {
            navigateToPage(pageName);
        }
    });
});

// Quick Action Button Handlers
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const pageName = btn.getAttribute('data-page');
        if (pageName) {
            navigateToPage(pageName);
        }
    });
});

// Counter Animation
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = Math.ceil(target).toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.ceil(current).toLocaleString();
        }
    }, 16);
}

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            
            // Trigger counter animations for stat values
            if (entry.target.classList.contains('stat-value')) {
                const target = parseInt(entry.target.textContent.replace(/,/g, ''));
                animateCounter(entry.target, target);
            }
            
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all animatable elements
document.querySelectorAll('.feature-card, .stat-item, .tool-display, .leaderboard-item').forEach(el => {
    observer.observe(el);
});

// Observe counters
document.querySelectorAll('.stat-value, .score-value').forEach(el => {
    observer.observe(el);
});

// Navbar Scroll Effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.backdropFilter = 'blur(30px) saturate(200%)';
        navbar.style.background = 'rgba(255, 255, 255, 0.12)';
    } else {
        navbar.style.backdropFilter = 'blur(20px) saturate(180%)';
        navbar.style.background = 'var(--glass-bg)';
    }
    
    lastScroll = currentScroll;
});

// Floating Cards Interactive Effect
document.querySelectorAll('.floating-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// Feature Cards Interactive Effect
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        const icon = card.querySelector('.feature-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
        }
    });
    
    card.addEventListener('mouseleave', () => {
        const icon = card.querySelector('.feature-icon');
        if (icon) {
            icon.style.transform = '';
        }
    });
});

// Converter Animation
const converterDisplay = document.querySelector('.converter-display');
if (converterDisplay) {
    setInterval(() => {
        const input = converterDisplay.querySelector('.input-display:first-child .input-value');
        const output = converterDisplay.querySelector('.input-display:last-child .input-value');
        
        if (input && output) {
            const randomInput = Math.floor(Math.random() * 900) + 100;
            const convertedValue = (randomInput * 1000).toFixed(0);
            
            input.textContent = randomInput;
            output.textContent = convertedValue;
        }
    }, 3000);
}

// Periodic Table Hover Effect
document.querySelectorAll('.element-tile').forEach(tile => {
    tile.addEventListener('mouseenter', () => {
        tile.style.transform = 'scale(1.15) rotate(2deg)';
    });
    
    tile.addEventListener('mouseleave', () => {
        tile.style.transform = '';
    });
});

// Scroll to Top Button
const fab = document.querySelector('.fab');
if (fab) {
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            fab.style.opacity = '1';
            fab.style.pointerEvents = 'all';
        } else {
            fab.style.opacity = '0';
            fab.style.pointerEvents = 'none';
        }
    });
    
    fab.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Background Gradient Orbs Interactive Movement
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
});

function animateOrbs() {
    const orbs = document.querySelectorAll('.gradient-orb');
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.05;
        const x = mouseX * 30 * speed;
        const y = mouseY * 30 * speed;
        
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });
    
    requestAnimationFrame(animateOrbs);
}

animateOrbs();

// Button Ripple Effect
document.querySelectorAll('.btn-primary, .btn-secondary').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Leaderboard Score Animation
document.querySelectorAll('.score-value').forEach(scoreEl => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(scoreEl.textContent.replace(/,/g, ''));
                animateCounter(scoreEl, target, 2500);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(scoreEl);
});

// Add slide-up animation class to elements on scroll
const slideUpObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('slide-up');
            slideUpObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.section-header, .section-badge, .section-title, .section-description').forEach(el => {
    slideUpObserver.observe(el);
});

// Log styling for console
console.log('%c🚀 EduVerse UI Ready!', 'font-size: 20px; font-weight: bold; color: #6366f1; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);');
console.log('%cPremium Glassmorphism Design', 'font-size: 14px; color: #8b5cf6;');
console.log('%cAll animations initialized ✨', 'font-size: 12px; color: #10b981;');

// Initialize FAB opacity
if (fab) {
    fab.style.opacity = '0';
    fab.style.pointerEvents = 'none';
    fab.style.transition = 'all 0.3s ease';
}

// =================================================================
// TOAST NOTIFICATION SYSTEM
// =================================================================
function showToast(message, type = 'info') {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =================================================================
// NOTIFICATION PANEL
// =================================================================
function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    const isVisible = panel.style.display === 'block';
    
    if (isVisible) {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
        renderNotifications();
    }
}

function renderNotifications() {
    if (!window.socialManager) return;
    
    const listEl = document.getElementById('notificationList');
    const notifications = socialManager.notifications;
    
    if (notifications.length === 0) {
        listEl.innerHTML = `
            <div class="empty-notif-state">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? 'read' : 'unread'}" onclick="markNotificationRead('${notif.id}')">
            <div class="notif-icon">
                <i class="fas ${notif.icon}"></i>
            </div>
            <div class="notif-content">
                <h4>${notif.title}</h4>
                <p>${notif.message}</p>
                <span class="notif-time">${socialManager.getTimeAgo(notif.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

function markNotificationRead(notifId) {
    if (!window.socialManager) return;
    
    const notif = socialManager.notifications.find(n => n.id === notifId);
    if (notif) {
        notif.read = true;
        localStorage.setItem('eduverse_notifications', JSON.stringify(socialManager.notifications));
        socialManager.updateNotificationBadge();
        renderNotifications();
    }
}

function clearAllNotifications() {
    if (!window.socialManager) return;
    
    if (confirm('Clear all notifications?')) {
        socialManager.notifications = [];
        localStorage.setItem('eduverse_notifications', '[]');
        socialManager.updateNotificationBadge();
        renderNotifications();
    }
}
