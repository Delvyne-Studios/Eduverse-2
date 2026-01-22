// =================================================================
// SOCIAL PAGE FUNCTIONALITY
// =================================================================

class SocialManager {
    constructor() {
        this.friends = JSON.parse(localStorage.getItem('eduverse_friends') || '[]');
        this.studyGroups = JSON.parse(localStorage.getItem('eduverse_studygroups') || '[]');
        this.messages = JSON.parse(localStorage.getItem('eduverse_messages') || '[]');
        this.notifications = JSON.parse(localStorage.getItem('eduverse_notifications') || '[]');
        this.pendingRequests = JSON.parse(localStorage.getItem('eduverse_pending_requests') || '[]');
        this.registeredUsers = JSON.parse(localStorage.getItem('eduverse_registered_users') || '[]');
        this.userHandle = localStorage.getItem('eduverse_userhandle') || '@user' + Math.floor(Math.random() * 10000);
        this.groupMessages = JSON.parse(localStorage.getItem('eduverse_group_messages') || '{}');
        
        // Register current user if not registered
        if (!this.registeredUsers.find(u => u.handle === this.userHandle)) {
            this.registeredUsers.push({
                handle: this.userHandle,
                name: 'You',
                joinedAt: new Date().toISOString()
            });
            localStorage.setItem('eduverse_registered_users', JSON.stringify(this.registeredUsers));
        }
        
        // Add some default registered users for testing
        if (this.registeredUsers.length < 5) {
            const defaultUsers = [
                { handle: '@amit_kumar', name: 'Amit Kumar' },
                { handle: '@sneha_gupta', name: 'Sneha Gupta' },
                { handle: '@rahul_verma', name: 'Rahul Verma' },
                { handle: '@priya_sharma', name: 'Priya Sharma' }
            ];
            defaultUsers.forEach(user => {
                if (!this.registeredUsers.find(u => u.handle === user.handle)) {
                    this.registeredUsers.push({
                        ...user,
                        joinedAt: new Date().toISOString()
                    });
                }
            });
            localStorage.setItem('eduverse_registered_users', JSON.stringify(this.registeredUsers));
        }
        
        this.initializeSocialFeatures();
    }
    
