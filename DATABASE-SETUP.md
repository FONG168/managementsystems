# Employee Manager - Database Setup Guide

## 🗄️ Database Integration

Your Employee Manager now supports **real database storage** using Supabase (PostgreSQL). This means:

- ✅ **No more data loss** when deploying
- ✅ **Multi-device access** to your data
- ✅ **Automatic backups** and sync
- ✅ **Real-time data persistence**

## 🚀 Quick Setup (5 minutes)

### 1. Create a Free Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

### 2. Get Your Database Credentials
1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy your:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Run the Database Setup
1. In Supabase, go to **SQL Editor**
2. Create a new query
3. Copy and paste this SQL script:

```sql
-- Employee Manager Database Tables
-- Run this SQL in your Supabase SQL Editor

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    staff_id VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    position VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    start_date DATE,
    salary DECIMAL(10,2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs table  
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    staff_id VARCHAR(10) NOT NULL,
    day INTEGER NOT NULL,
    activity VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_month_staff 
    ON activity_logs(month_key, staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_id ON staff(staff_id);
```

4. Click **Run** to execute the script

### 4. Connect Your App to the Database
1. In your Employee Manager app
2. **Press `Ctrl+Shift+D`** or click the database status indicator
3. Enter your **Project URL** and **anon key**
4. Click **Test** to verify connection
5. Click **Connect Database** to save

## 🔄 Usage

### Automatic Sync
Once connected, all your data automatically syncs to the database:
- Staff changes are saved immediately
- Activity logs are updated in real-time
- Settings are preserved across devices

### Status Indicator
Check the database status in the top-right corner:
- 🟢 **Database** - Connected and syncing
- 🔴 **Error** - Database error (using local backup)
- 🟡 **Local** - Using local storage only

### Backup & Migration
- **Export/Import** still works for manual backups
- **Database sync** happens automatically
- **Local storage** serves as fallback if database is unavailable

## 🛠️ Troubleshooting

### Connection Issues
1. Verify your Supabase URL and key are correct
2. Make sure you ran the SQL setup script
3. Check that your Supabase project is active

### Data Migration
1. **From Local to Database**: Once connected, your local data will be uploaded
2. **Between Devices**: Login with same credentials on any device
3. **Backup**: Use Export function for additional safety

### Reset Database
If you need to start fresh:
1. In Supabase SQL Editor, run: `TRUNCATE staff, activity_logs, activities, app_settings;`
2. Reload your app to re-initialize with sample data

## 💝 Free Tier Limits

Supabase free tier includes:
- **500MB database** (plenty for employee data)
- **50,000 monthly active users**
- **2GB bandwidth per month**
- **50GB file storage**

Perfect for small to medium businesses!

## 🔒 Security

- Your data is encrypted in transit and at rest
- Only you have access with your credentials
- No data is stored on our servers
- Open source and self-hostable

---

**Need help?** The database configuration modal has detailed setup instructions, or press `Ctrl+Shift+D` to access it anytime.
