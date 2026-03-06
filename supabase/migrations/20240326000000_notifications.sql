-- Create Notification Type Enum
CREATE TYPE notification_type AS ENUM ('lab_overdue', 'referral', 'system');

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    barangay_target TEXT, -- Barangay to show this notification to
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "MHO Admins can access all notifications" ON notifications
    FOR ALL USING (get_user_role() = 'mho_admin');

CREATE POLICY "BHWs can view their barangay notifications" ON notifications
    FOR SELECT USING (
        barangay_target = get_user_barangay()
    );

CREATE POLICY "BHWs can dismiss their barangay notifications" ON notifications
    FOR UPDATE USING (
        barangay_target = get_user_barangay()
    )
    WITH CHECK (
        barangay_target = get_user_barangay()
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_modtime
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_timestamp();
