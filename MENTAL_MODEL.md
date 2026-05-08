# 🏗️ HelpDesk Mental Model

---

## Main Modules

The system is built around **4 core backend modules**:

1. **Accounts (`/accounts/`)**
   - Custom User model with 3 roles: ADMIN, MEMBER, CLIENT
   - User authentication and profiles
   - Attached to both Client and Member profiles via OneToOne relationships

2. **Core (`/core/`)**
   - Issue Categories (e.g., "Network", "Database", "Software")
   - Sub-Issues (specific problems within each category)
   - Company Types (for client classification)
   - Simple lookup tables that support chaining and filtering

3. **Tickets (`/tickets/`)** - **The Main Engine**
   - **Models**: Ticket, Client, Member, TicketActivity
   - **Workflow**: Full issue lifecycle management
   - **Role-based Filtering**: Custom QuerySet ensures users only see authorized issues
   - **Dashboard Analytics**: Reporting and insights
   - **Activity Log**: Complete audit trail of all changes

4. **Frontend (`Next.js + React`)**
   - Login page with JWT authentication
   - Dashboard with analytics
   - Issue tracking interface with dropdown view system
   - Centralized API client with token handling

---

## Request Flow

```
┌─────────────────────────────────────────────────┐
│ USER AT FRONTEND (Next.js)                      │
│ - Login page or Dashboard                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ lib/api.ts Client  │
        │ - Adds JWT token   │
        │ - Manages refresh  │
        │ - Robust Base URL  │
        └────────┬───────────┘
                 │ HTTP Request
                 │ (POST/GET/etc)
                 ▼
    ┌────────────────────────────────────┐
    │ DJANGO BACKEND PROCESSING:         │
    │                                    │
    │ 1. URLs Router (JWT + App)         │
    │    ↓ (matches endpoint)            │
    │                                    │
    │ 2. View/ViewSet Selected           │
    │    (TicketListView, etc.)          │
    │                                    │
    │ 3. Authentication Check            │
    │    (JWT token validation)          │
    │                                    │
    │ 4. Permission Check                │
    │    (IsAdmin, IsMember, etc.)       │
    │                                    │
    │ 5. Serializer Validation           │
    │    (Input/Output transformation)   │
    │                                    │
    │ 6. QuerySet Filtering              │
    │    (Role-based via Ticket.for_user)│
    │                                    │
    │ 7. Database Query                  │
    │    (Models interact with DB)       │
    └────────┬───────────────────────────┘
             │
             ▼
    ┌────────────────────────────────────┐
    │ PostgreSQL Database                │
    │ - Execute SQL                      │
    │ - Return results                   │
    └────────┬───────────────────────────┘
             │
             ▼
    ┌────────────────────────────────────┐
    │ Response Pipeline:                 │
    │ - Serialize to JSON                │
    │ - Add metadata                     │
    │ - Return HTTP 200/201/400/etc      │
    └────────┬───────────────────────────┘
             │ JSON Response
             ▼
        ┌────────────────────┐
        │ Frontend receives  │
        │ JSON data          │
        │ - Updates state    │
        │ - Re-renders UI    │
        └────────────────────┘
```

**Key Concept: Role-Based Access is Applied at Multiple Levels**
- View-level: `@permission_classes([IsAdminUserRole])`
- QuerySet-level: `Ticket.objects.for_user(user)` filters by role at the database
- Model-level: OneToOne relationships restrict Client/Member to CLIENT/MEMBER roles only

---

## Database Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER TABLE                               │
│  (id, username, password, role: [ADMIN|MEMBER|CLIENT])           │
└────┬───────────────────────┬──────────────────────┬──────────────┘
     │ OneToOne              │ OneToOne             │
     │ (if CLIENT)           │ (if MEMBER)          │
     ▼                       ▼                      │
