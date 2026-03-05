# Patient Record Management System for Pregnant Women (Municipality of Valladolid MHO)

Digitize the maternal health journey from the Barangay Health Office (BHO) to the Municipal Health Office (MHO) while adhering to DOH Maternal Health guidelines and the Philippine Data Privacy Act of 2012.

## User Review Required

> [!CAUTION]
> **Data Privacy Act (DPA) Compliance for SMS**: We will be sending Patient Reminders via SMS. To comply with the Data Privacy Act of 2012, SMS messages should contain minimal sensitive information. The proposed SMS template is "Reminder: You have a scheduled laboratory at Valladolid MHO on [Date]." Please confirm if this generic format is sufficient, or if we need to implement a more secure channel for conveying sensitive medical updates.

> [!WARNING]
> **Supabase Edge Functions Runtime**: Connecting to Postgres from Edge Functions requires the standard Supabase REST API or Postgres (via Deno Postgres). Please confirm if we should strictly use `supabase-js` API client in Edge Functions to access Database records.

## System Architecture

- **Frontend**: React.js, deployed on Vercel.
- **Backend/Database**: Supabase (PostgreSQL for Relational DB, Edge Functions for scheduled/webhook logic, Real-time for dashboard updates, Auth for user management, Storage for laboratory results).
- **Communication Gateway**: HTTPSMS (SMS Gateway) triggered via Supabase Edge Functions.

---

## Database Schema Design

The schema supports multiple pregnancy cycles for a single patient, preserving historical data while identifying the active cycle.

### `patients`
Stores demographic information and contact details.
- `id` (uuid, primary key)
- `first_name` (varchar)
- `last_name` (varchar)
- `mi` (varchar)
- `purok` (varchar)
- `barangay` (varchar)
- `age` (integer)
- `contact_no` (varchar)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### `pregnancy_cycles`
Tracks the distinct maternal health journeys for a patient.
- `id` (uuid, primary key)
- `patient_id` (uuid, foreign key -> patients.id)
- `status` (enum: 'Active', 'Completed')
- `estimated_due_date` (date)
- `started_at` (timestamptz)
- `completed_at` (timestamptz, nullable)

### `referrals`
Manages the handoff from BHO to MHO. 
- `id` (uuid, primary key)
- `cycle_id` (uuid, foreign key -> pregnancy_cycles.id)
- `status` (enum: 'Pending', 'Admitted')
- `referred_by_user_id` (uuid, foreign key -> auth.users.id)
- `referred_at` (timestamptz)
- `admitted_at` (timestamptz, nullable)

### `laboratories`
Manages laboratory requests and results.
- `id` (uuid, primary key)
- `cycle_id` (uuid, foreign key -> pregnancy_cycles.id)
- `scheduled_date` (date)
- `status` (enum: 'Pending', 'Submitted')
- `results_path` (text, nullable, path in Supabase Storage)
- `created_at` (timestamptz)

### `notes`
Chronological logs related to a specific pregnancy cycle.
- `id` (uuid, primary key)
- `cycle_id` (uuid, foreign key -> pregnancy_cycles.id)
- `author_id` (uuid, foreign key -> auth.users.id)
- `content` (text)
- `created_at` (timestamptz)

---

## Functional Workflows & Logic

### Referral Flow (Barangay Health Worker / BHW)
1. BHW logs in, seeing only patients from their assigned barangay.
2. Interface provides "Search Patient" functionality to find existing records or "Add Patient" if the patient is new.
3. BHW starts a new active `pregnancy_cycles` record (if none exists).
4. BHW creates a `referrals` record with status "Pending".
5. Real-time updates trigger a "New Referral" notification on the MHO Admin's dashboard.

### Admission Logic (MHO Admin)
1. Pending referrals appear in the **Referrals Tab** for the MHO Admin.
2. Clicking a referral opens the patient's record view. Input fields (demographics, notes, labs) are **disabled** using React state (`disabled={status === 'Pending'}`).
3. The Admin reviews the referral and clicks the sticky **"Admit"** footer button.
4. The application fires a Supabase database update, changing the referral status to "Admitted" and setting `admitted_at`.
5. Upon successful mutation, the record automatically moves from the "Referrals Tab" to the "Patients Tab", and the input fields become unlocked.

