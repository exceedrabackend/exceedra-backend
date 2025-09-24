# Damage Claim Automation System

An automated damage claim management system for Airbnb property management companies. This system streamlines the process of reporting, tracking, and managing damage claims with automated notifications and deadline reminders.

## Features

### For Cleaners
- **Mobile-friendly damage reporting** with photo upload
- **Real-time image upload** to cloud storage
- **Simple form interface** for property selection and damage details
- **Track submitted reports** and their status

### For Damage Claim Team
- **Centralized dashboard** with statistics and overdue reports
- **Automated deadline tracking** (14-day Airbnb deadline, 30-day proof deadline)
- **Status management** workflow (Pending → Review → Submitted → Resolved)
- **Property-wise damage filtering** and search
- **Bulk image viewing** and management

### Automated Notifications
- **Email and SMS alerts** when new damage is reported
- **Deadline reminders** sent 1 day before and on the deadline day
- **Status update notifications** to cleaners
- **Overdue report alerts** for claim team

### Administration
- **User management** with role-based access (Cleaner, Claim Team, Admin)
- **Property management** with Airbnb ID tracking
- **System configuration** and monitoring

## Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication
- **Supabase Storage** for image storage
- **Nodemailer** for email notifications
- **Twilio** for SMS notifications
- **Node-cron** for scheduled reminders

### Frontend
- **React** with modern hooks
- **Tailwind CSS** for responsive design
- **React Router** for navigation
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Supabase account (for database and image storage)
- Email service (Gmail/SMTP)
- Twilio account (for SMS, optional)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DamageClaimAutomation
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Setup
Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/damage_claims_db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Supabase Config
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# Email Config
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Twilio Config (Optional)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# URLs
FRONTEND_URL="http://localhost:3000"
PORT=5000
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate

# Seed the database with sample data
npm run seed
```

### 5. Start the Application
```bash
# Development mode (both frontend and backend)
npm run dev

# Or start individually:
# Backend only
npm run server

# Frontend only (in another terminal)
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default User Accounts

After running the seed command, you can log in with these accounts:

- **Admin**: admin@company.com / password123
- **Claims Team**: claims@company.com / password123
- **Cleaner**: cleaner@company.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Damage Reports
- `GET /api/damages` - List damage reports (with filters)
- `POST /api/damages` - Create damage report
- `GET /api/damages/:id` - Get damage report details
- `PUT /api/damages/:id/status` - Update damage status
- `POST /api/damages/:id/images` - Add images to damage report

### Properties
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Environment Variables for Production
Make sure to set appropriate production values for:
- `DATABASE_URL` - Production database
- `JWT_SECRET` - Strong secret key
- `FRONTEND_URL` - Production frontend URL
- Email and SMS service credentials

### Recommended Deployment Platforms
- **Backend**: Heroku, Railway, DigitalOcean App Platform
- **Database**: PostgreSQL on AWS RDS, Google Cloud SQL, or Supabase
- **Frontend**: Vercel, Netlify, or serve from the same server
- **Images**: Cloudinary (already configured)

## Scheduled Tasks

The system runs automated checks every hour to:
- Send deadline reminders for Airbnb submissions (14 days)
- Send deadline reminders for proof submissions (30 days)
- Alert on overdue reports

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- File upload restrictions (images only, size limits)
- SQL injection protection via Prisma
- Rate limiting (recommended for production)

## Support

For support and questions:
1. Check the logs for detailed error messages
2. Ensure all environment variables are correctly set
3. Verify database connection and migrations
4. Test email/SMS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.