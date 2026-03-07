import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import TimelineView from '../../components/TimelineView';
import { ArrowLeft, User, MapPin, Calendar, Clock, Send, Save, X, CheckCircle2, MessageSquare, Plus, Loader2, Beaker } from 'lucide-react';
import { VALLADOLID_BARANGAYS } from '../../lib/constants';

const BHWPatientRecord = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('demographics');
    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

    const [milestones, setMilestones] = useState<any[]>([]);
    const [labs, setLabs] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);

    // Note Modal State
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showViewResultsModal, setShowViewResultsModal] = useState(false);
    const [selectedLabForResult, setSelectedLabForResult] = useState<any>(null);
    const [editingMilestone, setEditingMilestone] = useState<any>(null);
    const [tempNote, setTempNote] = useState('');
    const [tempNoteTitle, setTempNoteTitle] = useState('');
    const [modalMode, setModalMode] = useState<'view' | 'add'>('view');
    const [saveToast, setSaveToast] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Fetch patient details
            const { data: patient, error: pError } = await supabase
                .from('patients')
                .select('*, pregnancy_cycles(*)')
                .eq('id', id)
                .single();

            if (pError) throw pError;
            setRecord(patient);
            setEditForm({
                first_name: patient.first_name,
                mi: patient.mi || '',
                last_name: patient.last_name,
                date_of_birth: patient.date_of_birth || '',
                age: patient.age,
                purok: patient.purok || '',
                contact_no: patient.contact_no || '',
                barangay: patient.barangay
            });

            if (patient.pregnancy_cycles && patient.pregnancy_cycles.length > 0) {
                const activeCycle = patient.pregnancy_cycles.find((c: any) => c.status === 'Active' || c.status === 'active') || patient.pregnancy_cycles[0];
                setSelectedCycleId(activeCycle.id);
            }
        } catch (err) {
            console.error('Error fetching patient record:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchCycleDetails = useCallback(async (cycleId: string) => {
        try {
            const [
                { data: milestonesData },
                { data: labsData },
                { data: notesData }
            ] = await Promise.all([
                supabase.from('milestones').select('*').eq('cycle_id', cycleId).order('order_index', { ascending: true }),
                supabase.from('laboratories').select('*').eq('cycle_id', cycleId).order('scheduled_date', { ascending: true }),
                supabase.from('notes').select('*, profiles(full_name)').eq('cycle_id', cycleId).order('created_at', { ascending: true })
            ]);

            setMilestones(milestonesData || []);
            setLabs(labsData || []);
            setNotes(notesData || []);
        } catch (err) {
            console.error('Error fetching cycle details:', err);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (selectedCycleId) {
            fetchCycleDetails(selectedCycleId);
        }
    }, [selectedCycleId, fetchCycleDetails]);

    const handleOpenNoteModal = (milestone: any, mode: 'view' | 'add' = 'view') => {
        setEditingMilestone(milestone);
        setTempNote('');
        setTempNoteTitle('');
        setModalMode(mode);
        setShowNoteModal(true);
    };

    const handleOpenViewResults = (lab: any) => {
        setSelectedLabForResult(lab);
        setShowViewResultsModal(true);
    };

    const handleSaveMilestoneNote = async () => {
        if (!tempNote.trim() || !editingMilestone || !selectedCycleId) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            let authorName = 'BHW Staff';
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
                if (profile?.full_name) authorName = profile.full_name;
            }

            // 1. Add note to notes table
            const { error: noteError } = await supabase.from('notes').insert({
                cycle_id: selectedCycleId,
                milestone_id: editingMilestone.id,
                author_id: user?.id,
                content: tempNote,
                type: 'subjective',
                title: tempNoteTitle.trim() || `BHW Note - ${editingMilestone.title}`,
                physician_name: authorName,
                patient_id: id
            });

            if (noteError) throw noteError;

            // 2. Mark milestone as completed
            const { error: mError } = await supabase.from('milestones').update({
                status: 'completed'
            }).eq('id', editingMilestone.id);

            if (mError) throw mError;

            // 3. Mark next milestone as current if applicable
            const nextMilestone = milestones.find(m => m.order_index === editingMilestone.order_index + 1);
            if (nextMilestone && nextMilestone.status === 'upcoming') {
                await supabase.from('milestones').update({
                    status: 'current'
                }).eq('id', nextMilestone.id);
            }

            setSaveToast("Clinical note has been successfully saved to the timeline.");
            setShowNoteModal(false);
            fetchCycleDetails(selectedCycleId);

            // Auto-close toast after 3 seconds
            setTimeout(() => setSaveToast(null), 3000);
        } catch (err) {
            console.error('Error saving milestone note:', err);
            alert('Failed to save note. Please try again.');
        }
    };

    const handleSaveDetails = async () => {
        if (!editForm || !id) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('patients')
                .update({
                    first_name: editForm.first_name,
                    mi: editForm.mi || null,
                    last_name: editForm.last_name,
                    date_of_birth: editForm.date_of_birth || null,
                    age: parseInt(editForm.age),
                    purok: editForm.purok || null,
                    contact_no: editForm.contact_no || null,
                    barangay: editForm.barangay
                })
                .eq('id', id);

            if (error) throw error;

            setRecord((prev: any) => ({ ...prev, ...editForm }));
            setIsEditing(false);
            setSaveToast("Patient demographics updated successfully.");
            setTimeout(() => setSaveToast(null), 3000);
        } catch (err) {
            console.error('Error saving patient details:', err);
            alert('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditChange = (field: string, value: string) => {
        setEditForm((prev: any) => {
            const newForm = { ...prev, [field]: value };
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
                <p className="text-gray-500 font-medium">Loading patient record...</p>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-900">Patient record not found</h2>
                <button
                    onClick={() => navigate('/bhw/patients')}
                    className="mt-4 text-green-600 hover:underline"
                >
                    Back to My Patients
                </button>
            </div>
        );
    }

    const currentCycle = record.pregnancy_cycles?.find((c: any) => c.id === selectedCycleId);

    return (
        <div className="max-w-5xl mx-auto pb-24">
            {/* Non-blocking Toast Notification */}
            {saveToast && (
                <div className="fixed top-4 right-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-3">
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-bold">{saveToast}</span>
                        <button onClick={() => setSaveToast(null)} className="ml-2 hover:bg-green-700 p-1 rounded-full transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}
            {/* Header View */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back
                </button>
                <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        BHW Case Record
                    </span>
                </div>
            </div>

            {/* Main Document Paper-Style Container */}
            <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden min-h-[800px]">

                {/* Document Header */}
                <div className="bg-green-50 border-b border-gray-200 p-8 flex items-start justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center border-4 border-green-100 shadow-sm">
                            <User size={40} className="text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{record.first_name} {record.last_name}</h1>
                            <div className="mt-2 flex items-center text-gray-600 space-x-4">
                                <span className="flex items-center"><MapPin size={16} className="mr-1" /> {record.barangay}</span>
                                <span className="flex items-center"><Calendar size={16} className="mr-1" /> {record.age} years old</span>
                                <span className="flex items-center"><Clock size={16} className="mr-1" /> EDD: {currentCycle?.estimated_due_date || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Record ID</p>
                        <p className="text-lg font-mono text-gray-900 mt-1">{record.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-gray-200 px-8 flex space-x-8">
                    <button
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'demographics' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('demographics')}
                    >
                        Demographics
                    </button>
                    <button
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'timeline' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('timeline')}
                    >
                        Pregnancy Timeline
                    </button>
                    <button
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'labs' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('labs')}
                    >
                        Laboratory Requests
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-8">

                    {activeTab === 'demographics' && (
                        <div className="relative">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Patient Demographics</h3>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        Edit Patient Details
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="text-sm font-bold text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={isEditing ? editForm.first_name : record.first_name}
                                            onChange={e => handleEditChange('first_name', e.target.value)}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Middle Initial</label>
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={isEditing ? editForm.mi : (record.mi || "")}
                                            onChange={e => handleEditChange('mi', e.target.value)}
                                            maxLength={2}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                        <input
                                            type="date"
                                            readOnly={!isEditing}
                                            value={isEditing ? editForm.date_of_birth : (record.date_of_birth || "")}
                                            onChange={e => handleEditChange('date_of_birth', e.target.value)}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Purok</label>
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={isEditing ? editForm.purok : (record.purok || "")}
                                            onChange={e => handleEditChange('purok', e.target.value)}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={isEditing ? editForm.last_name : record.last_name}
                                            onChange={e => handleEditChange('last_name', e.target.value)}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Age</label>
                                        <input
                                            type="number"
                                            readOnly
                                            value={isEditing ? editForm.age : record.age}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 border p-2 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                        <input
                                            type="text"
                                            readOnly={!isEditing}
                                            value={isEditing ? editForm.contact_no : (record.contact_no || "")}
                                            onChange={e => handleEditChange('contact_no', e.target.value)}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Barangay</label>
                                        <select
                                            disabled={!isEditing}
                                            value={isEditing ? editForm.barangay : record.barangay}
                                            onChange={e => handleEditChange('barangay', e.target.value)}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                                        >
                                            {VALLADOLID_BARANGAYS.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="space-y-6">
                            {record.pregnancy_cycles && record.pregnancy_cycles.length > 0 && (
                                <div className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <span className="text-sm font-medium text-gray-700">Select Pregnancy Cycle:</span>
                                    <div className="flex space-x-2">
                                        {record.pregnancy_cycles.map((cycle: any) => (
                                            <button
                                                key={cycle.id}
                                                onClick={() => setSelectedCycleId(cycle.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${selectedCycleId === cycle.id
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'
                                                    }`}
                                            >
                                                {cycle.status === 'Active' || cycle.status === 'active' ? 'Current Pregnancy' : `History (${new Date(cycle.completed_at).getFullYear()})`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <TimelineView
                                isPending={false}
                                milestones={milestones.map(m => {
                                    const mNotes = notes.filter(n =>
                                        n.milestone_id === m.id ||
                                        (!n.milestone_id && n.title?.includes(m.title))
                                    );
                                    const subjectiveNotes = mNotes.filter(n => n.type === 'subjective').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                                    const objectiveNotes = mNotes.filter(n => n.type === 'objective').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                                    const subjectiveNote = subjectiveNotes[0];
                                    const objectiveNote = objectiveNotes[0];

                                    const progressLogs = mNotes.filter(n => n !== subjectiveNote && n !== objectiveNote)
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                                    return {
                                        ...m,
                                        notes: {
                                            subjective: subjectiveNote ? {
                                                content: subjectiveNote.content,
                                                date: subjectiveNote.created_at,
                                                authorName: subjectiveNote.profiles?.full_name || subjectiveNote.physician_name || 'BHW'
                                            } : undefined,
                                            objective: objectiveNote ? {
                                                content: objectiveNote.content,
                                                date: objectiveNote.created_at,
                                                authorName: objectiveNote.profiles?.full_name || objectiveNote.physician_name || 'BHW'
                                            } : undefined,
                                            physicianLogs: progressLogs.map(n => ({
                                                id: n.id,
                                                date: n.created_at,
                                                content: n.content,
                                                physicianName: n.physician_name || n.profiles?.full_name || 'Medical Staff'
                                            }))
                                        }
                                    };
                                })}
                                isAdmin={true}
                                onMilestoneClick={handleOpenNoteModal}
                            />
                        </div>
                    )}

                    {activeTab === 'labs' && (
                        <div className="space-y-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                                <Clock size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-800">View-Only Mode</h4>
                                    <p className="text-xs text-yellow-700 mt-1">Laboratory results and requests are managed by the MHO. BHW access is limited to viewing reported results for patient follow-up.</p>
                                </div>
                            </div>

                            {labs.length > 0 ? (
                                <div className="divide-y divide-gray-200 border rounded-lg">
                                    {labs.map((lab) => (
                                        <div key={lab.id} className="p-4 flex justify-between items-center">
                                            <div className="flex flex-col items-start">
                                                <p className="font-bold text-gray-900">{lab.test_name || 'Laboratory Test'}</p>
                                                <p className="text-xs text-gray-500">Scheduled: {new Date(lab.scheduled_date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${lab.status === 'Submitted' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                    {lab.status === 'Submitted' ? 'Completed' : lab.status}
                                                </span>
                                                {lab.status === 'Submitted' && (
                                                    <button
                                                        onClick={() => handleOpenViewResults(lab)}
                                                        className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-xs font-bold hover:bg-blue-100 transition-colors"
                                                    >
                                                        View Details
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center border shadow-sm mb-4">
                                        <Calendar size={28} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No Laboratory Results Found</h3>
                                    <p className="mt-1 text-sm text-gray-500 max-w-xs">Results will be displayed here once uploaded by the MHO laboratory staff.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg flex justify-end space-x-4 z-40">
                <button
                    onClick={() => navigate('/bhw/patients')}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                    Back to List
                </button>
                <button
                    onClick={handleSaveDetails}
                    disabled={!isEditing || isSaving}
                    className={`px-6 py-2.5 rounded-lg font-medium flex items-center shadow-sm transition-all ${!isEditing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={20} className="mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={20} className="mr-2" />
                            Save Record Changes
                        </>
                    )}
                </button>
                <button
                    onClick={() => navigate(`/bhw/patients/${id}/refer`)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                >
                    <Send size={20} className="mr-2" />
                    Refer to MHO
                </button>
            </div>

            {/* Note Entry/View Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-green-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">
                                    {modalMode === 'view' ? 'Clinical Timeline Logs' : 'Add Visit Note'}
                                </h3>
                                <p className="text-green-100 text-sm">{editingMilestone?.title}</p>
                            </div>
                            <button onClick={() => setShowNoteModal(false)} className="hover:bg-green-700 p-1 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {modalMode === 'view' ? (
                                <div className="space-y-6">
                                    {/* BHW/Physician combined logs list */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                            <MessageSquare size={14} className="mr-2" />
                                            Unified Care Progress
                                        </h4>

                                        {/* BHW Context if exists */}
                                        {(editingMilestone?.notes?.subjective || editingMilestone?.notes?.objective) && (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 mb-6">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">BHW Referral Context</p>

                                                {editingMilestone.notes.subjective && (
                                                    <div>
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Subjective</span>
                                                            <span className="text-[9px] text-gray-400 font-mono">{new Date(editingMilestone.notes.subjective.date).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 italic">"{editingMilestone.notes.subjective.content}"</p>
                                                    </div>
                                                )}

                                                {editingMilestone.notes.objective && (
                                                    <div>
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Objective</span>
                                                            <span className="text-[9px] text-gray-400 font-mono">{new Date(editingMilestone.notes.objective.date).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-900 font-medium">{editingMilestone.notes.objective.content}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {(editingMilestone?.notes?.physicianLogs && editingMilestone.notes.physicianLogs.length > 0) ? (
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Medical Staff Notes</h4>
                                                {editingMilestone.notes.physicianLogs.map((log: any) => (
                                                    <div key={log.id} className="p-4 bg-green-50/30 rounded-lg border border-green-100">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-[10px] font-bold text-green-700">{log.physicianName}</span>
                                                            <span className="text-[10px] text-gray-400 font-mono">{new Date(log.date).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-green-900 leading-relaxed">{log.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            (!editingMilestone?.notes?.subjective && !editingMilestone?.notes?.objective) && (
                                                <div className="text-center py-12">
                                                    <MessageSquare size={48} className="mx-auto text-gray-100 mb-2" />
                                                    <p className="text-sm text-gray-400 italic">No notes recorded for this milestone.</p>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => setModalMode('add')}
                                            className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all flex items-center justify-center shadow-md"
                                        >
                                            <Plus size={18} className="mr-2" />
                                            Add New Visit Entry
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Note Title</label>
                                        <input
                                            type="text"
                                            value={tempNoteTitle}
                                            onChange={(e) => setTempNoteTitle(e.target.value)}
                                            placeholder="e.g. Home Visit Follow-up, Patient Complaint..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm font-medium text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Clinical Observations / Action Taken</label>
                                        <textarea
                                            rows={6}
                                            value={tempNote}
                                            onChange={(e) => setTempNote(e.target.value)}
                                            placeholder="Enter visit details, patient observations, or services provided during this contact..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none shadow-sm"
                                        />
                                        <p className="mt-2 text-[10px] text-gray-400 font-medium">This note will be saved with a timestamp and linked to your BHW account for the MHO to review.</p>
                                    </div>
                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            onClick={() => setModalMode('view')}
                                            className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-all"
                                        >
                                            Back to Logs
                                        </button>
                                        <button
                                            onClick={handleSaveMilestoneNote}
                                            disabled={!tempNote.trim()}
                                            className={`flex-1 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center ${!tempNote.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                                                }`}
                                        >
                                            <Save size={18} className="mr-2" />
                                            Save Entry
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* View Lab Results Modal */}
            {showViewResultsModal && selectedLabForResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold flex items-center">
                                    <Beaker className="mr-2" size={20} />
                                    Laboratory Result
                                </h3>
                                <p className="text-blue-100 text-xs font-medium uppercase tracking-widest mt-1">{selectedLabForResult.test_name}</p>
                            </div>
                            <button onClick={() => setShowViewResultsModal(false)} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Test Name</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedLabForResult.test_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date Reported</p>
                                    <p className="text-sm font-bold text-gray-900">{new Date(selectedLabForResult.scheduled_date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Report Findings</p>
                                <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                                    <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                                        {selectedLabForResult.result_text || "No detailed findings available for this report."}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => setShowViewResultsModal(false)}
                                    className="px-8 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-all shadow-md"
                                >
                                    Close Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BHWPatientRecord;
