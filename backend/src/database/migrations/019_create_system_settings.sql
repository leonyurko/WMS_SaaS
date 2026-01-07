CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Initial Seed
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
    ('email_notification_interval_days', '0', 'Interval in days for sending automatic email notifications. 0 means disabled.'),
    ('last_notification_sent_at', NULL, 'Timestamp of the last automatic email notification sent.')
ON CONFLICT (setting_key) DO NOTHING;
