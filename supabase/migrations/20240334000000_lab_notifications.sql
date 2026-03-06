-- Add reference_id to notifications for idempotency
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Create function to generate overdue lab notifications
CREATE OR REPLACE FUNCTION generate_overdue_lab_notifications()
RETURNS void AS $$
BEGIN
    INSERT INTO notifications (patient_id, type, title, content, barangay_target, reference_id)
    SELECT 
        p.id as patient_id,
        'lab_overdue'::notification_type as type,
        'Overdue Laboratory Test' as title,
        'Lab test "' || l.test_name || '" was scheduled for ' || l.scheduled_date || ' but has not been submitted.' as content,
        p.barangay as barangay_target,
        l.id as reference_id
    FROM laboratories l
    JOIN pregnancy_cycles c ON l.cycle_id = c.id
    JOIN patients p ON c.patient_id = p.id
    WHERE l.status = 'Pending'
    AND l.scheduled_date < CURRENT_DATE
    AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.reference_id = l.id 
        AND n.type = 'lab_overdue'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
