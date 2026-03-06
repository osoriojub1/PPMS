import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import TimelineView from '../../components/TimelineView';
import { ArrowLeft, User, MapPin, Calendar, Clock, CheckCircle2, ClipboardList, Beaker, X, Save, Plus, AlertCircle, Lock, Loader2 } from 'lucide-react';

const PatientRecord = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('demographics');
    const [showAdmissionModal, setShowAdmissionModal] = useState(false);

    // Default to latest cycle
    const [selectedCycleId, setSelectedCycleId] = useState<string | 'current'>('current');
    const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
    const [newMilestoneData, setNewMilestoneData] = useState({ title: '', reason: '', date: new Date().toISOString().split('T')[0] });

    // Lab Result Modal State
    const [showAddLabResultModal, setShowAddLabResultModal] = useState(false);
    const [showViewResultsModal, setShowViewResultsModal] = useState(false);
    const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
    const [selectedLabForResult, setSelectedLabForResult] = useState<any>(null);
    const [newLabResultData, setNewLabResultData] = useState({ result: '', date: new Date().toISOString().split('T')[0] });

    // Non-blocking toast state
    const [saveToast, setSaveToast] = useState<string | null>(null);

    // Clinical Note Modal State
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [modalMode, setModalMode] = useState<'view' | 'add'>('view');
    const [editingMilestone, setEditingMilestone] = useState<any>(null);
    const [tempNote, setTempNote] = useState('');

    // Admission State
    const [physicians, setPhysicians] = useState<any[]>([]);
    const [admissionDetails, setAdmissionDetails] = useState({
        date: new Date().toISOString().split('T')[0],
        physician: 'Admin'
    });

    useEffect(() => {
        const fetchPhysicians = async () => {
            const { data } = await supabase.from('profiles').select('full_name').eq('role', 'mho_admin');
            if (data && data.length > 0) {
                setPhysicians(data);
                setAdmissionDetails(prev => ({ ...prev, physician: data[0].full_name || 'Admin' }));
            }
        };
        fetchPhysicians();
    }, []);

    // Tracking pending changes for timeline logging
    const [pendingLogs, setPendingLogs] = useState<string[]>([]);
    const [pendingDateChanges, setPendingDateChanges] = useState<Map<string, { type: string, name: string, newDate: string }>>(new Map());

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        type: 'lab_update' | 'lab_delete' | 'milestone_update' | 'milestone_delete';
        id: string | number;
        name: string;
        newValue?: string;
    }>({ show: false, type: 'lab_update', id: 0, name: '' });

    const fetchRecord = useCallback(async () => {
        setLoading(true);
        try {
            const { data: patient } = await supabase
                .from('patients')
                .select(`
                    *,
                    pregnancy_cycles (*)
                `)
                .eq('id', id)
                .single();

            if (patient) {
                // Fetch milestones, labs, and notes for cycles
                const cycles = await Promise.all((patient.pregnancy_cycles || []).map(async (cycle: any) => {
                    const [mRes, lRes, nRes] = await Promise.all([
                        supabase.from('milestones').select('*').eq('cycle_id', cycle.id).order('target_date', { ascending: true }),
                        supabase.from('laboratories').select('*').eq('cycle_id', cycle.id).order('scheduled_date', { ascending: true }),
                        supabase.from('notes').select('*').eq('cycle_id', cycle.id)
                    ]);

                    // Transform labs to match UI expected format
                    const labs = (lRes.data || []).map(l => ({
                        id: l.id,
                        test: l.test_name,
                        dueDate: l.scheduled_date,
                        status: l.status === 'Submitted' ? 'Completed' : 'Scheduled',
                        result: l.result_text
                    }));

                    // Transform milestones and attach notes
                    const milestones = (mRes.data || []).map(m => {
                        const mNotes = (nRes.data || []).filter(n => n.milestone_id === m.id);
                        const subjectiveNote = mNotes.find(n => n.type === 'subjective');
                        const objectiveNote = mNotes.find(n => n.type === 'objective');

                        return {
                            id: m.id,
                            title: m.title,
                            description: m.description,
                            date: m.target_date,
                            status: m.status,
                            notes: {
                                subjective: subjectiveNote ? {
                                    content: subjectiveNote.content,
                                    date: subjectiveNote.created_at
                                } : null,
                                objective: objectiveNote ? {
                                    content: objectiveNote.content,
                                    date: objectiveNote.created_at
                                } : null,
                                physicianLogs: mNotes.filter(n => n.type === 'physician_log').map(n => ({
                                    id: n.id,
                                    date: n.created_at,
                                    content: n.content,
                                    physicianName: n.physician_name || 'Medical Staff'
                                }))
                            }
                        };
                    });

                    return {
                        ...cycle,
                        estimatedDue: cycle.estimated_due_date,
                        status: cycle.status,
                        milestones,
                        labs
                    };
                }));

                const formattedRecord = {
                    ...patient,
                    patientName: `${patient.first_name} ${patient.mi ? patient.mi + ' ' : ''}${patient.last_name}`,
                    status: 'Active',
                    cycles: cycles.reverse() // Newest first
                };
                setRecord(formattedRecord);
                if (selectedCycleId === 'current' && cycles.length > 0) {
                    setSelectedCycleId(cycles[0].id);
                }
            } else {
                // 2. Try fetching from referrals if not found in patients
                const { data: referral } = await supabase
                    .from('referrals')
                    .select('*, cycle_id(patient_id(*))')
                    .eq('id', id)
                    .single();

                if (referral) {
                    const patient = referral.cycle_id.patient_id;
                    const formattedRecord = {
                        ...patient,
                        id: referral.id, // Keep referral ID for the page
                        patient_id: patient.id,
                        patientName: `${patient.first_name} ${patient.mi ? patient.mi + ' ' : ''}${patient.last_name}`,
                        status: 'Pending',
                        referredDate: referral.referred_at,
                        subjective: referral.subjective,
                        objective: referral.objective,
                        cycles: []
                    };
                    setRecord(formattedRecord);
                }
            }
        } catch (err) {
            console.error('Error fetching record:', err);
        } finally {
            setLoading(false);
        }
    }, [id, selectedCycleId]);

    useEffect(() => {
        fetchRecord();
    }, [fetchRecord]);

    // Derived state for the selected cycle
    const currentCycle = useMemo(() => {
        if (!record || !record.cycles) return null;
        return record.cycles.find((c: any) => c.id === selectedCycleId) || (record.cycles[0]);
    }, [record, selectedCycleId]);

    const isPending = record?.status === 'Pending';

    const isHistorical = currentCycle?.status === 'Completed';

    // If pending, only allow demographics tab or a "Review & Admit" summary
    const isTabLocked = (tab: string) => {
        if (isPending && (tab === 'assessment' || tab === 'labs')) return true;
        return false;
    };

    // Auto-switch to demographics if trying to access locked tab
    useEffect(() => {
        if (isTabLocked(activeTab)) {
            setActiveTab('demographics');
        }
    }, [record?.status, activeTab]);

    // Auto-dismiss toast after 3 seconds
    useEffect(() => {
        if (saveToast) {
            const timer = setTimeout(() => setSaveToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [saveToast]);


    const handleUpdateLabDate = (labId: number, newDate: string) => {
        const lab = (currentCycle?.labs || []).find((l: any) => l.id === labId);
        if (lab) {
            setConfirmModal({
                show: true,
                type: 'lab_update',
                id: labId,
                name: lab.test,
                newValue: newDate
            });
        }
    };

    const confirmUpdateLabDate = (labId: number, newDate: string) => {
        const lab = (currentCycle?.labs || []).find((l: any) => l.id === labId);
        if (lab) {
            setPendingDateChanges(prev => {
                const next = new Map(prev);
                next.set(`lab-${labId}`, { type: 'lab', name: lab.test, newDate });
                return next;
            });
        }

        const updatedCycles = record.cycles.map((cycle: any) => {
            if (cycle.id === selectedCycleId) {
                return {
                    ...cycle,
                    labs: (cycle.labs || []).map((l: any) =>
                        l.id === labId ? { ...l, dueDate: newDate } : l
                    )
                };
            }
            return cycle;
        });
        setRecord({ ...record, cycles: updatedCycles });
        setConfirmModal(prev => ({ ...prev, show: false }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="text-gray-500 font-medium">Loading patient record...</p>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4 text-gray-500">
                <AlertCircle size={48} />
                <p className="text-xl font-bold">Record not found</p>
                <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Go back</button>
            </div>
        );
    }

    const handleAdmit = async () => {
        try {
            setLoading(true);

            // 0. Update patient as admitted
            const { error: pError } = await supabase
                .from('patients')
                .update({ is_admitted: true })
                .eq('id', record.patient_id || record.id);

            if (pError) throw pError;

            // 1. Create a new pregnancy cycle for the patient
            const { data: cycle, error: cError } = await supabase
                .from('pregnancy_cycles')
                .insert([{
                    patient_id: record.patient_id || record.id,
                    status: 'Active',
                    estimated_due_date: admissionDetails.date // Initial EDD could be same as admission date or left null
                }])
                .select()
                .single();

            if (cError) throw cError;

            // 2. Create Default Milestones
            const defaultMilestones = [
                { cycle_id: cycle.id, title: '1st Prenatal Visit', description: 'Initial assessment and lab requests', status: 'current' },
                { cycle_id: cycle.id, title: '2nd Prenatal Visit', description: 'Follow-up and screening', status: 'upcoming' },
                { cycle_id: cycle.id, title: '3rd Prenatal Visit', description: 'Pre-natal preparation', status: 'upcoming' },
                { cycle_id: cycle.id, title: 'Post-natal Follow-up', description: 'After delivery check-up', status: 'upcoming' }
            ];

            const { data: milestones, error: mError } = await supabase
                .from('milestones')
                .insert(defaultMilestones)
                .select();

            if (mError) throw mError;

            // 3. Transfer Subjective/Objective findings to the first milestone if they exist
            if (record.subjective || record.objective) {
                const firstMilestone = milestones.find(m => m.title === '1st Prenatal Visit');
                if (firstMilestone) {
                    const notes = [];
                    if (record.subjective) {
                        notes.push({
                            cycle_id: cycle.id,
                            milestone_id: firstMilestone.id,
                            type: 'subjective',
                            content: record.subjective,
                            author_id: (await supabase.auth.getUser()).data.user?.id
                        });
                    }
                    if (record.objective) {
                        notes.push({
                            cycle_id: cycle.id,
                            milestone_id: firstMilestone.id,
                            type: 'objective',
                            content: record.objective,
                            author_id: (await supabase.auth.getUser()).data.user?.id
                        });
                    }
                    await supabase.from('notes').insert(notes);
                }
            }

            // 4. Update Referral Status if it exists
            if (record.status === 'Pending') {
                await supabase
                    .from('referrals')
                    .update({ status: 'Admitted', admitted_at: new Date().toISOString() })
                    .eq('id', record.id);

                // Dismiss related notifications
                await supabase
                    .from('notifications')
                    .update({ is_dismissed: true })
                    .eq('patient_id', record.patient_id || record.id)
                    .eq('type', 'referral');
            }

            setSaveToast(`Patient ${record.patientName} has been admitted successfully.`);
            setShowAdmissionModal(false);
            setActiveTab('assessment');

            // Refresh to show the new active record
            await fetchRecord();
        } catch (err) {
            console.error('Admission error:', err);
            alert('Failed to admit patient. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAssessment = async (newEdd: string) => {
        try {
            setLoading(true);
            const baseDate = new Date(newEdd);
            const fmt = (d: Date) => d.toISOString().split('T')[0];

            // 1. Update Cycle EDD
            await supabase
                .from('pregnancy_cycles')
                .update({ estimated_due_date: newEdd })
                .eq('id', selectedCycleId);

            // 2. Recalculate Milestone Dates
            const milestoneDates = [
                fmt(new Date(baseDate.getTime() - 210 * 24 * 60 * 60 * 1000)),
                fmt(new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000)),
                fmt(new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000)),
                fmt(new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000))
            ];

            const currentMilestones = currentCycle.milestones || [];
            await Promise.all(currentMilestones.map(async (m: any, idx: number) => {
                if (m.status === 'upcoming' || m.date === 'Pending') {
                    const newTargetDate = milestoneDates[idx] || m.date;
                    if (newTargetDate && newTargetDate !== 'Pending') {
                        await supabase
                            .from('milestones')
                            .update({ target_date: newTargetDate })
                            .eq('id', m.id);
                    }
                }
            }));

            // 3. Ensure Default Labs are scheduled if none exist
            if (!currentCycle.labs || currentCycle.labs.length === 0) {
                const defaultLabs = [
                    { cycle_id: selectedCycleId, test_name: 'Standard Prenatal Lab Panel', scheduled_date: fmt(new Date(baseDate.getTime() - 180 * 24 * 60 * 60 * 1000)), status: 'Pending' },
                    { cycle_id: selectedCycleId, test_name: 'OGTT (Glucose Test)', scheduled_date: fmt(new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000)), status: 'Pending' },
                    { cycle_id: selectedCycleId, test_name: 'Repeat CBC & Blood Typing', scheduled_date: fmt(new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000)), status: 'Pending' }
                ];
                await supabase.from('laboratories').insert(defaultLabs);
            }

            setSaveToast("Estimated Due Date and schedules have been updated.");
            await fetchRecord();
        } catch (err) {
            console.error('Save assessment error:', err);
            setSaveToast("Failed to save EDD updates.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateMilestoneDate = (milestoneId: number, newDate: string) => {
        const milestone = (currentCycle?.milestones || []).find((m: any) => m.id === milestoneId);
        if (milestone) {
            setConfirmModal({
                show: true,
                type: 'milestone_update',
                id: milestoneId,
                name: milestone.title,
                newValue: newDate
            });
        }
    };

    const confirmUpdateMilestoneDate = (milestoneId: number, newDate: string) => {
        const milestone = (currentCycle?.milestones || []).find((m: any) => m.id === milestoneId);
        if (milestone) {
            setPendingDateChanges(prev => {
                const next = new Map(prev);
                next.set(`milestone-${milestoneId}`, { type: 'milestone', name: milestone.title, newDate });
                return next;
            });
        }

        const updatedCycles = record.cycles.map((cycle: any) => {
            if (cycle.id === selectedCycleId) {
                return {
                    ...cycle,
                    milestones: cycle.milestones.map((m: any) =>
                        m.id === milestoneId ? { ...m, date: newDate } : m
                    )
                };
            }
            return cycle;
        });
        setRecord({ ...record, cycles: updatedCycles });
        setConfirmModal(prev => ({ ...prev, show: false }));
    };

    const handleRemoveLab = (labId: number) => {
        const lab = (currentCycle?.labs || []).find((l: any) => l.id === labId);
        if (lab) {
            setConfirmModal({
                show: true,
                type: 'lab_delete',
                id: labId,
                name: lab.test
            });
        }
    };

    const confirmRemoveLab = async (labId: string | number) => {
        try {
            setLoading(true);
            const lab = (currentCycle?.labs || []).find((l: any) => l.id === labId);
            if (lab) {
                const { error } = await supabase.from('laboratories').delete().eq('id', labId);
                if (error) throw error;
                setPendingLogs(prev => [...prev, `Cancelled/Removed Laboratory Schedule: ${lab.test}`]);
            }
            await fetchRecord();
        } catch (err) {
            console.error('Remove lab error:', err);
            setSaveToast("Failed to remove laboratory schedule.");
        } finally {
            setLoading(false);
            setConfirmModal(prev => ({ ...prev, show: false }));
        }
    };

    const handleAddCustomMilestone = async () => {
        if (!newMilestoneData.title.trim()) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('milestones')
                .insert([{
                    cycle_id: selectedCycleId,
                    title: newMilestoneData.title,
                    description: newMilestoneData.reason,
                    target_date: newMilestoneData.date,
                    status: 'upcoming'
                }]);

            if (error) throw error;

            setPendingLogs(prev => [...prev, `Added a Schedule for ${newMilestoneData.title}: ${newMilestoneData.reason}`]);
            setShowAddMilestoneModal(false);
            setNewMilestoneData({ title: '', reason: '', date: new Date().toISOString().split('T')[0] });
            await fetchRecord();
        } catch (err) {
            console.error('Add milestone error:', err);
            setSaveToast("Failed to add custom schedule.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMilestone = (milestoneId: number) => {
        const milestone = (currentCycle?.milestones || []).find((m: any) => m.id === milestoneId);
        if (milestone) {
            setConfirmModal({
                show: true,
                type: 'milestone_delete',
                id: milestoneId,
                name: milestone.title
            });
        }
    };

    const confirmRemoveMilestone = async (milestoneId: string | number) => {
        try {
            setLoading(true);
            const milestone = (currentCycle?.milestones || []).find((m: any) => m.id === milestoneId);
            if (milestone) {
                const { error } = await supabase.from('milestones').delete().eq('id', milestoneId);
                if (error) throw error;
                setPendingLogs(prev => [...prev, `Cancelled/Removed Schedule: ${milestone.title}`]);
            }
            await fetchRecord();
        } catch (err) {
            console.error('Remove milestone error:', err);
            setSaveToast("Failed to remove clinical schedule.");
        } finally {
            setLoading(false);
            setConfirmModal(prev => ({ ...prev, show: false }));
        }
    };

    const handleAddOtherLab = async (testName: string) => {
        if (!testName.trim()) return;

        try {
            setLoading(true);
            const newDate = new Date().toISOString().split('T')[0];
            const { error } = await supabase
                .from('laboratories')
                .insert([{
                    cycle_id: selectedCycleId,
                    test_name: testName,
                    scheduled_date: newDate,
                    status: 'Pending'
                }]);

            if (error) throw error;

            setPendingLogs(prev => [...prev, `Added Laboratory Schedule for ${testName}. Due date is: ${newDate}`]);
            await fetchRecord();
        } catch (err) {
            console.error('Add lab error:', err);
            setSaveToast("Failed to add laboratory test.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        try {
            setLoading(true);
            const dateChangeLogs: string[] = [];

            // 1. Process Date Changes
            for (const [key, change] of Array.from(pendingDateChanges.entries())) {
                const [type, id] = key.split('-');
                if (type === 'lab') {
                    await supabase.from('laboratories').update({ scheduled_date: change.newDate }).eq('id', id);
                    dateChangeLogs.push(`Updated Laboratory Schedule for ${change.name}. New due date: ${change.newDate}`);
                } else if (type === 'milestone') {
                    await supabase.from('milestones').update({ target_date: change.newDate }).eq('id', id);
                    dateChangeLogs.push(`Updated Schedule for ${change.name}. New target date: ${change.newDate}`);
                }
            }

            // 2. Process All Logs (including date change logs)
            const allLogs = [...pendingLogs, ...dateChangeLogs];
            if (allLogs.length > 0) {
                // Find active milestone to attach logs to
                const activeMilestone = currentCycle.milestones.find((m: any) => m.status === 'current')
                    || currentCycle.milestones.find((m: any) => m.status === 'upcoming')
                    || currentCycle.milestones[0];

                if (activeMilestone) {
                    const { data: { user } } = await supabase.auth.getUser();
                    const notesToInsert = allLogs.map(logContent => ({
                        cycle_id: selectedCycleId,
                        milestone_id: activeMilestone.id,
                        type: 'physician_log',
                        content: logContent,
                        author_id: user?.id,
                        physician_name: admissionDetails.physician || 'Medical Staff'
                    }));
                    await supabase.from('notes').insert(notesToInsert);
                }
            }

            setPendingLogs([]);
            setPendingDateChanges(new Map());
            setSaveToast("All changes have been successfully saved to the cloud.");
            await fetchRecord();
        } catch (err) {
            console.error('Save changes error:', err);
            setSaveToast("Failed to save some changes.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddLabResult = (labId: number) => {
        setSelectedLabId(labId);
        setNewLabResultData({ result: '', date: new Date().toISOString().split('T')[0] });
        setShowAddLabResultModal(true);
    };

    const handleSaveLabResult = async () => {
        if (!newLabResultData.result.trim()) return;

        try {
            setLoading(true);
            const { error: lError } = await supabase
                .from('laboratories')
                .update({
                    status: 'Submitted',
                    result_text: newLabResultData.result,
                    scheduled_date: newLabResultData.date
                })
                .eq('id', selectedLabId);

            if (lError) throw lError;

            const lab = (currentCycle?.labs || []).find((l: any) => l.id === selectedLabId);
            setPendingLogs(prev => [...prev, `Added Laboratory Results for ${lab?.test || 'Test'}. Status updated to Completed.`]);

            setShowAddLabResultModal(false);
            setSelectedLabId(null);
            await fetchRecord();
        } catch (err) {
            console.error('Save lab result error:', err);
            setSaveToast("Failed to save lab result.");
        } finally {
            setLoading(false);
        };

        const handleOpenViewResults = (lab: any) => {
            setSelectedLabForResult(lab);
            setShowViewResultsModal(true);
        };

        const handleOpenNoteModal = (milestone: any, mode: 'view' | 'add' = 'view') => {
            if (isHistorical && mode === 'add') return;
            setEditingMilestone(milestone);
            setTempNote('');
            setModalMode(mode);
            setShowNoteModal(true);
        };

        const handleSaveMilestoneNote = async () => {
            if (!tempNote.trim()) return;

            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();

                // 1. Add the note
                const { error: nError } = await supabase
                    .from('notes')
                    .insert([{
                        cycle_id: selectedCycleId,
                        milestone_id: editingMilestone.id,
                        type: 'physician_log',
                        content: tempNote,
                        author_id: user?.id,
                        physician_name: admissionDetails.physician || 'Medical Staff'
                    }]);

                if (nError) throw nError;

                // 2. Update milestone status
                await supabase
                    .from('milestones')
                    .update({ status: 'completed' })
                    .eq('id', editingMilestone.id);

                // 3. Update next milestone to current if applicable
                const nextMilestone = currentCycle.milestones.find((m: any) => m.target_date > editingMilestone.date);
                if (nextMilestone) {
                    await supabase
                        .from('milestones')
                        .update({ status: 'current' })
                        .eq('id', nextMilestone.id);
                }

                setModalMode('view');
                setTempNote('');
                await fetchRecord();
            } catch (err) {
                console.error('Save note error:', err);
                setSaveToast("Failed to save clinical note.");
            } finally {
                setLoading(false);
            }
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
                {/* Admission Modal */}
                {showAdmissionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center">
                                    <CheckCircle2 className="mr-2" />
                                    Confirm Admission
                                </h3>
                                <button onClick={() => setShowAdmissionModal(false)} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start space-x-3 mb-2">
                                    <AlertCircle size={18} className="text-blue-500 mt-0.5" />
                                    <p className="text-sm text-blue-700">Admitting this patient will unlock physician assessment tabs and enable clinical timeline tracking.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                                    <input
                                        type="date"
                                        value={admissionDetails.date}
                                        onChange={(e) => setAdmissionDetails({ ...admissionDetails, date: e.target.value })}
                                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Physician-in-Charge</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                        value={admissionDetails.physician}
                                        onChange={(e) => setAdmissionDetails({ ...admissionDetails, physician: e.target.value })}
                                    >
                                        {physicians.length > 0 ? (
                                            physicians.map((p, i) => (
                                                <option key={i} value={p.full_name || 'Admin'}>{p.full_name || 'Admin'}</option>
                                            ))
                                        ) : (
                                            <option value="Admin">Admin</option>
                                        )}
                                    </select>
                                </div>
                                <div className="pt-4">
                                    <button
                                        onClick={handleAdmit}
                                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
                                    >
                                        Confirm Admission
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showNoteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold">
                                        {modalMode === 'view' ? 'Detailed Clinical Logs' : 'Add Clinical Visit Note'}
                                    </h3>
                                    <p className="text-blue-100 text-sm">{editingMilestone?.title}</p>
                                </div>
                                <button onClick={() => setShowNoteModal(false)} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                {modalMode === 'view' ? (
                                    <div className="space-y-6">
                                        {/* BHW Context if exists */}
                                        {editingMilestone?.notes?.subjective && (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">BHW Referral Context</p>
                                                    <span className="text-[9px] text-gray-400 font-mono">{new Date(editingMilestone.notes.subjective.date).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 italic">"{editingMilestone.notes.subjective.content}"</p>
                                            </div>
                                        )}

                                        {/* Physician Logs List */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Physician Progress Notes</h4>
                                            {editingMilestone?.notes?.physicianLogs && editingMilestone.notes.physicianLogs.length > 0 ? (
                                                editingMilestone.notes.physicianLogs.map((log: any) => (
                                                    <div key={log.id} className="p-4 bg-blue-50/30 rounded-lg border border-blue-100">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-[10px] font-bold text-blue-600">{log.physicianName}</span>
                                                            <span className="text-[10px] text-gray-400 font-mono">{new Date(log.date).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-blue-900 leading-relaxed">{log.content}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-400 italic py-4 text-center">No physician notes recorded for this milestone.</p>
                                            )}
                                        </div>

                                        {!isHistorical && (
                                            <button
                                                onClick={() => setModalMode('add')}
                                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md flex items-center justify-center"
                                            >
                                                <Plus size={18} className="mr-2" /> Add New Entry
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Physician Assessment & Recommendations</label>
                                            <textarea
                                                rows={5}
                                                autoFocus
                                                value={tempNote}
                                                onChange={(e) => setTempNote(e.target.value)}
                                                placeholder="Enter findings, prescriptions, or follow-up instructions..."
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm"
                                            ></textarea>
                                        </div>
                                        <div className="pt-2 flex space-x-4">
                                            <button
                                                onClick={() => setModalMode('view')}
                                                className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveMilestoneNote}
                                                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
                                            >
                                                Save Note
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Header View */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors font-semibold"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back
                    </button>
                    <div className="flex items-center space-x-3">
                        {isPending ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                                <Clock size={14} className="mr-2" />
                                Pending Admission
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 uppercase tracking-wider">
                                <CheckCircle2 size={14} className="mr-2" />
                                Active Case
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Document Paper-Style Container */}
                <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden min-h-[800px] relative">

                    {/* Admission Watermark or Overlay for Pending */}
                    {isPending && activeTab !== 'demographics' && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center p-12 text-center bg-white/60 backdrop-blur-[2px]">
                            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-2xl max-w-sm">
                                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="text-amber-600" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Clinical Access Locked</h3>
                                <p className="text-sm text-gray-500 mb-6">Confirm admission to activate clinical assessments and timeline tracking.</p>
                                <button
                                    onClick={() => setShowAdmissionModal(true)}
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
                                >
                                    Admit Patient Now
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Document Header */}
                    <div className={`${isPending ? 'bg-amber-50' : 'bg-blue-50'} border-b border-gray-200 p-8 flex items-start justify-between`}>
                        <div className="flex items-center space-x-6">
                            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                                <User size={48} className={isPending ? 'text-amber-300' : 'text-blue-300'} />
                            </div>
                            <div>
                                <div className="flex items-center space-x-3">
                                    <h1 className="text-3xl font-bold text-gray-900">{record.patientName}</h1>
                                    {isHistorical && (
                                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-gray-300">History</span>
                                    )}
                                </div>
                                <div className="mt-2 flex items-center text-gray-600 space-x-6 font-medium text-sm">
                                    <span className="flex items-center"><MapPin size={16} className="mr-1.5 text-gray-400" /> {record.barangay}</span>
                                    <span className="flex items-center"><Calendar size={16} className="mr-1.5 text-gray-400" /> {record.age} years old</span>
                                    {currentCycle?.estimatedDue && (
                                        <span className="flex items-center text-blue-700"><Clock size={16} className="mr-1.5" /> EDD: {currentCycle.estimatedDue}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Record ID</p>
                            <p className="text-xl font-mono font-bold text-gray-900">{record.id}</p>
                            {!isPending && (
                                <div className="mt-3 flex flex-col items-end">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attending Physician</p>
                                    <p className="text-sm font-bold text-gray-700">{record.physicianInCharge}</p>
                                </div>
                            )}
                            {isPending && (
                                <button
                                    onClick={() => setShowAdmissionModal(true)}
                                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center ml-auto"
                                >
                                    <CheckCircle2 size={16} className="mr-2" />
                                    Admit Patient
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sub-Header: Cycle Selector */}
                    {record.cycles && record.cycles.length > 0 && !isPending && (
                        <div className="bg-gray-50 px-8 py-3 border-b border-gray-200 flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-600 flex items-center"><ClipboardList size={16} className="mr-2" /> Pregnancy Cycles:</span>
                            <div className="flex space-x-2">
                                {record.cycles.map((cycle: any) => (
                                    <button
                                        key={cycle.id}
                                        onClick={() => setSelectedCycleId(cycle.id)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCycleId === cycle.id
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'
                                            }`}
                                    >
                                        {cycle.status === 'Active' ? 'Current' : `Previous (${cycle.completed_at?.split('-')[0] || 'N/A'})`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation Tabs */}
                    <div className="border-b border-gray-200 px-8 flex space-x-8">
                        <TabButton active={activeTab === 'demographics'} onClick={() => setActiveTab('demographics')} label="Patient Profile" />
                        <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} label="Care Timeline" />
                        <TabButton
                            active={activeTab === 'assessment'}
                            onClick={() => setActiveTab('assessment')}
                            label="Scheduling"
                            locked={isPending}
                        />
                        <TabButton
                            active={activeTab === 'labs'}
                            onClick={() => setActiveTab('labs')}
                            label="Laboratory History"
                            locked={isPending}
                        />
                    </div>

                    {/* Tab Content */}
                    <div className="p-8">

                        {activeTab === 'demographics' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">Demographics & Identification</h2>
                                    {!isPending && (
                                        <button className="text-sm font-bold text-blue-600 hover:underline">Edit Profile</button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <FormInput label="Full Name" value={record.patientName} disabled={true} />
                                        <FormInput label="Barangay" value={record.barangay} disabled={true} />
                                        <FormInput label="Age" value={`${record.age} years old`} disabled={true} />
                                    </div>
                                    <div className="space-y-6">
                                        <FormInput label="Purok" value={record.purok || "Not Specified"} disabled={true} />
                                        <FormInput label="Contact Number" value="+63 912 345 6789" disabled={true} />
                                        <FormInput label="Referred Date" value={record.referredDate?.split('T')[0] || "2024-03-20"} disabled={true} />
                                    </div>
                                </div>

                                {isPending && (record.subjective || record.objective) && (
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <h3 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-4">BHW Referral Findings</h3>
                                        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 space-y-4">
                                            {record.subjective && (
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Subjective Findings</p>
                                                    <p className="text-sm text-gray-700 italic font-medium leading-relaxed">"{record.subjective}"</p>
                                                </div>
                                            )}
                                            {record.objective && (
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Objective Findings</p>
                                                    <p className="text-sm text-gray-900 font-bold leading-relaxed">{record.objective}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">Pregnancy Care Timeline</h2>
                                </div>
                                <TimelineView
                                    isPending={isPending}
                                    milestones={currentCycle?.milestones || []}
                                    isAdmin={true}
                                    onMilestoneClick={handleOpenNoteModal}
                                />
                            </div>
                        )}

                        {activeTab === 'assessment' && (
                            <div className="space-y-12">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Care Scheduling</h2>
                                    <div className="bg-blue-600 px-6 py-3 rounded-xl text-white shadow-lg flex items-center space-x-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Cycle EDD:</h3>
                                        <input
                                            type="date"
                                            value={currentCycle?.estimatedDue || ''}
                                            disabled={isHistorical}
                                            onChange={(e) => handleSaveAssessment(e.target.value)}
                                            className="bg-transparent border-none text-white font-bold focus:ring-0 cursor-pointer text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Section 1: Check Up Schedule */}
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 text-gray-900">
                                            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black uppercase tracking-wider">Maternal Check-up Schedule</h3>
                                                <p className="text-xs text-gray-400 font-medium">Routine visits and clinical follow-ups</p>
                                            </div>
                                        </div>
                                        {!isHistorical && (
                                            <button
                                                onClick={() => setShowAddMilestoneModal(true)}
                                                className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-md flex items-center group"
                                            >
                                                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                                <span className="ml-2 text-xs font-bold px-1">Add Schedule</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(currentCycle?.milestones || []).map((m: any) => {
                                            const milestoneDateStr = m.date || '';
                                            const milestoneDate = milestoneDateStr.includes(',') ? new Date(milestoneDateStr) : (milestoneDateStr === 'Pending' || !milestoneDateStr ? null : new Date(milestoneDateStr));
                                            const isLapsed = !!(milestoneDate && milestoneDate < new Date(new Date().setHours(0, 0, 0, 0)));
                                            const displayDate = milestoneDateStr.includes(',') ? (milestoneDate?.toISOString().split('T')[0] || '') : (milestoneDateStr === 'Pending' ? '' : milestoneDateStr);

                                            return (
                                                <div key={m.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all hover:shadow-md relative">
                                                    <div className="flex-1 mr-4">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <p className="text-sm font-black text-gray-900">{m.title}</p>
                                                            {m.status === 'completed' && <CheckCircle2 size={14} className="text-green-500" />}
                                                            {isLapsed && m.status !== 'completed' && (
                                                                <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">Lapsed</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight line-clamp-1">{m.description || 'Target clinical visit'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="date"
                                                            value={displayDate}
                                                            onChange={(e) => handleUpdateMilestoneDate(m.id, e.target.value)}
                                                            disabled={!!(isHistorical || m.status === 'completed' || isLapsed)}
                                                            className={`bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-black w-[150px] transition-all ${isLapsed ? 'text-gray-400 cursor-not-allowed border-dashed' : 'text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-100'
                                                                }`}
                                                        />
                                                        {!isHistorical && m.id > 10 && (
                                                            <button
                                                                onClick={() => handleRemoveMilestone(m.id)}
                                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Remove Schedule"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* Section 2: Laboratory Schedule */}
                                <section className="space-y-6 pt-12 border-t border-gray-100">
                                    <div className="flex items-center space-x-3 text-gray-900">
                                        <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                                            <Beaker size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-wider">Laboratory Schedule</h3>
                                            <p className="text-xs text-gray-400 font-medium">Diagnostic testing and screening targets</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {(currentCycle?.labs || []).map((lab: any) => {
                                                const labDate = lab.dueDate.includes('/') ? new Date(lab.dueDate) : new Date(lab.dueDate);
                                                const isLapsed = labDate < new Date(new Date().setHours(0, 0, 0, 0));
                                                const displayDate = lab.dueDate.includes('/') ? labDate.toISOString().split('T')[0] : lab.dueDate;

                                                return (
                                                    <div key={lab.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all hover:shadow-md h-full relative">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex-1 mr-2">
                                                                <div className="flex items-center space-x-2 mb-1">
                                                                    <p className="text-xs font-black text-gray-900 leading-tight">{lab.test}</p>
                                                                    {lab.status === 'Completed' && <CheckCircle2 size={12} className="text-green-500" />}
                                                                    {isLapsed && lab.status !== 'Completed' && (
                                                                        <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1 py-0.5 rounded uppercase tracking-tighter">Lapsed</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">Due Date</p>
                                                            </div>
                                                            {!isHistorical && (
                                                                <button
                                                                    onClick={() => handleRemoveLab(lab.id)}
                                                                    className="text-gray-300 hover:text-red-500 transition-all p-1 hover:bg-red-50 rounded-lg"
                                                                    title="Remove Lab Test"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="date"
                                                            value={displayDate}
                                                            onChange={(e) => handleUpdateLabDate(lab.id, e.target.value)}
                                                            disabled={!!(isHistorical || lab.status === 'Completed' || isLapsed)}
                                                            className={`border rounded-xl px-4 py-2 text-xs font-black w-full transition-all ${isLapsed ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-dashed border-gray-200' : 'bg-blue-50/20 border-blue-50 text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-100'
                                                                }`}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="md:col-span-1">
                                            {!isHistorical && (
                                                <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-6">
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Quick Add Lab</h4>
                                                    <div className="space-y-2">
                                                        {['Ultrasound', 'Urinalysis', 'HBsAg Screening', 'HIV/STI Screening'].map(test => {
                                                            // Multiple allowed now, so no need to change color if "added"
                                                            return (
                                                                <button
                                                                    key={test}
                                                                    onClick={() => handleAddOtherLab(test)}
                                                                    className="w-full flex items-center justify-between p-3 rounded-xl border bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all"
                                                                >
                                                                    <span className="text-xs font-bold">{test}</span>
                                                                    <Plus size={14} className="opacity-40" />
                                                                </button>
                                                            );
                                                        })}
                                                        <button
                                                            onClick={() => {
                                                                const test = prompt("Enter Custom Laboratory Test Name:");
                                                                if (test) handleAddOtherLab(test);
                                                            }}
                                                            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 transition-all"
                                                        >
                                                            + Custom Lab Test
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'labs' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">Laboratory Results</h2>
                                    <p className="text-xs font-medium text-gray-400">Cycle ID: {selectedCycleId}</p>
                                </div>

                                <div className="space-y-4">
                                    {currentCycle?.labs && currentCycle.labs.length > 0 ? (
                                        currentCycle.labs.map((lab: any) => (
                                            <div key={lab.id} className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-all shadow-sm">
                                                <div className="flex items-center space-x-6">
                                                    <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <Beaker size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-900">{lab.test}</p>
                                                        <p className="text-sm text-gray-500">Date: {lab.dueDate}</p>
                                                        {lab.result && (
                                                            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 italic text-sm text-blue-800">
                                                                {lab.result}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${lab.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                                                        }`}>
                                                        {lab.status}
                                                    </span>
                                                    {lab.status === 'Completed' ? (
                                                        <button
                                                            onClick={() => handleOpenViewResults(lab)}
                                                            className="px-4 py-2 border border-blue-200 text-blue-600 rounded text-xs font-bold hover:bg-blue-50 transition-colors"
                                                        >
                                                            View Results
                                                        </button>
                                                    ) : (
                                                        !isHistorical && (
                                                            <button
                                                                onClick={() => handleOpenAddLabResult(lab.id)}
                                                                className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 flex items-center"
                                                            >
                                                                <Plus size={14} className="mr-1" />
                                                                Add Result
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-16 flex flex-col items-center justify-center text-center opacity-50">
                                            <Beaker size={48} className="text-gray-300 mb-4" />
                                            <h3 className="font-bold text-gray-900 uppercase">No Laboratory History</h3>
                                            <p className="text-sm text-gray-500 max-w-xs mt-1">Diagnostic records for this pregnancy cycle will appear here.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-gray-200 shadow-lg flex items-center justify-end space-x-4">
                    {!isPending && (pendingLogs.length > 0 || pendingDateChanges.size > 0) && (
                        <div className="flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 animate-pulse mr-auto ml-4">
                            <AlertCircle size={16} className="mr-2" />
                            <span className="text-xs font-bold uppercase tracking-wider">{pendingLogs.length + pendingDateChanges.size} Unsaved Change{(pendingLogs.length + pendingDateChanges.size) !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                    {isPending ? (
                        <>
                            <button className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50 transition-all">
                                Decline
                            </button>
                            <button
                                onClick={() => setShowAdmissionModal(true)}
                                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center"
                            >
                                <CheckCircle2 size={20} className="mr-2" />
                                Confirm Admission
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleSaveChanges}
                            className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-sm flex items-center"
                        >
                            <Save size={20} className="mr-2" />
                            Save Changes
                        </button>
                    )}
                </div>
                {/* Add Custom Milestone Modal */}
                {showAddMilestoneModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="bg-blue-600 p-8 text-white relative">
                                <h3 className="text-xl font-black uppercase tracking-widest">New Check-up Schedule</h3>
                                <p className="text-blue-100 text-xs mt-1 font-bold">Plan a custom maternal health milestone</p>
                                <button
                                    onClick={() => setShowAddMilestoneModal(false)}
                                    className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Schedule Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2nd Trimester Anomaly Scan"
                                        value={newMilestoneData.title}
                                        onChange={(e) => setNewMilestoneData({ ...newMilestoneData, title: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Reason / Description</label>
                                    <textarea
                                        placeholder="Brief clinical reason for this visit..."
                                        value={newMilestoneData.reason}
                                        onChange={(e) => setNewMilestoneData({ ...newMilestoneData, reason: e.target.value })}
                                        rows={3}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Target Date</label>
                                    <input
                                        type="date"
                                        value={newMilestoneData.date}
                                        onChange={(e) => setNewMilestoneData({ ...newMilestoneData, date: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                    />
                                </div>
                                <div className="flex space-x-4 pt-4">
                                    <button
                                        onClick={() => setShowAddMilestoneModal(false)}
                                        className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddCustomMilestone}
                                        disabled={!newMilestoneData.title.trim()}
                                        className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:grayscale"
                                    >
                                        Create Schedule
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Laboratory Result Modal */}
                {showAddLabResultModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="bg-amber-600 p-8 text-white relative">
                                <h3 className="text-xl font-black uppercase tracking-widest">Post Laboratory Result</h3>
                                <p className="text-amber-100 text-xs mt-1 font-bold italic">Enter test findings and completion date</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Result Summary</label>
                                    <textarea
                                        value={newLabResultData.result}
                                        onChange={(e) => setNewLabResultData({ ...newLabResultData, result: e.target.value })}
                                        placeholder="e.g., Blood type A+, Hemoglobin 12.5 g/dL, No abnormalities found..."
                                        rows={4}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-amber-50 transition-all outline-none resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Completion Date</label>
                                    <input
                                        type="date"
                                        value={newLabResultData.date}
                                        onChange={(e) => setNewLabResultData({ ...newLabResultData, date: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-amber-50 transition-all outline-none"
                                    />
                                </div>
                                <div className="flex space-x-4 pt-4">
                                    <button
                                        onClick={() => setShowAddLabResultModal(false)}
                                        className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveLabResult}
                                        disabled={!newLabResultData.result.trim()}
                                        className="flex-1 px-6 py-4 bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 disabled:opacity-50"
                                    >
                                        Save Result
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Admission Modal */}
                {showAdmissionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="bg-green-600 p-8 text-white relative">
                                <h3 className="text-xl font-black uppercase tracking-widest">Confirm Admission</h3>
                                <p className="text-green-100 text-xs mt-1 font-bold italic">Officially admit patient to healthcare services</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Admission Date</label>
                                    <input
                                        type="date"
                                        value={admissionDetails.date}
                                        onChange={(e) => setAdmissionDetails({ ...admissionDetails, date: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Physician in Charge</label>
                                    <select
                                        value={admissionDetails.physician}
                                        onChange={(e) => setAdmissionDetails({ ...admissionDetails, physician: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                    >
                                        <option value="">Select Physician</option>
                                        {physicians.length > 0 ? (
                                            physicians.map((p, i) => (
                                                <option key={i} value={p.full_name || 'Admin'}>
                                                    {p.full_name || 'Admin'}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="Admin">Admin</option>
                                        )}
                                    </select>
                                </div>
                                <div className="flex space-x-4 pt-4">
                                    <button
                                        onClick={() => setShowAdmissionModal(false)}
                                        className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAdmit}
                                        disabled={!admissionDetails.date || !admissionDetails.physician}
                                        className="flex-1 px-6 py-4 bg-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50"
                                    >
                                        Confirm Admission
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {confirmModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}></div>
                        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-6 ${confirmModal.type.includes('delete') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                {confirmModal.type.includes('delete') ? <X size={32} /> : <Calendar size={32} />}
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-2">
                                {confirmModal.type.includes('delete') ? 'Confirm Removal' : 'Confirm Update'}
                            </h3>

                            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                                {confirmModal.type === 'lab_delete' && `Are you sure you want to remove the laboratory schedule for "${confirmModal.name}"? This action will be logged to the care timeline.`}
                                {confirmModal.type === 'milestone_delete' && `Are you sure you want to remove the clinical schedule for "${confirmModal.name}"? This action will be logged to the care timeline.`}
                                {confirmModal.type === 'lab_update' && `Update the due date for "${confirmModal.name}" to ${confirmModal.newValue}?`}
                                {confirmModal.type === 'milestone_update' && `Update the target date for "${confirmModal.name}" to ${confirmModal.newValue}?`}
                            </p>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirmModal.type === 'lab_update') confirmUpdateLabDate(confirmModal.id as any, confirmModal.newValue!);
                                        else if (confirmModal.type === 'milestone_update') confirmUpdateMilestoneDate(confirmModal.id as any, confirmModal.newValue!);
                                        else if (confirmModal.type === 'lab_delete') confirmRemoveLab(confirmModal.id as any);
                                        else if (confirmModal.type === 'milestone_delete') confirmRemoveMilestone(confirmModal.id as any);
                                    }}
                                    className={`flex-1 px-6 py-4 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg ${confirmModal.type.includes('delete') ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                                        }`}
                                >
                                    {confirmModal.type.includes('delete') ? 'Remove' : 'Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* View Lab Results Modal */}
                {showViewResultsModal && selectedLabForResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-blue-700 p-6 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center">
                                        <Beaker className="mr-2" size={20} />
                                        Laboratory Report
                                    </h3>
                                    <p className="text-blue-100 text-xs font-medium uppercase tracking-widest mt-1">{selectedLabForResult.test}</p>
                                </div>
                                <button onClick={() => setShowViewResultsModal(false)} className="hover:bg-blue-800 p-1 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Test Name</p>
                                        <p className="text-sm font-bold text-gray-900">{selectedLabForResult.test}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date Reported</p>
                                        <p className="text-sm font-bold text-gray-900">{selectedLabForResult.dueDate}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Clinical Findings</p>
                                    <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                                        <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                                            {selectedLabForResult.result || "No detailed findings available for this report."}
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

    // Refined Helper Components
    const TabButton = ({ active, onClick, label, locked }: { active: boolean, onClick: () => void, label: string, locked?: boolean }) => (
        <button
            disabled={locked}
            className={`py-4 px-1 border-b-2 font-bold text-sm transition-all ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={onClick}
        >
            {label}
        </button>
    );

    const FormInput = ({ label, value, disabled, type = 'text', maxLength }: { label: string, value: string, disabled: boolean, type?: string, maxLength?: number }) => (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
            <input
                type={type}
                disabled={disabled}
                defaultValue={value}
                maxLength={maxLength}
                className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-medium text-gray-700 disabled:opacity-50"
            />
        </div>
    );
};

export default PatientRecord;