    initializeSocialFeatures() {
        // Add event listeners for social features
        const addGroupBtn = document.querySelector('.groups-card .btn-icon');
        const addFriendBtn = document.querySelector('.friends-card .btn-icon');
        
        if (addGroupBtn) {
            addGroupBtn.addEventListener('click', () => this.showCreateGroupModal());
        }
        
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => this.showAddFriendModal());
        }
        
        // Add click handlers to friend items for DM
        this.attachFriendClickHandlers();
        
        // Add click handlers to group items
        this.attachGroupClickHandlers();
        
        // Load saved data
        this.renderFriends();
        this.renderGroups();
        this.renderMessages();
    }
    
    // =================================================================
    // FRIENDS MANAGEMENT
    // =================================================================
    
    showAddFriendModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content glass-premium">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> Add Friend</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Friend's Handle</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.2rem; color: var(--text-secondary);">@</span>
                            <input type="text" id="friendHandle" class="modal-input" placeholder="username" style="flex: 1;">
                        </div>
                        <p style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 8px;">
                            <i class="fas fa-info-circle"></i> Only registered users can be added
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-primary" onclick="socialManager.addFriend()">Send Request</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    addFriend() {
        const handleInput = document.getElementById('friendHandle');
        let handle = handleInput.value.trim();
        
        if (!handle) {
            showToast('Please enter a handle', 'error');
            return;
        }
        
        // Add @ prefix if not present
        if (!handle.startsWith('@')) {
            handle = '@' + handle;
        }
        
        // Check if user is trying to add themselves
        if (handle === this.userHandle) {
            showToast('You cannot add yourself as a friend!', 'error');
            return;
        }
        
        // Check if user is already a friend
        if (this.friends.find(f => f.handle === handle)) {
            showToast('Already friends with this user!', 'error');
            return;
        }
        
        // Check if user is registered (case-insensitive)
        const normalizedHandle = handle.toLowerCase().trim();
        const registeredUser = this.registeredUsers.find(u => u.handle.toLowerCase() === normalizedHandle);
        if (!registeredUser) {
            showToast(`User ${handle} is not registered!`, 'error');
            return;
        }
        
        // Add friend immediately (in real app, would send request)
        const newFriend = {
            id: 'friend_' + Date.now(),
            handle: handle,
            name: registeredUser.name,
            avatar: this.getInitials(handle),
            status: Math.random() > 0.5 ? 'online' : 'offline',
            xp: Math.floor(Math.random() * 5000) + 1000,
            addedAt: new Date().toISOString()
        };
        
        this.friends.push(newFriend);
        localStorage.setItem('eduverse_friends', JSON.stringify(this.friends));
        
        // Create notification
        this.addNotification({
            type: 'friend_request_sent',
            title: 'Friend Request Sent',
            message: `Friend request sent to ${registeredUser.name} (${handle})`,
            icon: 'fa-user-plus',
            timestamp: new Date().toISOString()
        });
        
        this.renderFriends();
        document.querySelector('.modal-overlay').remove();
        showToast(`Friend request sent to ${handle}!`, 'success');
    }
    
    renderFriends() {
        const friendsList = document.querySelector('.friends-list');
        if (!friendsList) return;
        
        if (this.friends.length === 0) {
            friendsList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: var(--spacing-lg); color: var(--text-tertiary);">
                    <i class="fas fa-user-friends" style="font-size: 2rem; margin-bottom: var(--spacing-md); opacity: 0.3;"></i>
                    <p>No friends yet. Click + to add friends!</p>
                </div>
            `;
            return;
        }
        
        friendsList.innerHTML = this.friends.map(friend => `
            <div class="friend-item" data-friend-id="${friend.id}">
                <div class="friend-avatar gradient-bg-${Math.floor(Math.random() * 5) + 1}">${friend.avatar}</div>
                <div class="friend-info">
                    <h4>${friend.name}</h4>
                    <p class="${friend.status === 'online' ? 'online-status' : 'offline-status'}">
                        <i class="fas fa-circle"></i> ${friend.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                </div>
                <button class="btn-icon-small" onclick="socialManager.openDM('${friend.id}')" title="Message">
                    <i class="fas fa-comment"></i>
                </button>
            </div>
        `).join('');
        
        this.attachFriendClickHandlers();
    }
    
    attachFriendClickHandlers() {
        const friendItems = document.querySelectorAll('.friend-item');
        friendItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-icon-small')) {
                    const friendId = item.dataset.friendId;
                    this.openDM(friendId);
                }
            });
        });
    }
    
    // =================================================================
    // DIRECT MESSAGES
    // =================================================================
    
    openDM(friendId) {
        const friend = this.friends.find(f => f.id === friendId);
        if (!friend) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content glass-premium dm-modal">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        <div class="friend-avatar-small gradient-bg-3">${friend.avatar}</div>
                        <div>
                            <h3>${friend.name}</h3>
                            <p class="${friend.status === 'online' ? 'online-status' : 'offline-status'}" style="font-size: 0.8rem; margin: 0;">
                                <i class="fas fa-circle"></i> ${friend.status === 'online' ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="dm-messages" id="dmMessages">
                    ${this.renderDMHistory(friendId)}
                </div>
                <div class="dm-input-area">
                    <input type="text" id="dmInput" class="dm-input" placeholder="Type a message..." onkeypress="if(event.key==='Enter') socialManager.sendDM('${friendId}')">
                    <button class="btn-send" onclick="socialManager.sendDM('${friendId}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Focus input
        setTimeout(() => document.getElementById('dmInput').focus(), 100);
    }
    
    renderDMHistory(friendId) {
        const conversation = this.messages.filter(m => 
            (m.from === friendId && m.to === 'me') || 
            (m.from === 'me' && m.to === friendId)
        );
        
        if (conversation.length === 0) {
            return `<div class="empty-dm-state"><i class="fas fa-comments"></i><p>No messages yet. Say hi!</p></div>`;
        }
        
        return conversation.map(msg => `
            <div class="dm-message ${msg.from === 'me' ? 'sent' : 'received'}">
                <p>${msg.text}</p>
                <span class="dm-time">${this.formatTime(msg.timestamp)}</span>
            </div>
        `).join('');
    }
    
    sendDM(friendId) {
        const input = document.getElementById('dmInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        const message = {
            id: 'msg_' + Date.now(),
            from: 'me',
            to: friendId,
            text: text,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        this.messages.push(message);
        localStorage.setItem('eduverse_messages', JSON.stringify(this.messages));
        
        // Add message to UI
        const messagesDiv = document.getElementById('dmMessages');
        const emptyState = messagesDiv.querySelector('.empty-dm-state');
        if (emptyState) emptyState.remove();
        
        messagesDiv.innerHTML += `
            <div class="dm-message sent">
                <p>${text}</p>
                <span class="dm-time">${this.formatTime(message.timestamp)}</span>
            </div>
        `;
        
        input.value = '';
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        this.renderMessages();
    }
    
    renderMessages() {
        const messageList = document.querySelector('.message-list');
        if (!messageList) return;
        
        // Get unique conversations
        const conversations = {};
        this.messages.forEach(msg => {
            const otherId = msg.from === 'me' ? msg.to : msg.from;
            if (!conversations[otherId] || new Date(msg.timestamp) > new Date(conversations[otherId].timestamp)) {
                conversations[otherId] = msg;
            }
        });
        
        const conversationArray = Object.entries(conversations);
        
        if (conversationArray.length === 0) {
            messageList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: var(--spacing-lg); color: var(--text-tertiary);">
                    <i class="fas fa-comments" style="font-size: 2rem; margin-bottom: var(--spacing-sm); opacity: 0.3;"></i>
                    <p>No messages yet</p>
                </div>
            `;
            return;
        }
        
        messageList.innerHTML = conversationArray.map(([friendId, msg]) => {
            const friend = this.friends.find(f => f.id === friendId);
            const unreadCount = this.messages.filter(m => m.from === friendId && !m.read).length;
            
            return `
                <div class="message-item ${unreadCount > 0 ? 'unread' : ''}" onclick="socialManager.openDM('${friendId}')">
                    <div class="message-avatar gradient-bg-${Math.floor(Math.random() * 5) + 1}">${friend ? friend.avatar : 'U'}</div>
                    <div class="message-content">
                        <h4>${friend ? friend.name : 'Unknown'}</h4>
                        <p>${msg.text.substring(0, 30)}${msg.text.length > 30 ? '...' : ''}</p>
                    </div>
                    ${unreadCount > 0 ? `<span class="message-badge">${unreadCount}</span>` : ''}
                </div>
            `;
        }).join('');
    }
    
    // =================================================================
    // STUDY GROUPS
    // =================================================================
    
    showCreateGroupModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content glass-premium">
                <div class="modal-header">
                    <h3><i class="fas fa-users"></i> Create Study Group</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Group Name</label>
                        <input type="text" id="groupName" class="modal-input" placeholder="e.g., Physics Legends">
                    </div>
                    <div class="form-group">
                        <label>Subject</label>
                        <select id="groupSubject" class="modal-input">
                            <option value="math">Mathematics</option>
                            <option value="physics">Physics</option>
                            <option value="chemistry">Chemistry</option>
                            <option value="biology">Biology</option>
                            <option value="english">English</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Add Friends (Optional)</label>
                        <div class="friend-checkboxes" id="friendCheckboxes">
                            ${this.friends.length === 0 ? '<p style="color: var(--text-tertiary); font-size: 0.85rem;">No friends to add yet</p>' : 
                            this.friends.map(f => `
                                <label class="checkbox-item">
                                    <input type="checkbox" value="${f.id}">
                                    <span>${f.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-primary" onclick="socialManager.createGroup()">Create Group</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    createGroup() {
        const nameInput = document.getElementById('groupName');
        const subjectSelect = document.getElementById('groupSubject');
        const name = nameInput.value.trim();
        const subject = subjectSelect.value;
        
        if (!name) {
            showToast('Please enter a group name', 'error');
            return;
        }
        
        // Get selected friends
        const selectedFriends = Array.from(document.querySelectorAll('#friendCheckboxes input:checked')).map(cb => cb.value);
        
        const iconMap = {
            math: 'calculator',
            physics: 'atom',
            chemistry: 'flask',
            biology: 'dna',
            english: 'book',
            general: 'users'
        };
        
        const newGroup = {
            id: 'group_' + Date.now(),
            name: name,
            subject: subject,
            icon: iconMap[subject] || 'users',
            members: ['me', ...selectedFriends],
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        this.studyGroups.push(newGroup);
        localStorage.setItem('eduverse_studygroups', JSON.stringify(this.studyGroups));
        
        this.renderGroups();
        document.querySelector('.modal-overlay').remove();
        showToast(`Study group "${name}" created!`, 'success');
    }
    
    renderGroups() {
        const groupsList = document.querySelector('.groups-list');
        if (!groupsList) return;
        
        if (this.studyGroups.length === 0) {
            groupsList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: var(--spacing-lg); color: var(--text-tertiary);">
                    <i class="fas fa-users" style="font-size: 2rem; margin-bottom: var(--spacing-md); opacity: 0.3;"></i>
                    <p>No study groups yet. Click + to create one!</p>
                </div>
            `;
            return;
        }
        
        groupsList.innerHTML = this.studyGroups.map((group, index) => {
            const memberCount = group.members.length;
            const timeAgo = this.getTimeAgo(group.lastActivity);
            
            return `
                <div class="group-item" data-group-id="${group.id}">
                    <div class="group-icon gradient-bg-${(index % 5) + 1}">
                        <i class="fas fa-${group.icon}"></i>
                    </div>
                    <div class="group-info">
                        <h4>${group.name}</h4>
                        <p>${memberCount} member${memberCount !== 1 ? 's' : ''} • ${timeAgo}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        this.attachGroupClickHandlers();
    }
    
    attachGroupClickHandlers() {
        const groupItems = document.querySelectorAll('.group-item');
        groupItems.forEach(item => {
            item.addEventListener('click', () => {
                const groupId = item.dataset.groupId;
                this.openGroupChat(groupId);
            });
        });
    }
    
    openGroupChat(groupId) {
        const group = this.studyGroups.find(g => g.id === groupId);
        if (!group) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content glass-premium dm-modal">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        <div class="group-icon gradient-bg-1" style="width: 40px; height: 40px; border-radius: 8px;">
                            <i class="fas fa-${group.icon}"></i>
                        </div>
                        <div>
                            <h3>${group.name}</h3>
                            <p style="font-size: 0.8rem; margin: 0; color: var(--text-tertiary);">
                                ${group.members.length} members
                            </p>
                        </div>
                    </div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="dm-messages" id="groupMessages">
                    ${this.renderGroupMessages(groupId)}
                </div>
                <div class="dm-input-area">
                    <input type="text" id="groupInput" class="dm-input" placeholder="Type a message..." onkeypress="if(event.key==='Enter') socialManager.sendGroupMessage('${groupId}')">
                    <button class="btn-send" onclick="socialManager.sendGroupMessage('${groupId}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            const messagesDiv = document.getElementById('groupMessages');
            if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
            document.getElementById('groupInput').focus();
        }, 100);
    }
    
    renderGroupMessages(groupId) {
        if (!this.groupMessages[groupId] || this.groupMessages[groupId].length === 0) {
            return `<div class="empty-dm-state"><i class="fas fa-comments"></i><p>No messages yet. Start the conversation!</p></div>`;
        }
        
        return this.groupMessages[groupId].map(msg => `
            <div class="dm-message ${msg.from === 'me' ? 'sent' : 'received'}">
                ${msg.from !== 'me' ? `<small style="color: var(--text-tertiary); font-size: 0.75rem; margin-bottom: 4px;">${msg.senderName}</small>` : ''}
                <p>${msg.text}</p>
                <span class="dm-time">${this.formatTime(msg.timestamp)}</span>
            </div>
        `).join('');
    }
    
    sendGroupMessage(groupId) {
        const input = document.getElementById('groupInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        if (!this.groupMessages[groupId]) {
            this.groupMessages[groupId] = [];
        }
        
        const message = {
            id: 'gmsg_' + Date.now(),
            from: 'me',
            senderName: 'You',
            text: text,
            timestamp: new Date().toISOString()
        };
        
        this.groupMessages[groupId].push(message);
        localStorage.setItem('eduverse_group_messages', JSON.stringify(this.groupMessages));
        
        // Add message to UI
        const messagesDiv = document.getElementById('groupMessages');
        const emptyState = messagesDiv.querySelector('.empty-dm-state');
        if (emptyState) emptyState.remove();
        
        messagesDiv.innerHTML += `
            <div class="dm-message sent">
                <p>${text}</p>
                <span class="dm-time">${this.formatTime(message.timestamp)}</span>
            </div>
        `;
        
        input.value = '';
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    // =================================================================
    // UTILITY FUNCTIONS
    // =================================================================
    
    generateNameFromHandle(handle) {
        if (handle.includes('@')) {
            return handle.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'User';
        }
        return handle.replace(/[^a-zA-Z]/g, ' ').trim() || 'User';
    }
    
    getInitials(text) {
        const cleaned = text.replace(/[@.]/g, '');
        if (cleaned.length < 2) return cleaned.toUpperCase();
        return (cleaned[0] + cleaned[1]).toUpperCase();
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    
    addNotification(notification) {
        notification.id = 'notif_' + Date.now();
        notification.read = false;
        this.notifications.unshift(notification);
        localStorage.setItem('eduverse_notifications', JSON.stringify(this.notifications));
        this.updateNotificationBadge();
    }
    
    updateNotificationBadge() {
        const badge = document.getElementById('notifBadge');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }
}

// Initialize social manager
let socialManager;
document.addEventListener('DOMContentLoaded', () => {
    socialManager = new SocialManager();
});
