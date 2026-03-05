# Patient Record Management System (PPMS) - Current State Knowledge Base

Last Updated: March 4, 2026

## 🏥 Project Overview
The Patient Record Management System for Pregnant Women (Municipality of Valladolid MHO) is designed to digitize the maternal health journey from Barangay Health Offices (BHO) to the Municipal Health Office (MHO), adhering to DOH Maternal Health guidelines.

## 🛠️ Tech Stack & Infrastructure
- **Frontend**: React.js with Vite
- **Styling**: Tailwind CSS v4 (configured via PostCSS)
- **Icons**: Lucide Icons
- **Data Tables**: @tanstack/react-table (v8)
- **Icons**: Lucide React
- **Backend (Implemented)**: Supabase client initialization (`supabase.ts`)
- **Routing**: react-router-dom

## 🏗️ Portal Architecture & File Organization

The system is split into two distinct portals to separate administrative duties from frontline healthcare delivery.

### 🏢 1. Admin Portal (MHO - Municipal Health Office)
- **Focus**: Oversight, admission approval, and system administration.
- **Entry Points**: `/admin`, `/admin/referrals`, `/admin/patients`, `/admin/users`.
- **Constraint**: **No patient creation capability.** Admins only admit patients referred by BHWs.
- **Location**: `src/pages/admin/`, `src/layouts/admin/`.

### 🏥 2. User Portal (BHW - Barangay Health Worker)
- **Focus**: Primary data entry and patient referral.
- **Entry Points**: `/bhw`, `/bhw/patients`, `/bhw/referrals`.
- **Role**: All patient records MUST originate here. BHWs initialize the patient record and start the pregnancy cycle.
- **Location**: `src/pages/bhw/`, `src/layouts/bhw/`.

## 🎯 Existing Features & Implementation

### 🏷️ 1. Dashboard & Navigation
- **Role-Based Layouts**: Separate `AdminLayout` (Blue theme) and `BHWLayout` (Green theme).
- **Sidebar Integration**: Tailored navigation for each user type. (BHW: Dashboard, My Patients, Referrals).

### 📋 2. Pending Referrals Management (Admin Only)
- **Table View**: Review patients in the admission queue.
- **Search & Sort**: Advanced TanStack Table integration.

### 👩‍⚕️ 3. Patient Records (Admin & BHW)
- **Admin View**: Read-only access until admitted; manages active pregnancy cycles.
- **BHW View**: List of patients assigned to their specific barangay. Features an **"Add New Patient"** button.

### 📝 4. Patient Entry & Document View
- **Add Patient (BHW Only)**: New form to initialize records (Integrated into Patient List).
- **Referral (SOAP Notes)**: Interactive step to record Subjective and Objective findings before MHO handoff.
- **Patient Record View**: Document-style management with clickable patient names.
- **Dynamic Timeline**: Milestone stepper displaying DOH goals and integrated clinical notes.
- **Paper-Style Design**: High-fidelity UI mimicking paper maternal health records (Green theme for BHW, Blue for Admin).
- **Timeline View**: Vertical stepper for DOH milestones.

### 👥 5. User Management (MHO Admin)
- **Account List**: Admin view to manage BHW accounts.
- **Staff Tracking**: Displays Name, Email, Role (Admin/BHW), Barangay Assignment, and Last Login.
- **Search & Sort**: Global search and sorting for User Management table.
- **Account Creation**: Integrated "Create Account" button (Mock logic).

### 🗄️ 6. Data Layer (Mock & Schema)
- **Supabase Integration**: Defined schema for `patients`, `pregnancy_cycles`, `referrals`, `laboratories`, and `notes`.
- **Mock Data**: Robust mock data in `mockData.ts` for all entities to support UI development without constant database reliance.

---
**Status: Week 3 Complete, transitioning to Week 4 (Storage & Data Entry).**
