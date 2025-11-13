// ============================================================
// scheduleGenerator.ts — Smart global pool (Option B)
// - Repeats allowed, dynamic 4-player selection each round
// - Auto-stop when all players have equal match count
// - For N = 5: relaxed hard-streak enforcement (to allow full variety)
// - Hard rest (no 4-in-a-row) enforced for other N
// ============================================================

export interface Match {
  teamA: [string, string];
  teamB: [string, string];
}

export interface Round {
  roundNumber: number;
  matches: Match[];
  sittingOut?: string;
}

export interface Schedule {
  rounds: Round[];
  totalRounds: number;
}

// ---------------- Utility ----------------
function combinations<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  function rec(i: number, path: T[]) {
    if (path.length === k) {
      out.push([...path]);
      return;
    }
    for (let x = i; x < arr.length; x++) {
      path.push(arr[x]);
      rec(x + 1, path);
      path.pop();
    }
  }
  rec(0, []);
  return out;
}

function teamKey(pair: [string, string]) {
  return [...pair].sort().join("|");
}

function matchupKey(a: [string, string], b: [string, string]) {
  return [teamKey(a), teamKey(b)].sort().join("__");
}

// ---------------- Pool generation ----------------
// All 3 splits for every 4-subset
function generateAllGlobalMatchups(players: string[]): Match[] {
  const out: Match[] = [];
  const groups4 = combinations(players, 4);
  for (const g of groups4) {
    const [a, b, c, d] = g;
    out.push({ teamA: [a, b], teamB: [c, d] });
    out.push({ teamA: [a, c], teamB: [b, d] });
    out.push({ teamA: [a, d], teamB: [b, c] });
  }
  return out;
}

// ---------------- Scoring ----------------
// Lower score = more desirable
function scoreMatch(
  m: Match,
  pairCount: Map<string, number>,
  oppCount: Map<string, number>,
  playerLoad: Map<string, number>,
  rnd = 0
): number {
  const [a1, a2] = m.teamA;
  const [b1, b2] = m.teamB;

  const pA = teamKey([a1, a2]);
  const pB = teamKey([b1, b2]);
  const opp = matchupKey(m.teamA, m.teamB);

  // penalize repeated teammate pairs and repeated opponent matchups (we want new ones)
  const pairPenalty = (pairCount.get(pA) || 0) * 5000 + (pairCount.get(pB) || 0) * 5000;
  const oppPenalty = (oppCount.get(opp) || 0) * 2000;

  // fairness: prefer less-loaded players (lower load better)
  const loadScore =
    (playerLoad.get(a1) || 0) +
    (playerLoad.get(a2) || 0) +
    (playerLoad.get(b1) || 0) +
    (playerLoad.get(b2) || 0);

  // deterministic tie-break
  const tie = (a1 + a2 + b1 + b2).length;

  return pairPenalty + oppPenalty + loadScore + tie + rnd;
}

// ---------------- Streak helpers ----------------
function computeEndStreaks(players: string[], chosen: Match[]): Map<string, number> {
  const streaks = new Map<string, number>();
  players.forEach(p => streaks.set(p, 0));
  for (const m of chosen) {
    const playing = new Set([...m.teamA, ...m.teamB]);
    for (const p of players) {
      if (playing.has(p)) streaks.set(p, (streaks.get(p) || 0) + 1);
      else streaks.set(p, 0);
    }
  }
  return streaks;
}

function wouldCreateForbiddenStreak(players: string[], chosen: Match[], next: Match, limit = 3): boolean {
  const s = computeEndStreaks(players, chosen);
  for (const p of [...next.teamA, ...next.teamB]) {
    if ((s.get(p) || 0) >= limit) return true;
  }
  return false;
}

// ---------------- Equality math ----------------
// minimal R such that (4*R) % n == 0
function minimalRoundsForEquality(n: number): number {
  for (let R = 1; R <= 1000; R++) {
    if ((4 * R) % n === 0) return R;
  }
  return n; // fallback
}

function allEqualCounts(map: Map<string, number>): boolean {
  const vals = Array.from(map.values());
  if (vals.length === 0) return false;
  return vals.every(v => v === vals[0]);
}

