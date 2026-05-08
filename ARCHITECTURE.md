# Silicon Systems HelpDesk System Architecture

Complete visual guide to how the system works and connects.

---

## 🏗️ Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER (Silicon Systems)              │
│                   (Next.js Frontend + React)                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Login Page (with Branding)                 │  │
│  │          Silicon Systems Logo + Security Info           │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │ (JWT Token)                             │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │  Dashboard Layout (Fixed Sidebar + Main Content)         │  │
│  │  ├─ Silicon Systems Logo & Branding                     │  │
│  │  ├─ Role-Based Navigation Menu                          │  │
│  │  ├─ Mobile Burger Menu (responsive)                     │  │
│  │  └─ Main Content Area                                  │  │
│  │      ├─ Dashboard Page (Analytics, Charts)             │  │
│  │      ├─ Tickets List (Table + Cards, Filters)          │  │
│  │      ├─ [Ticket Details]  ◄─── Current Interest       │  │
│  │      │  ┌──────────────────────────────────────┐       │  │
│  │      │  │ LEFT: Ticket Info + Activity Log    │       │  │
│  │      │  │ RIGHT: Action Buttons with Modals    │       │  │
│  │      │  │ ├─ Progress Button → Panel           │       │  │
│  │      │  │ ├─ Conversation → Modal + Badge      │       │  │
│  │      │  │ │  (Unread count shown)             │       │  │
│  │      │  │ └─ Update → Modal (role-based)       │       │  │
│  │      │  └──────────────────────────────────────┘       │  │
│  │      ├─ User Directory (role filter)                   │  │
│  │      └─ Create Ticket Form                             │  │
│  │                                                         │  │
│  │  Notifications:                                        │  │
│  │  ├─ Unread Badge (red circle on Conversation)          │  │
│  │  └─ Toast Notifications (bottom-right/left)            │  │
│  └───────────────┬──────────────────────────────────────┬───┘  │
│                  │ Sends HTTP with JWT                 │       │
│                  │ Receives JSON responses              │       │
│                  │                                      │       │
│                  ▼                                      │       │
│         ┌──────────────────┐                          │       │
│         │  lib/api.ts      │                          │       │
│         │  API Client      │                          │       │
│         │  + Token Mgmt    │                          │       │
│         │  + Refresh Logic │                          │       │
│         └────────┬─────────┘                          │       │
└──────────────────┼──────────────────────────────────────┼───────┘
                   │                                      │
                   │ RESTful API Calls                    │
                   │ POST /api/token/                     │
                   │ GET /api/me/ (Profile Fallback)      │
                   │ GET /api/tickets/                    │
                   │ PATCH /api/tickets/{id}/update/      │
                   │ GET /api/dashboard/summary/          │
                   │                                      │
        ┌──────────▼──────────────────────────────────┐   │
        │      DJANGO REST FRAMEWORK BACKEND           │   │
        │      (config, accounts, core, tickets)       │   │
        │                                              │   │
        │  ┌──────────────────────────────────────┐   │   │
        │  │ URLs Router (JWT + App Routes)       │   │   │
        │  └────────────┬─────────────────────────┘   │   │
        │               ▼                             │   │
        │  ┌──────────────────────────────────────┐   │   │
        │  │ Views/Viewsets (ticket_views.py)    │   │   │
        │  │ - List, Create, Update, Delete       │   │   │
        │  │ - Dashboard analytics                │   │   │
        │  │ - Member filtering                   │   │   │
        │  └────────┬──────────────┬──────────────┘   │   │
        │           ▼              ▼                  │   │
        │  ┌──────────────┐  ┌──────────────┐        │   │
        │  │ Permissions  │  │ Serializers  │        │   │
        │  │ IsAuthenticated│ Validate      │        │   │
        │  │ & IsAdmin    │  Transform     │        │   │
        │  └──────────────┘  └──────┬───────┘        │   │
        │                           ▼                │   │
        │  ┌──────────────────────────────────────┐   │   │
        │  │ Models & QuerySet                    │   │   │
        │  │ Ticket.objects.for_user(user)        │   │   │
        │  │ Role-based filtering at DB level     │   │   │
        │  └────────────┬─────────────────────────┘   │   │
        │               ▼                             │   │
        └───────────────┼─────────────────────────────┘   │
                        │                                 │
                        ▼                                 │
        ┌──────────────────────────────────────┐  ◄──────┘
        │     PostgreSQL Database               │
        │  ┌──────────────────────────────────┐ │
        │  │ Users, Tickets, Members, Clients │ │
        │  │ Issues, SubIssues, Activities    │ │
        │  │ Company Types                    │ │
        │  └──────────────────────────────────┘ │
        └──────────────────────────────────────┘
