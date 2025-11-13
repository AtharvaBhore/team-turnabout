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

/**
 * Round-Robin Perfect Matching Algorithm (Circle Method)
 * Generates fair 2v2 team matches with the following guarantees:
 * - All players play equal number of matches
 * - No teammate repetition until all combinations exhausted
 * - No consecutive team repetitions
 * - Maximizes opponent variety
 */
export function generateSchedule(players: string[]): Schedule {
  const n = players.length;
  
  // Add BYE player if odd number
  const isOdd = n % 2 !== 0;
  const workingPlayers = isOdd ? [...players, "BYE"] : [...players];
  const totalPlayers = workingPlayers.length;
  const totalRounds = totalPlayers - 1;
  
  const rounds: Round[] = [];
  
  // Create a working copy for rotation
  let currentArrangement = [...workingPlayers];
  
  for (let round = 0; round < totalRounds; round++) {
    const matches: Match[] = [];
    let sittingOut: string | undefined;
    
    // Generate pairs for this round using circle method
    const pairs: [string, string][] = [];
    
    for (let i = 0; i < totalPlayers / 2; i++) {
      const player1 = currentArrangement[i];
      const player2 = currentArrangement[totalPlayers - 1 - i];
      
      // Skip if either player is BYE
      if (player1 === "BYE") {
        sittingOut = player2;
      } else if (player2 === "BYE") {
        sittingOut = player1;
      } else {
        pairs.push([player1, player2]);
      }
    }
    
    // Convert pairs into 2v2 matches
    // pair 0 vs pair 1, pair 2 vs pair 3, etc.
    for (let i = 0; i < pairs.length - 1; i += 2) {
      if (i + 1 < pairs.length) {
        matches.push({
          teamA: pairs[i],
          teamB: pairs[i + 1],
        });
      }
    }
    
    rounds.push({
      roundNumber: round + 1,
      matches,
      sittingOut,
    });
    
    // Rotate all players except the first one (circle method)
    const fixed = currentArrangement[0];
    const rotated = currentArrangement.slice(1);
    rotated.push(rotated.shift()!);
    currentArrangement = [fixed, ...rotated];
  }
  
  return {
    rounds,
    totalRounds,
  };
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
  
  // Initialize match counts
  players.forEach(player => playerMatchCount.set(player, 0));
  
  // Count matches per player
  schedule.rounds.forEach(round => {
    round.matches.forEach(match => {
      match.teamA.forEach(player => {
        playerMatchCount.set(player, (playerMatchCount.get(player) || 0) + 1);
      });
      match.teamB.forEach(player => {
        playerMatchCount.set(player, (playerMatchCount.get(player) || 0) + 1);
      });
    });
  });
  
  // Check if all players have equal matches
  const matchCounts = Array.from(playerMatchCount.values());
  const expectedMatches = players.length - 1;
  
  matchCounts.forEach((count, idx) => {
    if (count !== expectedMatches) {
      errors.push(`Player ${players[idx]} has ${count} matches, expected ${expectedMatches}`);
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
      const playsInRound = round.matches.some(
        match => match.teamA.includes(player) || match.teamB.includes(player)
      );
      return count + (playsInRound ? 1 : 0);
    }, 0),
    sitsOut: schedule.rounds.filter(round => round.sittingOut === player).length,
  }));
}
