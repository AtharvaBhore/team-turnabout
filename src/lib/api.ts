// API client for the backend. 
// Change BASE_URL to point to your deployed backend.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Players ────────────────────────────────────────────
export interface PlayerFromDB {
  _id: string;
  name: string;
  active: boolean;
}

export async function fetchPlayers(): Promise<PlayerFromDB[]> {
  const res = await fetch(`${BASE_URL}/players`);
  if (!res.ok) throw new Error('Failed to fetch players');
  return res.json();
}

// ─── Sessions ───────────────────────────────────────────
export interface SessionSummary {
  _id: string;
  players: string[];
  totalRounds: number;
  status: 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface MatchFromDB {
  teamA: string[];
  teamB: string[];
  winner: 'A' | 'B' | null;
}

export interface RoundFromDB {
  roundNumber: number;
  matches: MatchFromDB[];
  sittingOut?: string;
}

export interface SessionDetail extends SessionSummary {
  rounds: RoundFromDB[];
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${BASE_URL}/sessions`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function fetchSession(id: string): Promise<SessionDetail> {
  const res = await fetch(`${BASE_URL}/sessions/${id}`);
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
}

export async function createSession(data: {
  players: string[];
  rounds: any[];
  totalRounds: number;
}): Promise<SessionDetail> {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export async function submitResult(
  sessionId: string,
  roundNumber: number,
  matchIndex: number,
  winner: 'A' | 'B'
): Promise<SessionDetail> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roundNumber, matchIndex, winner }),
  });
  if (!res.ok) throw new Error('Failed to submit result');
  return res.json();
}

// ─── Stats ──────────────────────────────────────────────
export interface PlayerStat {
  name: string;
  wins: number;
  losses: number;
  played: number;
  winPercentage: number;
}

export interface DuoStat {
  duo: string;
  wins: number;
  losses: number;
  played: number;
  winPercentage: number;
}

export interface PlayerTrendPoint {
  sessionDate: string;
  sessionId: string;
  winRate: number;
  wins: number;
  played: number;
}

export async function fetchPlayerStats(): Promise<PlayerStat[]> {
  const res = await fetch(`${BASE_URL}/stats/players`);
  if (!res.ok) throw new Error('Failed to fetch player stats');
  return res.json();
}

export async function fetchDuoStats(): Promise<DuoStat[]> {
  const res = await fetch(`${BASE_URL}/stats/duos`);
  if (!res.ok) throw new Error('Failed to fetch duo stats');
  return res.json();
}

export async function fetchPlayerTrends(): Promise<Record<string, PlayerTrendPoint[]>> {
  const res = await fetch(`${BASE_URL}/stats/players/trend`);
  if (!res.ok) throw new Error('Failed to fetch player trends');
  return res.json();
}
