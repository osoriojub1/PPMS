
import { Check, Clock, AlertCircle, MessageSquare } from 'lucide-react';

interface Milestone {
    id: number;
    title: string;
    description: string;
    date: string;
    status: 'completed' | 'current' | 'upcoming';
    notes?: {
        subjective?: {
            content: string;
            date: string;
            authorName?: string;
        };
        objective?: {
            content: string;
            date: string;
            authorName?: string;
        };
        physicianLogs?: {
            id: string;
            date: string;
            content: string;
            physicianName: string;
        }[];
    };
}

const defaultMilestones: Milestone[] = [
    {
        id: 1,
        title: '1st Trimester Contact',
        description: 'Initial prenatal visit, comprehensive checkup, and lab requests.',
        date: 'March 15, 2024',
        status: 'completed'
    },
    {
        id: 2,
        title: '2nd Trimester Contact',
        description: 'Routine checkup, fetal heart tone monitoring.',
        date: 'April 22, 2024',
        status: 'current'
    },
    {
        id: 3,
        title: '3rd Trimester Contacts (3 visits)',
        description: 'Frequent monitoring, birth plan presentation.',
        date: 'Pending',
        status: 'upcoming'
    },
    {
        id: 4,
        title: 'Postnatal Visits',
        description: 'Follow-up care for mother and newborn.',
        date: 'Pending',
        status: 'upcoming'
    }
];

