# EduVerse Authentication System

## 🔐 Professional Login System with InsForge Backend

### Features Implemented

✅ **OAuth Authentication**
- Google Sign-in
- GitHub Sign-in
- One-click authentication with redirect handling

✅ **Email/Password Authentication**
- Secure email and password signup
- Login with email and password
- Session management with httpOnly cookies

✅ **Real-time Password Validation**
- Minimum 6 characters requirement
- Must contain at least one number
- Must contain at least one letter
- Visual feedback with green/red borders
- Live requirement indicators

✅ **First-Time Profile Setup**
- Display name input
- Unique handle (@username) selection
- Only shown after first login
- Stored in InsForge database

✅ **Professional UI/UX**
- Modern, glassmorphic design
- Smooth animations and transitions
- Error and success notifications
- Loading states on form submissions
- Responsive modal dialogs

### Database Schema

**Table: `user_profiles`**
```sql
- user_id (TEXT, PRIMARY KEY) - InsForge user ID
- display_name (TEXT, NOT NULL) - User's display name
- handle (TEXT, UNIQUE, NOT NULL) - Unique @handle
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Row Level Security (RLS):**
- Anyone can view profiles
- Users can only insert/update their own profile

### How to Test

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000
   ```

3. **Try Different Login Methods:**
   
   **Option 1: Email Signup**
   - Click "Sign Up"
   - Enter email and password
   - Password must meet requirements (shown in real-time)
   - Complete profile setup with display name and handle
   
   **Option 2: Google OAuth**
   - Click "Continue with Google"
   - Authenticate with Google account
   - Complete profile setup (first time only)
   
   **Option 3: GitHub OAuth**
   - Click "Continue with GitHub"
   - Authenticate with GitHub account
   - Complete profile setup (first time only)

### File Structure

```
EduVerse/
├── landing.html              # Updated with new auth modals
├── landing.js                # Main landing page logic
├── landing-styles.css        # Updated with OAuth & validation styles
├── auth-handler.js           # Authentication logic (NEW)
├── insforge-client.js        # InsForge SDK client (NEW)
└── server.js                 # Express server (updated)
```

### Key Features

#### Password Validation
- Real-time visual feedback as user types
- Green border when all requirements met
- Red border when requirements not met
- Individual requirement indicators change color

#### Profile Setup
- Only shown to first-time users
- Required fields: Display name & handle
- Handle must be 3+ characters, alphanumeric + underscore
- Checks for unique handle in database
- Cannot proceed without completing profile

#### Session Management
- Auto-detect existing sessions
- Redirect logged-in users to dashboard
- OAuth callback handling
- Persistent login with httpOnly cookies

### Security Features

✅ Password requirements enforced
✅ Row Level Security on database
✅ CSRF protection with tokens
✅ HttpOnly cookies for session storage
✅ OAuth redirect validation
✅ Handle uniqueness validation

### Backend Configuration

**InsForge Backend:**
- Base URL: `https://aw63n46k.us-west.insforge.app`
- OAuth Providers: Google, GitHub
- Email Verification: Enabled (6-digit code)
- Password Min Length: 6 characters

### Next Steps

After successful login, users are redirected to `index.html` (main dashboard).

To integrate authentication into other pages:
1. Import the auth functions from `auth-handler.js`
2. Call `getCurrentUser()` to check login status
3. Redirect to landing page if not authenticated

Example:
```javascript
import { getCurrentUser, signOut } from './auth-handler.js';

const user = await getCurrentUser();
if (!user) {
    window.location.href = 'landing.html';
}
```

### Troubleshooting

**Module not found errors:**
- Ensure you're using `<script type="module">` in HTML
- Make sure server.js serves `.js` files with correct MIME type

**OAuth not working:**
- Check that redirect URL matches: `http://localhost:3000/landing.html?auth=callback`
- Verify OAuth providers are enabled in InsForge dashboard

**Profile setup keeps showing:**
- Check browser console for database errors
- Verify RLS policies are correctly set
- Ensure user_id is being passed correctly

---

## 🎉 Ready to Use!

Your professional authentication system is now complete with:
- 3 login methods (Google, GitHub, Email)
- Real-time password validation
- First-time profile setup
- Professional UI/UX
- Secure backend with InsForge

Just run `npm run dev` and start testing! 🚀