// ---------------- Soft balancing ----------------
function softBalanceBreaks(players: string[], rounds: Round[]): Round[] {
  if (rounds.length <= 1) return rounds;
  const TARGET = 2;
  const LIMIT = 300;

  function penalty(list: Round[]) {
    const cur = new Map<string, number>();
    const tot = new Map<string, number>();
    players.forEach(p => { cur.set(p, 0); tot.set(p, 0); });
    for (const r of list) {
      const set = new Set([...r.matches[0].teamA, ...r.matches[0].teamB]);
      for (const p of players) {
        if (set.has(p)) {
          const c = (cur.get(p) || 0) + 1;
          cur.set(p, c);
          if (c > TARGET) tot.set(p, (tot.get(p) || 0) + (c - TARGET));
        } else {
          cur.set(p, 0);
        }
      }
    }
    let sum = 0;
    for (const v of tot.values()) sum += v;
    return sum;
  }

  let pen = penalty(rounds);
  for (let attempt = 0; attempt < LIMIT; attempt++) {
    let improved = false;
    for (let i = 0; i < rounds.length - 1; i++) {
      for (let j = i + 1; j < rounds.length; j++) {
        const tmp = rounds[i];
        rounds[i] = rounds[j];
        rounds[j] = tmp;
        const newPen = penalty(rounds);
        if (newPen < pen) {
          pen = newPen;
          improved = true;
          break;
        } else {
          rounds[j] = rounds[i];
          rounds[i] = tmp;
        }
      }
      if (improved) break;
    }
    if (!improved) break;
  }
  return rounds;
}

// ---------------- Hard repair ----------------
function enforceMaxStreak(rounds: Round[], players: string[], limit: number): boolean {
  const MAX_SWAPS = 500;
  function computeMax(list: Round[]) {
    const streak = new Map<string, number>();
    const maxStreak = new Map<string, number>();
    players.forEach(p => { streak.set(p, 0); maxStreak.set(p, 0); });
    for (const r of list) {
      const set = new Set([...r.matches[0].teamA, ...r.matches[0].teamB]);
      for (const p of players) {
        if (set.has(p)) {
          const v = (streak.get(p) || 0) + 1;
          streak.set(p, v);
          maxStreak.set(p, Math.max(maxStreak.get(p) || 0, v));
        } else {
          streak.set(p, 0);
        }
      }
    }
    return maxStreak;
  }

  let maxStreak = computeMax(rounds);
  for (let attempt = 0; attempt < MAX_SWAPS; attempt++) {
    const offenders = [...maxStreak.entries()].filter(([_, v]) => v > limit);
    if (offenders.length === 0) return true;
    const player = offenders[0][0];

    // find run
    let start = -1, len = 0;
    for (let i = 0; i < rounds.length; i++) {
      const plays = rounds[i].matches[0].teamA.includes(player) || rounds[i].matches[0].teamB.includes(player);
      if (plays) {
        if (start === -1) start = i;
        len++;
      } else {
        start = -1;
        len = 0;
      }
      if (len > limit) break;
    }
    if (len <= limit) break;
    const badIndex = start + len - 1;
    let swapWith = -1;
    for (let j = badIndex + 1; j < rounds.length; j++) {
      const plays = rounds[j].matches[0].teamA.includes(player) || rounds[j].matches[0].teamB.includes(player);
      if (!plays) { swapWith = j; break; }
    }
    if (swapWith === -1) {
      for (let j = 0; j < start; j++) {
        const plays = rounds[j].matches[0].teamA.includes(player) || rounds[j].matches[0].teamB.includes(player);
        if (!plays) { swapWith = j; break; }
      }
    }
    if (swapWith === -1) return false;
    const tmp = rounds[badIndex];
    rounds[badIndex] = rounds[swapWith];
    rounds[swapWith] = tmp;
    maxStreak = computeMax(rounds);
  }
  return [...computeMax(rounds).values()].every(v => v <= limit);
}