┌──────────────┐      ┌──────────────┐             │
│  CLIENT      │      │  MEMBER      │             │
│              │      │              │             │
│- company_name      │- specialty(→Issue)         │
│- company_type      │- is_active                 │
│- email             │                │            │
│- whatsapp  │       │              │            │
└──────┬──────┘      └──────┬───────┘             │
       │                    │                      │
       │ ForeignKey        │ ChainedFK            │
       │ (created by)      │ (assigned_to)        │
       │                    │                      │
       └────┬───────────────┘                      │
            │                                      │
            ▼                                      │
      ┌─────────────────────────────────┐          │
      │      TICKET (Core Entity)       │          │
      │                                 │          │
      │ - ticket_number (UUID)          │          │
      │ - client_id (→ Client)          │          │
      │ - issue_id (→ Issue)            │          │
      │ - sub_issue_id (→ SubIssue)     │          │ [Status Flow]
      │ - assigned_to_id (→ Member OR) ─┼──────────┼─ CREATED
      │ - description                   │          │   ↓
      │ - status: [CREATED>ASSIGNED>    │          │ ASSIGNED
      │           STARTED>RESOLVED>     │          │   ↓
      │           CLOSED]               │          │ STARTED
      │ - assigned_at                   │          │   ↓
      │ - started_at                    │          │ RESOLVED
      │ - resolved_at                   │          │   ↓
      │ - closed_at                     │          │ CLOSED
      │ - created_at / updated_at       │          │
      │                                 │
      └────────────?─────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ▼ ChainedFK         ▼ ChainedFK
┌──────────────┐     ┌──────────────┐
│  ISSUE       │     │  SUB_ISSUE   │
│              │     │              │
│- name        │     │- issue_id    │
│  (Network)   │     │- name        │
│  (Database)  │     │ (Auth issue) │
│  (Software)  │     │ (Connectivity)
└──────────────┘     └──────────────┘
       ▲
       │ ForeignKey
       │ (specialty)
       └── MEMBER uses this to specialize


AUDIT LOG:
┌──────────────────────────┐
│  TICKET_ACTIVITY         │
│                          │
│- ticket_id (→ Ticket)    │
│- changed_by_id (→ User)  │
│- old_status              │
│- new_status              │
│- created_at              │
└──────────────────────────┘
```

---

## Data Flow Example: Issue Tracking System with Dropdown View

```
1. USER LOGS IN
   POST /api/token/ → Get JWT access token
   Frontend stores in localStorage:
   - access token (15 min expiry)
   - refresh token (7 day expiry)
   Redirects to /dashboard

2. USER OPENS ISSUE TRACKING INTERFACE (/dashboard/tickets/)
   Frontend:
   - Gets userRole from localStorage
   - Makes GET /api/tickets/?limit=1000 (API endpoint name remains 'tickets')
   - Headers: Authorization: Bearer {access_token}

3. BACKEND PROCESSING:
   - Validates JWT token (401 if invalid)
   - Checks IsAuthenticated permission (401 if not authed)
   - Calls Ticket.objects.for_user(user) (database model, unchanged):
     └─ ADMIN: Returns ALL issues (no filter)
     └─ MEMBER: Returns only assigned_to__user=user
     └─ CLIENT: Returns only client__user=user
   - Serializes to JSON with related data:
     {
       id, ticket_number, status, description, created_at,
       client_name, company_name, assigned_member
     }

4. FRONTEND DISPLAYS DROPDOWN VIEW (Modern UI):
   - Detects userRole and shows appropriate professional header:
     └─ ADMIN: "Issue Tracking System" (comprehensive interface)
     └─ MEMBER: "Assigned Issues" (track your workload)
     └─ CLIENT: "My Issues" (monitor your requests)
   - Groups issues by status (CREATED, ASSIGNED, STARTED, RESOLVED, CLOSED)
   - Renders 5 collapsible dropdown panels with:
     └─ Status icon (📝, 👤, ⚙️, ✅, 🔒)
     └─ Status label with professional font
     └─ Issue count badge with color coding
     └─ Color-coded background (blue, purple, amber, green, slate)
     └─ Smooth expand/collapse animation
   - Total issue count in gradient info box
   - CREATED dropdown expanded by default for quick access

