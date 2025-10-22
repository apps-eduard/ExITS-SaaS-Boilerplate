# Quick Start: Login & Navigate to User Management

## 🚀 Start the Application

### 1. Terminal 1 - Start PostgreSQL Database
```powershell
cd k:\speed-space\ExITS-SaaS-Boilerplate

# If using docker-compose (recommended)
docker-compose up -d

# OR if PostgreSQL is already running locally, skip this
```

### 2. Terminal 2 - Start API Server
```powershell
cd k:\speed-space\ExITS-SaaS-Boilerplate\api

npm install  # Only if first time
npm start    # Runs on http://localhost:3000
```

Expected output:
```
✓ API Server running on http://localhost:3000
✓ Database connected successfully
✓ Routes initialized
```

### 3. Terminal 3 - Start Web Application
```powershell
cd k:\speed-space\ExITS-SaaS-Boilerplate\web

npm install  # Only if first time
npm start    # Runs on http://localhost:4200
```

Expected output:
```
✓ Angular application started
✓ Listening on http://localhost:4200
```

---

## 🔐 Login Flow

### Step 1: Open Login Page
1. Open browser to `http://localhost:4200`
2. You should be **automatically redirected** to `/login`
3. See the login page with **ExITS SaaS** branding

### Step 2: Theme Check
- **Top-right corner**: Dark/Light theme toggle button
- **Click it** to test dark mode:
  - Light mode: White background, dark text
  - Dark mode: Dark gray background (#111827), light text
- **Theme persists** on page reload ✅

### Step 3: Select Test Account
The login page shows **quick-access test accounts** in a grid:
- Click any test account to auto-fill email and password
- Or manually enter credentials below:

**System Administrator** (Full Access)
```
Email:    admin@exitsaas.com
Password: Admin@123
```

**Tenant User** (Limited Access)
```
Email:    admin-1@example.com
Password: Admin@123
```

### Step 4: Login
1. Click the desired test account (or enter manually)
2. Click **"Sign In"** button
3. Button shows loading spinner while processing
4. After ~2 seconds, redirected to `/dashboard`

**✅ Login Success Indicators:**
- URL changed to `/dashboard`
- Top navbar shows your email
- Sidebar visible on left
- Dashboard content loads

**❌ Login Failed Indicators:**
- Error message appears below form
- Stay on `/login` page
- Check credentials and try again

---

## 👥 Navigate to User Management

### Option 1: From Dashboard Sidebar
1. After login, look at **left sidebar**
2. Find and click **"Users"** menu item
3. You'll navigate to `/admin/users`
4. **All Users view** loads

### Option 2: Direct URL
1. Manually type in address bar: `http://localhost:4200/admin/users`
2. Press Enter
3. Redirects to full path with sidebar

---

## 📋 User Management Views

Once on `/admin/users`, you see the **Users Sidebar** on the left (green-themed).

### View 1: All Users (Active by Default)
```
URL: http://localhost:4200/admin/users
📋 All Users (first sidebar option)
```

**What you'll see:**
- Grid with 4 stat cards at top
  - Total Users
  - Active
  - Inactive
  - Selected
- Search and filter row
- User data table with columns:
  - Checkbox (select)
  - User (avatar + name)
  - Email
  - Tenant (System Admin / Tenant name)
  - Roles (badges)
  - Status (color-coded)
  - Last Login
  - Actions (Profile, Edit, Delete)
- Pagination at bottom

**Test Actions:**
1. Type in search box → See results filter in real-time
2. Select a user with checkbox → Selection counter updates
3. Click "Profile" button → Opens user profile view
4. Click "Edit" button → Opens user editor
5. Click "Next" button → See next page of users

---

### View 2: Admin Users Only
```
URL: http://localhost:4200/admin/users/admins
👤 Users → Admin Users (click from sidebar)
```

**What's different:**
- Shows ONLY system admin users (where `tenantId` is null)
- Stats show admin-specific counts:
  - Total Admins (lower than all users)
  - Active Admins
  - Suspended Admins
- Same table layout as All Users
- No tenant users displayed

**Test:**
1. Compare admin count to total users count
2. Verify all displayed users have "System Admin" badge
3. No "Tenant User" badges visible

---

### View 3: User Activity
```
URL: http://localhost:4200/admin/users/activity
📊 User Activity (click from sidebar)
```

**What you'll see:**
- 4 activity stat cards:
  - Total Users
  - Online Now (simulated: 1-5)
  - Last 24h Login (actual calculated)
  - Never Logged In (actual count)
- Activity table showing:
  - User avatar + name
  - Email
  - Type (System Admin / Tenant User)
  - Last Login (date + relative time like "2h ago")
  - Login IP (shows "N/A" - placeholder)
  - Status (color-coded)
  - View action button

**Test:**
1. Check "Last Login" shows relative times correctly:
   - "Just now"
   - "5m ago"
   - "2h ago"
   - "3d ago"
   - "Never logged in"
2. Verify stat counts match data in table
3. Click "View" button to see user profile

---

## 🎯 Quick Test Checklist

### ✅ Authentication
- [ ] Redirect to `/login` on first visit
- [ ] Theme toggle button works (light/dark)
- [ ] Test account tiles are clickable
- [ ] Manual login works with credentials
- [ ] After login, redirected to `/dashboard`
- [ ] Logout button appears in navbar

### ✅ Navigation
- [ ] Click "Users" in sidebar → Goes to `/admin/users`
- [ ] Sidebar navigation switches between views
- [ ] Back button works on browser
- [ ] Direct URL navigation works (`/admin/users/admins`)
- [ ] All routes protected (try `/admin/users` without login → redirects to `/login`)

### ✅ All Users View
- [ ] All users display in table
- [ ] Search box filters in real-time
- [ ] Status filter dropdown works
- [ ] Type filter shows System/Tenant options
- [ ] Role filter populated with roles
- [ ] Pagination buttons enable/disable correctly
- [ ] Individual row action buttons visible

### ✅ Admin Users View
- [ ] Shows only system admin users
- [ ] Admin count is lower than total users
- [ ] All displayed users have "System Admin" badge
- [ ] Stats match displayed data

### ✅ Activity View
- [ ] Activity stats display
- [ ] "Last 24h" count is accurate
- [ ] "Never Logged In" count is accurate
- [ ] Last Login times show relative format ("Xh ago")
- [ ] User status badges visible

### ✅ Compact Design & Theme
- [ ] Light mode readable (white background)
- [ ] Dark mode readable (dark background)
- [ ] Theme persists on page reload
- [ ] No horizontal scroll on main content
- [ ] All text sizes are consistent
- [ ] Buttons have proper hover states
- [ ] Color coding visible (Purple = Admin, Blue = Tenant)
- [ ] Responsive on mobile (resize to 375px width)

---

## 🐛 Troubleshooting

### Issue: "Cannot GET /admin/users"
**Cause**: API not running or route not configured
**Fix**:
1. Verify API running: `http://localhost:3000/api/users` should return JSON
2. Check routes in `app.routes.ts`
3. Reload page with Ctrl+Shift+R (hard refresh)

### Issue: Users not loading in table
**Cause**: API request failing
**Fix**:
1. Open DevTools (F12) → Network tab
2. Refresh page
3. Look for `GET /api/users` request
4. Should show status 200 with JSON response
5. If 401/403: Token expired, logout and login again
6. If 500: API error, check API logs in Terminal 2

### Issue: Theme not changing
**Cause**: localStorage issue or theme toggle broken
**Fix**:
1. Open DevTools (F12) → Application → localStorage
2. Delete `exitsaas-theme` key
3. Refresh page
4. Try theme toggle again
5. Check if `exitsaas-theme` key is created

### Issue: Sidebar not visible
**Cause**: RBAC permission missing
**Fix**:
1. Verify logged in as `admin@exitsaas.com` (system admin)
2. Check user has "Users" module permission
3. Refresh page
4. Check browser console for RBAC errors (F12 → Console)

### Issue: Mobile view broken
**Cause**: Responsive CSS not applied
**Fix**:
1. Close DevTools (F12) - they affect responsive layout
2. Resize browser window manually to 375px
3. Or use Chrome DevTools Device Emulation (without opening DevTools panel)
4. Should show hamburger menu instead of sidebar

---

## 📊 Expected Performance

### Page Load Times
- Initial load: 2-3 seconds
- Dashboard redirect: 1 second
- User list load: 1-2 seconds
- Pagination: < 500ms
- Search filter: < 100ms

### API Response Times
- GET /api/users: 200-500ms
- Search (with query): 300-700ms
- Pagination: 200-400ms

---

## 📝 Test Scenarios

### Scenario 1: Complete Login & Browse (5 min)
1. ✅ Open app
2. ✅ Toggle theme to dark
3. ✅ Login with admin account
4. ✅ Navigate to Users
5. ✅ Search for a user
6. ✅ View user profile
7. ✅ Go to Admin Users view
8. ✅ Go to Activity view
9. ✅ Logout

### Scenario 2: Test All Filters (3 min)
1. ✅ Go to All Users
2. ✅ Filter by Status = Active
3. ✅ Filter by Type = System Admin
4. ✅ Filter by Role (select one)
5. ✅ Combine multiple filters
6. ✅ Click Clear Filters
7. ✅ Verify all users shown again

### Scenario 3: Test Responsive Design (3 min)
1. ✅ Open app on desktop (1024px+)
   - Sidebar visible on left
   - Full table visible
2. ✅ Resize to tablet (600px)
   - Sidebar hidden
   - Hamburger menu visible
   - Click hamburger to show sidebar
3. ✅ Resize to mobile (375px)
   - All stacked vertically
   - Table scrolls horizontally
   - Touch buttons properly sized

### Scenario 4: Test Tenant User Access (2 min)
1. ✅ Logout
2. ✅ Login with `admin-1@example.com` (tenant user)
3. ✅ Try to access `/admin/users`
   - Should be forbidden/redirected
   - RBAC should restrict access
4. ✅ Verify tenant user sees only tenant dashboard

---

## 🎓 Key Features to Verify

### Theme Integration
```
✅ Tailwind CSS dark: classes used throughout
✅ Color scheme consistent
✅ No hardcoded colors (all using CSS classes)
✅ localStorage persistence
✅ System preference detection (optional)
```

### Compact Design
```
✅ Minimal padding (px-3, py-2 on cards)
✅ Small text sizes (text-xs, text-sm)
✅ Efficient spacing (gap-2, space-y-4)
✅ No unnecessary margins
✅ Responsive grid layout
```

### Responsive Layout
```
✅ Mobile: Single column, hamburger menu
✅ Tablet: Flexible wrapping, horizontal scroll for tables
✅ Desktop: Full sidebar + content
✅ No fixed widths breaking layout
✅ Touch-friendly sizes on mobile
```

### Dark Mode Coverage
```
✅ All backgrounds have dark: variant
✅ All text has dark: variant
✅ All borders have dark: variant
✅ All interactive elements have dark: hover states
✅ Sufficient contrast in both modes (WCAG AA)
```

---

## 🚀 Next Steps After Testing

### If Everything Works ✅
1. Commit changes to git
2. Deploy to staging environment
3. Run full E2E test suite
4. Get stakeholder approval
5. Deploy to production

### If Issues Found ❌
1. Check error logs (Console tab in DevTools)
2. Review API responses in Network tab
3. Check browser compatibility
4. Run tests locally with `npm test`
5. Debug and fix, then retry

---

## 📞 Support

For issues or questions:
1. **Check Network Tab**: DevTools (F12) → Network → See API responses
2. **Check Console**: DevTools (F12) → Console → See JavaScript errors
3. **Check Logs**: Terminal windows → See API/build errors
4. **Restart**: Kill all processes (Ctrl+C) and restart each service

---

**Last Updated**: October 22, 2025
**Version**: 1.0
**Status**: Ready for Testing ✅
