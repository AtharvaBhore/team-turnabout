import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  fetchSessions,
  fetchSession,
  SessionSummary,
  SessionDetail,
} from '@/lib/api';
import { Calendar, Users, ChevronRight, ArrowLeft, Trophy, CheckCircle } from 'lucide-react';

export function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchSessions();
      setSessions(data);
    } catch (err) {
      setError('Could not load sessions. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (id: string) => {
    try {
      const detail = await fetchSession(id);
      setSelectedSession(detail);
    } catch {
      setError('Could not load session details.');
    }
  };

  if (selectedSession) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedSession(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Button>

        <Card className="p-6 shadow-card bg-gradient-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">
                Session — {new Date(selectedSession.createdAt).toLocaleDateString()}
              </h2>
              <p className="text-sm opacity-90">
                {selectedSession.players.join(', ')} • {selectedSession.totalRounds} rounds
              </p>
            </div>
          </div>
        </Card>

        {/* Rounds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {selectedSession.rounds.map((round) => (
            <Card key={round.roundNumber} className="p-5 shadow-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">Round {round.roundNumber}</h3>
                  {round.matches[0]?.winner && (
                    <Badge className="bg-accent text-accent-foreground">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Team {round.matches[0].winner} Won
                    </Badge>
                  )}
                </div>

                {round.sittingOut && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Sitting out:</span> {round.sittingOut}
                  </p>
                )}

                {round.matches.map((m, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-semibold text-primary">A:</span> {m.teamA.join(' & ')}
                      </div>
                      <span className="text-muted-foreground font-bold">VS</span>
                      <div>
                        <span className="font-semibold text-secondary">B:</span> {m.teamB.join(' & ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-primary rounded-lg">
          <Calendar className="w-6 h-6 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Match History</h2>
      </div>

      {loading && <p className="text-muted-foreground">Loading sessions...</p>}
      {error && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure your backend is running at the configured API URL.
          </p>
        </Card>
      )}

      {!loading && !error && sessions.length === 0 && (
        <Card className="p-8 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No sessions yet</h3>
          <p className="text-muted-foreground">Complete a match session to see it here.</p>
        </Card>
      )}

      <div className="space-y-3">
        {sessions.map((session) => (
          <Card
            key={session._id}
            className="p-4 shadow-card hover:shadow-hover transition-all cursor-pointer"
            onClick={() => handleSelectSession(session._id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-muted rounded-lg">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {new Date(session.createdAt).toLocaleDateString()} —{' '}
                    {new Date(session.createdAt).toLocaleTimeString()}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {session.players.length} players
                    </span>
                    <span>{session.totalRounds} rounds</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