5. USER INTERACTS WITH DROPDOWNS (Smooth UX):
   Click dropdown header:
   - EXPANDS: Shows all issues in that status
     └─ Each issue card displays:
        ├─ Issue ID (#xxx format)
        ├─ Description (truncated with "…")
        ├─ Client name (📋)
        ├─ Company name (🏢)
        ├─ Assigned member if exists (👤)
        ├─ Created date (📅)
        └─ "View →" indicator on hover (blue-600 text)
   - COLLAPSES: Hides issues to save vertical space
   - Arrow icon rotates 180° smoothly
   - Background color transitions (150-200ms)
   - Box shadow appears on hover
   - Professional white card styling with soft borders (slate-200/60)

6. USER CLICKS ISSUE CARD:
   Frontend: Navigate to /dashboard/tickets/{issue_id}
   - Smooth navigation with no page flicker
   Backend: GET /api/tickets/{id}/
   - Validate user access via for_user() filter
   - Return full issue details with related data
   - Shows detail page with status update options

7. ADMIN WORKFLOW (Full ticket management):
   a) Opens ASSIGNED dropdown
   b) Clicks on unassigned ticket card
   c) Views detail page with "Assign Member" button
   d) Clicks button → GET /api/tickets/{id}/eligible-members/
      - Returns members with matching specialty
   e) Selects member from dropdown
   f) PATCH /api/tickets/{id}/ with { assigned_to: 5, status: "ASSIGNED" }
   g) Backend:
      - Validates member specialty = issue type ✓
      - Updates ticket.assigned_to
      - Creates TicketActivity log
   h) Frontend refetches /api/tickets/
   i) Ticket card moves to ASSIGNED dropdown

8. MEMBER WORKFLOW (Limited ticket management):
   a) Opens ASSIGNED dropdown (only sees own assigned tickets)
   b) Clicks on assigned ticket
   c) Views detail page with status dropdown
   d) Dropdown shows allowed transitions:
      - ASSIGNED → STARTED ✓
      - STARTED → RESOLVED ✓
      - RESOLVED → ... (cannot CLOSE, admin-only)
   e) Selects "STARTED"
   f) PATCH /api/tickets/{id}/ with { status: "STARTED" }
   g) Backend:
      - Validates MEMBER cannot close ✓
      - Updates ticket.status
      - Sets started_at timestamp
      - Creates TicketActivity log
   h) Frontend shows updated status

9. CLIENT WORKFLOW (View only):
   a) Opens /dashboard/tickets
   b) Sees "My Created Tickets" header
   c) Can expand dropdowns to track progress
   d) Can click ticket to view details (read-only)
   e) Can see who's assigned (after admin assigns)
   f) Can view activity timeline
   g) Cannot:
      - Change status (no buttons/dropdowns)
      - Assign members (no access)
      - See other clients' tickets (filtered by backend)

10. AUTOMATIC TOKEN REFRESH:
    If access token expires (401 Unauthorized):
    - api.ts detects 401
    - Calls POST /api/refresh/ with refresh token
    - Gets new access token
    - Retries original request
    - User sees no interruption