```
                    │ │ (Validate)  │  │
                    │ └──────┬──────┘  │
                    │        │         │
                    │ ┌──────▼──────┐  │
                    │ │   Models    │  │
                    │ │ (QuerySet) │  │
                    │ └──────┬──────┘  │
                    └────────┼─────────┘
                             │
                    ┌────────▼──────────┐
                    │  PostgreSQL DB    │
                    │  ┌──────────────┐ │
                    │  │ Users        │ │
                    │  │ Tickets      │ │
                    │  │ Members      │ │
                    │  │ Clients      │ │
                    │  │ Activities   │ │
                    │  └──────────────┘ │
                    └───────────────────┘
```

---

## 🔄 Request/Response Flow

```
CLIENT SENDS:
┌──────────────────────────────────┐
│ GET /api/tickets/                │
│ Headers:                         │
│   Authorization: Bearer <token>  │
│   Content-Type: application/json │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ BACKEND PROCESSES:               │
│ 1. Extract token from header     │
│ 2. Verify token (valid, not exp) │
│ 3. Get user from token           │
│ 4. Check permission              │
│ 5. Filter issues for user        │
│ 6. Serialize to JSON             │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ SERVER RETURNS:                  │
│ HTTP 200 OK                      │
│ [                                │
│   { id: 1, ticket_number: "..." },
│   { id: 2, ticket_number: "..." }
│ ]                                │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ FRONTEND UPDATES:                │
│ 1. Parse JSON response           │
│ 2. Update state (setIssues)     │
│ 3. Re-render components          │
│ 4. Display issues in UI          │
└──────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
USER AT LOGIN PAGE:
┌─────────────────────────────────────────┐
│ Enters username: "john"                 │
│ Enters password: "secret123"            │
└──────────┬────────────────────────────────┘
           │ Click "Login" button
           ▼
┌─────────────────────────────────────────┐
│ apiPost('/api/token/', {                │
│   username: "john",                     │
│   password: "secret123"                 │
│ })                                      │
└──────────┬────────────────────────────────┘
           │ POST request to backend
           ▼
┌─────────────────────────────────────────┐
│ BACKEND /api/token/ endpoint:           │
│ 1. Lookup user "john"                   │
│ 2. Check password matches               │
│ 3. If valid → Generate JWT tokens       │
│    - access token (15 min expiry)       │
│    - refresh token (7 day expiry)       │
│ 4. Return both tokens                   │
└──────────┬────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ RESPONSE TO FRONTEND:                   │
│ {                                       │
│   "access": "eyJ0eXAi...",             │
│   "refresh": "eyJ0eXAi..."             │
│ }                                       │
└──────────┬────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ FRONTEND STORES & VERIFIES:             │
│ localStorage.setItem('access', token)   │
│ localStorage.setItem('refresh', token)  │
│                                         │
│ 1. Decodes JWT to get user_id          │
│ 2. If role/username missing from JWT:  │
│    GET /api/me/ (Profile Fallback)      │
│ 3. Stores username & user_role         │
└──────────┬────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ REDIRECT TO DASHBOARD                   │
│ All future requests include:            │
│ Authorization: Bearer <access_token>    │
└─────────────────────────────────────────┘

IF TOKEN EXPIRES:
┌────────────────────────────────────────┐
│ Request gets 401 Unauthorized           │
└──────────┬───────────────────────────┐
           │                           │
      ▼────────────────────────────┬────▼
   Retry with                      │
   new access              Wait, let's
   token from              refresh
   refresh token           the token!
   
   POST /api/token/refresh/
   Body: { refresh: <refresh_token> }
           │
           ▼
   ┌─────────────────────────┐
   │ Get new access token    │
   │ (refresh token still    │
   │  good for 7 days)       │
   └────────┬────────────────┘
            │
            ▼
   ┌─────────────────────────┐
   │ Update localStorage     │
   │ Retry original request  │
   │ with new token          │
   └─────────────────────────┘

---

## 📱 Responsive Design System (Mobile-First Approach)

### Dual-View Pattern
```
DESKTOP VIEW (md breakpoint and above):
┌─────────────────────────────────┐
│   Comprehensive Table Layout    │
│ (hidden on mobile via Tailwind) │
│                                 │
│ Columns: ID, Status, Client,   │
│ Issue, Member, Date            │
│                                 │
│ Used: hidden md:block           │
└─────────────────────────────────┘

