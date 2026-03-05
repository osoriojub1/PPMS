export interface Referral {
    id: string;
    patientName: string;
    mi?: string;
    age: number;
    barangay: string;
    referredDate: string;
    status: 'Pending' | 'Admitted';
    purok?: string;
    physicianInCharge?: string;
    recommendedPhysician?: string;
    cycles?: PregnancyCycle[];
    subjective?: string;
    objective?: string;
}

export const mockReferrals: Referral[] = [
    {
        id: "ref-001",
        patientName: "Maria Santos",
        mi: "A",
        barangay: "Poblacion",
        age: 28,
        referredDate: "2026-03-20T08:30:00Z",
        status: "Pending",
        purok: "Purok 1",
        subjective: "Patient reports frequent urination and slight back pain.",
        objective: "BP 120/80, FHT 148 bpm. Weight 65kg.",
        cycles: [
            {
                id: "cycle-m-1",
                startDate: "2025-12-15",
                status: "Active",
                estimatedDue: "2026-09-15",
                milestones: [
                    { id: 1, title: '1st Trimester Contact', description: 'Initial checkup.', date: 'Dec 20, 2025', status: 'completed', notes: { subjective: { content: "Morning sickness.", date: "2025-12-20T08:00:00Z" }, objective: { content: "Healthy fetal heart tone.", date: "2025-12-20T08:30:00Z" } } },
                    { id: 2, title: '2nd Trimester Contact', description: 'Monitoring fetal growth.', date: 'Pending', status: 'current' },
                    { id: 3, title: '3rd Trimester Contacts', description: 'Third trimester prep.', date: 'Pending', status: 'upcoming' },
                    { id: 4, title: 'Postnatal Visits', description: 'Aftercare.', date: 'Pending', status: 'upcoming' }
                ],
                labs: []
            }
        ]
    },
    {
        id: "ref-002",
        patientName: "Juana Dela Cruz",
        mi: "B",
        barangay: "Tabao",
        age: 32,
        referredDate: "2026-03-19T14:15:00Z",
        status: "Pending",
        purok: "Purok 3",
        subjective: "Occasional dizziness and swelling of feet.",
        objective: "BP 130/80, Trace edema on both ankles.",
        cycles: [
            {
                id: "cycle-j-1",
                startDate: "2025-11-20",
                status: "Active",
                estimatedDue: "2026-08-22",
                milestones: [
                    { id: 1, title: '1st Trimester Contact', description: 'Initial checkup.', date: 'Nov 25, 2025', status: 'completed' },
                    { id: 2, title: '2nd Trimester Contact', description: 'Monitoring fetal growth.', date: 'Feb 15, 2026', status: 'completed' },
                    { id: 3, title: '3rd Trimester Contacts', description: 'Third trimester prep.', date: 'Pending', status: 'current' },
                    { id: 4, title: 'Postnatal Visits', description: 'Follow-up care.', date: 'Pending', status: 'upcoming' }
                ],
                labs: []
            }
        ]
    },
    {
        id: "ref-003",
        patientName: "Ana Reyes",
        mi: "C",
        barangay: "Alijis",
        age: 24,
        referredDate: "2024-03-19T09:45:00Z",
        status: "Pending",
        purok: "Purok 2",
        cycles: [
            {
                id: "cycle-a-1",
                startDate: "2024-01-05",
                status: "Active",
                estimatedDue: "2024-10-05",
                milestones: []
            }
        ]
    }
];

export interface PregnancyCycle {
    id: string;
    startDate: string;
    endDate?: string;
    status: 'Active' | 'Completed';
    estimatedDue?: string;
    milestones: {
        id: number;
        title: string;
        description: string;
        date: string;
        status: 'completed' | 'current' | 'upcoming';
        notes?: {
            subjective?: {
                content: string;
                date: string;
            };
            objective?: {
                content: string;
                date: string;
            };
            physicianLogs?: {
                id: string;
                date: string;
                content: string;
                physicianName: string;
            }[];
        };
    }[];
    labs?: {
        id: number;
        test: string;
        dueDate: string;
        status: 'Scheduled' | 'Completed' | 'Delayed';
        result?: string;
    }[];
}

export interface Patient {
    id: string;
    patientName: string;
    mi?: string;
    age: number;
    barangay: string;
    admittedDate: string;
    status: 'Active' | 'Completed';
    purok?: string;
    physicianInCharge?: string;
    cycles?: PregnancyCycle[];
}

