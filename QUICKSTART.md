# Silicon Systems HelpDesk Quickstart Guide for Developers

## 🚀 Setup Guide for a New PC (Step-by-Step)

Before running the project on a new PC, make sure you have the following prerequisites installed:
1. **Python** (version 3.10 or higher)
2. **Node.js** (version 18 or higher)
3. **PostgreSQL** (running locally on port 5432)

---

### Step 1: Database Setup (PostgreSQL)
1. Open your PostgreSQL client (pgAdmin, psql shell, or terminal) and create a database named `helpdesk_db`:
   ```sql
   CREATE DATABASE helpdesk_db;
   ```

### Step 2: Backend Setup (Django)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   * **Windows (PowerShell/CMD)**: `python -m venv venv`
   * **Mac/Linux**: `python3 -m venv venv`
3. Activate the virtual environment:
   * **Windows (PowerShell)**: `venv\Scripts\Activate.ps1`
   * **Windows (CMD)**: `venv\Scripts\activate.bat`
   * **Mac/Linux**: `source venv/bin/activate`
4. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create a `.env` file inside the `backend/` folder (same directory as `manage.py`) with the following environment variables:
   ```env
   SECRET_KEY=your-super-secret-key-change-in-prod
   DEBUG=True
   ALLOWED_HOSTS=127.0.0.1,localhost,192.168.1.63
   DB_NAME=helpdesk_db
   DB_USER=postgres
   DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
   DB_HOST=localhost
   DB_PORT=5432
   FRONTEND_URL=http://localhost:3000
   
   # Optional settings for ticket-creation-via-email (IMAP)
   GEMAIL=samirmondal1789@gmail.com
   GPASSWORD=your_gmail_app_password
   ```
6. Run database migrations to set up tables:
   ```bash
   python manage.py migrate
   ```
7. Create an Admin user (superuser) to access the panel:
   ```bash
   python manage.py createsuperuser
   ```
8. Start the backend development server:
   ```bash
   python manage.py runserver
   ```
   *Visit: `http://localhost:8000/admin` to verify backend access.*

---

### Step 3: Frontend Setup (Next.js)
1. Open a new terminal/command prompt window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install frontend node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file inside the `frontend/` folder:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *Visit: `http://localhost:3000` to open the HelpDesk dashboard.*

---

## 🎯 Project at a Glance

**What it does**: Enterprise issue management platform where customers submit support requests → Support team handles them → Track progress with real-time analytics and professional dashboard

**Three user types**:
- **Admin**: System administrator with full access to all tickets, users, analytics, and system configuration
- **Member**: Support specialist handling assigned issues with status transitions and client communication
- **Client**: Client portal for secure issue submission and real-time tracking of resolution status

**Key workflow**: Issue Category → Specific Issue Type → Assign to Expert → Track Resolution Status → Complete Lifecycle

**UI/UX**: Modern tech blue SaaS dashboard with Silicon Systems branding, dark fixed sidebar, professional typography, responsive mobile design, and comprehensive analytics. Features action-button interface on ticket details page with real-time unread message notifications.

---

## 🗂️ File Structure (Simplified)

