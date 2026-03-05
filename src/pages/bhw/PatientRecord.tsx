import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockPatients, mockReferrals, type PregnancyCycle } from '../../lib/mockData';
import TimelineView from '../../components/TimelineView';
import { ArrowLeft, User, MapPin, Calendar, Clock, Send, Save, X, CheckCircle2, MessageSquare, Plus } from 'lucide-react';

const BHWPatientRecord = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('demographics');

    // Portfolio state for real-time updates as we don't have a backend yet
    const [record, setRecord] = useState<any>(() =>
        (mockPatients.find(p => p.id === id) || mockReferrals.find(r => r.id === id))
    );

    const [selectedCycleId, setSelectedCycleId] = useState(record?.cycles?.[0]?.id || 'current');

    // Note Modal State
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<any>(null);
    const [tempNote, setTempNote] = useState('');
    const [modalMode, setModalMode] = useState<'view' | 'add'>('view');
    const [saveToast, setSaveToast] = useState<string | null>(null);

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

    const currentCycle = record?.cycles?.find((c: PregnancyCycle) => c.id === selectedCycleId) || (record?.cycles?.[0]);

    const handleOpenNoteModal = (milestone: any, mode: 'view' | 'add' = 'view') => {
        setEditingMilestone(milestone);
        setTempNote('');
        setModalMode(mode);
        setShowNoteModal(true);
    };

    const handleSaveMilestoneNote = () => {
        if (!tempNote.trim()) return;

        const newLog = {
            id: `log-bhw-${Date.now()}`,
            date: new Date().toISOString(),
            content: tempNote,
            physicianName: 'BHW User' // In a real app, this would be the logged-in user name
        };

        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const updatedCycles = record.cycles.map((cycle: any) => {
            if (cycle.id === selectedCycleId) {
                return {
                    ...cycle,
                    milestones: cycle.milestones.map((m: any) => {
                        if (m.id === editingMilestone.id) {
                            return {
                                ...m,
                                notes: {
                                    ...m.notes,
                                    physicianLogs: [...(m.notes?.physicianLogs || []), newLog]
                                },
                                status: 'completed',
                                date: today
                            };
                        }

                        // Cascading logic (mirrored from Admin)
                        if (m.id < editingMilestone.id && m.status !== 'completed') {
                            return { ...m, status: 'completed' };
                        }
                        if (m.id === editingMilestone.id + 1 && m.status === 'upcoming') {
                            return { ...m, status: 'current' };
                        }
                        return m;
                    })
                };
            }
            return cycle;
        });

        setRecord({ ...record, cycles: updatedCycles });
        setSaveToast("Clinical note has been successfully saved to the timeline.");
        setModalMode('view');
        setTempNote('');

        // Update local editing milestone to show new log immediately
        const updatedMilestone = updatedCycles.find((c: any) => c.id === selectedCycleId)
            ?.milestones.find((m: any) => m.id === editingMilestone.id);
        setEditingMilestone(updatedMilestone);

        // Auto-close toast after 3 seconds
        setTimeout(() => setSaveToast(null), 3000);
    };

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
                            <h1 className="text-3xl font-bold text-gray-900">{record.patientName}</h1>
                            <div className="mt-2 flex items-center text-gray-600 space-x-4">
                                <span className="flex items-center"><MapPin size={16} className="mr-1" /> {record.barangay}</span>
                                <span className="flex items-center"><Calendar size={16} className="mr-1" /> {record.age} years old</span>
                                <span className="flex items-center"><Clock size={16} className="mr-1" /> EDD: {record.estimatedDue}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Record ID</p>
                        <p className="text-lg font-mono text-gray-900 mt-1">{record.id}</p>
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
                        <div className="grid grid-cols-2 gap-8 relative">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input type="text" defaultValue={record.patientName.split(" ")[0]} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Middle Initial</label>
                                    <input type="text" defaultValue={record.mi || ""} maxLength={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Purok</label>
                                    <input type="text" defaultValue={record.purok || "Purok 1"} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                    <input type="text" defaultValue="+63 912 345 6789" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input type="text" defaultValue={record.patientName.split(" ").slice(1).join(" ")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Age</label>
                                    <input type="number" defaultValue={record.age} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Barangay</label>
                                    <select defaultValue={record.barangay} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-gray-700">
                                        <option>Poblacion</option>
                                        <option>Tabao</option>
                                        <option>Alijis</option>
                                        <option>Bayabas</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="space-y-6">
                            {record.cycles && record.cycles.length > 0 && (
                                <div className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <span className="text-sm font-medium text-gray-700">Select Pregnancy Cycle:</span>
                                    <div className="flex space-x-2">
                                        {record.cycles.map((cycle: PregnancyCycle) => (
                                            <button
                                                key={cycle.id}
                                                onClick={() => setSelectedCycleId(cycle.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${selectedCycleId === cycle.id
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'
                                                    }`}
                                            >
                                                {cycle.status === 'Active' ? 'Current Pregnancy' : `History (${cycle.endDate?.split('-')[0]})`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <TimelineView
                                isPending={record.status === 'Pending'}
                                milestones={currentCycle?.milestones}
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

                            <div className="py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center border shadow-sm mb-4">
                                    <Calendar size={28} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">No Laboratory Results Found</h3>
                                <p className="mt-1 text-sm text-gray-500 max-w-xs">Results will be displayed here once uploaded by the MHO laboratory staff.</p>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-gray-200 shadow-lg flex justify-end space-x-4">
                <button
                    onClick={() => navigate('/bhw/patients')}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                    Cancel Updates
                </button>
                <button className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center shadow-sm">
                    <Save size={20} className="mr-2" />
                    Save Record Changes
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

                                        {((editingMilestone?.notes?.physicianLogs && editingMilestone.notes.physicianLogs.length > 0) ||
                                            editingMilestone?.notes?.subjective) ? (
                                            <div className="space-y-4">
                                                {/* Subjective context if exists */}
                                                {editingMilestone?.notes?.subjective && (
                                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initial Assessment</p>
                                                            <span className="text-[9px] text-gray-400 font-mono">{new Date(editingMilestone.notes.subjective.date).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 italic">"{editingMilestone.notes.subjective.content}"</p>
                                                    </div>
                                                )}

                                                {/* Progress Logs */}
                                                {editingMilestone?.notes?.physicianLogs?.map((log: any) => (
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
                                            <div className="text-center py-12">
                                                <MessageSquare size={48} className="mx-auto text-gray-100 mb-2" />
                                                <p className="text-sm text-gray-400 italic">No notes recorded for this milestone.</p>
                                            </div>
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
        </div>
    );
};

export default BHWPatientRecord;
