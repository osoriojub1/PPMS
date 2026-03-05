import { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Monitor, Activity, Database, Wifi, HardDrive, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';

// Mock system health data
const mockSystemHealth = {
    status: 'Operational',
    uptime: '99.97%',
    lastChecked: new Date().toISOString(),
    services: [
        { name: 'Application Server', status: 'healthy', latency: '42ms', uptime: '99.99%' },
        { name: 'Database (PostgreSQL)', status: 'healthy', latency: '12ms', uptime: '99.98%' },
        { name: 'Authentication Service', status: 'healthy', latency: '68ms', uptime: '99.95%' },
        { name: 'SMS Gateway (HTTPSMS)', status: 'degraded', latency: '320ms', uptime: '98.50%' },
        { name: 'File Storage (Supabase)', status: 'healthy', latency: '55ms', uptime: '99.97%' },
    ],
    metrics: {
        activeUsers: 12,
        totalPatients: 847,
        pendingReferrals: 6,
        scheduledLabs: 23,
        diskUsage: 34,
        memoryUsage: 61,
        cpuUsage: 18,
    },
    recentEvents: [
        { id: 1, type: 'info', message: 'Database backup completed successfully', time: '2 hours ago' },
        { id: 2, type: 'warning', message: 'SMS Gateway response time elevated (>300ms)', time: '4 hours ago' },
        { id: 3, type: 'info', message: 'System update applied: v2.4.1', time: '1 day ago' },
        { id: 4, type: 'info', message: 'SSL certificate renewed', time: '3 days ago' },
    ]
};

const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'healthy') return <CheckCircle2 size={16} className="text-green-500" />;
    if (status === 'degraded') return <AlertTriangle size={16} className="text-amber-500" />;
    return <XCircle size={16} className="text-red-500" />;
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
        healthy: 'bg-green-100 text-green-700 border-green-200',
        degraded: 'bg-amber-100 text-amber-700 border-amber-200',
        down: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${colors[status as keyof typeof colors] || colors.healthy}`}>
            {status}
        </span>
    );
};

const Settings = () => {
    const [activeSection, setActiveSection] = useState<'appearance' | 'health'>('appearance');
    const { theme: darkMode, setTheme: setDarkMode } = useTheme();

    const sections = [
        { id: 'appearance' as const, label: 'Appearance', icon: <Moon size={18} /> },
        { id: 'health' as const, label: 'System Health', icon: <Activity size={18} /> },
    ];

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <SettingsIcon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h1>
                    <p className="text-sm text-gray-400 font-medium">Manage preferences and monitor system status</p>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex space-x-2 mb-8">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSection === s.id
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
                            }`}
                    >
                        {s.icon}
                        <span>{s.label}</span>
                    </button>
                ))}
            </div>

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
                <div className="space-y-8">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-black text-gray-900">Theme</h2>
                            <p className="text-xs text-gray-400 font-medium mt-1">Choose your preferred display mode</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-3 gap-4">
                                {/* Light Mode */}
                                <button
                                    onClick={() => setDarkMode('light')}
                                    className={`relative p-6 rounded-2xl border-2 transition-all text-center group ${darkMode === 'light'
                                        ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                                        : 'border-gray-200 bg-white hover:border-gray-400'
                                        }`}
                                >
                                    <div className={`h-14 w-14 rounded-full mx-auto mb-4 flex items-center justify-center transition-all ${darkMode === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                        }`}>
                                        <Sun size={24} />
                                    </div>
                                    <p className="font-black text-sm text-gray-900">Light</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Default bright theme</p>
                                    {darkMode === 'light' && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle2 size={18} className="text-blue-600" />
                                        </div>
                                    )}
                                </button>

                                {/* Dark Mode */}
                                <button
                                    onClick={() => setDarkMode('dark')}
                                    className={`relative p-6 rounded-2xl border-2 transition-all text-center group ${darkMode === 'dark'
                                        ? 'border-blue-600 bg-gray-900 shadow-lg shadow-blue-100'
                                        : 'border-gray-200 bg-white hover:border-gray-400'
                                        }`}
                                >
                                    <div className={`h-14 w-14 rounded-full mx-auto mb-4 flex items-center justify-center transition-all ${darkMode === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                        }`}>
                                        <Moon size={24} />
                                    </div>
                                    <p className={`font-black text-sm ${darkMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dark</p>
                                    <p className={`text-[10px] mt-1 ${darkMode === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>Easy on the eyes</p>
                                    {darkMode === 'dark' && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle2 size={18} className="text-blue-600" />
                                        </div>
                                    )}
                                </button>

                                {/* System Mode */}
                                <button
                                    onClick={() => setDarkMode('system')}
                                    className={`relative p-6 rounded-2xl border-2 transition-all text-center group ${darkMode === 'system'
                                        ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                                        : 'border-gray-200 bg-white hover:border-gray-400'
                                        }`}
                                >
                                    <div className={`h-14 w-14 rounded-full mx-auto mb-4 flex items-center justify-center transition-all ${darkMode === 'system' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                        }`}>
                                        <Monitor size={24} />
                                    </div>
                                    <p className="font-black text-sm text-gray-900">System</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Match OS preference</p>
                                    {darkMode === 'system' && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle2 size={18} className="text-blue-600" />
                                        </div>
                                    )}
                                </button>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start space-x-3">
                                <CheckCircle2 size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-700 font-medium">
                                    Your theme preference is saved automatically and will persist across sessions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* System Health Section */}
            {activeSection === 'health' && (
                <div className="space-y-6">
                    {/* Overall Status Banner */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">All Systems {mockSystemHealth.status}</h2>
                                    <p className="text-green-100 text-xs font-bold mt-0.5">
                                        Uptime: {mockSystemHealth.uptime} · Last checked: {new Date(mockSystemHealth.lastChecked).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                                <div className="h-2.5 w-2.5 bg-green-300 rounded-full animate-pulse" />
                                <span className="text-xs font-bold">Live</span>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: 'Active Users', value: mockSystemHealth.metrics.activeUsers, icon: <Wifi size={18} />, color: 'blue' },
                            { label: 'Total Patients', value: mockSystemHealth.metrics.totalPatients, icon: <Database size={18} />, color: 'purple' },
                            { label: 'Pending Referrals', value: mockSystemHealth.metrics.pendingReferrals, icon: <Clock size={18} />, color: 'amber' },
                            { label: 'Scheduled Labs', value: mockSystemHealth.metrics.scheduledLabs, icon: <HardDrive size={18} />, color: 'green' },
                        ].map(metric => (
                            <div key={metric.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`h-9 w-9 rounded-lg flex items-center justify-center bg-${metric.color}-50 text-${metric.color}-600`}>
                                        {metric.icon}
                                    </span>
                                </div>
                                <p className="text-2xl font-black text-gray-900">{metric.value}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{metric.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Two Column: Services + Resource Usage */}
                    <div className="grid grid-cols-5 gap-6">
                        {/* Services Status */}
                        <div className="col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Service Status</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {mockSystemHealth.services.map(service => (
                                    <div key={service.name} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <StatusIcon status={service.status} />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{service.name}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">Latency: {service.latency}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xs font-bold text-gray-500">{service.uptime}</span>
                                            <StatusBadge status={service.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resource Usage */}
                        <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Resource Usage</h3>
                            </div>
                            <div className="p-5 space-y-6">
                                {[
                                    { label: 'CPU', value: mockSystemHealth.metrics.cpuUsage, color: 'bg-blue-500' },
                                    { label: 'Memory', value: mockSystemHealth.metrics.memoryUsage, color: 'bg-purple-500' },
                                    { label: 'Disk', value: mockSystemHealth.metrics.diskUsage, color: 'bg-green-500' },
                                ].map(resource => (
                                    <div key={resource.label}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-600">{resource.label}</span>
                                            <span className="text-xs font-black text-gray-900">{resource.value}%</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${resource.color}`}
                                                style={{ width: `${resource.value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Events */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Recent Events</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {mockSystemHealth.recentEvents.map(event => (
                                <div key={event.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        {event.type === 'warning' ? (
                                            <AlertTriangle size={16} className="text-amber-500" />
                                        ) : (
                                            <CheckCircle2 size={16} className="text-blue-500" />
                                        )}
                                        <p className="text-sm font-medium text-gray-700">{event.message}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap ml-4">{event.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
