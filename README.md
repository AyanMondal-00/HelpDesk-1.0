# Silicon Systems HelpDesk Ticketing System

A comprehensive enterprise help desk ticketing system built with Django REST Framework and Next.js, designed to streamline support operations with role-based access control and ticket management. Branded and styled for Silicon Systems with modern SaaS design patterns.

## 📋 Overview

**Silicon Systems HelpDesk** is a modern, enterprise-grade full-stack ticketing platform built with Django REST Framework and Next.js. It enables organizations to:
- ✅ Create and manage support issues with unique tracking numbers and UUIDs
- ✅ Track issue categories and sub-issues with intelligent chained selection
- ✅ Assign issues to support members based on technical expertise and issue specialization
- ✅ Monitor ticket activity and status transitions through complete audit trails
- ✅ Provide role-based access control with granular permissions (Admin, Member, Client)
- ✅ Role-based filtering at database level (custom QuerySets for security)
- ✅ Generate comprehensive dashboard analytics with role-specific views
- ✅ Track client information, member profiles, and complete ticket history
- ✅ Modern SaaS UI with Silicon Systems branding and tech blue color scheme
- ✅ Responsive design with mobile-first approach (desktop table view + mobile card view)
- ✅ Advanced filtering system with real-time search capabilities
- ✅ Real-time message conversation system with unread notification badges
- ✅ Action-button interface for ticket operations (Progress, Conversation, Update)
- ✅ Client-wise and Member-wise analytics dashboards

## 🏗️ Tech Stack

### Backend
- **Framework**: Django 6.0.2
- **API**: Django REST Framework 3.16.1
- **Database**: PostgreSQL
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Additional Libraries**: 
  - `django-cors-headers` - CORS handling
  - `django-filter` - Advanced filtering
  - `django-smart-selects` - Intelligent form field selection

### Frontend
- **Framework**: Next.js 16.1.6
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4 with modern SaaS design system
- **Charts**: Recharts 3.7.0 for analytics visualization
- **Language**: TypeScript
- **HTTP Client**: Custom API wrapper with JWT authentication
- **Design**: Modern tech blue SaaS dashboard with dark sidebar, white cards, professional typography

## 📁 Project Structure

