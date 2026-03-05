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
import { mockReferrals } from '../../lib/mockData';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Calendar } from 'lucide-react';

type Referral = typeof mockReferrals[0];
const columnHelper = createColumnHelper<Referral>();

const columns = [
    columnHelper.accessor('patientName', {
        header: ({ column }) => (
            <button
                className="flex items-center space-x-1 hover:text-gray-700 font-medium text-xs uppercase tracking-wider"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                <span>Patient Name</span>
                {column.getIsSorted() === 'asc' ? <ArrowUp size={14} /> : column.getIsSorted() === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
            </button>
        ),
        cell: info => <div className="font-medium text-gray-900">{info.getValue()}</div>,
    }),
    columnHelper.accessor('age', {
        header: 'Age',
        cell: info => <div className="text-gray-500">{info.getValue()} yrs</div>,
    }),
    columnHelper.accessor('referredDate', {
        header: 'Date Referred',
        cell: info => {
            const date = new Date(info.getValue() as string);
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
        cell: info => {
            const status = info.getValue();
            return (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                    }`}>
                    {status}
                </span>
            );
        }
    }),
];

const BHWReferrals = () => {
    const [data] = useState(() => [...mockReferrals]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Referrals</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Patients referred to the Municipal Health Office for admission.
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
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Search referrals..."
                    />
                </div>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
            </div>
        </div>
    );
};

export default BHWReferrals;
