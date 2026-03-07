const fs = require('fs');

const notes = JSON.parse(fs.readFileSync('tmp_test_notes.json', 'utf8'));

// Dummy milestone to test
const milestone = { id: '84efec22-9ed2-4b66-9c4f-016f3a6704e4', title: '1st Prenatal Visit' };

const mNotes = notes.filter(n =>
    n.milestone_id === milestone.id ||
    (!n.milestone_id && n.title?.includes(milestone.title))
);

const subjectiveNotes = mNotes.filter(n => n.type === 'subjective').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
const objectiveNotes = mNotes.filter(n => n.type === 'objective').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

const subjectiveNote = subjectiveNotes[0];
const objectiveNote = objectiveNotes[0];

const progressLogs = mNotes.filter(n => n !== subjectiveNote && n !== objectiveNote)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());


const mapped = {
    ...milestone,
    notes: {
        subjective: subjectiveNote ? {
            content: subjectiveNote.content,
            date: subjectiveNote.created_at,
            authorName: 'BHW'
        } : null,
        objective: objectiveNote ? {
            content: objectiveNote.content,
            date: objectiveNote.created_at,
            authorName: 'BHW'
        } : null,
        physicianLogs: progressLogs.map(n => ({
            id: n.id,
            date: n.created_at,
            content: n.content,
            physicianName: 'Medical Staff'
        }))
    }
};

console.log(JSON.stringify(mapped, null, 2));