```
HelpDesk/
│
├── backend/                 # API Server (Django)
│   ├── accounts/           # User management
│   ├── core/               # Issue categories
│   ├── tickets/            # Main ticketing logic ⭐
│   │   ├── models/         # Database tables
│   │   ├── views/          # API endpoints
│   │   ├── serializers/    # Data validation
│   │   └── permissions.py  # Who can do what
│   └── config/             # Settings
│
└── frontend/               # Web App (Next.js) - Silicon Systems Branding
    ├── app/               # Pages
    │   ├── login/         # Sign in (responsive with Silicon Systems branding)
    │   ├── page.tsx       # Home page (with logo and branding)
    │   ├── dashboard/     # Main area ⭐
    │   │   ├── layout.tsx # Dashboard with fixed sidebar, logo, mobile burger menu
    │   │   ├── page.tsx   # Analytics dashboard with real-time metrics
    │   │   ├── users/     # User directory with role-based filter
    │   │   └── tickets/   # Ticket management
    │   │       ├── page.tsx          # Dual-view (table on desktop, cards on mobile)
    │   │       ├── create/page.tsx   # Create form with issue/sub-issue chaining
    │   │       └── [id]/page.tsx     # Detail page with action buttons & modals
    │   └── layout.tsx     # Root layout with metadata
    ├── components/        # Reusable components
    │   ├── StatusBadge.tsx            # Status indicator (color-coded)
    │   ├── TicketProgressBar.tsx      # Progress visualization
    │   ├── TicketChatbox.tsx          # Chat interface for conversations
    │   ├── MenuItem.tsx               # Sidebar navigation item
    │   ├── FilterSelect.tsx           # Dropdown filter component
    │   ├── FilterBadge.tsx            # Filter status indicator
    │   └── TicketCard.tsx             # Mobile-optimized card layout
    ├── public/
    │   └── Elements/
    │       └── silicon logo.png       # Silicon Systems logo (responsive sizing)
    └── lib/api.ts                     # HTTP client with JWT auth + token refresh ⭐
```

**Component Ecosystem**:
- `StatusBadge.tsx` - Color-coded status indicators (blue/purple/yellow/green/gray)
- `TicketProgressBar.tsx` - Visual workflow progression (CREATED → ASSIGNED → STARTED → RESOLVED → CLOSED)
- `TicketChatbox.tsx` - Chat/conversation interface with message history
- `MenuItem.tsx` - Navigation items with active state highlighting
- `FilterSelect.tsx` - Reusable dropdown for client/member/month filtering
- `FilterBadge.tsx` - Visual filter indicators with remove buttons
- `TicketCard.tsx` - Mobile-optimized card layout (responsive grid)
- **Modals**: Conversation modal (chat interface), Update Ticket modal (form), Progress panel (dropdown)

---

## 💾 Core Data Models

### User
```
Name, Email, Password, Role (Admin/Member/Client)
↓ links to ↓
↓ ADMIN → Member (support staff)
↓ CLIENT → Client (customer)
```

### Ticket (The Main Entity)
```
Ticket
├── Who created it? → Client
├── What's the problem? → Issue & SubIssue
├── Who's handling it? → Member
└── Where are we? → Status (CREATED → ASSIGNED → STARTED → RESOLVED → CLOSED)
```

---

## 🔌 API Quick Reference

### Login
```http
POST /api/token/
Body: { username: "...", password: "..." }
Response: { access: "token...", refresh: "token..." }
```

### Get Tickets
```http
GET /api/tickets/
Response: [{ id, ticket_number, status, client, issue, ... }, ...]
```

### Get Members (for assignment)
```http
GET /api/tickets/{ticket_id}/eligible-members/
Response: [{ id, username }, ...]
```

### Update Ticket
```http
PATCH /api/tickets/{id}/update/
Body: { status: "STARTED", assigned_to: 5 }
Response: { updated ticket... }
```

### Get Analytics
```http
GET /api/dashboard/member-wise/
Response: [{ assigned_to__user__username: "john", count: 5 }, ...]
```

---

## 🛠️ Common Tasks

### Add a field to Ticket
1. Edit `backend/tickets/models/ticket.py`
2. Add new field like: `new_field = models.CharField(max_length=100)`
3. Create migration: `python manage.py makemigrations`
4. Apply: `python manage.py migrate`
5. Update serializer: `backend/tickets/serializers/ticket_serializers.py`
6. Add to template: `frontend/app/dashboard/tickets/[id]/page.tsx`

### Add a new API endpoint
1. Create view in `backend/tickets/views/`
2. Add URL in `backend/tickets/urls.py`
3. Import and call from frontend: `apiGet('/api/new-endpoint/')`

### Create new page
1. Create folder: `frontend/app/new-page/`
2. Add `page.tsx` with `"use client"` at top
3. Use components and styles from existing pages as template
4. Call API with: `await apiGet('/api/...')`