```
HelpDesk/
├── backend/                           # Django REST API Server
│   ├── accounts/                      # User Management & Authentication
│   │   ├── models/
│   │   │   └── user.py               # Custom User model with roles (Admin, Member, Client)
│   │   ├── views/
│   │   │   ├── profile_view.py       # User profile endpoints
│   │   │   └── user_admin_views.py   # User directory endpoints
│   │   ├── serializers/
│   │   │   ├── profile_serializer.py # User data serialization
│   │   │   └── user_admin_serializer.py # Admin user list serialization
│   │   ├── migrations/               # Database migrations
│   │   ├── admin.py                  # Django admin configuration
│   │   └── urls.py                   # Authentication routes
│   │
│   ├── core/                          # Issue & Category Management
│   │   ├── models/
│   │   │   ├── base.py               # TimeStamped base model
│   │   │   ├── issue.py              # Issue categories
│   │   │   └── sub_issue.py          # Sub-issue types
│   │   ├── views/
│   │   │   └── core_views.py         # Issue API views
│   │   ├── serializers/
│   │   │   └── core_serializers.py   # Issue serialization
│   │   ├── migrations/
│   │   ├── admin.py
│   │   └── urls.py
│   │
│   ├── tickets/                       # Main Ticketing System
│   │   ├── models/
│   │   │   ├── ticket.py             # Main Ticket model with status workflow
│   │   │   ├── member.py             # Support member profiles
│   │   │   ├── client.py             # Client information
│   │   │   └── ticket_activity.py    # Activity audit logs
│   │   ├── views/
│   │   │   ├── ticket_views.py       # Ticket CRUD & status updates
│   │   │   ├── activity_view.py      # Activity logging
│   │   │   ├── dashboard_view.py     # Dashboard analytics
│   │   │   ├── status_transition_view.py # Status workflow
│   │   │   ├── member_filter_view.py # Member eligibility filtering
│   │   │   └── auth_view.py          # Authentication endpoint
│   │   ├── serializers/
│   │   │   ├── ticket_serializers.py # Ticket data validation
│   │   │   └── activity_serializer.py # Activity logging serializers
│   │   ├── services/
│   │   │   └── dashboard_service.py  # Business logic for analytics
│   │   ├── permissions.py            # Role-based permissions
│   │   ├── migrations/               # Database schema versions
│   │   ├── admin.py                  # Admin panel configuration
│   │   ├── tests.py                  # Unit tests
│   │   └── urls.py                   # API routes
│   │
│   ├── config/                        # Django Configuration
│   │   ├── settings.py               # Project settings & environment variables
│   │   ├── urls.py                   # Root URL configuration
│   │   ├── asgi.py                   # ASGI application (for async)
│   │   └── wsgi.py                   # WSGI application (for production)
│   │
│   ├── manage.py                      # Django management CLI
│   ├── requirements.txt               # Python package dependencies
│   └── .env                          # Environment configuration
│
├── frontend/                          # Next.js React Application
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with navigation
│   │   ├── page.tsx                  # Home page
│   │   ├── globals.css               # Global styles
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx              # Login authentication page
│   │   │
│   │   └── dashboard/                # Protected dashboard routes
│   │       ├── layout.tsx            # Dashboard layout with sidebar
│   │       ├── page.tsx              # Dashboard main page (analytics)
│   │       │
│   │       ├── tickets/              # Ticket management
│   │       │   ├── page.tsx          # Tickets list with filtering
│   │       │   ├── create/
│   │       │   │   └── page.tsx      # Create new ticket form
│   │       │   └── [id]/
│   │       │       └── page.tsx      # Ticket detail & update form
│   │       │
│   │       └── users/                # User directory (admin only)
│   │           └── page.tsx          # User list with role filtering
│   │
│   ├── component/                    # Reusable React Components
│   │   ├── StatusBadge.tsx          # Status badge component
│   │   ├── FilterSelect.tsx         # Reusable dropdown filter component
│   │   ├── FilterBadge.tsx          # Active filter indicator component
│   │   └── TicketCard.tsx           # Mobile-optimized card layout
│   │
│   ├── lib/                          # Utility Functions
│   │   └── api.ts                   # Axios API client wrapper
│   │
│   ├── public/                       # Static assets
│   ├── next.config.ts               # Next.js configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── package.json                 # Node package dependencies
│   ├── postcss.config.mjs           # CSS processing
│   └── .env.local                   # Local environment variables
│
└── README.md                         # This file
```

## 📋 Prerequisites

