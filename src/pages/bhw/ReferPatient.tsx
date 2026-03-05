import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockPatients, mockReferrals, type Patient } from '../../lib/mockData';
import { ArrowLeft, User, Send, FileText, ClipboardList } from 'lucide-react';

const ReferPatient = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const record = (mockPatients.find(p => p.id === id) || mockReferrals.find(r => r.id === id)) as Patient | any;

    const [subjective, setSubjective] = useState('');
    const [objective, setObjective] = useState('');

    if (!record) {
        return <div className="p-8 text-center text-gray-500">Patient not found</div>;
    }

    const handleRefer = () => {
        // In a real app, this would send an API request to creating a Referral record with findings
        console.log('Referring patient with SOAP notes:', { subjective, objective });

        // Simulating the transfer logic for the mock data demonstration
        const referralData = {
            id: record.id,
            patientName: record.patientName,
            subjective: subjective,
            objective: objective,
            timestamp: new Date().toISOString()
        };

        console.log('Referral Data Prepared for Milestones:', referralData);
        alert(`Patient referral sent to MHO successfully!\n\nSubjective: ${subjective.substring(0, 30)}...\nObjective: ${objective.substring(0, 30)}...`);
        navigate('/bhw/referrals');
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
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
                            <p className="text-sm font-bold text-gray-900">{record.patientName}</p>
                            <p className="text-xs text-gray-500">{record.barangay} • Age: {record.age} • EDD: {record.estimatedDue}</p>
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
                            disabled={!subjective || !objective}
                            className="bg-blue-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center shadow-lg transform hover:-translate-y-0.5 disabled:bg-gray-300 disabled:transform-none disabled:shadow-none"
                        >
                            <Send size={20} className="mr-2" />
                            Send Referral to MHO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferPatient;