MOBILE VIEW (below md breakpoint):
┌─────────────────────────────────┐
│   Responsive Card Layout        │
│ (hidden on desktop)             │
│                                 │
│ ┌──────────────────────────┐    │
│ │ #123                     │    │
│ │ Description              │    │
│ │ 📋 Client | 🏢 Company  │    │
│ │ 👤 Member | 📅 Date     │    │
│ └──────────────────────────┘    │
│                                 │
│ Used: md:hidden                 │
└─────────────────────────────────┘
```

**Benefits**:
- No horizontal scrolling on mobile
- Optimized readability for small screens
- Desktop users get full table features
- Responsive pagination wraps correctly

### Responsive Utilities Used
- `hidden md:block` - Show table on desktop, hide on mobile
- `md:hidden` - Show cards on mobile, hide on desktop
- `grid grid-cols-1 md:grid-cols-3` - 1 column mobile, 3 columns tablet/desktop
- `flex flex-wrap gap-2` - Pagination wraps on small screens
- `flex flex-col md:flex-row` - Stack on mobile, horizontal on desktop

---

## 🔍 Advanced Filtering System (Admin Feature)

### Filter Architecture
```
ADMIN SEES (on tickets page):
┌──────────────────────────────────────────┐
│  Advanced Filtering Controls             │
│                                          │
│  ┌─────────────┐  ┌────────────┐        │
│  │ Filter by   │  │ Filter by  │        │
│  │ Client      │  │ Member     │        │
│  │ ▼ Company A │  │ ▼ John D.  │        │
│  └─────────────┘  └────────────┘        │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │ Filter by    │  │ Active:          │ │
│  │ Month        │  │ 2 filters        │ │
│  │ ▼ March 2026 │  │ (12 results)     │ │
│  │              │  │ [Reset] [X]      │ │
│  └──────────────┘  └──────────────────┘ │
└──────────────────────────────────────────┘

FILTER LOGIC (AND operations):
- filterClient AND filterMember AND filterMonth
- All filters work together (intersection, not union)
- Client-side filtering (data already loaded)
- Real-time updates as filters change

FILTER COMPONENTS:
1. FilterSelect: Reusable dropdown component
   - Accepts array of strings or objects
   - Supports custom label extraction
   - Shows "All" option when cleared

2. FilterBadge: Visual filter indicator
   - Shows active filter with name
   - Individual remove buttons
   - Count of applied filters
   - Professional styling with blue accent

3. Filter Summary Card:
   - Shows total filtered results
   - Lists active filters
   - Reset button to clear all
   - Responsive layout (stacks on mobile)
```

**Member Filter Logic**:
```javascript
// Extract unique members from tickets
const uniqueMembers = []
  .concat(...tickets.map(t => t.assignedTo))
  .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)

// Only ADMIN sees filter dropdowns
if (userRole === 'ADMIN') { showFilters() }
```

---

## 👥 User Directory with Role-Based Filtering (New Feature)

### User Directory Page Architecture
```
ADMIN VIEWING: /app/dashboard/users/ (or /admin/users/)

┌──────────────────────────────────────┐
│  User Directory & Management         │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Filter by Role:                │ │
│  │ ☐ All Roles                    │ │
│  │ ☐ Administrators               │ │
│  │ ☐ Support Members              │ │
│  │ ☐ Clients                      │ │
│  └────────────────────────────────┘ │
│                                      │
│  Results: Showing 5 users            │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ John Doe          [ADMIN]    │   │
│  │ john@example.com             │   │
│  │ Role: Administrator          │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Sarah Smith       [MEMBER]   │   │
│  │ sarah@example.com            │   │
│  │ Role: Support Specialist     │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Acme Corp         [CLIENT]   │   │
│  │ contact@acme.com             │   │
│  │ Role: Client Portal User     │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘

FILTERING OPTIONS:
1. Filter by Role (ADMIN only feature):
   - All Roles (default, shows all users)
   - Administrators (role='ADMIN')
   - Support Members (role='MEMBER')
   - Clients (role='CLIENT')

2. Search Integration (optional):
   - Search by username or email
   - Works alongside role filter
   - Real-time filtering

ROLE-BASED VISIBILITY:
- ADMIN: Can see and filter all users
- MEMBER: Cannot see user directory (redirected)
- CLIENT: Cannot see user directory (redirected)
```

**Implementation Pattern** (mirrors tickets filtering):
```typescript
// State management
const [users, setUsers] = useState<User[]>([]);
const [filterRole, setFilterRole] = useState(''); // 'ADMIN' | 'MEMBER' | 'CLIENT' | ''

// Filter logic
const filteredUsers = users.filter(user => {
  if (filterRole && user.role !== filterRole) return false;
  return true;
});

