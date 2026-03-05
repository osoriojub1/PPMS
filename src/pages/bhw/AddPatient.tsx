import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save } from 'lucide-react';

const AddPatient = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Dashboard
            </button>

            <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-green-50 border-b border-gray-200 p-6 flex items-center space-x-4">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border-2 border-green-100">
                        <User size={24} className="text-green-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Add New Patient Entry</h1>
                        <p className="text-sm text-gray-500">Enter basic demographic information to start a new record.</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input type="text" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Initial</label>
                            <input type="text" maxLength={2} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input type="text" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                            <input type="number" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                            <input type="tel" placeholder="+63" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purok</label>
                            <input type="text" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                            <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2">
                                <option>Poblacion</option>
                                <option>Tabao</option>
                                <option>Alijis</option>
                                <option>Bayabas</option>
                                <option>Crossing Magallon</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t flex justify-end">
                        <button className="bg-green-600 text-white px-12 py-3 rounded-lg font-bold hover:bg-green-700 transition-all flex items-center shadow-lg transform hover:-translate-y-0.5">
                            <Save size={20} className="mr-2" />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPatient;
