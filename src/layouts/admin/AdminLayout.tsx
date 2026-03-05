import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Bell,
    Settings,
    LogOut,
    Shield
} from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/admin/referrals', icon: <ClipboardList size={20} />, label: 'Referrals' },
        { path: '/admin/patients', icon: <Users size={20} />, label: 'Patients' },
        { path: '/admin/users', icon: <Shield size={20} />, label: 'User Management' },
        { path: '/admin/notifications', icon: <Bell size={20} />, label: 'Notifications' },
        { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
    ];

    return (
        <div className="sidebar-container w-64 bg-white border-r h-screen flex flex-col shadow-sm">
            <div className="p-6 border-b flex items-center space-x-3">
                <img src="/logo.png" alt="Valladolid Logo" className="h-10 w-10 object-contain shadow-sm rounded-lg" />
                <div>
                    <h2 className="text-base font-black tracking-tighter text-blue-600 leading-tight">Valladolid MHO</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Portal</p>
                </div>
            </div>

            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>

            <div className="p-4 border-t">
                <button className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full">
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};

const AdminLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <main className="main-content flex-1 overflow-y-auto w-full">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