const TimelineView = ({
    isPending,
    milestones = defaultMilestones,
    isAdmin = false,
    onMilestoneClick,
    title = "Pregnancy Timeline"
}: {
    isPending: boolean;
    milestones?: Milestone[];
    isAdmin?: boolean;
    onMilestoneClick?: (milestone: Milestone) => void;
    title?: string;
}) => {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'N/A';
            return d.toLocaleDateString();
        } catch (e) {
            return 'N/A';
        }
    };

    const formatFullDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'N/A';
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return 'N/A';
        }
    };

    return (
        <div className="py-6 px-4">
            <h3 className="text-xl font-bold text-gray-900 mb-10 tracking-tight">{title}</h3>

            <div className="relative border-l-4 border-gray-100 ml-6 space-y-12">
                {milestones.map((milestone, index) => {
                    const isLast = index === milestones.length - 1;
                    const isActive = milestone.status !== 'upcoming';

                    return (
                        <div key={milestone.id} className={`relative pl-12 transition-all duration-300 ${isPending ? 'opacity-40 grayscale' : ''}`}>
                            {/* Timeline dot */}
                            <div className={`absolute -left-[26px] top-0 flex h-12 w-12 items-center justify-center rounded-2xl ring-8 ring-white shadow-lg transition-all
                ${milestone.status === 'completed' ? 'bg-blue-600' :
                                    milestone.status === 'current' ? 'bg-amber-500 animate-pulse' :
                                        'bg-gray-100'}
              `}>
                                {milestone.status === 'completed' ? (
                                    <Check className="h-6 w-6 text-white stroke-[3px]" />
                                ) : milestone.status === 'current' ? (
                                    <Clock className="h-6 w-6 text-white" />
                                ) : (
                                    <div className="h-3 w-3 rounded-full bg-gray-300" />
                                )}
                            </div>

                            {/* Content */}
                            <div
                                onClick={() => isAdmin && onMilestoneClick?.(milestone)}
                                className={`flex flex-col bg-white p-6 rounded-2xl border-2 transition-all group hover:shadow-xl ${isActive ? 'border-gray-50' : 'border-dashed border-gray-100'} ${isAdmin && !isPending ? 'cursor-pointer hover:border-blue-200' : ''}`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <h4 className={`text-lg font-black tracking-tight ${milestone.status === 'upcoming' ? 'text-gray-400' : 'text-gray-900'
                                                }`}>
                                                {milestone.title}
                                            </h4>
                                            {milestone.status === 'current' && (
                                                <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Active</span>
                                            )}
                                            {isAdmin && !isPending && (
                                                <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Click to Log Note</span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500 font-medium">{milestone.description}</p>
                                    </div>
                                    <div className={`mt-2 sm:mt-0 whitespace-nowrap text-xs px-4 py-2 rounded-xl font-bold self-start sm:self-auto shadow-sm ${milestone.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        milestone.status === 'current' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            'bg-gray-50 text-gray-400'
                                        }`}>
                                        {milestone.date}
                                    </div>
                                </div>

                                {/* Clinical Notes Section */}
                                {milestone.notes && (
                                    <div className="mt-6 space-y-4">
                                        <div className="flex items-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] bg-gray-50/50 py-1 px-3 rounded-full w-fit">
                                            <MessageSquare size={12} className="mr-2" />
                                            Clinical Documentation
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(milestone.notes.subjective || milestone.notes.objective) && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                                                        {milestone.notes.subjective?.authorName || milestone.notes.objective?.authorName || 'BHW Field Notes'}
                                                    </p>
                                                    {milestone.notes.subjective && (
                                                        <div className="mb-2">
                                                            <div className="flex items-center text-[9px] text-gray-400 font-bold mb-0.5">
                                                                <Clock size={8} className="mr-1" />
                                                                {formatDate(milestone.notes.subjective.date)}
                                                            </div>
                                                            <p className="text-sm text-gray-600 italic">"{milestone.notes.subjective.content}"</p>
                                                        </div>
                                                    )}
                                                    {milestone.notes.objective && (
                                                        <div>
                                                            <div className="flex items-center text-[9px] text-gray-400 font-bold mb-0.5">
                                                                <Clock size={8} className="mr-1" />
                                                                {formatDate(milestone.notes.objective.date)}
                                                            </div>
                                                            <p className="text-xs font-bold text-gray-800">{milestone.notes.objective.content}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {milestone.notes.physicianLogs && milestone.notes.physicianLogs.length > 0 && (
                                                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Physician Assessments</p>
                                                    <div className="space-y-3">
                                                        {milestone.notes.physicianLogs.slice(0, 3).map((log) => (
                                                            <div key={log.id} className="text-sm border-l-2 border-blue-200 pl-3">
                                                                <div className="flex items-center text-[10px] text-blue-400 font-bold mb-1">
                                                                    <Clock size={10} className="mr-1" />
                                                                    {formatFullDate(log.date)}
                                                                    <span className="ml-2 text-blue-300">— {log.physicianName}</span>
                                                                </div>
                                                                <p className="text-blue-900 font-medium leading-relaxed text-xs">{log.content}</p>
                                                            </div>
                                                        ))}
                                                        {milestone.notes.physicianLogs.length > 3 && (
                                                            <p className="text-[10px] text-blue-500 font-bold italic">+{milestone.notes.physicianLogs.length - 3} more log entries...</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!isActive && !isPending && (
                                    <button className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center hover:text-blue-700 transition-colors opacity-0 group-hover:opacity-100">
                                        Open for Clinical Entry
                                    </button>
                                )}
                            </div>

                            {/* Connector line styling based on status */}
                            {!isLast && (
                                <div className={`absolute top-12 -left-[3px] w-1 h-[calc(100%+8px)] 
                    ${milestone.status === 'completed' ? 'bg-blue-600' : 'bg-gray-100'}
                  `} />
                            )}
                        </div>
                    );
                })}
            </div>

            {isPending && (
                <div className="mt-12 flex items-start space-x-4 bg-amber-50 p-6 rounded-2xl border-2 border-amber-100 text-amber-900 shadow-lg shadow-amber-500/5">
                    <AlertCircle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest mb-1">Timeline Locked</p>
                        <p className="text-sm font-medium text-amber-800/80">
                            The maternal care timeline is suspended. Please finalize the patient's admission to activate clinical tracking and visit logging.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimelineView;