11. CASCADE ON DELETE:
    - Client deleted → All their Tickets cascade deleted
    - Member deleted → Their assigned tickets' assigned_to = NULL
    - Issue deleted → PROTECTED (error, can't delete)
```

---

## Key Design Patterns

| Pattern | Implementation |
|---------|-----------------|
| **Role-Based Access** | User model roles + Permission classes + QuerySet filtering |
| **Workflow State Machine** | Status choices + `get_allowed_transitions()` + validation |
| **Audit Trail** | TicketActivity logs every status change with timestamp + user |
| **Chained Selection** | `ChainedForeignKey` - Sub-issues chain to Issues, Members chain to Issues |
| **Separation of Concerns** | Models (data) → Serializers (validation) → Views (logic) → URLs (routing) |
| **Custom Manager** | `TicketQuerySet.for_user()` handles role-based filtering at DB level |
| **Responsive Design** | `hidden md:block` (desktop) + `md:hidden` (mobile) dual-view pattern |
| **Client-Side Filtering** | State-driven filter logic with AND operations (all conditions must match) |
| **Dual Layout** | Full table on desktop (✓ desktop) + Card grid on mobile (✓ mobile) |

---

## Modern UI Features (After Recent Updates)

### 1. Responsive Design Pattern
```
The system now provides TWO DIFFERENT VIEWS depending on screen size:

DESKTOP VIEW (screens ≥ 768px):
┌─────────────────────────────────────────────────┐
│ Issue Tracking System                           │
├─────────────────────────────────────────────────┤
│ [Filter: Client] [Filter: Member] [Filter: Month]
├─────────────────────────────────────────────────┤
│ ID │ Status   │ Client │ Issue  │ Member │ Date │
├─────────────────────────────────────────────────┤
│ 001│ ASSIGNED │ Acme   │ Network│ John   │ 3/20 │
│ 002│ STARTED  │ TechCo │ DB     │ Jane   │ 3/19 │
└─────────────────────────────────────────────────┘

MOBILE VIEW (screens < 768px):
┌─────────────────────────────────┐
│ Issue Tracking System           │
├─────────────────────────────────┤
│ [Filter: Client ▼]              │
│ [Filter: Member ▼]              │
│ [Filter: Month ▼]               │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📋 Acme Corp                    │
│ Network Issue                   │
│ 👤 John Doe  │ 3/20 │ ✓ Ready  │
│ ──────────────────────────────  │
│ View →                          │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 📋 TechCo Inc                   │
│ Database Issue                  │
│ 👤 Jane Smith │ 3/19 │ ⚙️ Active
│ ──────────────────────────────  │
│ View →                          │
└─────────────────────────────────┘

Key Benefits:
✓ No horizontal scrolling on mobile (prevents frustration)
✓ Responsive grid automatically adjusts columns
✓ Touch-friendly spacing on mobile
✓ One filter view per mobile screen
✓ Seamless transition at 768px breakpoint
```

### 2. Advanced Filtering System (Admin Only)
```
FILTER ARCHITECTURE:

FilterSelect Component (Reusable Dropdown):
- Shows unique values from loaded data
- Supports string arrays or object arrays
- Custom label extraction function
- "All" option to clear filter
- Blue-600 styling with professional UX

State Management (Three Independent Filters):
const [filterClient, setFilterClient] = useState('');      // Client ID or empty
const [filterMember, setFilterMember] = useState('');      // Member ID or empty
const [filterMonth, setFilterMonth] = useState('');        // Month string or empty

Filter Logic (AND Operations):
All conditions must be TRUE for ticket to show (intersection, not union):
┌──────────────────────────────────────────────────┐
│ Ticket matches if:                               │
│ (✓ No client filter OR client matches) AND       │
│ (✓ No member filter OR member matches) AND       │
│ (✓ No month filter OR month matches)             │
└──────────────────────────────────────────────────┘

Example Scenario:
- Admin selects: Client = "Acme Corp"
  Result: Shows ALL tickets from Acme (any member, any month)
  
- Admin selects: Client = "Acme Corp" + Member = "John"
  Result: Shows ONLY tickets from Acme assigned to John
  
- Admin selects: Client = "Acme Corp" + Member = "John" + Month = "March"
  Result: Shows ONLY tickets from Acme, assigned to John, created in March (intersection)

FilterBadge Component (Visual Feedback):
├─ Shows active filters as pills
├─ "Client: Acme Corp" tag
├─ Remove button (X) per badge
├─ Blue background with rounded corners
└─ Updates in real-time as filters change
```

### 3. User Directory with Role-Based Filtering
```
A new admin feature for user management at: /dashboard/users/

Admin arrives at user directory:
├─ Sees all users in a responsive grid
├─ Role filter dropdown with options:
│  ├─ All Roles (default, shows everyone)
│  ├─ Administrators
│  ├─ Support Members
│  └─ Clients
├─ Filtered results update instantly
└─ Shows user cards with:
   ├─ Username
   ├─ Email
   ├─ Role badge [ADMIN], [MEMBER], or [CLIENT]
   └─ Account status

Filtering Logic:
const uniqueRoles = ['ADMIN', 'MEMBER', 'CLIENT']
  .filter(role => users.some(u => u.role === role));
// Extract only roles that have users

const filteredUsers = users.filter(u => {
  if (filterRole && u.role !== filterRole) return false;
  return true;
});
// Show only users matching selected role

Responsive Grid Layout:
┌──────────────────────────────────────────┐
│ Desktop (≥1024px)        │ 3 columns per row
├──────────────────────────────────────────┤
│ Tablet (768-1024px)      │ 2 columns per row
├──────────────────────────────────────────┤
│ Mobile (<768px)          │ 1 column per row
└──────────────────────────────────────────┘

Access Control:
✓ ADMIN: Can access and filter
✗ MEMBER: Cannot access (no permission)
✗ CLIENT: Cannot access (no permission)
```

---

### 4. Action-Button Interface on Ticket Details Page
```
TICKET DETAILS LAYOUT:

LEFT COLUMN (Read-Only Information):
├─ Ticket ID & Tracking Number
├─ Status Badge (color-coded)
├─ Client Name & Company
├─ Issue Category & Sub-Issue
├─ Full Description
├─ Assigned Member (if exists)
├─ Created Date & Time
└─ Activity Timeline
   ├─ All status changes with timestamps
   ├─ Changed by (which user made change)
   ├─ Historical progression
   └─ Professional audit trail

RIGHT COLUMN (Three Vertical Action Buttons):

1. TICKET PROGRESS BUTTON (Always Visible)
   - Displays current status and progression
   - Shows expanded progress panel below button
   - TicketProgressBar component with workflow visualization
   - Click to expand/collapse

2. CONVERSATION BUTTON (Always Visible)
   - Opens TicketChatbox in modal
   - Red badge with unread count (capped at 9+)
   - Shows message history in semi-transparent modal
   - Clears unread badge when clicked

3. UPDATE TICKET BUTTON (Role-Based)
   - Admin/Member: Visible and functional
   - Client: Hidden (read-only access)
   - Opens form modal for status/member updates
```

### 5. Unread Message Notification System
```
NOTIFICATION COMPONENTS:

UNREAD BADGE:
├─ Red circular indicator on Conversation button
├─ Shows count (1-8) or "9+" (capped)
├─ Appears only when unreadCount > 0
├─ Positioned at top-right corner of button
├─ Disappears when button clicked

TOAST NOTIFICATION:
├─ Fixed position at bottom of screen
├─ Desktop: bottom-right corner
├─ Mobile: full-width with side margins
├─ Shows icon + message + dismiss button
├─ Z-index z-50 (above all other content)
├─ Dismissible manually or auto-dismiss (optional 5s)
└─ Smooth fade-in/out animations

NOTIFICATION FLOW:
1. New message detected → setUnreadCount(count)
2. Extract message → setNotificationMessage(text)
3. Display toast → setShowNotification(true)
4. User sees badge and toast notification
5. Click Conversation → opens modal, clears badge
```

### 6. Silicon Systems Branding Integration
```
LOGO & BRANDING:

LOGO ASSET:
├─ File: /public/Elements/silicon logo.png (100×100px source)
├─ Homepage navbar: 40×40px responsive
├─ Dashboard sidebar: 64×64px centered
├─ Login page top-left: 48×48px
├─ Login page centered: 144×48px
└─ Responsive sizing via CSS classes

PAGES WITH BRANDING:

Homepage (app/page.tsx):
- Logo in navbar + "Silicon Systems HelpDesk" title

Login Page (app/login/page.tsx):
- Logo above SYSTEM ACCESS badge
- Responsive: stacked on mobile, side-by-side on desktop
- Dark theme (slate-950) for enterprise appearance
- Security indicators: TLS 1.3, JWT Protocol, Session expiration

Dashboard (app/dashboard/layout.tsx):
- Fixed sidebar with Silicon Systems logo at top
- Professional branding with system name
- Dark sidebar (slate-900) on all screen sizes
- Mobile burger menu for sidebar toggle
- Auto-closes sidebar on navigation

COLOR SCHEME:
- Primary: #2563EB (Blue-600)
- Sidebar: slate-900 dark background
- Text: Dark slate-900 on white, light on dark
- Accents: Blue-600 for links/buttons
- Cards: White bg with soft shadows
```

---

## 🎨 Frontend Component Ecosystem (Updated)

```
Component Layer Structure:

AUTHENTICATION FLOW:
  LoginPage (with Silicon Systems branding)
    → JWT Token Storage (localStorage)
    → Redirect to Dashboard

DASHBOARD LAYOUT (with Fixed Sidebar):
  Layout (fixed dark sidebar + main content)
  ├─ Header (with burger menu on mobile)
  ├─ Sidebar (dark theme, fixed position)
  │  ├─ Silicon Systems logo & branding
  │  ├─ Dashboard (all roles)
  │  ├─ Tickets (all roles)
  │  ├─ Users (admins only)
  │  └─ Logout button
  └─ MainContent (left margin lg:ml-64 for fixed sidebar)

TICKETS LIST PAGE (Dual-View Responsive):
  TicketsPage
  ├─ FilterSection (ADMIN ONLY)
  │  ├─ FilterSelect (Client dropdown)
  │  ├─ FilterSelect (Member dropdown)
  │  ├─ FilterSelect (Month dropdown)
  │  ├─ FilterBadge (Display active filters with X remove)
  │  └─ Reset Button (clear all filters)
  ├─ DesktopView (hidden md:block)
  │  └─ TicketsTable (comprehensive table with all columns)
  ├─ MobileView (md:hidden)
  │  └─ TicketCard Grid (card layout, responsive columns)
  └─ PaginationControls (flex-wrap responsive pagination)

TICKET DETAIL PAGE (Action-Button Interface):
  TicketDetail
  ├─ LeftColumn (ticket information)
  │  ├─ Ticket ID & Number
  │  ├─ Status Badge (color-coded)
  │  ├─ Client & Company Info
  │  ├─ Issue Category
  │  ├─ Description
  │  └─ ActivityTimeline (audit log)
  └─ RightColumn (action buttons with modals)
     ├─ TicketProgressButton
     │  └─ TicketProgressBar (panel below button)
     ├─ ConversationButton (with unread badge)
     │  ├─ Unread Badge (red circle, count 9+ max)
     │  └─ ConversationModal
     │     └─ TicketChatbox (message history + input)
     └─ UpdateTicketButton (role-based visibility)
        └─ UpdateModal (status dropdown + member assignment)

Modals & Overlays:
├─ Backdrop (semi-transparent bg-black/40, blur-sm)
├─ Z-index management (z-40 backdrop, z-50 modal)
├─ Dismissible (Escape key, backdrop click, close button)
└─ Smooth animations (fade-in, slide transitions)

NOTIFICATIONS:
  ├─ UnreadBadge (on Conversation button, red circle)
  └─ Toast Notification (fixed position, bottom-right desktop, bottom-left mobile)

USER DIRECTORY PAGE:
  UsersPage
  ├─ FilterSection
  │  ├─ FilterSelect (Role dropdown: All, Admin, Member, Client)
  │  └─ Results counter (shows total users matching filter)
  └─ ResponsiveGrid
     └─ UserCard (3 cols desktop, 2 cols tablet, 1 col mobile)

SHARED COMPONENTS:
  ├─ StatusBadge (color-coded status indicator)
  ├─ TicketProgressBar (workflow visualization with timestamps)
  ├─ TicketChatbox (conversation interface with message history)
  ├─ MenuItem (sidebar navigation with active highlighting)
  ├─ FilterSelect (reusable dropdown for filtering)
  ├─ FilterBadge (active filter indicator with remove button)
  └─ TicketCard (mobile-optimized card layout for responsive design)

RESPONSIVE BREAKPOINTS:
  ├─ Mobile (<768px): `md:hidden` for card views, stacked layout
  ├─ Tablet (768-1024px): 2-column grid, medium spacing
  └─ Desktop (≥1024px): Full table, fixed sidebar, comprehensive filters
```

---

**Last Updated**: March 12, 2026
**Version**: 2.3 (After Silicon Systems Branding, Action-Button Interface, and Notification System)