// ---------------- Main scheduler (Smart) ----------------
export function generateSchedule(players: string[]): Schedule {
  if (players.length < 4) throw new Error("At least 4 players needed.");
  const n = players.length;

  // trivial n==4
  if (n === 4) {
    const [a, b, c, d] = players;
    const matches: Match[] = [
      { teamA: [a, b], teamB: [c, d] },
      { teamA: [a, c], teamB: [b, d] },
      { teamA: [a, d], teamB: [b, c] },
    ];
    return { rounds: matches.map((m, i) => ({ roundNumber: i + 1, matches: [m] })), totalRounds: 3 };
  }

  const pool = generateAllGlobalMatchups(players);
  if (pool.length === 0) return { rounds: [], totalRounds: 0 };

  // minimal rounds for equality (e.g., n=5 -> minimalRoundsForEquality=5)
  const minEqualRounds = minimalRoundsForEquality(n);
  // ensure variety: 3*(n-1)
  const minVarietyRounds = 3 * (n - 1);
  // use the larger as minimum; it ensures both fairness and variety
  const minRounds = Math.max(minEqualRounds, minVarietyRounds);
  // small upper cap: allow a bit more room to repair
  const upperCap = minRounds + n;

  const MAX_ATTEMPTS = 400;
  const isFive = n === 5; // special-case: relaxed streak enforcement for n=5

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rndSeed = attempt * 31 + 7;

    const pairCount = new Map<string, number>();
    const oppCount = new Map<string, number>();
    const playerLoad = new Map<string, number>();
    players.forEach(p => playerLoad.set(p, 0));

    const chosen: Match[] = [];

    let stuck = false;

    // We will try to build up to upperCap rounds, but we stop earlier if equality reached
    while (chosen.length < upperCap) {
      // stop condition: we have at least minRounds AND all counts equal
      const loadsArr = Array.from(playerLoad.values());
      const haveEqual = loadsArr.length ? loadsArr.every(v => v === loadsArr[0]) : false;
      if (chosen.length >= minRounds && haveEqual) break;

      // Score pool with a tiny randomized tie-break
      const scored = pool.map(m => ({
        m,
        score: scoreMatch(m, pairCount, oppCount, playerLoad, ((m.teamA.join("") + m.teamB.join("")).length % 13) ^ rndSeed)
      })).sort((a, b) => a.score - b.score);

      // Pick best candidate that doesn't create forbidden streak (unless isFive)
      let pick: Match | null = null;

      // current min/max loads
      const loads = Array.from(playerLoad.values());
      const curMin = loads.length ? Math.min(...loads) : 0;
      const curMax = loads.length ? Math.max(...loads) : 0;
      const curDiff = curMax - curMin;

      for (const s of scored) {
        const candidate = s.m;
        if (!isFive && wouldCreateForbiddenStreak(players, chosen, candidate, 3)) continue;

        // simulate loads
        const sim = new Map(playerLoad);
        for (const p of [...candidate.teamA, ...candidate.teamB]) sim.set(p, (sim.get(p) || 0) + 1);
        const simVals = Array.from(sim.values());
        const simMin = Math.min(...simVals);
        const simMax = Math.max(...simVals);
        const simDiff = simMax - simMin;

        // Accept candidate if it does not increase imbalance beyond 1 or it reduces imbalance
        if (simDiff <= curDiff || simDiff <= 1) {
          pick = candidate;
          break;
        }
      }

      // fallback: pick first non-streak if none satisfies balance
      if (!pick) {
        for (const s of scored) {
          if (isFive || !wouldCreateForbiddenStreak(players, chosen, s.m, 3)) { pick = s.m; break; }
        }
      }

      if (!pick) { stuck = true; break; }

      // accept pick
      chosen.push(pick);

      // update counters
      const pairA = teamKey(pick.teamA);
      const pairB = teamKey(pick.teamB);
      pairCount.set(pairA, (pairCount.get(pairA) || 0) + 1);
      pairCount.set(pairB, (pairCount.get(pairB) || 0) + 1);

      const opp = matchupKey(pick.teamA, pick.teamB);
      oppCount.set(opp, (oppCount.get(opp) || 0) + 1);

      for (const p of [...pick.teamA, ...pick.teamB]) playerLoad.set(p, (playerLoad.get(p) || 0) + 1);
    }

    if (stuck) continue;

    // After generation, try extra fills if not equal yet
    if (!allEqualCounts(playerLoad)) {
      let extraAttempts = 0;
      const EXTRA_LIMIT = 200;
      while (!allEqualCounts(playerLoad) && chosen.length < upperCap && extraAttempts < EXTRA_LIMIT) {
        extraAttempts++;
        const scored = pool.map(m => ({
          m,
          score: scoreMatch(m, pairCount, oppCount, playerLoad, ((m.teamA.join("") + m.teamB.join("")).length % 17) ^ rndSeed)
        })).sort((a, b) => a.score - b.score);

        let pick: Match | null = null;
        const loads = Array.from(playerLoad.values());
        const curMin = Math.min(...loads), curMax = Math.max(...loads), curDiff = curMax - curMin;
        for (const s of scored) {
          if (!isFive && wouldCreateForbiddenStreak(players, chosen, s.m, 3)) continue;
          const sim = new Map(playerLoad);
          for (const p of [...s.m.teamA, ...s.m.teamB]) sim.set(p, (sim.get(p) || 0) + 1);
          const vals = Array.from(sim.values());
          const simDiff = Math.max(...vals) - Math.min(...vals);
          if (simDiff <= curDiff) { pick = s.m; break; }
        }
        if (!pick) break;
        chosen.push(pick);
        const pairA = teamKey(pick.teamA); const pairB = teamKey(pick.teamB);
        pairCount.set(pairA, (pairCount.get(pairA) || 0) + 1);
        pairCount.set(pairB, (pairCount.get(pairB) || 0) + 1);
        const opp = matchupKey(pick.teamA, pick.teamB);
        oppCount.set(opp, (oppCount.get(opp) || 0) + 1);
        for (const p of [...pick.teamA, ...pick.teamB]) playerLoad.set(p, (playerLoad.get(p) || 0) + 1);
      }
    }

    // final check: are counts equal?
    if (!allEqualCounts(playerLoad)) {
      // fail this attempt, try next
      continue;
    }

    // build rounds
    let rounds: Round[] = chosen.map((m, i) => {
      const playing = new Set([...m.teamA, ...m.teamB]);
      const sitting = players.filter(p => !playing.has(p));
      return { roundNumber: i + 1, matches: [m], sittingOut: sitting.join(", ") };
    });

    // soft balance
    rounds = softBalanceBreaks(players, rounds);

    // HARD REPAIR: only enforce for non-5 players
    if (!isFive) {
      const repaired = enforceMaxStreak(rounds, players, 3);
      if (!repaired) continue;
    }

    // success
    return { rounds: rounds.map((r, i) => ({ ...r, roundNumber: i + 1 })), totalRounds: rounds.length };
  }

  // fallback (should be rare)
  console.warn("scheduleGenerator: all attempts failed — returning empty schedule.");
  return { rounds: [], totalRounds: 0 };
}

// ---------------- Stats & validation ----------------
function playsIn(round: Round, p: string) {
  const m = round.matches[0];
  return m.teamA.includes(p) || m.teamB.includes(p);
}

export function calculatePlayerStats(players: string[], schedule: Schedule) {
  return players.map(p => {
    let total = 0, sit = 0;
    for (const r of schedule.rounds) playsIn(r, p) ? total++ : sit++;
    return { name: p, totalMatches: total, sitsOut: sit };
  });
}

export function validateSchedule(schedule: Schedule, players: string[]) {
  const counts = new Map<string, number>();
  players.forEach(p => counts.set(p, 0));
  schedule.rounds.forEach(r => {
    const m = r.matches[0];
    [...m.teamA, ...m.teamB].forEach(p => counts.set(p, (counts.get(p) || 0) + 1));
  });
  const vals = Array.from(counts.values());
  const min = Math.min(...vals), max = Math.max(...vals);
  return { valid: max - min <= 1, errors: max - min > 1 ? ["Fairness issue"] : [] };
}
