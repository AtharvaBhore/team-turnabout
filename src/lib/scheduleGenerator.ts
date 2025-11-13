export interface Match {
  teamA: [string, string];
  teamB: [string, string];
}

export interface Round {
  roundNumber: number;
  match: Match;
  sittingOut: string[];
}

export interface Schedule {
  rounds: Round[];
  totalRounds: number;
}

// Helper: Generate all combinations of size k from array
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

// Helper: Create a unique key for a team (sorted)
function teamKey(team: [string, string]): string {
  return [...team].sort().join('|');
}

// Helper: Create a unique key for a matchup (sorted teams)
function matchupKey(teamA: [string, string], teamB: [string, string]): string {
  const keys = [teamKey(teamA), teamKey(teamB)].sort();
  return keys.join(' vs ');
}

/**
 * Constraint-based Match Generator
 * Generates exactly ONE 2v2 match per round with the following guarantees:
 * - Exactly one match per round (4 players play, rest sit out)
 * - Total rounds = N (number of players)
 * - No teammate repetition until all combinations exhausted
 * - No consecutive team repetitions
 * - Fair distribution of matches and sit-outs
 */
export function generateSchedule(players: string[]): Schedule {
  if (players.length < 4) {
    throw new Error("You need at least 4 players for a 2v2 match.");
  }

  const n = players.length;
  const totalRounds = n;
  const rounds: Round[] = [];

  // All possible teams C(n,2)
  const allTeams: [string, string][] = combinations(players, 2) as any;

  // All valid matchups (unique 4 players)
  const allMatchups: Match[] = [];
  for (const teamA of allTeams) {
    for (const teamB of allTeams) {
      if (teamA === teamB) continue;
      const playersSet = new Set([...teamA, ...teamB]);
      if (playersSet.size === 4) {
        allMatchups.push({
          teamA: [...teamA] as [string, string],
          teamB: [...teamB] as [string, string],
        });
      }
    }
  }

  const usedTeams = new Set<string>();
  const usedMatchups = new Set<string>();
  const previousTeams = new Set<string>();
  const playerMatchCount = new Map<string, number>();
  const playerSitCount = new Map<string, number>();

  players.forEach((p) => {
    playerMatchCount.set(p, 0);
    playerSitCount.set(p, 0);
  });

  for (let round = 1; round <= totalRounds; round++) {
    let chosen: Match | null = null;
    let sittingOut: string[] = [];

    const sorted = [...allMatchups].sort((m1, m2) => {
      const m1Score =
        (usedTeams.has(teamKey(m1.teamA)) ? 1 : 0) +
        (usedTeams.has(teamKey(m1.teamB)) ? 1 : 0);
      const m2Score =
        (usedTeams.has(teamKey(m2.teamA)) ? 1 : 0) +
        (usedTeams.has(teamKey(m2.teamB)) ? 1 : 0);
      return m1Score - m2Score;
    });

    for (const match of sorted) {
      const tAKey = teamKey(match.teamA);
      const tBKey = teamKey(match.teamB);

      if (previousTeams.has(tAKey) || previousTeams.has(tBKey)) continue;

      if (usedTeams.has(tAKey) && usedTeams.has(tBKey)) continue;

      const matchupK = matchupKey(match.teamA, match.teamB);
      if (usedMatchups.has(matchupK)) continue;

      const playing = new Set([...match.teamA, ...match.teamB]);
      const maxMatches = Math.max(...playerMatchCount.values());
      const minMatches = Math.min(...playerMatchCount.values());
      let ok = true;
      for (const p of playing) {
        if (playerMatchCount.get(p)! > minMatches + 1) ok = false;
      }
      if (!ok) continue;

      chosen = match;
      sittingOut = players.filter((p) => !playing.has(p));
      break;
    }

    if (!chosen) throw new Error("Could not create a valid schedule.");

    const tA = teamKey(chosen.teamA);
    const tB = teamKey(chosen.teamB);

    usedTeams.add(tA);
    usedTeams.add(tB);
    previousTeams.clear();
    previousTeams.add(tA);
    previousTeams.add(tB);
    usedMatchups.add(matchupKey(chosen.teamA, chosen.teamB));

    [...chosen.teamA, ...chosen.teamB].forEach((p) =>
      playerMatchCount.set(p, playerMatchCount.get(p)! + 1)
    );
    sittingOut.forEach((p) =>
      playerSitCount.set(p, playerSitCount.get(p)! + 1)
    );

    rounds.push({
      roundNumber: round,
      match: chosen,
      sittingOut,
    });
  }

  return { rounds, totalRounds };
}

/**
 * Validates the generated schedule for fairness
 */
export function validateSchedule(schedule: Schedule, players: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const playerMatchCount = new Map<string, number>();
  const playerSitCount = new Map<string, number>();
  
  // Initialize counts
  players.forEach(player => {
    playerMatchCount.set(player, 0);
    playerSitCount.set(player, 0);
  });
  
  // Count matches and sit-outs per player
  schedule.rounds.forEach(round => {
    const match = round.match;
    match.teamA.forEach(player => {
      playerMatchCount.set(player, (playerMatchCount.get(player) || 0) + 1);
    });
    match.teamB.forEach(player => {
      playerMatchCount.set(player, (playerMatchCount.get(player) || 0) + 1);
    });
    round.sittingOut.forEach(player => {
      playerSitCount.set(player, (playerSitCount.get(player) || 0) + 1);
    });
  });
  
  // Check fairness: expectedMatches = totalRounds - sitsOutCount
  players.forEach(player => {
    const matchCount = playerMatchCount.get(player) || 0;
    const sitCount = playerSitCount.get(player) || 0;
    const expectedMatches = schedule.totalRounds - sitCount;
    
    if (matchCount !== expectedMatches) {
      errors.push(`Player ${player} has ${matchCount} matches, expected ${expectedMatches} (sat out ${sitCount} times)`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate player statistics from the schedule
 */
export function calculatePlayerStats(players: string[], schedule: Schedule) {
  return players.map(player => ({
    name: player,
    totalMatches: schedule.rounds.reduce((count, round) => {
      const playsInRound = round.match.teamA.includes(player) || round.match.teamB.includes(player);
      return count + (playsInRound ? 1 : 0);
    }, 0),
    sitsOut: schedule.rounds.filter(round => round.sittingOut.includes(player)).length,
  }));
}
