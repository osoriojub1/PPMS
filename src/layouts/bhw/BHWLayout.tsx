import { NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Bell,
    Settings,
    LogOut
} from 'lucide-react';

import { useNotification } from '../../contexts/NotificationContext';

const Sidebar = () => {
    const { unreadCount } = useNotification();

    const navItems = [
        { path: '/bhw', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/bhw/patients', icon: <Users size={20} />, label: 'My Patients' },
        { path: '/bhw/referrals', icon: <ClipboardList size={20} />, label: 'Referrals' },
        {
            path: '/bhw/notifications',
            icon: (
                <div className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            ),
            label: 'Notifications'
        },
        { path: '/bhw/settings', icon: <Settings size={20} />, label: 'Settings' },
    ];

    return (
        <div className="w-64 bg-white border-r h-screen flex flex-col shadow-sm">
            <div className="p-6 border-b flex items-center space-x-3">
                <img src="/logo.png" alt="Valladolid Logo" className="h-10 w-10 object-contain shadow-sm rounded-lg" />
                <div>
                    <h2 className="text-base font-black tracking-tighter text-green-600 leading-tight">Valladolid MHO</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">BHW Portal</p>
                </div>
            </div>

            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/bhw'}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-green-50 text-green-700 font-medium'
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
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
                >
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};

const BHWLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default BHWLayout;