// Extract unique roles from user data
const uniqueRoles = ['ADMIN', 'MEMBER', 'CLIENT']
  .filter(role => users.some(u => u.role === role));
```
```

---

## 🎫 Issue Lifecycle

```
CREATED
├─ Client submits form
├─ Backend creates issue with:
│  - ticket_number: UUID
│  - status: CREATED
│  - assigned_to: NULL (not yet assigned)
│  - created_at: now
└─ Activity log: "Issue created"

         │
         ▼ (Admin assigns to member)

ASSIGNED
├─ Admin views eligible-members endpoint
├─ Frontend shows members filtered by specialty
├─ Admin selects member
├─ Backend validates member specialty matches issue
├─ Update assigned_to field
└─ Activity log: "Assigned to john"

         │
         ▼ (Member starts working)

STARTED
├─ Member changes status to STARTED
├─ Backend:
│  - Check is it allowed (yes, from ASSIGNED)
│  - Check user is MEMBER role (yes)
│  - Update status
│  - Set started_at: now
└─ Activity log: "Started at 2:45 PM"

         │
         ▼ (Member fixes issue)

RESOLVED
├─ Member changes status to RESOLVED
├─ Backend marks resolved_at: now
└─ Activity log: "Resolved at 3:30 PM"

         │
         ▼ (Admin closes issue)

CLOSED
├─ Admin (only admin can) closes issue
├─ Backend marks closed_at: now
└─ Activity log: "Closed. Total time: 1hr 45min"

INVALID TRANSITIONS:
- CREATED → STARTED (skip ASSIGNED) ❌
- CREATED → RESOLVED ❌
- STARTED → CLOSED (skip RESOLVED) ❌
- CLOSED → ASSIGNED (no reopening) ❌
```

---

## 👥 Role-Based Access Timeline

```
VISITOR (Not logged in)
└─ Only access: Login page
   Redirect: / → /login

ADMIN (After login)
├─ Access:
│  ├─ All issues (GET /api/tickets/)
│  ├─ Create/Read/Update/Delete issues
│  ├─ View all analytics
│  │  ├─ Status distribution
│  │  ├─ Monthly trends
│  │  ├─ Client-wise breakdown
│  │  └─ Member-wise workload
│  ├─ Manage users
│  ├─ View member list
│  └─ Perform any status transition (including CLOSE)
│
└─ Cannot: Create issues from Client form

MEMBER (After login)
├─ Access:
│  ├─ Only assigned issues (QuerySet filters)
│  ├─ Update status of own issues (not CLOSE)
│  ├─ View activity timeline
│  ├─ View analytics
│  │  ├─ Status distribution
│  │  ├─ Monthly trends
│  │  └─ Client-wise breakdown
│  └─ See eligible members (for handoff)
│
└─ Cannot:
   ├─ Close issues (admin-only)
   ├─ Create issues
   ├─ Assign members
   ├─ View member-wise analytics
   └─ Manage users

CLIENT (After login)
├─ Access:
│  ├─ Only own issues (QuerySet filters)
│  ├─ Create new issues
│  ├─ Track issue status
│  └─ View activity on own issues
│
└─ Cannot:
   ├─ Change issue status
   ├─ Assign to members
   ├─ Delete issues
   ├─ See other clients' issues
   ├─ View analytics
   └─ View member information
```

---

## 🔄 Member Assignment Process

```
ADMIN VIEWING ISSUE DETAIL:
┌──────────────────────────┐
│ Issue #12345             │
│ Issue: Database          │
│ Status: ASSIGNED         │
│ Currently unassigned ☐   │
└──────┬───────────────────┘
       │ Admin clicks "Assign Member"
       ▼
┌────────────────────────────────┐
│ <select> placeholder loading   │
└──────┬──────────────────────────┘
       │ Frontend calls:
       │ GET /api/tickets/123/eligible-members/
       ▼
┌────────────────────────────────┐
│ BACKEND LOGIC:                 │
│ 1. Get ticket #123             │
│ 2. Get ticket.issue = Database │
│ 3. Query Members where:        │
│    - specialty = Database      │
│    - is_active = True          │
│ 4. Return member list          │
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ RESPONSE:                        │
│ [                                │
│   { id: 5, username: "john" },   │
│   { id: 8, username: "mary" }    │
│ ]                                │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ FRONTEND:                        │
│ <select>                         │
│   <option>Select member</option> │
│   <option value="5">john</option>│
│   <option value="8">mary</option>│
│ </select>                        │
└──────┬───────────────────────────┘
       │ Admin selects "john"
       ▼
┌──────────────────────────────────┐
│ PATCH /api/tickets/123/          │
│ Body: { assigned_to: 5 }         │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ BACKEND VALIDATION:              │
│ 1. User is Admin? ✓              │
│ 2. Member #5 specialty =         │
│    Ticket issue? ✓               │
│ 3. Save to DB                    │
│ 4. Create TicketActivity log     │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ RESPONSE:                        │
│ Updated ticket with:            │
│ - assigned_to: {id: 5, ...}      │
│                                  │
│ Activity log:                    │
│ "Assigned to john by admin"      │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ FRONTEND UPDATE:                 │
│ 1. Update ticket state           │
│ 2. Show "Assigned to: john"      │
│ 3. Show new activity entry       │
│ 4. Show success message          │
└──────────────────────────────────┘
```