---

## 📊 Key Concepts

### Chained Selection
**What**: Dropdown 2 depends on Dropdown 1
**Why**: Only show sub-issues that match the issue
**Where**: Ticket creation & member assignment

### QuerySet for_user()
**What**: Each user sees different tickets
**Why**: Security - clients don't see other clients' tickets
**How**: `Ticket.objects.for_user(request.user)`

### Permissions
**What**: Role-based access control
**How**: Add to views: `permission_classes = [IsAdminUserRole]`
**Result**: 403 error if user doesn't have access

### Status Workflow
**Flow**: CREATED → ASSIGNED → STARTED → RESOLVED → CLOSED
**Rule**: Can only go to next step (can't skip)
**Exception**: MEMBER can't go directly from RESOLVED to CLOSED

---

## 🐛 Debugging Tips

### Backend Issues
```bash
# Check if migrations work
python manage.py migrate --dry-run

# See what SQL is running
python manage.py shell
>>> from tickets.models import Ticket
>>> print(Ticket.objects.all().query)

# Check permissions
# Add print statements in views
```

### Frontend Issues
```javascript
// Check token storage
localStorage.getItem('access')

// Check API calls
// Open Network tab in DevTools → see requests

// Check component state
console.log('tickets:', tickets)
```

---

## 🔐 Token System

**How it works**:
1. Login → get `access` token & `refresh` token
2. Include `access` in Authorization header
3. If `access` expires (401 error) → use `refresh` to get new `access`
4. `refresh` token stored in httpOnly cookie (secure)

**In code**:
```typescript
// api.ts automatically handles this
// Just use: await apiGet('/api/...')
```

---

## 📝 Testing Workflow - Dropdown Tickets View

1. **Test as Admin**
   - Login with admin account
   - Go to /dashboard/tickets
   - Should see "Issue Tracking System" header
   - See 5 collapsible dropdowns: CREATED, ASSIGNED, STARTED, RESOLVED, CLOSED
   - Click each dropdown to expand and see all tickets
   - Total ticket count badge shows in info box
   - See three filter dropdowns: Client, Member, Month
   - Change filters to see real-time filtering (AND logic)
   - Click any ticket card to view details and assign members

2. **Test as Member**
   - Create MEMBER role user in admin panel
   - Create Member profile with issue specialty
   - Login with member account
   - Go to /dashboard/tickets
   - Should see "Assigned Issues" header
   - Only see dropdowns populated with tickets assigned to you
   - Cannot see tickets assigned to other members
   - Can change status (except CLOSED)
   - No filter dropdowns visible (member-only limitation)

3. **Test as Client**
   - Create CLIENT role user in admin panel
   - Create Client profile with company info
   - Login with client account
   - Go to /dashboard/tickets
   - Should see "My Created Tickets" header
   - Only see dropdowns populated with your tickets
   - Cannot change status or create assignments
   - Can only view and track ticket progress
   - No filter dropdowns visible

4. **Test Role-Based Filtering (Admin Only)**
   - Create 10+ tickets with different statuses and clients
   - As admin:
     - a) Click filter dropdown for "Client"
     - b) Select a specific client
     - c) Verify only that client's tickets show
     - d) Add "Member" filter
     - e) Verify intersection (AND logic, not OR)
     - f) Add "Month" filter
     - g) Verify 3 filters work together
     - h) Click "Reset" button to clear all filters
     - i) Verify all tickets reappear

5. **Test Responsive Design (Tickets Page)**
   - **Desktop (lg screen, >1024px)**:
     - Full table view visible
     - All columns: ID, Status, Client, Issue, Member, Date
     - Pagination shows multiple page buttons
     - Card view hidden
   
   - **Tablet (md screen, 768-1024px)**:
     - Table still visible but narrower
     - Filters stack vertically (3 columns → 2 columns)
     - Pagination buttons responsive
   
   - **Mobile (sm screen, <768px)**:
     - Table hidden completely
     - Card view appears with metadata grid
     - Single column card layout
     - Filters stack in single column
     - Pagination wraps to next line
     - No horizontal scrolling