### Timeline View Component
A visual UI roadmap detailing standard Department of Health (DOH) milestones.
- Connects to the active `pregnancy_cycles` and extracts associated `notes` and `laboratories` dates.
- Maps events chronologically to:
    - 1st Trimester Contact
    - 2nd Trimester Contact
    - 3rd Trimester Contacts
    - Postnatal Visits (once cycle transitions towards completion)
- Implemented as a vertical stepper component.

---

## Automation & Notification Strategy

Powered by Supabase Edge Functions (via `pg_cron` / Deno cron for scheduling).

### Task A (Patient Reminder - 7 Days Future)
- **Logic**: A daily cron job triggers an Edge Function. It queries `laboratories` where `scheduled_date` is exactly `CURRENT_DATE + 7 days` AND `status` is 'Pending'.
- **Action**: Constructs SMS string and hits HTTPSMS gateway.
- **SMS Template**: "Reminder: You have a scheduled laboratory at Valladolid MHO on [Date]."

### Task B (Admin/BHW Alert - 7 Days Past Due)
- **Logic**: Query `laboratories` where `scheduled_date` is exactly `CURRENT_DATE - 7 days` AND `status` is 'Pending'.
- **Action**: 
    - Database Insert: Insert a notification into a `system_notifications` table (for MHO Admin dashboard).
    - SMS Gateway: Look up the BHW assigned to the patient's barangay and send an SMS alert to follow up with the patient.

### HTTPSMS Integration Implementation
Helper function structure inside the Supabase Edge Function:

```typescript
async function sendSms(phoneNumber: string, message: string) {
  const apiKey = Deno.env.get('HTTPSMS_API_KEY');
  const response = await fetch('https://api.httpsms.com/v1/messages/send', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: '+1234567890', // Default or verified sender ID
      to: phoneNumber,
      content: message,
    }),
  });

  if (!response.ok) {
    console.error('Failed to send SMS:', await response.text());
  }
}
```

---

## UI/UX & Frontend Components

### Layout structure
- **Sidebar Navigation**:
    - Dashboard (High-level metrics, Quick actions)
    - Referral Tab (Pending queue for MHO Admins)
    - Patients Tab (Admitted and Active records)
    - Notifications
    - User Management (MHO admins to handle BHW accounts)

### Features
- Data tables initialized using **TanStack Table** for advanced features like per-column filtering, global search, and sorting.
- Skeleton loaders for asynchronous data fetching.

### Document View
- Styled like a traditional paper form to feel familiar to healthcare workers.
- Encapsulates Patient summary, current cycle details, interactive Timeline View, and Lab requests.
- Features a **sticky footer** housing the "Admit" or "Save Changes" call to action, ensuring it is always accessible regardless of scroll depth.

---

## Compliance & Security

### Supabase Row Level Security (RLS)
Security is enforced at the database level using `auth.uid()` and custom claims or user metadata:
1. **BHW RLS Policy**: `SELECT`, `UPDATE` on `patients` and related tables where `patients.barangay == auth.user().user_metadata.assigned_barangay`.
2. **MHO Admin RLS Policy**: Broad access. `SELECT`, `UPDATE`, `INSERT`, `DELETE` across all records. By verifying if `auth.user().user_metadata.role == 'mho_admin'`.

### Data Privacy Act of 2012
- **Sensitive Personal Information**: Health records are classified under SPI. Data access is strictly restricted by RLS (Role-Based Access Control).
- **Consent Collection**: The BHW workflows must include a physical or digital consent acknowledgement step when digitizing records.
- **Data Minimization in SMS**: As highlighted, SMS notifications only communicate dates and locations, avoiding specific diagnoses, laboratory types, or personal identifiable health data.

---

## Phased Development Timeline (6 Weeks)

- **Week 1: Setup & Data Layer**: Initialize React, Supabase project. Establish database schemas, RLS policies, and Auth handling.
- **Week 2: Core Workflows (Frontend)**: Develop Dashboard layout, implement Sidebar, build TanStack Table integrations for Patients and Referrals.
- **Week 3: Document & Timeline View**: Build the Paper-style Document View, Referral flow, Admission logic state handling, and Timeline View component.
- **Week 4: Storage & Data Entry**: Integrate Supabase Storage for laboratory files. Implement Forms for notes, demographics.
- **Week 5: Automations (Edge Functions)**: Write and deploy Cron jobs for Patient Reminders and Past Due Alerts. Integrate HTTPSMS payload logic.
- **Week 6: UAT & Compliance Check**: Test RLS roles thoroughly, end-to-end testing of SMS delivery, perform User Acceptance Testing with BHWs and MHO Admins. 