---

## 📊 Analytics Data Flow

```
ADMIN OPENS DASHBOARD
│
├─ Four tabs with different analytics:
│
├─ Tab 1: "Status Distribution"
│  └─ GET /api/dashboard/summary/
│     └─ Shows pie chart: CREATED(5), ASSIGNED(8), STARTED(12), RESOLVED(10), CLOSED(7)
│
├─ Tab 2: "Monthly Trends"
│  └─ GET /api/dashboard/monthly/
│     └─ Shows line chart: Jan(10), Feb(20), Mar(12)...
│
├─ Tab 3: "Client Analytics"
│  └─ GET /api/dashboard/client-wise/
│     └─ Shows bar chart: Acme Corp(15), Tech Inc(8), StartUp(5)...
│
└─ Tab 4: "Team Performance" (Admin only)
   └─ GET /api/dashboard/member-wise/
      └─ Shows bar chart: John(12 tickets), Sarah(9), Mike(7)...
      └─ Sensitive data - members cannot see this
         │
         ▼
      Frontend renders Recharts visualization
      │
      ├─ Smooth transitions between tabs
      ├─ Loading state: "Fetching analytics…"
      └─ Error handling: Shows error message if API fails
```

**Key Features**:
- Real-time data fetching
- Role-based tab visibility
- Professional Recharts integration
- Responsive chart sizing
- Light grid styling for readability

---

## 📱 Responsive Design System (New - After March UI Update)

### Dual-View Pattern for Tickets Page

The tickets page (`app/dashboard/tickets/page.tsx`) implements a dual-view responsive system:

**DESKTOP VIEW** (MD breakpoint and above, ≥768px):
```
┌────────────────────────────────────────┐
│  Full Comprehensive Table              │
│  ┌─────────────────────────────────┐  │
│  │ ID  │ Status │ Client │ Issue   │  │
│  ├─────────────────────────────────┤  │
│  │ #1  │ ASSIGNED │ Acme │ Network │  │
│  │ #2  │ STARTED  │ TechCo │DB    │  │
│  │ #3  │ RESOLVED │ Beta  │Soft   │  │
│  └─────────────────────────────────┘  │
│                                        │
│  Pagination: [1] [2] [3] [Next]       │
└────────────────────────────────────────┘

Implementation: hidden md:block
- Shows table with all columns
- Horizontal scrolling prevented
- Professional table styling
```

**MOBILE VIEW** (Below MD breakpoint, <768px):
```
┌──────────────────────────┐
│  Card Layout (Stack)     │
│  ┌────────────────────┐  │
│  │ #123               │  │
│  │ Network issue      │  │
│  │ 📋 Acme | 🏢 Corp │  │
│  │ 👤 John | 📅 3/7  │  │
│  │ [Status Badge]     │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ #124               │  │
│  │ Database sync      │  │
│  │ 📋 TechCo | 🏢 Inc│  │
│  │ 👤 Jane | 📅 3/6  │  │
│  │ [Status Badge]     │  │
│  └────────────────────┘  │
│                          │
│ Pagination: [1] [2]     │
└──────────────────────────┘

Implementation: md:hidden
- Shows TicketCard component
- Grid layout with 2-column metadata
- No horizontal scrolling
- Touch-friendly spacing
```

### Key Responsive Classes Used

| Pattern | Purpose | Example |
|---------|---------|---------|
| `hidden md:block` | Hide on mobile, show on desktop | Table component |
| `md:hidden` | Show on mobile, hide on desktop | Card view component |
| `grid-cols-1 md:grid-cols-3` | 1 column mobile, 3 desktop | Filter dropdowns |
| `flex flex-wrap gap-2` | Wrap items on small screens | Pagination |
| `flex flex-col md:flex-row` | Stack mobile, row desktop | Filter summary |

### Benefits of Dual-View Approach

