import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    type SortingState,
    type PaginationState,
} from '@tanstack/react-table';
import { supabase } from '../../lib/supabase';
import {
    Calendar,
    MapPin,
    ChevronRight,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
    AlertCircle
} from 'lucide-react';

interface ReferralRecord {
    id: string;
    status: string;
    referred_at: string;
    pregnancy_cycle: {
        patient: {
            first_name: string;
            last_name: string;
            age: number;
            barangay: string;
        };
    };
}

const columnHelper = createColumnHelper<ReferralRecord>();

const columns = [
    columnHelper.accessor(row => row.pregnancy_cycle?.patient, {
        id: 'patientName',
        header: ({ column }) => (
            <button
                className="flex items-center space-x-1 hover:text-gray-700 font-medium text-xs uppercase tracking-wider"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                <span>Patient Name</span>
                {column.getIsSorted() === 'asc' ? <ArrowUp size={14} /> : column.getIsSorted() === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
            </button>
        ),
        cell: info => {
            const patient = info.row.original.pregnancy_cycle?.patient;
            return (
                <Link
                    to={`/admin/patients/${info.row.original.id}`}
                    className="font-medium text-blue-600 hover:text-blue-900 transition-colors hover:underline"
                >
                    {patient ? `${patient.first_name} ${patient.last_name}` : 'N/A'}
                </Link>
            );
        },
    }),
    columnHelper.accessor(row => row.pregnancy_cycle?.patient?.age, {
        id: 'age',
        header: ({ column }) => (
            <button
                className="flex items-center space-x-1 hover:text-gray-700 font-medium text-xs uppercase tracking-wider"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                <span>Age</span>
                {column.getIsSorted() === 'asc' ? <ArrowUp size={14} /> : column.getIsSorted() === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
            </button>
        ),
        cell: info => <div className="text-gray-500">{info.getValue()} yrs</div>,
    }),
    columnHelper.accessor(row => row.pregnancy_cycle?.patient?.barangay, {
        id: 'barangay',
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
                <MapPin size={16} className="mr-1" />
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('referred_at', {
        header: ({ column }) => (
            <button
                className="flex items-center space-x-1 hover:text-gray-700 font-medium text-xs uppercase tracking-wider"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                <span>Date Referred</span>
                {column.getIsSorted() === 'asc' ? <ArrowUp size={14} /> : column.getIsSorted() === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
            </button>
        ),
        cell: info => {
            const date = new Date(info.getValue());
            return (
                <div className="flex items-center text-gray-500">
                    <Calendar size={16} className="mr-1" />
                    {date.toLocaleDateString()}
                </div>
            );
        },
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {info.getValue()}
            </span>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        cell: info => (
            <Link
                to={`/admin/patients/${info.row.original.id}`}
                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors inline-block"
            >
                <ChevronRight size={20} />
            </Link>
        ),
    }),
];

const Referrals = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<ReferralRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const fetchReferrals = useCallback(async () => {
        setLoading(true);
        try {
            const { data: referrals, error } = await supabase
                .from('referrals')
                .select(`
                    *,
                    pregnancy_cycle:pregnancy_cycles(
                        patient:patients(first_name, last_name, age, barangay)
                    )
                `)
                .eq('status', 'Pending');

            if (error) throw error;
            setData(referrals as any || []);
        } catch (err) {
            console.error('Error fetching referrals:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReferrals();
    }, [fetchReferrals]);

    const table = useReactTable({
        data,
        columns,
        state: {
            globalFilter,
            sorting,
            pagination,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pending Referrals</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Review and admit patients referred by Barangay Health Workers.
                    </p>
                </div>
                <div className="relative w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={globalFilter ?? ''}
                        onChange={e => setGlobalFilter(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search referrals..."
                    />
                </div>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                        <p className="text-gray-500 font-medium">Loading pending referrals...</p>
                    </div>
                ) : (
                    <>
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
                                    <tr
                                        key={row.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/admin/patients/${row.original.id}`)}
                                    >
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
                                <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">No referrals found</h3>
                                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <span>Show</span>
                                <select
                                    value={table.getState().pagination.pageSize}
                                    onChange={e => {
                                        table.setPageSize(Number(e.target.value));
                                    }}
                                    className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 p-1"
                                >
                                    {[5, 10, 20, 30, 40, 50].map(pageSize => (
                                        <option key={pageSize} value={pageSize}>
                                            {pageSize}
                                        </option>
                                    ))}
                                </select>
                                <span>results per page</span>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-700">
                                    Page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                                    <span className="font-medium">{table.getPageCount()}</span>
                                </span>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => table.setPageIndex(0)}
                                        disabled={!table.getCanPreviousPage()}
                                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronsLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    <button
                                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                        disabled={!table.getCanNextPage()}
                                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronsRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Referrals;
