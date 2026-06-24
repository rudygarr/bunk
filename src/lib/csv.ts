import type { AttendeeKind, Gender } from './types';

export interface ParsedCamper {
  name: string;
  email?: string;
  kind: AttendeeKind;
  grade?: number;
  gender?: Gender;
  friends?: string;
}

// Minimal CSV parser with quoted-field support — enough for a pasted/exported
// roster. First non-empty row is treated as headers.
function splitRow(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
function pickGender(v: string): Gender | undefined {
  const x = v.toLowerCase();
  if (x.startsWith('m') || x === 'boy') return 'male';
  if (x.startsWith('f') || x === 'girl') return 'female';
  if (x) return 'other';
  return undefined;
}
function pickKind(v: string): AttendeeKind {
  const x = v.toLowerCase();
  if (x.startsWith('staff') || x.startsWith('counsel') || x.startsWith('lead')) return 'staff';
  if (x.startsWith('parent') || x.startsWith('volunteer')) return 'parent';
  if (x.startsWith('guest') || x.startsWith('speaker')) return 'guest';
  return 'camper';
}

export interface CsvResult { rows: ParsedCamper[]; skipped: number; columns: string[] }

export function parseCsv(text: string): CsvResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { rows: [], skipped: 0, columns: [] };
  const headers = splitRow(lines[0]).map(norm);
  const col = (...names: string[]) => headers.findIndex((h) => names.includes(h));
  const ci = {
    name: col('name', 'fullname', 'camper', 'student'),
    first: col('first', 'firstname'),
    last: col('last', 'lastname', 'surname'),
    email: col('email', 'emailaddress', 'parentemail'),
    kind: col('kind', 'type', 'role'),
    grade: col('grade', 'gradelevel', 'age'),
    gender: col('gender', 'sex'),
    friends: col('friends', 'friend', 'bunkmate', 'request', 'friendrequest'),
  };
  const rows: ParsedCamper[] = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const f = splitRow(lines[i]);
    let name = ci.name >= 0 ? f[ci.name] : '';
    if (!name && ci.first >= 0) name = [f[ci.first], ci.last >= 0 ? f[ci.last] : ''].filter(Boolean).join(' ');
    if (!name) { skipped++; continue; }
    const gradeRaw = ci.grade >= 0 ? f[ci.grade] : '';
    const grade = gradeRaw && !isNaN(Number(gradeRaw)) ? Number(gradeRaw) : undefined;
    rows.push({
      name,
      email: ci.email >= 0 ? f[ci.email] || undefined : undefined,
      kind: ci.kind >= 0 ? pickKind(f[ci.kind]) : 'camper',
      grade,
      gender: ci.gender >= 0 ? pickGender(f[ci.gender]) : undefined,
      friends: ci.friends >= 0 ? f[ci.friends] || undefined : undefined,
    });
  }
  return { rows, skipped, columns: splitRow(lines[0]) };
}
