import { Users, UserPlus, ClipboardList } from 'lucide-react';

const BHWDashboard = () => {
    const stats = [
        { title: 'My Patients', value: '12', icon: <Users size={24} />, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'New Referrals', value: '3', icon: <UserPlus size={24} />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Pending Labs', value: '5', icon: <ClipboardList size={24} />, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">BHW Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Welcome! Managing your assigned patients in the barangay.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-xl border p-6 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointments</h3>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 italic">No appointments scheduled for today.</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notes</h3>
                    <div className="space-y-4 text-sm text-gray-600">
                        <p>No recent activity documented.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BHWDashboard;