6. **Test Dropdown Interactions**
   - Click dropdown header to expand/collapse
   - Arrow icon should rotate 180°
   - Background color transitions smoothly
   - Expanded dropdown shows all tickets in that status
   - Click ticket to navigate to detail page
   - Status count badges update correctly

7. **Test User Directory (Admin Only)**
   - Login as admin
   - Go to /dashboard/users (or admin user directory)
   - Should see "User Directory & Management" header
   - See role filter dropdown: All Roles, Admins, Members, Clients
   - Select "Admins" → see only admin users
   - Select "Members" → see only support members
   - Select "Clients" → see only client users
   - Select "All Roles" → see all users again
   - Results counter updates correctly
   - As non-admin, user directory redirects or is hidden

8. **Test Ticket Details Page - Action Buttons & Modals (NEW)**
   - Go to any ticket detail page (/dashboard/tickets/[id])
   - **Left Column**: Ticket info, status, client, issue, timeline
   - **Right Column**: Three vertical action buttons
     - **Ticket Progress Button**: 
       - Click to show/hide progress panel below button
       - Displays TicketProgressBar with status progression
       - Click again to collapse
     - **Conversation Button**: 
       - Opens modal with chat interface (TicketChatbox)
       - Shows message history and new message input
       - Modal has semi-transparent backdrop with blur effect
       - Shows unread message badge (red circle) if unread > 0
       - Badge displays count (capped at 9+)
       - Click button clears unread count and badge disappears
       - Modal has close button and outer dismiss functionality
     - **Update Ticket Button** (role-based visibility):
       - Admin & Member: See update button
       - Client: Button hidden (read-only access)
       - Opens modal with status dropdown and member assignment
       - Smooth form interaction with optional fields
       - Submit button updates ticket immediately

9. **Test Unread Message Notifications (NEW)**
   - Open ticket on two windows side-by-side
   - In one window, send a message via Conversation modal
   - In other window, observe:
     - Unread badge appears on Conversation button (red circle with count)
     - Toast notification appears at bottom-right (desktop) or bottom-left (mobile)
     - Toast shows: New message icon + message text + dismiss button
     - Can dismiss toast manually
     - Click Conversation button to open chat and clear badge/notification

10. **Test Responsive Sidebar (Mobile)**
   - On mobile/tablet view:
     - Burger menu icon visible in header
     - Click burger to toggle sidebar
     - Sidebar slides in from left (translate animation)
     - Press Escape or click overlay to close
     - Sidebar auto-closes when navigating to different page
     - Silicon Systems logo and branding visible in sidebar
     - Navigation items stack vertically (touch-friendly)
   - On desktop view:
     - Sidebar always visible (fixed position)
     - Burger menu hidden
     - Sidebar stays 256px width fixed
     - Main content has left margin to accommodate sidebar

11. **Test Login Page Responsiveness**
   - Open on desktop (≥768px):
     - Left panel visible with branding and system specs
     - Right panel with login form
     - Silicon Systems logo and "SYSTEM ACCESS" badge visible
     - Side-by-side layout
   - Open on mobile (<768px):
     - Stacked layout (branding above form)
     - Logo and branding fully visible
     - Form takes full width
     - Responsive padding and spacing
     - No horizontal scrolling

---

## 📊 Key Features Demonstrated

### Filtering (Admin Only)
- **Client Filter**: Shows unique clients from loaded tickets
- **Member Filter**: Shows unique assigned members from tickets
- **Month Filter**: Shows creation months of tickets
- **Filter Logic**: AND operations (must match all active filters)
- **Reset Button**: Clears all filters at once
- **Filter Summary**: Shows count of active filters and results

### Responsive Design
- **Dual-View System**:
  - Desktop: Comprehensive table with all columns and full sidebar
  - Mobile: Card-based layout with essential info, collapsible sidebar
  - Uses Tailwind: `hidden md:block` and `md:hidden`
  
