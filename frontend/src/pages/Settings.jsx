import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchSettings, updateSettings } from '../services/settingsService';

const Settings = () => {
    const { setPageTitle } = useOutletContext();
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        setPageTitle('System Settings');
        loadSettings();
    }, [setPageTitle]);

    const loadSettings = async () => {
        try {
            const data = await fetchSettings();
            setSettings(data);

            // Map settings to form data
            const initialData = {};
            data.forEach(setting => {
                initialData[setting.setting_key] = setting.setting_value;
            });
            setFormData(initialData);
        } catch (err) {
            console.error('Failed to load settings:', err);
            alert('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Convert formData back to array of updates or object
            // The API supports object { key: value }
            await updateSettings(formData);
            alert('Settings updated successfully');
            loadSettings();
        } catch (err) {
            console.error('Failed to update settings:', err);
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-8 text-gray-500">Loading settings...</div>;

    // Helper to find specific setting description/metadata if needed
    const getSettingObj = (key) => settings.find(s => s.setting_key === key);

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 pb-2 border-b">Notifications</h2>

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Automatic Email Notification Interval (Days)
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                        Set how often (in days) the system sends automatic email notifications for issues like Low Stock or Critical Wear Reports.
                        <br />
                        <span className="text-brand-red font-medium">Set to 0 to disable automatic notifications.</span>
                    </p>
                    <div className="flex items-center space-x-2">
                        <input
                            type="number"
                            min="0"
                            value={formData['email_notification_interval_days'] || ''}
                            onChange={(e) => handleChange('email_notification_interval_days', e.target.value)}
                            className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red"
                        />
                        <span className="text-gray-600">days</span>
                    </div>
                </div>

                {/* We can add more settings here dynamically or explicitly */}

                <div className="flex justify-end pt-4 border-t">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
