// Classroom data access — Teacher mode, first slice. Backed by the tables and
// RLS in supabase/migrations/0026_classroom.sql:
//   - a self-declared teacher (row in `teachers`) creates classes with a join
//     code they choose and may change (0028; rules in classCode.ts). Class
//     names and codes are unique system-wide.
//   - a signed-in student joins with the code through the `join_class` RPC;
//     the teacher may remove a student, optionally blocking their account
//     from that class (0028's class_blocks + remove_class_member RPC)
//   - a class idle for 6 months is deleted server-side (0028); the screen
//     warns ahead of it from `lastActivityAt` (classActivity.ts)
//   - the teacher assigns homework (a DrillConfig as jsonb); members read it
//   - a student posts one `homework_attempts` row per finished run; the
//     class's teacher reads them all (the "who practised" list)
//
// Every helper no-ops / returns an empty result when `supabase` is null, so a
// config-less guest build never breaks. Errors are thrown to the caller (the
// Class screen shows them); there is no local cache — the whole feature is
// online-only by nature (it exists to move results between two people).

import { supabase } from '../utils/supabase';
import type { DrillConfig } from '../drill/DrillConfig';
import type { InstrumentId } from '../utils/instruments';

export interface ClassRow {
  id: string;
  name: string;
  code: string;
  teacherName: string | null;
  teacherId: string;
  createdAt: string;
  /** Last homework attempt / student join / homework assigned (0028). */
  lastActivityAt: string;
}

export interface BlockedRow {
  userId: string;
  displayName: string;
  blockedAt: string;
}

export interface MemberRow {
  userId: string;
  displayName: string;
  joinedAt: string;
}

export interface HomeworkRow {
  id: string;
  classId: string;
  title: string;
  instrumentId: string;
  /** Raw stored jsonb — run it only through `parseHomeworkDrill`. */
  drill: unknown;
  dueOn: string | null;
  createdAt: string;
}

export interface AttemptRow {
  homework_id: string;
  user_id: string;
  correct: number;
  total: number;
  seconds: number;
  created_at: string;
}

interface DbClass {
  id: string; name: string; code: string; teacher_name: string | null;
  teacher_id: string; created_at: string; last_activity_at: string;
}
interface DbHomework {
  id: string; class_id: string; title: string; instrument_id: string;
  drill: unknown; due_on: string | null; created_at: string;
}

const toClass = (r: DbClass): ClassRow => ({
  id: r.id, name: r.name, code: r.code, teacherName: r.teacher_name,
  teacherId: r.teacher_id, createdAt: r.created_at, lastActivityAt: r.last_activity_at,
});
const toHomework = (r: DbHomework): HomeworkRow => ({
  id: r.id, classId: r.class_id, title: r.title, instrumentId: r.instrument_id,
  drill: r.drill, dueOn: r.due_on, createdAt: r.created_at,
});

const CLASS_COLS = 'id, name, code, teacher_name, teacher_id, created_at, last_activity_at';
const HOMEWORK_COLS = 'id, class_id, title, instrument_id, drill, due_on, created_at';

// ── Teacher role ────────────────────────────────────────────────────────

export interface TeacherStatus {
  isTeacher: boolean;
  /** Admin-granted manual override (a partnership grant), not the automatic rule. */
  verified: boolean;
  /** Premium is active via the 'teacher' entitlement source — automatic or verified. */
  premiumActive: boolean;
}

export async function fetchTeacherStatus(userId: string): Promise<TeacherStatus> {
  if (!supabase) return { isTeacher: false, verified: false, premiumActive: false };
  const [{ data, error }, { data: ent, error: entError }] = await Promise.all([
    supabase.from('teachers').select('verified_at').eq('user_id', userId).maybeSingle(),
    supabase.from('entitlements').select('tier, source').eq('user_id', userId).maybeSingle(),
  ]);
  if (error) throw error;
  if (entError) throw entError;
  return {
    isTeacher: !!data,
    verified: !!data?.verified_at,
    premiumActive: ent?.tier === 'premium' && ent?.source === 'teacher',
  };
}

/** Self-declare as a teacher. Idempotent: an existing row is left as it is. */
export async function becomeTeacher(userId: string, displayName: string | null): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('teachers')
    .upsert({ user_id: userId, display_name: displayName?.slice(0, 60) ?? null },
      { onConflict: 'user_id', ignoreDuplicates: true });
  if (error) throw error;
}

// ── Classes ─────────────────────────────────────────────────────────────

export async function fetchTeachingClasses(userId: string): Promise<ClassRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('classes').select(CLASS_COLS).eq('teacher_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbClass[]).map(toClass);
}

/** Classes this user has joined as a student. */
export async function fetchJoinedClasses(userId: string): Promise<ClassRow[]> {
  if (!supabase) return [];
  const { data: mem, error: memErr } = await supabase
    .from('class_members').select('class_id').eq('user_id', userId);
  if (memErr) throw memErr;
  const ids = (mem ?? []).map((m) => m.class_id as string);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('classes').select(CLASS_COLS).in('id', ids)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbClass[]).map(toClass);
}

/** Why the server refused a class name/code write, so the form can say so. */
export type ClassWriteProblem = 'nameTaken' | 'codeTaken' | 'codeInvalid';

