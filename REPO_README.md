# H10CM - Production Management & Inventory Tracking System

A comprehensive full-stack web application for production management and inventory tracking, built with modern technologies and designed for multi-tenant environments.

## 🏗️ Repository Structure

```
H10CM/
├── api/                          # Backend API Server
│   ├── h10cm_api.js             # API implementation (empty file)
│   ├── index.js                 # Main API server
│   ├── package.json             # API dependencies
│   └── tests/                   # API test files
├── TF_CMapp/                    # Frontend React Application
│   ├── src/                     # Source code
│   ├── public/                  # Static assets
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts           # Vite configuration
├── h10cm.sql                    # Database schema
├── TFPM_Complete_Database_Schema.sql  # Complete database setup
└── README.md                    # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- SQL Server (with H10CM database)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/justinmdougherty/H10CM.git
   cd H10CM
   ```

2. **Set up the database**
   - Execute `h10cm.sql` to create the H10CM database with all required tables and stored procedures
   - Configure your SQL Server connection details

3. **Install and run the API**
   ```bash
   cd api
   npm install
   npm start
   # API will be available at http://localhost:3000
   ```

4. **Install and run the frontend**
   ```bash
   cd TF_CMapp
   npm install
   npm run dev
   # Frontend will be available at http://localhost:5173
   ```

## 📊 Current Status

### ✅ **Completed Features**
- **Database**: H10CM database with 21 tables and all required stored procedures
- **Cart System**: Fully functional with input handlers and API integration
- **Inventory Management**: Working inventory system with multi-tenant support
- **Frontend**: Complete React/TypeScript application with Material UI
- **API Integration**: Core inventory operations functional with proper backend support

### 🔧 **In Progress**
- Multi-tenant security enforcement (program-level filtering)
- Complete RBAC backend integration
- Comprehensive testing and quality assurance

### 📈 **Progress Overview**
- **Overall Progress**: ~75% complete
- **Frontend Development**: 85% complete
- **Database Implementation**: 95% complete
- **Backend API**: 70% complete
- **System Integration**: 80% complete

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: Zustand + React Query
- **Build Tool**: Vite
- **Styling**: CSS-in-JS with MUI theming

### Backend
- **Runtime**: Node.js with Express
- **Database**: Microsoft SQL Server
- **Authentication**: Certificate-based authentication
- **API Style**: RESTful API with JSON responses

### Database
- **Database**: Microsoft SQL Server
- **Architecture**: Multi-tenant with program-level isolation
- **Features**: Full RBAC, audit trails, stored procedures

## 🔐 Security Features

- Certificate-based user authentication
- Multi-tenant data isolation
- Role-based access control (RBAC)
- Audit trail logging
- Input validation and sanitization

## 📦 Key Features

### Inventory Management
- Real-time inventory tracking
- Multi-tenant program isolation
- Shopping cart functionality
- Bulk operations support
- Audit trail for all transactions

### Project Management
- Project creation and tracking
- Task assignment and management
- Timeline and milestone tracking
- Resource allocation

### User Management
- Certificate-based authentication
- Role-based access control
- Multi-program access management
- User preference management

## 🧪 Testing

### API Testing
```bash
cd api
npm test
```

### Frontend Testing
```bash
cd TF_CMapp
npm test
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd TF_CMapp
npm run build

# Start API in production mode
cd ../api
npm start
```

### Environment Variables
Create `.env` files in both `api/` and `TF_CMapp/` directories with appropriate configuration.

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 🔗 Links

- [API Documentation](./api/README.md)
- [Frontend Documentation](./TF_CMapp/README.md)
- [Database Schema](./h10cm.sql)

---

*Last Updated: July 15, 2025*
*Status: ✅ Core functionality operational - focusing on security enhancements*