✓ **No Horizontal Scrolling**: Mobile users never scroll horizontally  
✓ **Optimal Information Density**: Desktop shows full table, mobile shows key info  
✓ **Touch-Friendly**: Card layout works well on touch devices  
✓ **Professional Look**: Each view is purpose-built for its screen size  
✓ **Better Performance**: Each view is optimized (less rendering on mobile)  

---

## 🔍 Advanced Filtering System

### Overview

Admin-only filtering system on tickets page with three independent filters working with AND logic.

### Filter Architecture

```
┌─────────────────────────────────────────────┐
│  ADMIN SEES: Advanced Filter Controls       │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Client   │  │ Member   │  │ Month    │ │
│  │ ▼ Acme   │  │ ▼ John   │  │ ▼ March  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Active: 2 filters applied          │   │
│  │  Results: 5 tickets                 │   │
│  │  [Reset Filters]                    │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

MEMBER/CLIENT: No filter dropdowns visible
```

### Filter Components

**1. FilterSelect** - Reusable dropdown component
```typescript
// Usage
<FilterSelect
  label="Filter by Client"
  options={uniqueClients}
  value={filterClient}
  onChange={setFilterClient}
/>

// Features:
- Custom label extraction
- "All" option to clear
- Blue-600 styling
- Responsive width
```

**2. FilterBadge** - Visual filter indicator pill
```typescript
// Usage
{filterClient && (
  <FilterBadge 
    label={`Client: ${selectedClientName}`}
    onRemove={() => setFilterClient('')}
  />
)}

// Features:
- Shows active filter name
- Individual × button to remove
- Count of applied filters
- Blue accent styling
```

**3. Filter Logic** - AND operations
```typescript
// All three filters work together (AND, not OR)
const filteredTickets = tickets.filter(ticket => {
  // All conditions must be true
  if (filterClient && ticket.client.id !== filterClient) return false;
  if (filterMember && ticket.assignedTo.id !== filterMember) return false;
  if (filterMonth && !isInMonth(ticket.createdAt, filterMonth)) return false;
  return true;
});
```

### Unique Value Extraction

```typescript
// Extract unique clients from loaded tickets
const uniqueClients = [
  ...new Map(
    tickets.map(t => t.client).map(item => [item.id, item])
  ).values()
];

// Display in dropdown  
<FilterSelect
  options={uniqueClients}
  getLabelFn={(client) => client.name}
/>
```

### Role-Based Visibility

```
ADMIN Role:
✓ FilterSelect dropdowns visible (Client, Member, Month)
✓ Can apply multiple filters
✓ Can reset all filters

MEMBER Role:
✗ No filter dropdowns
✗ Sees only assigned tickets (backend filtered)
✗ No reset needed

CLIENT Role:
✗ No filter dropdowns
✗ Sees only own tickets (backend filtered)
✗ No reset needed
```

---

## 👥 User Directory with Role-Based Filtering (New Feature)

### User Directory Page

Location: `/app/dashboard/users/page.tsx` (New)

```
┌─────────────────────────────────────────┐
│  User Directory & Management            │
│                                         │
│  Filter by Role:                        │
│  ┌─────────────────────────────────┐   │
│  │ All Roles ▼                     │   │
│  │ - Administrators                │   │
│  │ - Support Members               │   │
│  │ - Clients                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Results: Showing 12 users              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ John Doe          [ADMIN]       │   │
│  │ john@example.com                │   │
│  │ Administrator Access            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Sarah Smith       [MEMBER]      │   │
│  │ sarah@example.com               │   │
│  │ Support Specialist              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Acme Corporation  [CLIENT]      │   │
│  │ contact@acme.com                │   │
│  │ Client Portal User              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Filter Options

```
filterRole state:
- "" (empty) → "All Roles" → Show all users
- "ADMIN" → "Administrators" → Show only role='ADMIN'
- "MEMBER" → "Support Members" → Show only role='MEMBER'
- "CLIENT" → "Clients" → Show only role='CLIENT'

Extraction Logic:
const uniqueRoles = ['ADMIN', 'MEMBER', 'CLIENT']
  .filter(role => users.some(u => u.role === role));
```

### Role-Based Access Control

```
ADMIN Role:
✓ Access to /dashboard/users
✓ See all users
✓ Can filter by role
✓ See role badges and details

MEMBER Role:
✗ Cannot access /dashboard/users
✗ Redirected or page hidden
✗ No user directory needed

CLIENT Role:
✗ Cannot access /dashboard/users
✗ Redirected or page hidden
✗ No user directory needed
```

### Implementation Pattern

```typescript
// Similar to ticket filtering pattern
const [users, setUsers] = useState<User[]>([]);
const [filterRole, setFilterRole] = useState('');

