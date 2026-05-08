# HelpDesk Code Guide
## Complete File Explanations and Architecture

---

## 📚 TABLE OF CONTENTS
1. [Backend Overview](#backend-overview)
2. [Frontend Overview](#frontend-overview)
3. [File-by-File Guide](#file-by-file-guide)
4. [Data Flow Diagrams](#data-flow-diagrams)

---

## 🔙 BACKEND OVERVIEW

### Architecture Pattern
```
Client Request → URLs → Views → Serializers → Models/Database
                                   ↓
                            Permissions Check
                                   ↓
                          Business Logic (Services)
```

### Key Directories

#### `/accounts/` - User Management
- **Purpose**: Handle user authentication and profiles
- **Role**: Custom user model with role-based access
- **Key Files**:
  - `models/user.py` - User model with ADMIN/MEMBER/CLIENT roles
  - `views/profile_view.py` - User profile endpoints
  - `serializers/profile_serializer.py` - User data validation

#### `/core/` - Issue Management
- **Purpose**: Define issue categories and sub-issues
- **Role**: Categorize tickets by type (Network, Database, Software, etc.)
- **Key Files**:
  - `models/issue.py` - Issue category model
  - `models/sub_issue.py` - Sub-issue types within each issue
  - `views/core_views.py` - Issue listing/filtering endpoints
  - `serializers/core_serializers.py` - Issue data validation

#### `/tickets/` - Main Ticketing System [CORE MODULE]
- **Purpose**: Handle all ticket operations
- **Role**: Central business logic for support tickets
- **Key Components**:
  
  **Models** (`/models/`):
  - `ticket.py` - Main Ticket model with workflow
  - `member.py` - Support member profiles (Issue specialists)
  - `client.py` - Client/customer information
  - `ticket_activity.py` - Audit log for all changes

  **Views** (`/views/`):
  - `ticket_views.py` - CRUD operations on tickets
  - `activity_view.py` - View ticket activity history
  - `dashboard_view.py` - Analytics endpoints
  - `status_transition_view.py` - Workflow state transitions
  - `member_filter_view.py` - Get eligible members for assignment
  - `auth_view.py` - Authentication endpoints

  **Supporting Files**:
  - `serializers/` - Data validation and transformation
  - `services/dashboard_service.py` - Business logic for analytics
  - `permissions.py` - Role-based access control

#### `/config/` - Django Configuration
- **settings.py** - Project settings, database config, installed apps
- **urls.py** - Root URL routing
- **wsgi.py** - Production server interface
- **asgi.py** - Async server interface

---

## 🎨 FRONTEND OVERVIEW

### Architecture Pattern
```
Next.js App Router
    ↓
Pages (Route Components)
    ↓
Component Hierarchy
    ↓
API Client (lib/api.ts)
    ↓
Backend Services
```

### Key Directories

#### `/app/` - Application Routes (Next.js App Router)
- **layout.tsx** - Root layout with navigation
- **page.tsx** - Home page
- **globals.css** - Global styles

#### `/app/login/` - Authentication
- **page.tsx** - Enterprise-grade login page with Silicon Systems branding
  - Responsive mobile-friendly design (stacked on mobile, side-by-side on desktop)
  - Silicon Systems logo positioned above security badge
  - Left panel: Brand display with system specifications (desktop only)
  - Right panel: Clean login form on dark background
  - Collects username/password
  - Sends to `/api/token/` endpoint
  - **Robust Token Handling**: Stores JWT tokens and fetches profile from `/api/me/` if role or username are missing in JWT.
  - Redirects to dashboard on success
  - Professional security indicators (TLS 1.3, JWT Protocol, Session expiration)

#### `/app/dashboard/` - Protected Dashboard [MAIN INTERFACE]
- **layout.tsx** - Dashboard layout with fixed sidebar navigation
  - Dark sidebar (slate-900) with Silicon Systems branding and logo
  - Fixed positioning on all screen sizes with responsive main content
  - Mobile burger menu for toggle on small screens
  - **Route-Aware Sidebar**: Automatically manages sidebar state based on current pathname to ensure smooth navigation.
  - Navigation menu (varies by role)
  - Admin: All Tickets, Manage Users, Issues, Analytics
  - Member: My Assigned Tickets, Analytics
  - Client: Track My Tickets, Create Ticket
  - Professional branding with system name and logout button
- **page.tsx** - Main dashboard with analytics
  - "Ticket Overview" title with real-time analytics subtitle
  - Status distribution chart
  - Monthly trends visualization
  - Client/Member-wise workload breakdown

#### `/app/dashboard/tickets/`
- **page.tsx** - Tickets list view
  - List all accessible tickets
  - Filter by status
  - Quick actions

- **create/page.tsx** - Create new ticket
  - Form for new ticket submission
  - Issue -> SubIssue chaining
  - Automatic sub-issue filtering (only shows relevant to selected issue)

- **[id]/page.tsx** - Ticket detail page with action-based interface
  - Left column: Ticket information (status, client, issue, timeline)
  - Right column: Three vertical action buttons with dropdowns/modals
  - **Ticket Progress Button**: Displays progress panel with TicketProgressBar below button
  - **Conversation Button**: Opens modal with TicketChatbox component; shows unread message badge (red circle with count, capped at 9+); clears unread count on click
  - **Update Ticket Button**: Opens form modal for status updates and member assignment (role-based visibility)
  - Modals: Semi-transparent backdrop with blur effect, dismissible
  - Unread message notifications: Badge system + toast notification at bottom of screen
  - Activity timeline: Audit log of all changes
  - Responsive positioning: Progress panel, Conversation badge, Update button

#### `/lib/` - Utilities
- api.ts - API client wrapper
  - Centralized fetch with JWT authentication
  - Automatic token refresh on 401
  - **Robust Base URL**: Falls back to `http://localhost:8000` if `NEXT_PUBLIC_API_URL` is undefined.
  - Error handling
  - Methods: apiGet(), apiPost(), apiPut(), apiPatch(), apiDelete()

#### `/components/` - Reusable Components
- **StatusBadge.tsx** - Status display with color coding
  - CREATED: Blue
  - ASSIGNED: Purple
  - STARTED: Yellow
  - RESOLVED: Green
  - CLOSED: Gray
- **TicketProgressBar.tsx** - Visual progress indicator for ticket workflow
- **TicketChatbox.tsx** - Chat interface for ticket conversations
- **MenuItem.tsx** - Sidebar navigation item with active highlighting

---

## 📄 FILE-BY-FILE GUIDE

### BACKEND FILES

#### `backend/accounts/models/user.py`
```python
class User(AbstractUser):
    """Custom user model extending Django's AbstractUser"""
    
    ROLES:
    - ADMIN: Full system access
    - MEMBER: Support staff
    - CLIENT: End users
    
    Fields:
    - username, email, password (from AbstractUser)
    - role: CharField (ADMIN/MEMBER/CLIENT)
```
**Key Usage**: Authentication, role-based permissions

---

#### `backend/tickets/models/ticket.py`
```python
class Ticket(TimeStampedModel):
    """Main ticket entity"""
    
    WORKFLOW STATUS:
    CREATED → ASSIGNED → STARTED → RESOLVED → CLOSED
    
    Fields:
    - ticket_number: UUID (unique identifier)
    - client: FK to Client
    - issue: FK to Issue
    - sub_issue: ChainedFK to SubIssue (filtered by issue)
    - description: TextField
    - assigned_to: ChainedFK to Member (filtered by specialty)
    - status: CharField (workflow status)
    - assigned_at, started_at, resolved_at, closed_at: Timestamps
    - created_at, updated_at: Auto timestamps (TimeStampedModel)
    
    Methods:
    - for_user(): QuerySet filter by role
    - get_allowed_transitions(): What statuses are allowed next
```
**Key Usage**: Core business logic, ticket lifecycle management

---

#### `backend/tickets/models/member.py`
```python
class Member(TimeStampedModel):
    """Support staff profile"""
    
    Fields:
    - user: OneToOne to User (must be MEMBER role)
    - specialty: FK to Issue (what they handle)
    - is_active: Boolean (if they can receive new tickets)
    
    Purpose: Link support staff users to their expertise areas
```
**Key Usage**: Ticket assignment, member filtering

---

#### `backend/tickets/models/client.py`
```python
class Client(TimeStampedModel):
    """Client/customer information"""
    
    Fields:
    - user: OneToOne to User (must be CLIENT role)
    - company_name: CharField
    - company_type: FK to CompanyType
    - contract_duration: CharField (contract terms)
    - email, whatsapp_number: Contact info
    
    Purpose: Store client organization details
```
**Key Usage**: Client identification, contact information

---

#### `backend/tickets/views/ticket_views.py`
```
ENDPOINTS:
- GET /api/tickets/ → List (filtered by role)
- POST /api/tickets/ → Create new
- GET /api/tickets/{id}/ → Get details
- PUT/PATCH /api/tickets/{id}/ → Update status
- DELETE /api/tickets/{id}/ → Delete

AUTHENTICATION:
- All endpoints now require permission_classes = [permissions.IsAuthenticated]
- JWT token must be included in Authorization header
- Unauthenticated requests receive 401 Unauthorized

PERMISSIONS:
- Client: Can only see own tickets (filtered by client__user=user)
- Member: Can only see assigned tickets (filtered by assigned_to__user=user)
- Admin: Can see all tickets (no QuerySet filter)
- Only authenticated users can access any endpoint

BUSINESS LOGIC:
- Members cannot close tickets (only Admin can)
- Automatic status validation with get_allowed_transitions()
- Assignment validation (member specialty must match issue)
- Clients cannot update/delete tickets
- Admin-only assignment (only admin can set assigned_to field)

ROLE-BASED QUERYSET FILTERING:
- Implemented via Ticket.objects.for_user(user) custom manager
- Filters applied at database level for security and performance
```
**Key Usage**: All ticket CRUD operations with role-based access

---

#### `backend/tickets/views/member_filter_view.py`
```
ENDPOINT:
- GET /api/tickets/{id}/eligible-members/

PURPOSE:
Get list of members eligible for ticket assignment
Based on ticket's issue type

FLOW:
1. Client selects issue while creating/updating ticket
2. Frontend calls this endpoint
3. Returns members whose specialty matches issue
4. Frontend populates dropdown with filtered members

PERMISSION:
- Clients cannot see member list (security)
- Only Admin & Members can view
```
**Key Usage**: Smart member assignment filtering

---

#### `backend/tickets/views/dashboard_view.py`
```
ENDPOINTS:
- GET /api/dashboard/summary/ → Overall stats
- GET /api/dashboard/monthly/ → Monthly trends
- GET /api/dashboard/client-wise/ → Client breakdown
- GET /api/dashboard/member-wise/ → Member workload

PERMISSION:
- Member-wise requires Admin only (confidential)
- Others available to Admin & Members

RETURNS:
Charts data formatted for Recharts visualization
```
**Key Usage**: Analytics and reporting

---

#### `backend/tickets/permissions.py`
```
PERMISSION CLASSES:
- IsAdminUserRole: Only ADMIN role
- IsMemberUserRole: Only MEMBER role
- IsClientUserRole: Only CLIENT role
- IsAdminOrMember: ADMIN or MEMBER

USAGE:
Add to view's permission_classes to restrict access:
    permission_classes = [IsAuthenticated, IsAdminOrMember]
```
**Key Usage**: Role-based access control

---

#### `backend/tickets/serializers/ticket_serializers.py`
```
SERIALIZERS:
1. TicketSerializer (Read)
   - Converts Ticket model to JSON
   - Includes related data (client info, issue name, etc.)
   - Read-only fields: ticket_number, created_at, updated_at

2. TicketCreateSerializer
   - Validation for creating new tickets
   - Validates sub_issue belongs to selected issue

3. TicketStatusUpdateSerializer
   - Validation for status updates
   - Checks allowed transitions
   - Validates member specialty matches issue

PURPOSE:
- Data validation
- Transformation (model → JSON)
- Business rule enforcement
```
**Key Usage**: Request validation, response formatting

---

### FRONTEND FILES

#### `frontend/lib/api.ts`
```typescript
FUNCTIONS:
- getAccessToken(): Retrieve access token
- getRefreshToken(): Retrieve refresh token
- refreshAccessToken(): Get new access token using refresh token
- fetchWithAuth(): Fetch with JWT auth (internal)
- apiGet(endpoint): GET request
- apiPost(endpoint, body): POST request
- apiPut(endpoint, body): PUT request
- apiPatch(endpoint, body): PATCH request
- apiDelete(endpoint): DELETE request

FEATURES:
- Automatic token refresh on 401
- Error extraction from response
- Base URL from NEXT_PUBLIC_API_URL env var
- Automatic "Content-Type: application/json" header

USAGE:
const tickets = await apiGet('/api/tickets/');
const newTicket = await apiPost('/api/tickets/', {
  issue: 1,
  sub_issue: 5,
  description: "..."
});
```
**Key Usage**: All HTTP communication with backend

---

#### `frontend/app/layout.tsx`
```tsx
PURPOSE: Root layout for entire application

STRUCTURE:
├─ Navigation/Header
├─ Role-based menu items
├─ Protected routes redirection
└─ Global styles

FEATURES:
- Check authentication on mount
- Redirect to login if not authenticated
- Show different menu based on user role
- Persist theme/preferences
```
**Key Usage**: App shell, navigation, layout

---

#### `frontend/app/login/page.tsx`
```tsx
PURPOSE: Enterprise-grade authentication page with technical maturity

VISUAL DESIGN:
- Dark slate-950 background theme
- Left panel: Dark branding with system specifications display
  - Terminal-style code snippet showing version/protocol info
  - Technical capability descriptions (TLS 1.3, JWT Protocol)
  - Feature breakdown with accent bars (blue/cyan)
- Right panel: Clean login form on dark background

FORM FIELDS:
- username (with placeholder "your.username")
- password (with masked display "••••••••••••")

FLOW:
1. User enters credentials
2. POST to /api/token/
3. Receive access + refresh tokens
4. Store in localStorage
5. Redirect to /dashboard

FEATURES:
- Animated loading spinner during authentication
- Professional error alerts with icon indicators
- Security information display:
  - End-to-end encrypted connection (TLS 1.3)
  - JWT-based authentication protocol
  - Session token expiration info
- Responsive design (mobile collapses left branding panel)
- Enterprise-style footer with version info
- Technical language throughout ("Authenticate Access" not "Sign In")

STYLING:
- Dark theme with blue accent (blue-600)
- Rounded corners (lg = 8px)
- Smooth transitions and focus states
- System font stack for optimal rendering
```
**Key Usage**: Initial entry point with strong security messaging

---

#### `frontend/app/dashboard/layout.tsx`
```tsx
PURPOSE: Protected dashboard wrapper with dark sidebar navigation

VISUAL DESIGN:
- Dark sidebar: slate-900 background
- Light main content: slate-50 background
- White cards with soft shadows
- Professional typography with proper letter-spacing
- Color scheme: Blue-600 primary, slate grays for text/borders
- Sidebar styling: 
  - Brand heading with "System Control Center" subtitle
  - Navigation items with icon emojis
  - Section headers (UPPERCASE, tracking-wider)
  - Blue-600 hover states on nav items
  - User info panel in darker shade
  - Red logout button with clear visual hierarchy

COMPONENTS:
- Sidebar (dark navigation menu)
- Main content area
- User profile section

NAVIGATION (Role-based):
ADMIN sees:
- All Tickets
- Manage Users
- Issues
- Analytics

MEMBER sees:
- My Assigned Tickets
- Analytics

CLIENT sees:
- Track My Tickets
- Create Ticket

FEATURES:
- Active route highlighting
- Logout functionality
- User role display
```
**Key Usage**: Dashboard main layout

---

#### `frontend/app/dashboard/page.tsx`
```tsx
PURPOSE: Main system overview with real-time analytics dashboard

VISUAL DESIGN:
- Title: "Ticket Overview" (professional technical language)
- Subtitle: "Real-time system analytics and performance metrics"
- White card with soft shadows and rounded corners
- Professional typography with optimized spacing
- Color scheme: Blue-600 buttons and accents

TAB OPTIONS (Professional naming):
1. "Status Distribution" - Overall status breakdown
   - Count of issues by status
   - Blue bar chart visualization (blue-600)
   
2. "Monthly Trends" - Temporal analytics
   - Issues created per month
   - Line/bar chart for historical trends
   
3. "Client Analytics" (Admin & Members)
   - Client-wise issue distribution
   - Bar chart by organization
   
4. "Team Performance" (Admin only)
   - Member workload analysis
   - Who has how many assigned issues

FEATURES:
- Blue-600 colored tab buttons
- Smooth transitions between charts
- Real-time data fetching with "Fetching analytics…" loading state
- Role-based chart visibility (admin sees all, member sees limited)
- Professional error handling
- Recharts with light grid styling
- Proper cursor feedback on interactions
```
**Key Usage**: Management overview and real-time system insights

---

#### `frontend/app/dashboard/tickets/page.tsx`
```tsx
PURPOSE: Issue Tracking System with unified list view for all roles

VISUAL DESIGN:
- Professional title: "Issue Tracking System" (technical language)
- Descriptive subtitle per role:
  - Admin: "Comprehensive issue management interface…"
  - Member: "Track your assigned issues…"
  - Client: "Monitor your submitted issues…"
- Info box with gradient background showing total issue count

DROPDOWN VIEW (All roles):
- 5 collapsible status dropdowns with professional styling
- Status grouping: CREATED, ASSIGNED, STARTED, RESOLVED, CLOSED
- Icons: 📝 (Created), 👤 (Assigned), ⚙️ (Started), ✅ (Resolved), 🔒 (Closed)
- Color-coded headers:
  - Blue for Created
  - Purple for Assigned
  - Amber for Started
  - Green for Resolved
  - Slate for Closed
- Smooth expand/collapse animations
- Arrow icon rotation on toggle
- White cards with professional shadows
- Soft borders (slate-200/60)

EACH ISSUE CARD displays:
  • Issue ID (#xxx format)
  • Description (truncated with "…")
  • Client name & company assignment (📋 🏢)
  • Assigned member if exists (👤)
  • Creation date (📅)
  • "View →" indicator on hover (blue-600 text)
  
ROLE-SPECIFIC HEADERS & FILTERING:
- Admin: "Issue Tracking System" (sees ALL issues)
- Member: "Assigned Issues" (sees ONLY assigned to them)  
- Client: "My Issues" (sees ONLY their created issues)
- Total issue count badge with professional styling

FEATURES:
- Interactive dropdown toggle with smooth expand/collapse
- Arrow icon rotates 180° on toggle
- Background color changes on hover (15-20ms transition)
- Empty state messaging per status
- Real-time issue data from /api/tickets/
- Backend filtering via QuerySet.for_user() ensures security
- Click any issue to navigate to detail page
- Loading states with professional messaging
- No-data states with helpful copy

BACKEND FILTERING (Security):
- Implemented at database level via QuerySet.for_user()
- Client sees only: client__user=user
- Member sees only: assigned_to__user=user
- Admin sees all (no filter applied)
- 403 errors automatically handled for unauthorized access
```
**Key Usage**: Central issue browsing interface with role-aware filtering

---

#### `frontend/app/dashboard/tickets/create/page.tsx`
```tsx
PURPOSE: Create New Issue form (Client-facing)

VISUAL DESIGN:
- Title: "Create New Issue" (technical professional language)
- Subtitle: "Submit an issue ticket and our support team will address it promptly"
- White card with professional shadows
- Blue buttons and accents

FORM FIELDS:
1. Issue Category (required)
   - Dropdown with "— Select a category —" placeholder
   - Chained to populate sub-issue options
   
2. Specific Issue Type (required)
   - Dropdown disabled until Issue is selected
   - Shows "— Select a subcategory —" placeholder
   - Automatically filtered by Issue selection
   
3. Issue Description (required)
   - Textarea with 6 rows
   - Helpful placeholder text
   - Full-width input

FORM FLOW:
1. Select Issue Category → Backend returns matching SubIssues
2. Filter auto-updates SubIssue dropdown
3. Select Specific Issue Type
4. Enter detailed description
5. Click "Submit Issue" button

FEATURES:
- Chained dropdown validation (SubIssue filtered by Issue)
- Blue-600 button with hover states
- Loading spinner shows "Submitting Issue…"
- Success message: "✓ Issue created successfully! Redirecting…"
- Error alerts with red styling (red-700/red-50)
- Form validation prevents submission until required fields filled
- Loading state disables button (cursor-not-allowed)

REDIRECT:
On success → Redirect to /dashboard/tickets (issue now visible)
```
**Key Usage**: Client-facing issue creation interface

---

#### `frontend/app/dashboard/tickets/[id]/page.tsx`
```tsx
PURPOSE: Ticket detail and management

SECTIONS:
1. Ticket Information
   - Number, status, issue, sub-issue
   - Client/company details
   - Contact info

2. Description
   - Full problem description

3. Assigned Member
   - Current assignment
   - Empty if unassigned

4. Activity Timeline
   - Who changed what and when
   - Status transitions
   - Timestamps

5. Update Panel (if not CLIENT)
   - Status dropdown (with role restrictions)
   - Assign Member dropdown (filtered by specialty)
   - Save button

FEATURES:
- Smart member dropdown (filtered by issue specialty)
- Status validation (members can't close tickets)
- Real-time updates
- Activity audit trail
- Error handling
```
**Key Usage**: View and manage individual tickets

---

#### `frontend/components/StatusBadge.tsx`
```tsx
PURPOSE: Visual status indicator component

COLORS:
- CREATED: Blue (new)
- ASSIGNED: Purple (have owner)
- STARTED: Yellow (in progress)
- RESOLVED: Green (fixed)
- CLOSED: Gray (archived)

VARIANTS: Size options (sm, md, lg)

USAGE:
<StatusBadge status="ASSIGNED" size="md" />

REUSABLE: Used in list views and detail pages
```
**Key Usage**: Consistent status visualization across UI

---

#### `frontend/components/FilterSelect.tsx` (NEW)
```tsx
PURPOSE: Reusable dropdown filter component for advanced filtering

PROPS:
- label: string (dropdown label: "Filter by Client", etc.)
- options: string[] | object[] (values to filter by)
- value: string (currently selected value)
- onChange: (value: string) => void (callback when selection changes)
- getLabelFn?: (item: any) => string (optional: extract label from object)

USAGE:
<FilterSelect
  label="Filter by Client"
  options={users}
  value={selectedClientId}
  onChange={setSelectedClientId}
  getLabelFn={(client) => client.name}
/>

FEATURES:
- "All" option to clear filter
- Blue-600 styling
- Responsive width
- Professional placeholder text
```
**Key Usage**: Central component for implementing client/member/month filtering

---

#### `frontend/components/FilterBadge.tsx` (NEW)
```tsx
PURPOSE: Visual indicator showing active filters with removal capability

PROPS:
- label: string (filter name: "Client: Acme Corp")
- onRemove: () => void (callback to remove filter)
- count?: number (optional: show filter count)

USAGE:
<FilterBadge 
  label="Client: Acme Corp" 
  onRemove={() => setFilterClient('')}
/>

DISPLAYS:
- Blue-600 background with white text
- Small × button to remove filter
- Responsive flex layout
- Professional rounded corners
```
**Key Usage**: Showing which filters are active and how to clear them

---

#### `frontend/components/TicketCard.tsx` (NEW)
```tsx
PURPOSE: Mobile-optimized card layout for responsive ticket display

SHOWS (on small screens):
- Ticket ID (#xxx)
- Description (truncated)
- Client name (📋)
- Company name (🏢)
- Assigned member (👤)
- Creation date (📅)
- Status badge

LAYOUT:
- Grid layout with 2 columns for metadata
- White card with shadows
- Hover effects (shadow increase)
- Links to ticket detail page

USAGE:
<TicketCard 
  ticket={ticket} 
  onCustomClick={handleCardClick}
/>

RESPONSIVE:
- Only rendered on md:hidden (mobile screens)
- Desktop view uses table instead
```
**Key Usage**: Provides optimal mobile viewing experience without horizontal scrolling

---

#### `frontend/app/dashboard/users/page.tsx` (NEW)
```tsx
PURPOSE: Admin user directory with role-based filtering

VISUAL DESIGN:
- Title: "User Directory & Management" (technical language)
- Subtitle: "View, filter, and manage system users by role"
- White card background with soft shadows
- Professional layout

ROLE FILTER (Admin Only):
- Dropdown: "All Roles", "Administrators", "Support Members", "Clients"
- Shows unique roles derived from user data
- Real-time filtering on selection change
- Results counter updates dynamically

USER CARDS DISPLAY:
- Username
- Email
- Role badge (color-coded: [ADMIN], [MEMBER], [CLIENT])
- Profile info if available

FEATURES:
- Real-time role filtering (client-side)
- Results count indicator
- Responsive grid layout (1 column mobile, 2-3 columns desktop)
- Loading state while fetching users
- Error handling if API fails
- No filter visible for MEMBER/CLIENT roles (redirect or hide)

ROLE-BASED ACCESS:
- ADMIN: Full access to user directory + all filters
- MEMBER: No access (redirected from page)
- CLIENT: No access (redirected from page)

API ENDPOINT:
GET /api/accounts/users/ → Returns all users with role info
```
**Key Usage**: System administration and user management interface

---

## 🔄 DATA FLOW DIAGRAMS

### Responsive Design Rendering Pattern
```
User visits /dashboard/tickets
│
└─→ Page fetches ticket data from API
    │
    ├─→ Renders FilterSelect components (ADMIN only)
    │   ├─ Client dropdown
    │   ├─ Member dropdown
    │   └─ Month dropdown
    │
    ├─→ Renders Desktop Table View
    │   └─ CSS: hidden md:block (hidden on small screens)
    │   └─ Shows: ID, Status, Client, Issue, Member, Date
    │
    ├─→ Renders Mobile Card View
    │   └─ CSS: md:hidden (shown only on small screens)
    │   └─ TicketCard component with grid metadata
    │
    └─→ Renders Responsive Pagination
        └─ CSS: flex flex-wrap (wraps buttons on small)
        └─ Smart page range: shows 3 pages around current
```

### Admin Filtering Flow
```
Admin selects filter value (Client dropdown)
│
└─→ State updates: setFilterClient(clientId)
    │
    ├─→ Frontend re-filters loaded tickets client-side
    │   └─ filterTickets = tickets.filter(t => {
    │       if (filterClient && t.client.id !== filterClient) return false;
    │       if (filterMember && t.assignedTo.id !== filterMember) return false;
    │       if (filterMonth && !isInMonth(t.createdAt, filterMonth)) return false;
    │       return true;
    │     })
    │
    ├─→ UI updates with filtered results
    │   ├─ FilterBadge shows active filter: "Client: Acme Corp"
    │   ├─ Results count updates: "12 results"
    │   └─ Issue cards update in real-time
    │
    └─→ AND logic combines all filters
        └─ Must match ALL conditions (intersection, not union)
            └─ Example: Client=Acme AND Member=John AND Month=March (5 results)
```

### User Directory Filter Flow
```
Admin visits /dashboard/users
│
└─→ Fetches users from API: GET /api/accounts/users/
    │
    ├─→ Response contains all users with role field
    │
    ├─→ Frontend extracts unique roles:
    │   └─ const uniqueRoles = ['ADMIN', 'MEMBER', 'CLIENT']
    │       .filter(role => users.some(u => u.role === role));
    │
    ├─→ Renders FilterSelect with role options
    │   ├─ All Roles (empty/default)
    │   ├─ Administrators
    │   ├─ Support Members
    │   └─ Clients
    │
    └─→ When admin selects role (e.g., "Administrators"):
        │
        ├─→ Updates filterRole state: setFilterRole('ADMIN')
        │
        ├─→ Filters users client-side
        │   └─ filteredUsers = users.filter(u => {
        │       if (filterRole && u.role !== filterRole) return false;
        │       return true;
        │     })
        │
        └─→ Updates display with filtered results
            ├─ Renders UserCard components for filtered users
            ├─ Results counter: "Showing 3 administrators"
            └─ Shows: username, email, role badge [ADMIN]
```

### 1. Ticket Creation Flow
```
Client
   ↓
Login Page → Submit credentials
   ↓
Backend /api/token/ → Returns JWT tokens
   ↓
Stored in localStorage (with expiration tracking)
   ↓
Dashboard (role-based menu shows)
   ↓
"Create Ticket" button (Client only)
   ↓
Create Ticket Form
   ├─ Issue dropdown loads from /api/core/issues/
   ├─ SubIssue dropdown loads from /api/core/subissues/?issue={id}
   ├─ Description textarea for problem description
   └─ Submit button
   ↓
POST /api/tickets/create/
   ↓
TicketCreateSerializer validates:
   ├─ SubIssue belongs to Issue? ✓
   ├─ All required fields present? ✓
   └─ User is CLIENT? ✓ (implicit from for_user())
   ↓
Create Ticket in database with:
   ├─ ticket_number: Auto-generated UUID
   ├─ status: 'CREATED'
   ├─ client: Authenticated user's client
   ├─ created_at: Current timestamp
   └─ created_by: Request user
   ↓
Create TicketActivity log entry:
   └─ "Ticket created by client"
   ↓
Return created ticket with 201 status
   ↓
Frontend redirects to /dashboard/tickets
   └─ New ticket visible in CREATED dropdown
```

### 2. Member Assignment Flow
```
Admin views ticket detail page
   ↓
Sees "Assign Member" section (empty or shows current member)
   ↓
Clicks "Change Assignment" button
   ↓
Frontend triggers: GET /api/tickets/{id}/eligible-members/
   ↓
Backend processes:
   1. Verify user is ADMIN
   2. Get ticket's issue type
   3. Query Members where:
      - specialty = ticket.issue
      - is_active = True
   4. Return filtered list
   ↓
Response example:
[
  { id: 5, user: { username: "john", email: "john@..." }, specialty: "Database" },
  { id: 8, user: { username: "mary", email: "mary@..." }, specialty: "Database" }
]
   ↓
Frontend: Populate member dropdown (replaces old dropdown)
   ↓
Admin selects member from dropdown
   ↓
PATCH /api/tickets/{id}/
   ├─ Body: { assigned_to: 5 }
   └─ Optional: { status: "ASSIGNED" }
   ↓
TicketStatusUpdateSerializer validates:
   ├─ User is ADMIN? ✓
   ├─ Member specialty matches issue? ✓
   ├─ Transition allowed? ✓
   └─ Member is_active? ✓
   ↓
Update in database:
   ├─ ticket.assigned_to = Member(5)
   ├─ ticket.assigned_at = now()
   └─ ticket.status = "ASSIGNED"
   ↓
Create TicketActivity entry:
   ├─ changed_by: Admin user
   ├─ old_value: null (was unassigned)
   ├─ new_value: "Member John Doe"
   └─ timestamp: now()
   ↓
Return updated ticket with 200 status
   ↓
Frontend:
   ├─ Updates ticket state with new data
   ├─ Shows notification: "✓ Assigned to John Doe"
   ├─ Updates UI: Shows member info
   └─ Refreshes activity timeline
```

### 3. Status Transition Flow
```
Member views assigned ticket detail page
   ↓
Sees "Update Ticket" panel with:
   ├─ Current Status Badge (e.g., ASSIGNED)
   ├─ Status dropdown (shows allowed transitions)
   └─ Save button
   ↓
Member changes status dropdown: ASSIGNED → STARTED
   ↓
Updates form state locally (no API call yet)
   ↓
Clicks "Save Changes" button
   ↓
PATCH /api/tickets/{id}/
   ├─ Body: { status: "STARTED" }
   └─ Authorization: Bearer {access_token}
   ↓
Backend validates:
   ├─ User is authenticated? ✓
   ├─ User is MEMBER role? ✓
   ├─ Member is assigned to ticket? ✓
   ├─ Allowed transition ASSIGNED→STARTED? ✓
   ├─ Member NOT trying to CLOSE? ✓ (admin only)
   └─ All required fields? ✓
   ↓
Update in database:
   ├─ ticket.status = "STARTED"
   ├─ ticket.started_at = now()
   └─ ticket.updated_at = now()
   ↓
Create TicketActivity entry with:
   ├─ ticket_id: {id}
   ├─ changed_by_id: Member's user ID
   ├─ old_status: "ASSIGNED"
   ├─ new_status: "STARTED"
   └─ created_at: now()
   ↓
Return updated ticket with inline activity
   ↓
Frontend:
   ├─ Updates ticket.status in state
   ├─ StatusBadge re-renders with new status color
   ├─ Appends new activity to timeline
   ├─ Shows success message: "✓ Status updated"
   └─ Disables form until next refresh
```

### 4. Dashboard Analytics Flow
```
Admin visits /app/dashboard/page.tsx
   ↓
Page mounts and renders four tabs:
   ├─ Status Distribution (active by default)
   ├─ Monthly Trends
   ├─ Client Analytics
   └─ Team Performance (admin only)
   ↓
For "Status Distribution" tab on mount:
   │
   ├─ GET /api/dashboard/summary/
   │  └─ Returns: { CREATED: 5, ASSIGNED: 8, STARTED: 12, RESOLVED: 10, CLOSED: 7 }
   │
   └─ Frontend converts to Recharts format:
      └─ [
           { name: "Created", value: 5 },
           { name: "Assigned", value: 8 },
           ...
         ]
   ↓
User clicks "Team Performance" tab
   ↓
GET /api/dashboard/member-wise/
   │
   ├─ Response (aggregated from Ticket table):
   │  [
   │    { assigned_to__user__username: "john", count: 12 },
   │    { assigned_to__user__username: "jane", count: 8 },
   │    { assigned_to__user__username: "mike", count: 7 }
   │  ]
   │
   └─ Frontend transforms to chart format:
      └─ [
           { name: "john", value: 12 },
           { name: "jane", value: 8 },
           { name: "mike", value: 7 }
         ]
   ↓
Renders with Recharts BarChart:
   ├─ X-axis: Member names
   ├─ Y-axis: Ticket count
   ├─ Bars: Blue-600 color
   ├─ Tooltip on hover shows exact count
   └─ Professional grid and axis labels
```

---

## 🔒 Role & Permission Model

### ADMIN Role
```
Can:
✓ View all tickets (no QuerySet filter)
✓ View all analytics (including member-wise - sensitive)
✓ Manage users (create, edit, delete via admin panel)
✓ Make all status transitions (no restrictions)
✓ Close tickets (final transition)
✓ Assign tickets to any member
✓ Use advanced filtering on tickets page (Client, Member, Month)
✓ Access user directory and filter by role
✓ View member specialties and assignments

Cannot:
✗ Create tickets (client-facing feature only)
✗ See external/client details (except through tickets)
```

### MEMBER Role
```
Can:
✓ View only assigned tickets (QuerySet filtered by assigned_to__user=user)
✓ View dashboard (restricted to status, monthly, client-wise - no member-wise)
✓ Update status of assigned tickets (ASSIGNED→STARTED→RESOLVED only)
✓ View activity logs of assigned tickets
✓ See eligible members for reassignment (specialty matching)
✓ Comment on/add notes to assigned tickets

Cannot:
✗ Close tickets (admin-only final action)
✗ Assign tickets to other members
✗ Create tickets
✗ View other members' assigned tickets
✗ Manage users
✗ Access user directory
✗ Use filtering (sees all assigned tickets)
✗ View "Team Performance" analytics (member workload is private)
```

### CLIENT Role
```
Can:
✓ Create new tickets (via create form)
✓ View only own tickets (QuerySet filtered by client__user=user)
✓ Track status changes (read-only views)
✓ View activity timeline (see who's working on their tickets)
✓ View assigned member (once admin assigns)
✓ Monitor issue resolution progress

Cannot:
✗ Assign to members
✗ Change ticket status
✗ Delete tickets
✗ See other clients' tickets (strict isolation)
✗ View analytics or reports
✗ Access user directory
✗ View member information (only see name/email once assigned)
✗ Use filtering or search
```

---

## 💾 Database Models Relationship

```
User (1)
├─── OneToOne ─── Member (has many Tickets assigned_to)
│    └─── specialty: FK → Issue (staff expertise)
├─── OneToOne ─── Client (has many Tickets created)
│    └─── company_name, company_type, contact info
└─── (1) ─ (Many) ─ TicketActivity (created by)

Issue (1)
├─── (1) ─ (Many) ─ SubIssue (specific problems)
├─── (1) ─ (Many) ─ Member (specialty field links members)
└─── (1) ─ (Many) ─ Ticket (issue classification)

Client (1)
└─── (1) ─ (Many) ─ Ticket (client created tickets)

Member (1)
└─── (1) ─ (Many) ─ Ticket (assigned_to field)

Ticket (1)
├─── ForeignKey ─── Issue (what category)
├─── ChainedFK ─── SubIssue (specific type - filtered by issue)
├─── ForeignKey ─── Client (who created)
├─── ChainedFK ─── Member (who's assigned - filtered by specialty)
├─── (1) ─ (Many) ─ TicketActivity (audit trail)
└─── Timestamps: created_at, assigned_at, started_at, resolved_at, closed_at
```

---

## 🚀 Common Implementation Patterns

### Responsive Component Pattern
```tsx
// Desktop view - shown on medium screens and up
<div className="hidden md:block">
  <DesktopTableComponent data={filteredData} />
</div>

// Mobile view - shown on screens below medium
<div className="md:hidden">
  <MobileCardComponent data={filteredData} />
</div>

// Responsive grid for filters
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Items automatically stack on mobile, 3 columns on desktop */}
</div>

// Responsive pagination wrapping
<div className="flex flex-wrap gap-2">
  {/* Buttons wrap to next line on small screens */}
</div>
```

### Filtering State & Logic Pattern
```tsx
// Three independent filter states (ADMIN only)
const [filterClient, setFilterClient] = useState('');
const [filterMember, setFilterMember] = useState('');
const [filterMonth, setFilterMonth] = useState('');

// Extract unique values for dropdowns
const uniqueClients = [...new Map(
  data.map(item => item.client)
    .map(val => [val.id, val])
).values()];

// Combined filter logic (AND operations)
const filteredData = data.filter(item => {
  // All conditions must be true (intersection)
  if (filterClient && item.client.id !== filterClient) return false;
  if (filterMember && item.member.id !== filterMember) return false;
  if (filterMonth && getMonth(item.date) !== filterMonth) return false;
  return true;
});

// Render active filters
{filterClient && (
  <FilterBadge 
    label={`Client: ${getClientName(filterClient)}`}
    onRemove={() => setFilterClient('')}
  />
)}
```

### Role-Based Conditional Rendering
```tsx
if (userRole === 'ADMIN') {
  return <AdminFiltersComponent />;
} else if (userRole === 'MEMBER') {
  return <MemberViewComponent />;  // No filters needed
} else {
  return <ClientViewComponent />;  // Very limited view
}
```

### Unique Value Extraction (for filter options)
```tsx
// Extract unique clients from loaded data
const uniqueClients = [
  ...new Map(
    data
      .map(item => item.client)
      .map(client => [client.id, client])
  ).values()
];

// For roles in user directory
const uniqueRoles = ['ADMIN', 'MEMBER', 'CLIENT']
  .filter(role => users.some(u => u.role === role));
```

---

## 🚀 Common Tasks

### Creating a New API Endpoint

1. **Create Model** (if needed)
   ```python
   # backend/tickets/models/new_model.py
   class NewModel(TimeStampedModel):
       """Docstring explaining model"""
       field = models.CharField(max_length=100)
   ```

2. **Create Serializer**
   ```python
   # backend/tickets/serializers/new_serializer.py
   class NewModelSerializer(serializers.ModelSerializer):
       class Meta:
           model = NewModel
           fields = ['id', 'field']
   ```

3. **Create View**
   ```python
   # backend/tickets/views/new_view.py
   class NewModelListView(APIView):
       permission_classes = [IsAuthenticated]
       
       def get(self, request):
           queryset = NewModel.objects.for_user(request.user)
           serializer = NewModelSerializer(queryset, many=True)
           return Response(serializer.data)
   ```

4. **Register URL**
   ```python
   # backend/tickets/urls.py
   urlpatterns = [
       path('new-models/', NewModelListView.as_view()),
   ]
   ```

5. **Use in Frontend**
   ```tsx
   // frontend/app/page.tsx
   const data = await apiGet('/api/new-models/');
   ```

---

### Adding Responsive Component

1. **Create desktop version** with full data display
2. **Create mobile version** with essential info only
3. **Combine with Tailwind breakpoints**:
   ```tsx
   <div className="hidden md:block">Desktop</div>
   <div className="md:hidden">Mobile</div>
   ```
4. **Test responsiveness**:
   - Mobile: 320px (iPhone SE)
   - Tablet: 768px (iPad)
   - Desktop: 1024px+ (Laptop)

---

### Adding New Filter

1. **Add state variable**
   ```tsx
   const [filterName, setFilterName] = useState('');
   ```

2. **Extract unique values for dropdown**
   ```tsx
   const uniqueValues = [...new Set(data.map(item => item.field))];
   ```

3. **Render FilterSelect component**
   ```tsx
   {userRole === 'ADMIN' && (
     <FilterSelect 
       label="Filter by Name"
       options={uniqueValues}
       value={filterName}
       onChange={setFilterName}
     />
   )}
   ```

4. **Add to filter logic**
   ```tsx
   const filteredData = data.filter(item => {
     if (filterName && item.field !== filterName) return false;
     return true;
   });
   ```

5. **Show active filter badge (optional)**
   ```tsx
   {filterName && (
     <FilterBadge 
       label={filterName}
       onRemove={() => setFilterName('')}
      />
   )}
   ```

---

## 📊 Testing Checklist

**Authentication & Authorization**:
- [ ] Can login with correct credentials?
- [ ] Get error with wrong credentials?
- [ ] Token refreshes automatically on 401?
- [ ] Logout clears tokens correctly?

**Ticket Management**:
- [ ] Can create ticket (as client)?
- [ ] Can see only own tickets (as client)?
- [ ] Can see assigned tickets (as member)?
- [ ] Can see all tickets (as admin)?
- [ ] Status transitions validated?
- [ ] Member assignment filtered by specialty?
- [ ] Activity logs recorded for all changes?
- [ ] Cannot close tickets (as member)?

**Filtering (Admin Only)**:
- [ ] Filter by Client works?
- [ ] Filter by Member works?
- [ ] Filter by Month works?
- [ ] All three filters work together (AND logic)?
- [ ] Results count updates correctly?
- [ ] Reset button clears all filters?
- [ ] FilterBadges show active filters?

**Responsive Design**:
- [ ] Desktop table view shows full data?
- [ ] Mobile card view shows simplified layout?
- [ ] No horizontal scrolling on mobile?
- [ ] Pagination wraps on small screens?
- [ ] Filter dropdown stacks vertically on mobile?
- [ ] Touch-friendly spacing on mobile?
- [ ] Correct breakpoint transitions (768px)?

**User Directory (Admin Only)**:
- [ ] Can access /dashboard/users (admin)?
- [ ] Role filter shows "Administrators"?
- [ ] Role filter shows "Support Members"?
- [ ] Role filter shows "Clients"?
- [ ] Filtering works correctly by role?
- [ ] Results count updates?
- [ ] Cannot access (as member/client)?

**Dashboard & Analytics**:
- [ ] Dashboard shows correct data?
- [ ] Status distribution chart accurate?
- [ ] Monthly trends chart accurate?
- [ ] Client analytics chart accurate?
- [ ] Team Performance hidden from members?
- [ ] Permissions enforced correctly?

---

## 🛠️ Debugging Tips

**Frontend Issues**:
```tsx
// Check if user is authenticated
console.log('Access Token:', localStorage.getItem('access'));

// Check filter state
console.log('Current filters:', {filterClient, filterMember, filterMonth});

// Check API response
const data = await apiGet('/api/tickets/');
console.log('Tickets from API:', data);

// Check filtered results
console.log('Filtered tickets:', filteredTickets);
```

**Backend Issues**:
```bash
# Check if migrations applied
python manage.py migrate --dry-run

# Check QuerySet filtering
python manage.py shell
>>> from tickets.models import Ticket
>>> from accounts.models import User
>>> user = User.objects.get(username='admin')
>>> tickets = Ticket.objects.for_user(user)
>>> print(f"User can see {tickets.count()} tickets")

# Check serializer data
>>> from tickets.serializers import TicketSerializer
>>> serializer = TicketSerializer(tickets, many=True)
>>> print(serializer.data)
```

---

**Last Updated**: March 7, 2026
**Version**: 2.1 (After Responsive Design & Filtering Implementation)
