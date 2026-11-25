# FORTISURE – Internal Asset and License Management System

## 1. Project Overview

FORTISURE is a full-stack web-based Internal Asset and License Management System developed to help organizations manage hardware assets, software licenses, employee assignments, and asset-related activities through a centralized platform.

The application provides separate access for Administrators and Employees. Administrators can manage organizational assets and licenses, assign resources, monitor usage, and review employee requests and asset reports. Employees can view their assigned resources, submit requests, and report lost or damaged assets.

The main objective is to improve asset visibility, prevent duplicate assignments, monitor license usage, and identify expired licenses before they cause operational issues.

## 2. Objectives

- Centralize hardware asset and software license management.
- Prevent duplicate hardware assignments.
- Track current asset holders and assignment history.
- Monitor software license seat availability.
- Identify expired licenses and upcoming expiries.
- Provide role-based access for Administrators and Employees.
- Maintain visibility into employee requests and asset reports.
- Improve accountability through activity tracking.

## 3. Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js
- RESTful APIs

### Database
- MySQL
- MySQL2

### Authentication and Security
- JSON Web Token (JWT)
- bcrypt password hashing
- Google Authentication Library
- Helmet
- CORS
- Express Rate Limit
- Environment variables using dotenv

## 4. User Roles and Permissions

### Administrator (Admin)

The Administrator manages the organization's assets, licenses, employees, and operational activities.

**Permissions:**
- Access the Admin Dashboard.
- Add, edit, view, search, and manage hardware assets.
- Assign assets to employees.
- Record asset returns.
- View asset assignment history.
- Add and manage software licenses.
- Allocate and manage license seats.
- Monitor license expiry and seat usage.
- View employee details.
- Review employee requests.
- Approve or reject asset reports.
- View dashboard statistics and alerts.
- Access available audit-related information.

### Employee

Employees can access information related to their assigned resources and submit relevant requests and reports.

**Permissions:**
- Access the Employee Dashboard.
- View assigned hardware assets.
- View assigned software licenses.
- Submit asset or license requests.
- Report assigned assets as Lost or Damaged.
- View submitted asset report history.
- Track relevant request information.

## 5. Application Modules and Features

### 5.1 Authentication Module

- User login with email and password.
- Role-based access for Admin and Employee.
- JWT-based authentication.
- Password hashing using bcrypt.
- Protected backend routes.
- Google authentication integration.
- Session/token-based access management.

### 5.2 Admin Dashboard

Provides a centralized overview of organizational resources.

**Features:**
- Asset statistics by status.
- Total and available asset information.
- Assigned asset information.
- Software license seat usage.
- Used versus total license seats.
- Upcoming license expiry information.
- Warranty expiry alerts.
- Overview of important asset and license activities.

### 5.3 Asset Management

Allows administrators to maintain hardware asset information.

**Asset information includes:**
- Unique Asset Tag.
- Asset Type.
- Brand.
- Model.
- Serial Number.
- Purchase Date.
- Cost.
- Warranty Expiry Date.
- Asset Status.

**Features:**
- Add new hardware assets.
- View asset details.
- Edit asset information.
- Search and filter assets.
- Track asset availability.
- Maintain asset status information.

**Asset statuses:**
- Available
- Assigned
- In Repair
- Retired
- Lost

### 5.4 Asset Assignment and Return Management

Manages the allocation of hardware assets to employees.

**Features:**
- Assign available assets to employees.
- Prevent assigning an already assigned asset.
- Prevent assignment of unavailable assets.
- Record assignment details.
- Record asset returns.
- Track current asset holders.
- Maintain assignment and return history.

**Core rule:** An asset cannot have more than one active assignment at a time.

### 5.5 Employee Management

Provides employee-related information for resource allocation and administration.

**Features:**
- View employee information.
- Identify employee resource assignments.
- View employee-related asset information.
- Support employee selection during asset and license allocation.

### 5.6 Software License Management

Allows administrators to manage software subscriptions and license information.

**License information includes:**
- Software Name.
- Vendor.
- License Key.
- Total Seats.
- Expiry Date.
- Cost.

**Features:**
- Add software licenses.
- View license details.
- Manage license information.
- Monitor total license seats.
- Track used and available seats.
- Identify expired licenses.
- Display license availability.

### 5.7 License Assignment Management

Manages software license allocation to employees.

**Features:**
- Assign available license seats.
- Track employees using each license.
- Monitor allocated seats.
- Calculate remaining seats.
- Maintain license assignment history.
- Prevent assignments when the seat limit is reached.
- Block new assignments to expired licenses.

**Core rule:** The number of active license assignments must not exceed the usable seat capacity.

### 5.8 Employee Request Management

Allows employees to submit requests for organizational resources.

**Features:**
- Submit asset-related requests.
- Submit license-related requests.
- View request information.
- Allow administrators to review requests.
- Approve or reject requests.
- Track request status.

### 5.9 Lost and Damaged Asset Reporting

Allows employees to report issues involving assets assigned to them.

**Features:**
- Report an assigned asset as Lost.
- Report an assigned asset as Damaged.
- Provide a description of the issue.
- View submitted report history.
- Allow administrators to review pending reports.
- Approve or reject reports.
- Update asset status after approval.

**Approval behavior:**
- Approved Lost reports update the asset status to Lost.
- Approved Damaged reports update the asset status to Maintenance.
- Existing assignment and holder history are retained.

### 5.10 Audit and Activity Tracking

Provides audit-related information to support accountability and traceability.

**Features:**
- Maintain activity-related information.
- Support tracking of asset and license operations.
- Provide administrators access to available audit information.