// Fetch all users on mount
useEffect(() => {
  const fetchUsers = async () => {
    const data = await apiGet('/api/accounts/users/');
    setUsers(data);
  };
  fetchUsers();
}, []);

// Filter logic
const filteredUsers = users.filter(user => {
  if (filterRole && user.role !== filterRole) return false;
  return true;
});

// Extract unique roles (for filter options)
const uniqueRoles = ['ADMIN', 'MEMBER', 'CLIENT']
  .filter(role => users.some(u => u.role === role));
```

---
   ├─ Frontend: GET /api/dashboard/member-wise/
   │
   ├─→ BACKEND PROCESSING:
   │   1. Get all tickets for this admin
   │      (admin sees all due to role)
   │   2. Group by assigned_to__user__username
   │   3. Count tickets per member
   │   4. Return aggregated data
   │
   ├─ RESPONSE JSON:
   │  [
   │    { assigned_to__user__username: "john", count: 15 },
   │    { assigned_to__user__username: "mary", count: 8 },
   │    { assigned_to__user__username: "bob", count: 12 }
   │  ]
   │
   ├─ FRONTEND TRANSFORMATION:
   │  Convert to chart format:
   │  [
   │    { name: "john", value: 15 },
   │    { name: "mary", value: 8 },
   │    { name: "bob", value: 12 }
   │  ]
   │
   └─ DISPLAY:
      Bar chart with Recharts
      john: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (15)
      mary: ▓▓▓▓▓▓▓▓ (8)
      bob:  ▓▓▓▓▓▓▓▓▓▓▓▓ (12)
```

---

## 🗄️ Database Schema Relationships

```
USERS TABLE
├─ id, username, email, password, role
│
├─→ 1-to-1 ─→ MEMBERS TABLE
│   │         ├─ id, user_id, specialty_id, is_active
│   │         │
│   │         └─→ 1-to-∞ ─→ TICKETS (assigned_to)
│   │                       └─ Member assigned to ticket
│   │
│   └─→ 1-to-1 ─→ CLIENTS TABLE
│                 ├─ id, user_id, company_name, email
│                 │
│                 └─→ 1-to-∞ ─→ TICKETS (client)
│                              └─ Ticket belongs to client
│
├─→ 1-to-∞ ─→ TICKET_ACTIVITY TABLE
│             ├─ id, ticket_id, changed_by_id
│             ├─ old_status, new_status, created_at
│             └─ Logs who changed what when
│
└─→ (foreign key) ─→ ISSUES TABLE
                     ├─ id, name (e.g., "Database")
                     │
                     └─→ 1-to-∞ ─→ MEMBERS (specialty)
                                  └─ Members specializing in this
                     
                     └─→ 1-to-∞ ─→ SUB_ISSUES TABLE
                                  ├─ id, name (e.g., "Connection lost")
                                  │
                                  └─→ 1-to-∞ ─→ TICKETS
                                             └─ Ticket's specific sub-issue
                     
                     └─→ 1-to-∞ ─→ TICKETS (issue)
                                  └─ Tickets in this category

KEY RELATIONSHIPS:
├─ User (MEMBER role) ←→ Member (1-to-1)
├─ User (CLIENT role) ←→ Client (1-to-1)
├─ Member specialty → Issue type
├─ Ticket issue → Issue type → Sub-issues
├─ Ticket assigned_to → Member
└─ Activity changed_by → User
```

---

## 🔐 Permission System

```
REQUEST ARRIVES
│
└─→ URL Router matches route
    │
    └─→ View executes
        │
        ├─→ Check: Is user authenticated?
        │   ├─ NO → 401 Unauthorized
        │   └─ YES → Continue
        │
        ├─→ Check: permission_classes
        │   ├─ @permission_classes([IsAdminUserRole])
        │   │  ├─ User role = ADMIN? → OK
        │   │  └─ Otherwise → 403 Forbidden
        │   │
        │   ├─ @permission_classes([IsAdminOrMember])
        │   │  ├─ User role in [ADMIN, MEMBER]? → OK
        │   │  └─ Otherwise → 403 Forbidden
        │   │
        │   └─ No decorator → Accessible to auth users
        │
        ├─→ QuerySet filtering: for_user()
        │   ├─ ADMIN → return all tickets
        │   ├─ MEMBER → return only assigned tickets
        │   ├─ CLIENT → return only own tickets
        │   └─ Other → return none
        │
        └─→ Serializer business logic
            ├─ Members can't set status to CLOSED
            ├─ Member specialty must match issue
            └─ Check allowed transitions

FINAL RESPONSE:
├─ User gets only data they can access
├─ User can only perform allowed actions
└─ Attempt to bypass → 403 error
```

