import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
    type SortingState,
} from '@tanstack/react-table';
import { mockPatients } from '../../lib/mockData';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, UserPlus, Send } from 'lucide-react';

type Patient = typeof mockPatients[0];
const columnHelper = createColumnHelper<Patient>();

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
        cell: info => (
            <Link
                to={`/bhw/patients/${info.row.original.id}`}
                className="font-medium text-green-600 hover:text-green-900 transition-colors hover:underline"
            >
                {info.getValue()}
            </Link>
        ),
    }),
    columnHelper.accessor('age', {
        header: 'Age',
        cell: info => <div className="text-gray-500">{info.getValue()} yrs</div>,
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.getValue() === 'Active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
                }`}>
                {info.getValue()}
            </span>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        cell: info => (
            <div className="flex space-x-2">
                <Link
                    to={`/bhw/patients/${info.row.original.id}/refer`}
                    className="bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1 rounded-md font-medium text-sm transition-colors border border-green-100 flex items-center"
                >
                    <Send size={14} className="mr-1.5" />
                    Refer patient
                </Link>
            </div>
        ),
    }),
];

const BHWPatients = () => {
    const [data] = useState(() => [...mockPatients]);
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
                    <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Patients registered in your assigned barangay.
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
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Search my patients..."
                        />
                    </div>
                    <Link
                        to="/bhw/add-patient"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
                    >
                        <UserPlus size={18} className="mr-2" />
                        Add New Patient
                    </Link>
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

export default BHWPatients;