Before you begin, ensure you have installed:
- **Python 3.9+** - [Download](https://www.python.org/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/)
- **Git** - [Download](https://git-scm.com/)
- **npm** or **yarn** - Node package manager

## 🚀 Installation & Setup

### Backend Setup (Django)

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   ```powershell
   venv\Scripts\Activate.ps1
   ```

4. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

5. **Configure environment variables**
   
   Create/update the `.env` file:
   ```env
   SECRET_KEY=your-super-secret-key
   DEBUG=True
   ALLOWED_HOSTS=127.0.0.1,localhost
   
   # Database Configuration
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=helpdesk
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

6. **Create PostgreSQL database**
   ```bash
   createdb helpdesk
   # or in pgAdmin
   ```

7. **Run database migrations**
   ```powershell
   python manage.py migrate
   ```

8. **Create a superuser (admin account)**
   ```powershell
   python manage.py createsuperuser
   ```

9. **Start the development server**
   ```powershell
   python manage.py runserver
   ```
   Backend available at: `http://localhost:8000`
   Admin dashboard: `http://localhost:8000/admin`

### Frontend Setup (Next.js)

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start development server**
   ```powershell
   npm run dev
   ```
   Frontend available at: `http://localhost:3000`

## ▶️ Running the Application

### Development Mode (Two Terminals)

**Terminal 1 - Backend:**
```powershell
cd backend
venv\Scripts\Activate.ps1
python manage.py runserver
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

Then open browser: `http://localhost:3000`

### Production Build

**Backend:**
```powershell
python manage.py runserver 0.0.0.0:8000
# or with gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

**Frontend:**
```powershell
npm run build  # Create optimized build
npm start      # Start production server
```

## 🎨 User Interface Design

**Modern Tech Blue SaaS Dashboard with Silicon Systems Branding**
- **Primary Color**: #2563EB (Blue-600) with slate grays for professional appearance
- **Logo**: Silicon Systems logo integrated in header, sidebar, and login page
- **Sidebar**: Dark slate-900 background with fixed positioning; shows branding at top
- **Cards**: White backgrounds with soft shadows and rounded corners (10-12px)
- **Background**: Light slate-50 for optimal contrast and readability
- **Typography**: Professional system font stack with optimized letter-spacing
- **Professional Language**: "Silicon Systems HelpDesk", "Issue Tracking", "System Overview", "Activity Log"
- **Responsive Design**: Desktop table/list view + mobile card-based layout (no horizontal scrolling)

**Responsive Design System**
- **Desktop View** (≥768px): Full table view with comprehensive filters, all columns visible
- **Mobile View** (<768px): Card-based layout with essential info and touch-friendly spacing
- **No Horizontal Scrolling**: Responsive grid and flex layouts prevent user frustration
- **Touch-Friendly**: Larger clickable areas, proper spacing on mobile devices
- **Flexible Components**: Pagination, filters, and buttons wrap intelligently on small screens

**Advanced Filtering (Admin Only)**
- FilterSelect dropdowns for Client, Member, and Month filters
- AND logic combines all filters: ALL conditions must match
- FilterBadge component shows active filters with individual remove buttons
- Client-side filtering with real-time results update
- Filter count and results breakdown displayed

**Login Page - Technical Maturity**
- Dark theme (slate-950) with professional enterprise styling
- Silicon Systems logo positioned above "SYSTEM ACCESS" badge
- Terminal-inspired code display showing system specifications (desktop)
- Security indicators (TLS 1.3, JWT Protocol, Session expiration)
- Responsive mobile layout with full-width form on small screens
- Animated loading spinner during authentication

**Ticket Details Page - Action-Based Interface**
- Left column: Complete ticket information and activity timeline
- Right column: Three vertical action buttons with modals/dropdowns
  - **Ticket Progress Button**: Displays progress breakdown directly below button
  - **Conversation Button**: Opens modal with chat interface; red badge shows unread count (9+ cap); toast notification for new messages
  - **Update Ticket Button**: Opens form modal for status updates (role-based visibility)
- Modals: Semi-transparent backdrop with blur effect, smooth interactions
- Unread notifications: Badge system on Conversation button + toast at bottom-right (desktop) or bottom-left (mobile)

## 🎯 User Roles & Permissions

| Role | Access Level | Permissions |
|------|---|------------|
| **Admin** | Administrator | Full system access - manage users, all issues, analytics, issue categories, system settings |
| **Member** | Support Specialist | View assigned issues, manage status transitions, add comments, view team analytics |
| **Client** | Client Portal | Create issues, view own issues, track resolution status, communicate with support team |

## ✨ Core Features

### Ticket Management
- Create tickets with issue categorization
- Automatic ticket numbering (UUID-based)
- Real-time status tracking and transitions
- Workflow: CREATED → ASSIGNED → STARTED → RESOLVED → CLOSED
- Activity audit logs for all changes
- **Dual-View Interface**: Responsive desktop/mobile layouts
  - Desktop: Full table view with all columns (hidden md:block)
  - Mobile: Card-based view with grid metadata (md:hidden)
  - Dropdown View: 5 collapsible status filters on tickets page
  - Organized display by ticket status
  - Role-based display: Admin (all), Member (assigned), Client (own)
  - Quick ticket count badge per status
  - Expandable/collapsible dropdowns with smooth animations
  - Interactive ticket cards with hover effects
- **Advanced Filtering** (Admin only with AND logic):
  - Filter by Client with multi-client support
  - Filter by Member with specialty-matched display
  - Filter by Month with automatic range detection
  - All filters work together (intersection, not union)
  - Active filters shown as removal-enabled badges

### Member Assignment
- Intelligent member filtering based on specialty
- One-to-one member-to-user relationship
- Active/inactive member status
- Specialty matching for ticket routing
- Automatic eligible member list generation

### Client Management
- Client profile with company information
- Contact information storage
- Ticket history tracking
- Client-specific ticket access (read-only view)
- Secure isolation - clients only see own tickets

### Dashboard Analytics
- **Ticket Overview** - Real-time system analytics dashboard
- Status-wise issue distribution chart
- Monthly issue trends with historical data
- Client-wise breakdown analytics
- Member-wise workload analysis (admin-only)
- Real-time metrics with professional Recharts visualization
- Tab-based analytics view (Status Distribution, Monthly Trends, Client Analytics, Team Performance)

### Activity Tracking
- Timestamp all changes
- Track status transitions with before/after state
- Record who made changes
- Complete audit trail
- Activity timeline on ticket detail page

### Role-Based Access Control
- **Admin**: View all tickets, manage assignments, close tickets, advanced filtering, user directory, full analytics
- **Member**: View assigned tickets, update status (except close), limited analytics, responsive mobile view
- **Client**: View own tickets (read-only), create new tickets, track progress, responsive mobile view
- Fine-grained permissions at view and QuerySet levels
- JWT authentication with automatic token refresh

### User Directory Management
- Admin-only interface for viewing all system users
- Role-based filtering: All Roles, Administrators, Support Members, Clients
- Responsive grid layout (1 col mobile, 2-3 desktop)
- User cards display username, email, and role badge
- Real-time inline filtering with result count
- Professional card-based user interface

## 🔌 API Endpoints

### Authentication
```
POST   /api/token/              - Login and get JWT token
POST   /api/token/refresh/      - Refresh access token
POST   /api/logout/             - Logout and blacklist token
```

### Tickets
```
GET    /api/tickets/            - List all tickets (role-based filtering)
POST   /api/tickets/create/     - Create new ticket
GET    /api/tickets/{id}/       - Get ticket details
PATCH  /api/tickets/{id}/update/ - Update ticket status

GET    /api/tickets/{id}/activity/           - Get ticket activities
GET    /api/tickets/{id}/allowed-transitions/ - Get valid status transitions
GET    /api/tickets/{id}/eligible-members/   - Get members for assignment
```

### Issues & Categories
```
GET    /api/issues/             - List all issues
GET    /api/issues/{id}/        - Get issue detail
GET    /api/core/sub-issues/    - List sub-issues
```

### Dashboard
```
GET    /api/dashboard/summary/   - Overall statistics
GET    /api/dashboard/monthly/   - Monthly trends
GET    /api/dashboard/client-wise/  - Client breakdown
GET    /api/dashboard/member-wise/  - Member workload
```

### User Profile
```
GET    /api/me/                 - Get current user profile (Role/Username)
GET    /api/users/              - List all users (admin only)
GET    /api/users/{id}/         - Get user detail (admin only)
```

## 💾 Database Schema Overview

### Core Tables

**accounts_user**
- id, username, email, password
- role (ADMIN, MEMBER, CLIENT)
- is_active, created_at, updated_at

**tickets_ticket**
- id, ticket_number (UUID), status
- description, created_at, updated_at
- client_id (FK), issue_id (FK), sub_issue_id (FK)
- assigned_to_id (FK to Member, nullable)

**tickets_member**
- id, user_id (OneToOne), specialty_id (FK to Issue)
- is_active, created_at, updated_at

**tickets_client**
- id, user_id (OneToOne), company_name, whatsapp_number
- created_at, updated_at

**core_issue**
- id, name, description, created_at, updated_at

**core_subissue**
- id, name, description
- issue_id (FK), created_at, updated_at

**tickets_ticketactivity**
- id, ticket_id (FK), changed_by_id (FK to User)
- old_status, new_status, created_at

## 📝 Code Organization Best Practices

### Backend Structure
- **Models** - Database schema definitions
- **Views** - API endpoint handlers with business logic
- **Serializers** - Data validation and transformation
- **Services** - Reusable business logic
- **Permissions** - Role-based access control
- **Migrations** - Database schema versions

### Frontend Structure
- **Pages** - Route-based components (Next.js App Router)
- **Components** - Reusable UI components
- **lib** - Utility functions and API clients
- **Hooks** - Custom React hooks (if needed)

## 🧪 Testing

```powershell
# Backend unit tests
python manage.py test

# Backend specific app tests
python manage.py test tickets

# Frontend tests (if configured)
npm test
```

## 📊 Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with meaningful comments

3. **Test your changes**
   ```bash
   python manage.py test  # Backend
   npm run lint           # Frontend
   npm run build          # Frontend build check
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new feature description"
   ```

5. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🛠️ Troubleshooting

### Backend Issues

**Database Connection Error**
- ✅ Ensure PostgreSQL is running
- ✅ Verify `.env` database credentials
- ✅ Check if database exists: `createdb helpdesk`

**Migration Errors**
- ✅ Run: `python manage.py migrate --fake-initial`
- ✅ Check migration dependencies

**CORS Errors**
- ✅ Update `ALLOWED_HOSTS` in settings.py
- ✅ Verify frontend URL in `CORS_ALLOWED_ORIGINS`

### Frontend Issues

**API Connection Errors**
- ✅ Check `NEXT_PUBLIC_API_URL` in `.env.local`
- ✅ Verify backend is running on correct port
- ✅ Check browser console for specific errors

**Port Already in Use**
- ✅ Frontend: `npm run dev -- -p 3001`
- ✅ Backend: `python manage.py runserver 8001`

## 📦 Key Dependencies

### Backend (Python)
- Django 6.0.2
- djangorestframework 3.16.1
- djangorestframework-simplejwt - JWT authentication
- django-cors-headers - CORS support
- psycopg2-binary - PostgreSQL adapter

### Frontend (Node.js)
- Next.js 16.1.6
- React 19.2.3
- TypeScript - Type safety
- Tailwind CSS 4 - Styling
- Recharts - Data visualization

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 💬 Support & Contact

For issues, bugs, or feature requests:
- Open an issue on GitHub
- Check existing issues for solutions
- Provide detailed error messages and steps to reproduce

## 📚 Documentation

Comprehensive documentation for developers:
- **[QUICKSTART.md](QUICKSTART.md)** - Fast onboarding and testing procedures
- **[CODE_GUIDE.md](CODE_GUIDE.md)** - Detailed file-by-file code explanations
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data flows
- **[MENTAL_MODEL.md](MENTAL_MODEL.md)** - Conceptual understanding of the system

## 🎯 Future Enhancements

Potential features for future releases:
- [ ] Email notifications for ticket updates
- [ ] Real-time WebSocket notifications
- [ ] Advanced search with full-text indexing
- [ ] Batch ticket operations
- [ ] Custom ticket fields and workflows
- [ ] SLA tracking and automation
- [ ] Knowledge base integration
- [ ] Mobile app version
- [ ] Export to PDF/CSV reports
- [ ] API rate limiting and usage analytics

---

**Last Updated**: March 7, 2026  
**Version**: 2.1 (After Responsive Design, Filtering, and User Directory Implementation)