### 5.11 Expiry Alerts and Validation

Helps administrators identify expired licenses and monitor resource validity.

**Features:**
- Identify expired licenses.
- Display expiry information.
- Exclude expired license seats from usable seat counts.
- Prevent new assignments to expired licenses.
- Retain existing assignments for administrative review.
- Display upcoming warranty and license expiry information.

## 6. Level 2 Challenges Implemented

Two Level 2 challenges were selected and implemented.

### Challenge C – Expiry Handling

**Problem:**

Expired software licenses should not continue to be counted as usable seats, and new assignments should not be allowed.

**Implementation:**
- Expired licenses are identified using their expiry date.
- Expired licenses are visibly marked.
- Expired license seats are excluded from usable seat calculations.
- New assignments to expired licenses are blocked.
- Existing assignments and their history are retained.

**Design decision and trade-off:**

Existing assignments are not automatically released when a license expires. They are retained for administrative review. This avoids silently changing employee access records and preserves assignment history.

### Challenge D – Lost or Damaged Assets

**Problem:**

Employees need a way to report missing or damaged organizational assets.

**Implementation:**
- Employees can report assets currently assigned to them.
- Reports include the report type and description.
- Administrators can review pending reports.
- Administrators can approve or reject reports.
- Approved reports update the corresponding asset status.
- Assignment and holder history are retained.

**Design decision and trade-off:**

Asset recovery requires physical verification by the administrator. The system retains the previous assignment information so that the asset's history remains traceable.

## 7. Core Business Rules

- Only authorized administrators can perform administrative operations.
- Employees can access only permitted employee-related information.
- An asset cannot be assigned to multiple employees simultaneously.
- Only Available assets can be assigned.
- In Repair, Retired, and Lost assets cannot be assigned.
- License assignments cannot exceed usable seat capacity.
- Expired licenses cannot receive new assignments.
- Expired license seats are excluded from usable seat counts.
- Employees can report only assets assigned to them.
- Asset report approvals and rejections are handled by administrators.

## 8. Security Measures

- Password hashing using bcrypt.
- JWT-based authentication.
- Role-based authorization.
- Protected API routes.
- Security headers using Helmet.
- CORS configuration.
- Request rate limiting.
- Backend-side request validation.
- Environment variables for sensitive configuration.
- Database connection using MySQL connection pooling.

## 9. Project Architecture

The application follows a frontend-backend-database architecture.

```text
                 FORTISURE APPLICATION
                          |
              +-----------+-----------+
              |                       |
         React Frontend          Node.js Backend
              |                       |
         Admin UI                 Express.js
         Employee UI                  |
              |               REST API Routes
              |                       |
              |                  Controllers
              |                       |
              |                Authentication
              |                 & Middleware
              |                       |
              +-----------------------+
                                      |
                                 MySQL Database
```

## 10. Project Folder Structure

```text
FORTISURE/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── package.json
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   └── package.json
│
├── .gitignore
└── README.md
```

## 11. Installation and Setup

### Prerequisites

- Node.js and npm.
- MySQL Server.
- Git.
- Visual Studio Code.

### Step 1 – Clone the Repository

```bash
git clone https://github.com/Jose-Max11/asset-license.git
cd asset-license
```

### Step 2 – Configure the Database

1. Start MySQL Server.
2. Create the database named `asset_license_management`.
3. Import the project's database schema and required seed data.
4. Verify that the required tables are created.

### Step 3 – Configure Backend Environment

Navigate to the backend folder:

```bash
cd backend
npm install
```

Create a `.env` file inside the backend directory.

Configure the required variables using your local environment:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=asset_license_management
DB_PORT=3306
FRONTEND_URL=http://localhost:5173
```

Add any additional JWT and Google OAuth variables required by the backend configuration.

Do not upload real credentials or secrets to GitHub.

### Step 4 – Start the Backend

Run the start command configured in `backend/package.json`.

The backend is configured to use port 5000 by default.

### Step 5 – Configure and Start Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local frontend URL displayed by Vite.

## 12. Demo Scenario

The following scenarios can be demonstrated during evaluation:

1. Log in as Admin.
2. Add a new laptop.
3. Assign the laptop to an employee.
4. Attempt to assign the same laptop to another employee and verify that the operation is rejected.
5. Allocate the final available seat of a license.
6. Attempt another assignment and verify that the seat limit is enforced.
7. View dashboard statistics.
8. View upcoming expiry alerts.
9. Demonstrate expired license handling.
10. Log in as Employee.
11. Submit a Lost or Damaged asset report.
12. Log in as Admin and review the submitted report.
13. Approve or reject the report.
14. Verify the updated asset status and retained assignment history.

## 13. Known Limitations

- The application is developed as a proof of concept.
- Automated test coverage is not yet complete.
- Public deployment is not included.
- Physical asset recovery requires administrative verification.
- Existing assignments on expired licenses are retained for review rather than automatically released.
- Email notifications are not included unless separately configured.
- Additional enhancements and validation may be required for production use.

## 14. Future Enhancements

- Automated testing for core business rules.
- Email notifications for upcoming expiries.
- QR code generation for hardware assets.
- CSV and Excel import/export.
- Cloud deployment.
- Enhanced asset recovery workflow.
- Advanced reporting and analytics.
- Improved audit history and traceability.

## 15. Repository

GitHub Repository:

https://github.com/Jose-Max11/asset-license

Repository visibility: Private.

## 16. Author

Developed as an individual full-stack proof-of-concept project for the FORTISURE evaluation.