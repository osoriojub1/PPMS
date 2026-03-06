import { useState, useEffect } from 'react';
import { Users, ClipboardList, AlertCircle, TrendingUp, Activity, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const StatCard = ({ title, value, icon, change, changeType, loading }: any) => (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                {loading ? (
                    <div className="h-8 w-16 bg-gray-100 animate-pulse rounded"></div>
                ) : (
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                )}
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
    const [stats, setStats] = useState({
        activePatients: 0,
        pendingReferrals: 0,
        pastDueLabs: 0,
        completedCycles: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [
                    { count: activePatientsCount },
                    { count: pendingReferralsCount },
                    { count: pastDueLabsCount },
                    { count: completedCyclesCount },
                    { data: activities }
                ] = await Promise.all([
                    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_admitted', true),
                    supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
                    supabase.from('laboratories').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
                    supabase.from('pregnancy_cycles').select('*', { count: 'exact', head: true }).eq('status', 'Completed'),
                    supabase.from('notes')
                        .select('*, patient:patients(first_name, last_name)')
                        .order('created_at', { ascending: false })
                        .limit(5)
                ]);

                setStats({
                    activePatients: activePatientsCount || 0,
                    pendingReferrals: pendingReferralsCount || 0,
                    pastDueLabs: pastDueLabsCount || 0,
                    completedCycles: completedCyclesCount || 0
                });
                setRecentActivity(activities || []);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
                    value={stats.activePatients}
                    icon={<Users size={24} />}
                    change="+0%"
                    changeType="neutral"
                    loading={loading}
                />
                <StatCard
                    title="Pending Referrals"
                    value={stats.pendingReferrals}
                    icon={<ClipboardList size={24} />}
                    change="+0"
                    changeType="neutral"
                    loading={loading}
                />
                <StatCard
                    title="Labs Pending"
                    value={stats.pastDueLabs}
                    icon={<AlertCircle size={24} />}
                    change="+0"
                    changeType="neutral"
                    loading={loading}
                />
                <StatCard
                    title="Completed Cycles"
                    value={stats.completedCycles}
                    icon={<Activity size={24} />}
                    change="+0"
                    changeType="neutral"
                    loading={loading}
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
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                            </div>
                        ) : recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <div key={activity.id} className="flex gap-4">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {activity.title || 'Note added'} for {activity.patient ? `${activity.patient.first_name} ${activity.patient.last_name}` : 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(activity.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
