import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, Loader2, CheckCircle2, X } from 'lucide-react';
import { VALLADOLID_BARANGAYS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

const AddPatient = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [form, setForm] = useState({
        first_name: '',
        mi: '',
        last_name: '',
        date_of_birth: '',
        age: '',
        contact_no: '',
        purok: '',
        barangay: VALLADOLID_BARANGAYS[0],
    });

    const handleChange = (field: string, value: string) => {
        setForm(prev => {
            const newForm = { ...prev, [field]: value };

            // Auto-calculate age if DOB changes
            if (field === 'date_of_birth' && value) {
                const birthDate = new Date(value);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                newForm.age = age.toString();
            }

            return newForm;
        });
    };

    useEffect(() => {
        const fetchUserBarangay = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const userBarangay = user?.user_metadata?.barangay;
            if (userBarangay) {
                setForm(prev => ({ ...prev, barangay: userBarangay }));
            }
        };
        fetchUserBarangay();
    }, []);

    const handleSave = async () => {
        if (!form.first_name.trim() || !form.last_name.trim() || !form.age) {
            alert('Please fill in First Name, Last Name, and Age.');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.from('patients').insert({
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                mi: form.mi.trim() || null,
                date_of_birth: form.date_of_birth || null,
                age: parseInt(form.age),
                contact_no: form.contact_no.trim() || null,
                purok: form.purok.trim() || null,
                barangay: form.barangay,
            }).select().single();

            if (error) throw error;

            setToast('Patient registered successfully!');
            setTimeout(() => {
                navigate('/bhw/patients');
            }, 1500);
        } catch (err: any) {
            console.error('Error saving patient:', err);
            alert(`Failed to save: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-12">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-3">
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-bold">{toast}</span>
                        <button onClick={() => setToast(null)} className="ml-2 hover:bg-green-700 p-1 rounded-full transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

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
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={form.first_name}
                                onChange={e => handleChange('first_name', e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Initial</label>
                            <input
                                type="text"
                                value={form.mi}
                                onChange={e => handleChange('mi', e.target.value)}
                                maxLength={2}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={form.last_name}
                                onChange={e => handleChange('last_name', e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={form.date_of_birth}
                                onChange={e => handleChange('date_of_birth', e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Age (Auto-populated)</label>
                            <input
                                type="number"
                                readOnly
                                value={form.age}
                                className="w-full rounded-lg border-gray-300 shadow-sm bg-gray-50 border p-2 text-gray-500 cursor-not-allowed"
                                placeholder="Age will calculate from DOB"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                            <input
                                type="tel"
                                value={form.contact_no}
                                onChange={e => handleChange('contact_no', e.target.value)}
                                placeholder="+63"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purok</label>
                            <input
                                type="text"
                                value={form.purok}
                                onChange={e => handleChange('purok', e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                            <select
                                value={form.barangay}
                                disabled
                                className="w-full rounded-lg border-gray-300 shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed border p-2"
                            >
                                <option value={form.barangay}>{form.barangay}</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-green-600 text-white px-12 py-3 rounded-lg font-bold hover:bg-green-700 transition-all flex items-center shadow-lg transform hover:-translate-y-0.5 disabled:bg-gray-300 disabled:transform-none"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={20} className="mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={20} className="mr-2" />
                                    Save
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPatient;