---

## 📱 Component Hierarchy (Frontend)

```
RootLayout
  ├─ Header/Navigation
  └─ Page (dynamic routing)
     │
     ├─ /login
     │  └─ LoginPage
     │
     ├─ /dashboard
     │  └─ DashboardLayout
     │     └─ DashboardPage
     │        ├─ StatusChart
     │        ├─ MonthlyChart
     │        ├─ ClientChart
     │        └─ MemberChart
     │
     └─ /dashboard/tickets
        ├─ TicketsPage (list)
        │  └─ TicketCard (repeating)
        │     └─ StatusBadge
        │
        ├─ /create
        │  └─ CreateTicketPage
        │     ├─ IssueSelect
        │     ├─ SubIssueSelect (chained)
        │     └─ DescriptionInput
        │
        └─ /[id]
           └─ TicketDetailPage
              ├─ TicketInfo
              ├─ ActivityTimeline
              │  └─ ActivityItem (repeating)
              │
              └─ TicketUpdateForm
                 ├─ StatusSelect
                 ├─ MemberSelect (chained)
                 └─ SaveButton
```

---

## 🔄 Data State Management

```
Frontend (no Redux/Context needed - simple state)
│
├─ useState per component
│  ├─ Form inputs (username, password, description)
│  ├─ API response data (issues, issue detail, members)
│  ├─ Loading state (isLoading, submitLoading)
│  └─ Error state (error message)
│
└─ LocalStorage
   ├─ access token (JWT)
   └─ refresh token (JWT)

Backend (Database is source of truth)
│
├─ Models (database tables)
│  └─ QuerySet → Filtered data
│
├─ Serializers
│  └─ Clean/transform data
│
└─ Views
   └─ Return serialized response

FLOW:
Frontend → POST request → Backend updates DB
         ← JSON response with new data
         → Update local state
         → Re-render component
```

---

## 🎯 Request Timeline for Ticket Creation

```
TIME    FRONTEND            BACKEND              DATABASE
────────────────────────────────────────────────────────
T0      Form opens
        Load issues
        └─GET /api/issues/ ───→

T1                         Query issues table
                           │
                           ├─→ Serialize results
                           │
T2      Receive issues     Return JSON
        ←─                 ←──── response

T3      User selects issue
        Load sub-issues
        └─GET /api/issues/{id}/
          sub-issues/ ────→

T4                         Query sub_issues
                           where issue_id={id}
                           │
                           ├─→ Serialize
                           │
T5      Receive            Return JSON
        sub-issues         ←──── 
        ←─────────

T6      User fills form
        - Selects Issue
        - Selects SubIssue
        - Enters description
        - Clicks Create

T7      POST /api/tickets/
        {issue, sub_issue,  ────→
         description}

T8                         Validate data
                           - SubIssue.issue
                             == Issue? ✓
                           - Required fields? ✓
                           │
                           ├─→ Create Ticket
                           │   INSERT INTO
                           │   tickets_ticket ───→ INSERT

T9                                                 Ticket created
                                                   ticket_id: 100

T10     Receive            Return:
        response           {id: 100, 
        ←────────          ticket_number: UUID,
                           status: CREATED}

T11     Update state
        setTicket(newData)
        Redirect to detail
        └─→ /dashboard/
            tickets/100
```

---

## 🚨 Error Handling Flow

```
USER ACTION (e.g., Update Status)
│
└─ Frontend sends PATCH request
   │
   ├─→ BACKEND receives
   │   │
   │   ├─ Check authentication → Fail?
   │   │  └─ Return 401 Unauthorized
   │   │     Frontend: Redirect to login
   │   │
   │   ├─ Check permission → Fail?
   │   │  └─ Return 403 Forbidden
   │   │     Frontend: Show "Not authorized"
   │   │
   │   ├─ Validate data → Fail?
   │   │  └─ Return 400 Bad Request
   │   │     with error message
   │   │     Frontend: Show validation errors
   │   │
   │   ├─ Check business rules → Fail?
   │   │  └─ Return 400 Bad Request
   │   │     with error reason
   │   │     Frontend: Show actual issue
   │   │
   │   └─ Database error → Fail?
   │      └─ Return 500 Internal Server Error
   │         Frontend: Show "Server error, try again"
   │
   └─ Frontend displays error to user
      based on error type
```

---

**Architecture Document v2.0**
**Updated**: March 4, 2026
