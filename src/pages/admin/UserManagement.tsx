import { useState } from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
    type SortingState,
} from '@tanstack/react-table';
import { mockUsers, type UserAccount } from '../../lib/mockData';
import {
    User,
    Shield,
    MapPin,
    Mail,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    UserPlus,
    MoreVertical,
    X,
    Save,
    Key,
    UserCircle
} from 'lucide-react';

const columnHelper = createColumnHelper<UserAccount>();

const BARANGAYS = ['Poblacion', 'Tabao', 'Alijis', 'Bayabas', 'Crossing Magallon'];

const UserManagement = () => {
    const [data, setData] = useState(() => [...mockUsers]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
    const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

    // Form states
    const [newUser, setNewUser] = useState<Partial<UserAccount>>({
        role: 'bhw',
        status: 'Active',
    });
    const [newPassword, setNewPassword] = useState('');

    const columns = [
        columnHelper.accessor('name', {
            header: ({ column }) => (
                <button
                    className="flex items-center space-x-1 hover:text-gray-700 font-medium text-xs uppercase tracking-wider"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <span>Name</span>
                    {column.getIsSorted() === 'asc' ? <ArrowUp size={14} /> : column.getIsSorted() === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
                </button>
            ),
            cell: info => (
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                        {info.getValue().charAt(0)}
                    </div>
                    <div className="font-medium text-gray-900">{info.getValue()}</div>
                </div>
            ),
        }),
        columnHelper.accessor(row => row.email || row.username, {
            id: 'identifier',
            header: 'Email / Username',
            cell: info => {
                const user = info.row.original;
                return (
                    <div className="flex items-center text-gray-500">
                        {user.email ? <Mail size={14} className="mr-2" /> : <UserCircle size={14} className="mr-2" />}
                        {info.getValue()}
                    </div>
                );
            },
        }),
        columnHelper.accessor('role', {
            header: ({ column }) => (
                <button
                    className="flex items-center space-x-1 hover:text-gray-700 font-medium text-xs uppercase tracking-wider"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <span>Role</span>
                    {column.getIsSorted() === 'asc' ? <ArrowUp size={14} /> : column.getIsSorted() === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
                </button>
            ),
            cell: info => {
                const role = info.getValue();
                return (
                    <div className="flex items-center space-x-2">
                        <Shield size={14} className={role === 'mho_admin' ? 'text-purple-500' : 'text-blue-500'} />
                        <span className="capitalize">{role.replace('_', ' ')}</span>
                    </div>
                );
            },
        }),
        columnHelper.accessor('barangay', {
            header: ({ column }) => (
                <button
                    className="flex items-center space-x-1 hover:text-gray-700 font-medium text-xs uppercase tracking-wider"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <span>Barangay</span>
                    {column.getIsSorted() === 'asc' ? <ArrowUp size={14} /> : column.getIsSorted() === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
                </button>
            ),
            cell: info => (
                <div className="flex items-center text-gray-500">
                    <MapPin size={14} className="mr-2" />
                    {info.getValue() || <span className="text-gray-300 italic">MHO Central</span>}
                </div>
            ),
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: info => {
                const status = info.getValue();
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {status}
                    </span>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            cell: (info) => (
                <div className="relative">
                    <button
                        onClick={() => setShowActionMenu(showActionMenu === info.row.id ? null : info.row.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>
                    {showActionMenu === info.row.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                                <button
                                    onClick={() => {
                                        setSelectedUser(info.row.original);
                                        setShowPasswordModal(true);
                                        setShowActionMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    role="menuitem"
                                >
                                    <Key size={14} className="mr-2" /> Change Password
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ),
        }),
    ];

    const table = useReactTable({
        data,
        columns,
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const handleCreateAccount = () => {
        const id = `user-${data.length + 1}`;
        const user: UserAccount = {
            id,
            name: newUser.name || '',
            role: newUser.role as any,
            barangay: newUser.role === 'bhw' ? newUser.barangay : undefined,
            email: newUser.role === 'mho_admin' ? newUser.email : undefined,
            username: newUser.role === 'bhw' ? newUser.username : undefined,
            password: newUser.password,
            status: 'Active',
            lastLogin: new Date().toISOString(),
        };

        setData([...data, user]);
        setShowCreateModal(false);
        setNewUser({ role: 'bhw', status: 'Active' });
    };

    const handleChangePassword = () => {
        if (!selectedUser) return;
        setData(data.map(u => u.id === selectedUser.id ? { ...u, password: newPassword } : u));
        setShowPasswordModal(false);
        setNewPassword('');
        setSelectedUser(null);
        alert(`Password for ${selectedUser.name} has been changed successfully.`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage BHO health workers and administrative staff accounts.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={globalFilter ?? ''}
                            onChange={e => setGlobalFilter(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search users..."
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm shrink-0"
                    >
                        <UserPlus size={18} className="mr-2" />
                        Create Account
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {table.getRowModel().rows.length === 0 && (
                    <div className="text-center py-12">
                        <User className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No users found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search query.</p>
                    </div>
                )}
            </div>

            {/* Create Account Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center">
                                <UserPlus className="mr-2" />
                                Create New Account
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Role</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any, barangay: e.target.value === 'bhw' ? BARANGAYS[0] : undefined })}
                                >
                                    <option value="bhw">Barangay Health Worker (BHW)</option>
                                    <option value="mho_admin">MHO Administrator</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter full name"
                                    value={newUser.name || ''}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>

                            {newUser.role === 'mho_admin' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="admin@valladolid.gov.ph"
                                        value={newUser.email || ''}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">Email is required for password recovery for admin roles.</p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter username"
                                            value={newUser.username || ''}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Barangay</label>
                                        <select
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            value={newUser.barangay}
                                            onChange={(e) => setNewUser({ ...newUser, barangay: e.target.value })}
                                        >
                                            {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter initial password"
                                    value={newUser.password || ''}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleCreateAccount}
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md flex items-center justify-center"
                                >
                                    <Save size={18} className="mr-2" />
                                    Create Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-amber-600 p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center">
                                <Key className="mr-2" />
                                Change Password
                            </h3>
                            <button onClick={() => { setShowPasswordModal(false); setSelectedUser(null); }} className="hover:bg-amber-700 p-1 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 mb-2">
                                <p className="text-sm text-amber-800">You are changing the password for <strong>{selectedUser.name}</strong>.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="pt-4">
                                <button
                                    onClick={handleChangePassword}
                                    className="w-full py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-all shadow-md flex items-center justify-center"
                                >
                                    <Save size={18} className="mr-2" />
                                    Confirm New Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
