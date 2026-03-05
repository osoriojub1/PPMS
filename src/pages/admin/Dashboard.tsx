import { Users, ClipboardList, AlertCircle, TrendingUp, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon, change, changeType }: any) => (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${changeType === 'increase' ? 'bg-green-50 text-green-600' :
                changeType === 'decrease' ? 'bg-red-50 text-red-600' :
                    'bg-blue-50 text-blue-600'
                }`}>
                {icon}
            </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
            <TrendingUp size={16} className={`mr-1 ${changeType === 'increase' ? 'text-green-500' :
                changeType === 'decrease' ? 'text-red-500' :
                    'text-gray-400'
                }`} />
            <span className={
                changeType === 'increase' ? 'text-green-600 font-medium' :
                    changeType === 'decrease' ? 'text-red-600 font-medium' :
                        'text-gray-500'
            }>
                {change}
            </span>
            <span className="text-gray-500 ml-2">vs last month</span>
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Welcome back. Here's what's happening today.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Patients"
                    value="124"
                    icon={<Users size={24} />}
                    change="+12%"
                    changeType="increase"
                />
                <StatCard
                    title="Pending Referrals"
                    value="8"
                    icon={<ClipboardList size={24} />}
                    change="-2"
                    changeType="decrease"
                />
                <StatCard
                    title="Labs Past Due"
                    value="3"
                    icon={<AlertCircle size={24} />}
                    change="+1"
                    changeType="increase"
                />
                <StatCard
                    title="Completed Cycles"
                    value="2"
                    icon={<Activity size={24} />}
                    change="+2"
                    changeType="neutral"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Demographics</h3>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-gray-500">Chart Placeholder</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">New Referral Received</p>
                                    <p className="text-xs text-gray-500">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