export const mockPatients: Patient[] = [
    {
        id: "pat-101",
        patientName: "Lourdes Garcia",
        mi: "M",
        barangay: "Poblacion",
        age: 29,
        admittedDate: "2026-03-15T10:00:00Z",
        status: "Active",
        purok: "Purok 4",
        cycles: [
            {
                id: "cycle-2024",
                startDate: "2025-10-15",
                status: "Active",
                estimatedDue: "2026-07-10",
                milestones: [
                    {
                        id: 1,
                        title: '1st Trimester Contact',
                        description: 'Initial prenatal visit, comprehensive checkup.',
                        date: 'Dec 15, 2025',
                        status: 'completed',
                        notes: {
                            subjective: {
                                content: "Patient reports mild morning sickness and fatigue.",
                                date: "2025-12-15T09:00:00Z"
                            },
                            objective: {
                                content: "BP 110/70, Weight 62kg. Clear breath sounds.",
                                date: "2025-12-15T09:15:00Z"
                            },
                            physicianLogs: [
                                {
                                    id: "log-1",
                                    date: "2025-12-15T10:30:00Z",
                                    content: "Prescribed ferrous sulfate and folic acid. Encouraged healthy diet.",
                                    physicianName: "Dr. Maria Santos"
                                }
                            ]
                        }
                    },
                    {
                        id: 2,
                        title: '2nd Trimester Contact',
                        description: 'Routine checkup, fetal heart tone monitoring.',
                        date: 'Mar 22, 2026',
                        status: 'current',
                        notes: {
                            subjective: {
                                content: "Feels active fetal movements. No headaches or blurring of vision.",
                                date: "2026-03-22T08:30:00Z"
                            },
                            objective: {
                                content: "BP 120/80. FHT 145 bpm. Fundic height 20cm.",
                                date: "2026-03-22T08:45:00Z"
                            }
                        }
                    },
                    { id: 3, title: '3rd Trimester Contacts (3 visits)', description: 'Frequent monitoring, birth plan presentation.', date: 'Pending', status: 'upcoming' },
                    { id: 4, title: 'Postnatal Visits', description: 'Follow-up care for mother and newborn.', date: 'Pending', status: 'upcoming' }
                ],
                labs: [
                    { id: 1, test: 'Standard Prenatal Lab Panel', dueDate: 'Jan 10, 2026', status: 'Completed', result: 'All within normal range. Hemoglobin 12.5 g/dL.' },
                    { id: 2, test: 'OGTT (Glucose Test)', dueDate: 'Apr 15, 2026', status: 'Scheduled' }
                ]
            },
            {
                id: "cycle-2022",
                startDate: "2021-05-10",
                endDate: "2022-02-14",
                status: "Completed",
                estimatedDue: "2022-02-10",
                milestones: [
                    { id: 1, title: '1st Trimester Contact', description: 'Initial prenatal visit.', date: 'Aug 10, 2021', status: 'completed' },
                    { id: 2, title: '2nd Trimester Contact', description: 'Routine checkup.', date: 'Nov 15, 2021', status: 'completed' },
                    { id: 3, title: '3rd Trimester Contacts', description: 'Monitoring.', date: 'Jan 20, 2022', status: 'completed' },
                    { id: 4, title: 'Postnatal Visits', description: 'Follow-up.', date: 'Feb 14, 2022', status: 'completed' }
                ],
                labs: [
                    { id: 1, test: 'Comprehensive Blood Count', dueDate: 'Aug 15, 2021', status: 'Completed', result: 'Normal' },
                    { id: 2, test: 'Urinalysis', dueDate: 'Nov 20, 2021', status: 'Completed', result: 'Normal' }
                ]
            }
        ]
    },
    {
        id: "pat-102",
        patientName: "Rosa Mendoza",
        mi: "S",
        barangay: "Bayabas",
        age: 35,
        admittedDate: "2026-03-10T11:30:00Z",
        status: "Active",
        purok: "Purok 5",
        cycles: [
            {
                id: "cycle-r-1",
                startDate: "2025-09-10",
                status: "Active",
                estimatedDue: "2026-06-18",
                milestones: [
                    { id: 1, title: '1st Trimester Contact', description: 'Standard visit.', date: 'Oct 05, 2025', status: 'completed' },
                    { id: 2, title: '2nd Trimester Contact', description: 'Monitoring.', date: 'Jan 15, 2026', status: 'completed' },
                    { id: 3, title: '3rd Trimester Contacts', description: 'Final stretch.', date: 'Mar 10, 2026', status: 'current' }
                ]
            },
            {
                id: "cycle-r-prev",
                startDate: "2020-01-01",
                endDate: "2020-10-10",
                status: "Completed",
                estimatedDue: "2020-10-05",
                milestones: [
                    { id: 1, title: '1st Trimester Contact', description: 'First pregnancy checkup.', date: 'Feb 15, 2020', status: 'completed' },
                    { id: 4, title: 'Postnatal Visits', description: 'Post-birth visit.', date: 'Oct 10, 2020', status: 'completed' }
                ]
            }
        ]
    },
    {
        id: "pat-103",
        patientName: "Carmen Bautista",
        mi: "P",
        barangay: "Tabao",
        age: 22,
        admittedDate: "2024-01-20T08:00:00Z",
        status: "Completed",
        purok: "Purok 1",
        cycles: [
            {
                id: "cycle-c-1",
                startDate: "2023-05-20",
                endDate: "2024-02-14",
                status: "Completed",
                estimatedDue: "2024-02-14",
                milestones: [
                    { id: 1, title: 'Postnatal Visits', description: 'Follow-up.', date: 'Feb 14, 2024', status: 'completed' }
                ]
            }
        ]
    }
];

export interface UserAccount {
    id: string;
    name: string;
    username?: string;
    password?: string;
    email?: string;
    role: 'mho_admin' | 'bhw';
    barangay?: string;
    status: 'Active' | 'Inactive';
    lastLogin: string;
}

export const mockUsers: UserAccount[] = [
    {
        id: 'user-1',
        name: 'Dr. Maria Santos',
        email: 'maria.santos@valladolid.gov.ph',
        password: 'password123',
        role: 'mho_admin',
        status: 'Active',
        lastLogin: '2024-03-20T08:30:00Z',
    },
    {
        id: 'user-2',
        name: 'Juana Dela Cruz',
        username: 'juana_bhw',
        password: 'password123',
        role: 'bhw',
        barangay: 'Tabao',
        status: 'Active',
        lastLogin: '2024-03-19T14:45:00Z',
    },
    {
        id: 'user-3',
        name: 'Elena Ramos',
        username: 'elena_bhw',
        password: 'password123',
        role: 'bhw',
        barangay: 'Poblacion',
        status: 'Active',
        lastLogin: '2024-03-20T09:15:00Z',
    },
    {
        id: 'user-4',
        name: 'Ricardo Gomez',
        username: 'ricardo_bhw',
        password: 'password123',
        role: 'bhw',
        barangay: 'Bayabas',
        status: 'Inactive',
        lastLogin: '2024-02-28T11:00:00Z',
    },
];
