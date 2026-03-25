import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Trophy, TrendingUp, Save, XCircle } from 'lucide-react';
import { Schedule } from '@/lib/scheduleGenerator';
import { LiveRoundCard } from './LiveRoundCard';
import { toast } from 'sonner';
import { generateExcelFile, downloadExcel } from '@/lib/excelGenerator';
import { createSession } from '@/lib/api';

interface ScheduleDisplayProps {
  schedule: Schedule;
  players: string[];
  playerStats: Array<{ name: string; totalMatches: number; sitsOut: number }>;
  onClearSession?: () => void;
}

const STORAGE_KEY = "team-turnabout-live-session";

export function ScheduleDisplay({ schedule, players, onClearSession }: ScheduleDisplayProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<number, 'A' | 'B'>>({});
  const [saving, setSaving] = useState(false);

  /* ---------------- Restore saved results on load ---------------- */

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (parsed.results) setResults(parsed.results);

    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /* ---------------- Persist results whenever they change ---------------- */

  useEffect(() => {
    if (Object.keys(results).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const sessionData = {
      schedule,
      players,
      results
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  }, [results, schedule, players]);

  const handleResultSubmitted = (roundNumber: number, matchIndex: number, winner: 'A' | 'B') => {
    setResults((prev) => ({
      ...prev,
      [roundNumber]: winner
    }));
  };

  const handleSaveSession = async () => {
    if (Object.keys(results).length === 0) {
      toast.error("Complete at least one match before saving");
      return;
    }

    try {
      setSaving(true);

      const roundsWithResults = schedule.rounds.map((round) => ({
        ...round,
        matches: round.matches.map((match) => ({
          ...match,
          winner: results[round.roundNumber] ?? null
        }))
      }));

      const session = await createSession({
        players,
        rounds: roundsWithResults,
        totalRounds: schedule.totalRounds
      });

      setSessionId(session._id);

      /* -------- Clear localStorage after session saved -------- */

      localStorage.removeItem(STORAGE_KEY);

      toast.success("Session saved to database!");

    } catch (error) {
      console.error(error);
      toast.error("Failed to save session");
    } finally {
      setSaving(false);
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

  const handleClearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setResults({});
    setSessionId(null);
    onClearSession?.();
    toast.success('Session cleared from local storage');
  };

  /* ---------------- Live statistics ---------------- */

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

    return {
      name: player,
      wins,
      losses,
      played,
      winPercentage: played > 0 ? Math.round((wins / played) * 100) : 0
    };
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

          <div className="flex gap-3">

            <Button
              onClick={handleSaveSession}
              disabled={saving || sessionId !== null}
              size="lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? "Saving..." : sessionId ? "Session Saved" : "Save Session"}
            </Button>

            <Button
              onClick={handleClearSession}
              size="lg"
              variant="destructive"
              className="flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Clear Session
            </Button>
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
        </div>
      </Card>

      {/* Stats UI unchanged */}
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
                <span className="text-sm font-bold text-primary">
                  {stat.winPercentage}%
                </span>
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

      {/* Rounds */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">
          Match Schedule — Select Winners
        </h3>

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