export class ClassWriteError extends Error {
  readonly problem: ClassWriteProblem;
  constructor(problem: ClassWriteProblem) {
    super(problem);
    this.problem = problem;
  }
}

/** Maps a Postgres unique/check violation on `classes` (0026/0028 names) to a
 *  ClassWriteError; anything else is rethrown as it came. */
function classWriteError(error: { code?: string; message?: string }): Error {
  const msg = error.message ?? '';
  if (error.code === '23505' && msg.includes('classes_name_unique')) return new ClassWriteError('nameTaken');
  if (error.code === '23505' && msg.includes('classes_code_key')) return new ClassWriteError('codeTaken');
  if (error.code === '23514' && msg.includes('classes_code_format')) return new ClassWriteError('codeInvalid');
  return error as Error;
}

export async function createClass(name: string, code: string, teacherName: string | null): Promise<ClassRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('classes')
    .insert({ name: name.trim().slice(0, 60), code, teacher_name: teacherName?.slice(0, 60) ?? null })
    .select(CLASS_COLS).single();
  if (error) throw classWriteError(error);
  return toClass(data as DbClass);
}

/** Replace a class's join code. Old invite links stop working; members stay. */
export async function changeClassCode(classId: string, code: string): Promise<ClassRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('classes').update({ code }).eq('id', classId)
    .select(CLASS_COLS).single();
  if (error) throw classWriteError(error);
  return toClass(data as DbClass);
}

export async function deleteClass(classId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('classes').delete().eq('id', classId);
  if (error) throw error;
}

export type JoinOutcome =
  | { kind: 'joined'; classId: string; name: string }
  | { kind: 'notFound' }
  | { kind: 'ownClass' }
  | { kind: 'blocked' }
  | { kind: 'tooManyAttempts' };

export async function joinClass(code: string, displayName: string): Promise<JoinOutcome> {
  if (!supabase) return { kind: 'notFound' };
  const { data, error } = await supabase.rpc('join_class', {
    join_code: code, member_name: displayName,
  });
  if (error) {
    if (error.message?.includes('own class')) return { kind: 'ownClass' };
    if (error.message?.includes('blocked')) return { kind: 'blocked' };
    if (error.message?.includes('too many attempts')) return { kind: 'tooManyAttempts' };
    throw error;
  }
  const row = (data as Array<{ id: string; name: string }> | null)?.[0];
  return row ? { kind: 'joined', classId: row.id, name: row.name } : { kind: 'notFound' };
}

export async function leaveClass(classId: string, userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('class_members').delete().eq('class_id', classId).eq('user_id', userId);
  if (error) throw error;
}

export async function fetchMembers(classId: string): Promise<MemberRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('class_members').select('user_id, display_name, joined_at')
    .eq('class_id', classId).order('display_name');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    userId: r.user_id as string, displayName: r.display_name as string, joinedAt: r.joined_at as string,
  }));
}

/** Teacher: remove a student; `block` also bars their account from rejoining
 *  this class, whatever its code becomes. */
export async function removeMember(classId: string, userId: string, block: boolean): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('remove_class_member', { cid: classId, member: userId, block });
  if (error) throw error;
}

export async function fetchBlocked(classId: string): Promise<BlockedRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('class_blocks').select('user_id, display_name, blocked_at')
    .eq('class_id', classId).order('blocked_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    userId: r.user_id as string, displayName: r.display_name as string, blockedAt: r.blocked_at as string,
  }));
}

/** Lift a block. The student is not re-added — they can join with the code again. */
export async function unblockMember(classId: string, userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('class_blocks').delete().eq('class_id', classId).eq('user_id', userId);
  if (error) throw error;
}

// ── Homework ────────────────────────────────────────────────────────────

export async function fetchHomework(classId: string): Promise<HomeworkRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('homework').select(HOMEWORK_COLS).eq('class_id', classId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbHomework[]).map(toHomework);
}

export async function assignHomework(input: {
  classId: string; title: string; instrumentId: InstrumentId; drill: DrillConfig; dueOn: string | null;
}): Promise<HomeworkRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('homework')
    .insert({
      class_id: input.classId,
      title: input.title.trim().slice(0, 80),
      instrument_id: input.instrumentId,
      drill: input.drill,
      due_on: input.dueOn,
    })
    .select(HOMEWORK_COLS).single();
  if (error) throw error;
  return toHomework(data as DbHomework);
}

export async function deleteHomework(homeworkId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('homework').delete().eq('id', homeworkId);
  if (error) throw error;
}

// ── Attempts ────────────────────────────────────────────────────────────

/** Every attempt in a class the caller may read: all of them for the class's
 *  teacher, only their own for a student (RLS decides). */
export async function fetchAttempts(classId: string): Promise<AttemptRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('homework_attempts')
    .select('homework_id, user_id, correct, total, seconds, created_at')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AttemptRow[];
}

export async function submitAttempt(input: {
  homeworkId: string; classId: string; userId: string; correct: number; total: number; seconds: number;
}): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('homework_attempts').insert({
    homework_id: input.homeworkId,
    class_id: input.classId,
    user_id: input.userId,
    correct: input.correct,
    total: input.total,
    seconds: Math.max(0, Math.round(input.seconds)),
  });
  if (error) throw error;
}