- **Responsive Grid**:
  - Filter dropdowns: `grid-cols-1 md:grid-cols-3 lg:grid-cols-4`
  - Adapts to screen size
  - Sidebar: Fixed on all sizes with mobile burger toggle
  
- **Responsive Pagination**:
  - `flex flex-wrap gap-2` - Buttons wrap on small screens
  - Smart page range (shows 3 pages around current)
  - Responsive spacing

### Unread Message Notifications (NEW)
- **Badge System**: Red circle on Conversation button with count (9+ max)
- **Toast Notifications**: Bottom-right desktop, bottom-left mobile
- **Auto-Clear**: Badge disappears when clicking Conversation button
- **Dismissible**: Toast has close button for manual dismiss
- **Real-Time**: Updates immediately when new messages detected

### Silicon Systems Branding (NEW)
- **Logo**: Responsive sizing across all pages
- **Sidebar**: Professional dark theme with fixed positioning
- **Login Page**: Technical maturity with security indicators
- **Typography**: Professional language and spacing throughout
- **Color Scheme**: Blue-600 primary with slate grays for professional appearance

---

## 📚 Learning Path

**Day 1 - Backend Structure**:
- [ ] Read: `backend/config/settings.py` (understand apps)
- [ ] Read: `backend/tickets/models/ticket.py` (understand data)
- [ ] Read: `backend/tickets/permissions.py` (understand access control)

**Day 2 - Frontend Structure**:
- [ ] Read: `frontend/lib/api.ts` (understand API calls)
- [ ] Read: `frontend/app/dashboard/page.tsx` (understand main page)
- [ ] Read: `frontend/app/dashboard/tickets/[id]/page.tsx` (understand detail page)

**Day 3 - Full Flow**:
- [ ] Trace: Creating a ticket → Database → Display
- [ ] Trace: Assigning to member → Validation → Backend
- [ ] Trace: Status update → Activity log → Activity display

**Day 4+** - Make changes!

---

## 🎮 API Testing with curl

```bash
# Login
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get token from response, then use it:
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

# List tickets
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/tickets/

# Create ticket
curl -X POST http://localhost:8000/api/tickets/create/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"issue":1,"sub_issue":1,"description":"test"}'
```

---

## 🚨 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Token expired or missing | Login again |
| 403 Forbidden | Wrong role for endpoint | Use different user |
| 404 Not Found | Wrong endpoint or resource deleted | Check URL in URLs.py |
| ValidationError | Bad data sent | Check serializer validations |
| Database locked | Migration issues | `manage.py migrate --fake` |
| "Module not found" | Missing import | Check imports at top of file |

---

## 📖 Documentation Files

- **README.md** - Project overview and setup
- **CODE_GUIDE.md** ← You are here! Detailed file explanations
- **QUICKSTART.md** ← This file! Quick reference

---

## 🤝 Code Style

### Python (Backend)
```python
# Use descriptive names
def create_ticket_and_notify_member():
    pass

# Add docstrings
class Ticket(models.Model):
    """Main ticket entity with workflow tracking"""
    
# Comments for complex logic
# Update status and record timestamp
if new_status != old_status:
    ticket.status = new_status
    ticket.updated_at = now()
```

### TypeScript (Frontend)
```typescript
// Component naming
export default function TicketDetailPage() {

// Interface for type safety
interface Ticket {
  id: number;
  ticket_number: string;
  status: 'CREATED' | 'ASSIGNED' | 'STARTED' | 'RESOLVED' | 'CLOSED';
}

// Clear variable names
const [tickets, setTickets] = useState<Ticket[]>([]);
```

---

## 📞 Need Help?

Check in this order:
1. **CODE_GUIDE.md** - Detailed explanations of all files
2. **Backend code comments** - In models, views, serializers
3. **Frontend code comments** - In pages and components
4. **Django/Next.js docs** - For framework-specific questions
5. **Git history** - See what changed and why (`git log --oneline`)

---

**Last Updated**: March 4, 2026
