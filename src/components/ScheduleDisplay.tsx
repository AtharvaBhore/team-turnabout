import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Trophy, TrendingUp } from 'lucide-react';
import { Schedule } from '@/lib/scheduleGenerator';
import { LiveRoundCard } from './LiveRoundCard';
import { toast } from 'sonner';
import { generateExcelFile, downloadExcel } from '@/lib/excelGenerator';
import { createSession, submitResult } from '@/lib/api';

interface ScheduleDisplayProps {
  schedule: Schedule;
  players: string[];
  playerStats: Array<{ name: string; totalMatches: number; sitsOut: number }>;
}

export function ScheduleDisplay({ schedule, players, playerStats }: ScheduleDisplayProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<number, 'A' | 'B'>>({});
  const [saving, setSaving] = useState(false);

  // Save session to backend when schedule first displays
  const saveSessionToBackend = useCallback(async () => {
    if (sessionId) return; // already saved
    try {
      setSaving(true);
      const session = await createSession({
        players,
        rounds: schedule.rounds,
        totalRounds: schedule.totalRounds,
      });
      setSessionId(session._id);
      toast.success('Session saved to database!');
    } catch {
      // Backend might not be running — that's OK, app still works locally
      console.warn('Backend not available — results will only be local');
    } finally {
      setSaving(false);
    }
  }, [sessionId, players, schedule]);

  // Auto-save on mount
  useState(() => {
    saveSessionToBackend();
  });

  const handleResultSubmitted = async (roundNumber: number, matchIndex: number, winner: 'A' | 'B') => {
    setResults((prev) => ({ ...prev, [roundNumber]: winner }));

    if (sessionId) {
      try {
        await submitResult(sessionId, roundNumber, matchIndex, winner);
      } catch {
        console.warn('Could not save result to backend');
      }
    }
  };

  const handleDownloadExcel = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateExcelFile(players, schedule);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadExcel(blob, `team-schedule-${timestamp}.xlsx`);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Failed to generate Excel file');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate live stats from results
  const livePlayerStats = players.map((player) => {
    let wins = 0;
    let losses = 0;
    let played = 0;

    for (const round of schedule.rounds) {
      const match = round.matches[0];
      const isInMatch = match.teamA.includes(player) || match.teamB.includes(player);
      if (!isInMatch) continue;

      const winner = results[round.roundNumber];
      if (!winner) continue;

      played++;
      const isTeamA = match.teamA.includes(player);
      if ((winner === 'A' && isTeamA) || (winner === 'B' && !isTeamA)) {
        wins++;
      } else {
        losses++;
      }
    }

    return { name: player, wins, losses, played, winPercentage: played > 0 ? Math.round((wins / played) * 100) : 0 };
  });

  const completedCount = Object.keys(results).length;
  const totalCount = schedule.totalRounds;

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-card bg-gradient-primary text-primary-foreground">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-foreground/20 rounded-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Live Match Session</h2>
              <p className="text-sm opacity-90">
                {completedCount}/{totalCount} rounds completed • {players.length} players
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownloadExcel}
            disabled={isGenerating}
            variant="secondary"
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Download className="w-5 h-5 mr-2" />
            {isGenerating ? 'Generating...' : 'Download Excel'}
          </Button>
        </div>
      </Card>

      {/* Live Player Stats */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-secondary rounded-lg">
            <TrendingUp className="w-5 h-5 text-secondary-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Live Statistics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {livePlayerStats.map((stat) => (
            <div key={stat.name} className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-foreground">{stat.name}</p>
                <span className="text-sm font-bold text-primary">{stat.winPercentage}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-center">
                <div>
                  <p className="font-medium text-foreground">{stat.played}</p>
                  <p className="text-xs text-muted-foreground">Played</p>
                </div>
                <div>
                  <p className="font-medium text-accent">{stat.wins}</p>
                  <p className="text-xs text-muted-foreground">Wins</p>
                </div>
                <div>
                  <p className="font-medium text-destructive">{stat.losses}</p>
                  <p className="text-xs text-muted-foreground">Losses</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Rounds with live winner selection */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Match Schedule — Select Winners</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {schedule.rounds.map((round) => (
            <LiveRoundCard
              key={round.roundNumber}
              round={round}
              sessionId={sessionId}
              result={results[round.roundNumber] || null}
              onResultSubmitted={handleResultSubmitted}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
