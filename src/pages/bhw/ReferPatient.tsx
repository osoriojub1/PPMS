import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Send, FileText, ClipboardList, Loader2, CheckCircle2, X } from 'lucide-react';

const ReferPatient = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [subjective, setSubjective] = useState('');
    const [objective, setObjective] = useState('');
    const [toast, setToast] = useState<string | null>(null);

    const fetchPatient = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*, pregnancy_cycles(id, status, estimated_due_date)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setRecord(data);
        } catch (err) {
            console.error('Error fetching patient:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPatient();
    }, [fetchPatient]);

    const handleRefer = async () => {
        if (!subjective || !objective || !record) return;

        setSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Find active cycle or create one
            const activeCycle = record.pregnancy_cycles?.find((c: any) => c.status === 'Active' || c.status === 'active');

            let cycleId = activeCycle?.id;

            if (!cycleId) {
                // Create a new pregnancy cycle
                const { data: newCycle, error: cycleError } = await supabase
                    .from('pregnancy_cycles')
                    .insert({
                        patient_id: record.id,
                        status: 'Active'
                    })
                    .select()
                    .single();

                if (cycleError) throw cycleError;
                cycleId = newCycle.id;
            }

            // Create referral
            const { error: referralError } = await supabase.from('referrals').insert({
                cycle_id: cycleId,
                patient_id: record.id,
                status: 'Pending',
                referred_by_user_id: user?.id,
                referred_at: new Date().toISOString(),
                subjective,
                objective
            });

            if (referralError) throw referralError;

            // Create notification for MHO Admin
            await supabase.from('notifications').insert({
                patient_id: record.id,
                type: 'referral',
                title: 'New Patient Referral',
                content: `${record.first_name} ${record.last_name} has been referred from ${record.barangay}.`,
                barangay_target: record.barangay // Admin can filter by this
            });

            setToast('Referral sent to MHO successfully!');
            setTimeout(() => {
                navigate('/bhw/referrals');
            }, 1500);
        } catch (err: any) {
            console.error('Error sending referral:', err);
            alert(`Failed to send referral: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                <p className="text-gray-500 font-medium">Loading patient details...</p>
            </div>
        );
    }

    if (!record) {
        return <div className="p-8 text-center text-gray-500">Patient not found</div>;
    }

    const activeCycle = record.pregnancy_cycles?.find((c: any) => c.status === 'Active' || c.status === 'active');
    const patientName = `${record.first_name} ${record.mi ? record.mi + ' ' : ''}${record.last_name}`;

    return (
        <div className="max-w-4xl mx-auto pb-12">
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
                Back
            </button>

            <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 border-b border-gray-200 p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border-2 border-blue-100 text-blue-500">
                            <Send size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Refer Patient to MHO</h1>
                            <p className="text-sm text-gray-500">Initiate handoff to the Municipal Health Office.</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Patient Summary Card */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center space-x-4">
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border text-gray-400">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{patientName}</p>
                            <p className="text-xs text-gray-500">{record.barangay} • Age: {record.age} • EDD: {activeCycle?.estimated_due_date || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                                <FileText size={18} className="mr-2 text-blue-500" />
                                Subjective Findings
                            </label>
                            <textarea
                                value={subjective}
                                onChange={(e) => setSubjective(e.target.value)}
                                placeholder="E.g., Patient reports headache, abdominal pain, fetal movements..."
                                className="w-full h-32 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-4 text-sm"
                            />
                            <p className="mt-1 text-[10px] text-gray-400">Describe the patient's complaints and history for this visit.</p>
                        </div>

                        <div>
                            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                                <ClipboardList size={18} className="mr-2 text-blue-500" />
                                Objective Findings
                            </label>
                            <textarea
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                placeholder="E.g., BP: 140/90, FHT: 150bpm, Fundic Height: 24cm..."
                                className="w-full h-32 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-4 text-sm"
                            />
                            <p className="mt-1 text-[10px] text-gray-400">Record physical examination data and vital signs.</p>
                        </div>
                    </div>

                    <div className="pt-8 border-t flex justify-end">
                        <button
                            onClick={handleRefer}
                            disabled={!subjective || !objective || sending}
                            className="bg-blue-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center shadow-lg transform hover:-translate-y-0.5 disabled:bg-gray-300 disabled:transform-none disabled:shadow-none"
                        >
                            {sending ? (
                                <>
                                    <Loader2 size={20} className="mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send size={20} className="mr-2" />
                                    Send Referral to MHO
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferPatient;
