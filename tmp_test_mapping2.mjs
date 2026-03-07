import fs from 'fs';

const notes = JSON.parse(fs.readFileSync('tmp_test_notes.json', 'utf8'));
const mNotes = notes.filter(n => n.milestone_id === '84efec22-9ed2-4b66-9c4f-016f3a6704e4');

const subjectiveNotes = mNotes.filter(n => n.type === 'subjective').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
const objectiveNotes = mNotes.filter(n => n.type === 'objective').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

const subjectiveNote = subjectiveNotes[0];
const objectiveNote = objectiveNotes[0];

const progressLogs = mNotes.filter(n => n !== subjectiveNote && n !== objectiveNote)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

console.log(`Total mNotes: ${mNotes.length}`);
console.log(`Subjective Note: ${subjectiveNote?.content}`);
console.log(`Objective Note: ${objectiveNote?.content}`);
console.log(`Progress Logs: ${progressLogs.length}`);
progressLogs.forEach(n => console.log(` - ${n.type}: ${n.content}`));
