import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, Trophy } from 'lucide-react';
import { Round } from '@/lib/scheduleGenerator';
import { toast } from 'sonner';

interface LiveRoundCardProps {
  round: Round;
  sessionId: string | null;
  onResultSubmitted?: (roundNumber: number, matchIndex: number, winner: 'A' | 'B') => void;
  result?: 'A' | 'B' | null;
}

export function LiveRoundCard({ round, sessionId, onResultSubmitted, result }: LiveRoundCardProps) {
  const [selectedWinner, setSelectedWinner] = useState<'A' | 'B' | null>(result || null);

  useEffect(() => {
    setSelectedWinner(result || null);
  }, [result]);

  const handleSelectWinner = (winner: 'A' | 'B') => {
    setSelectedWinner(winner);
    onResultSubmitted?.(round.roundNumber, 0, winner);
    toast.success(`Round ${round.roundNumber}: Team ${winner} wins!`);
  };

  return (
    <Card className="p-5 shadow-card hover:shadow-hover transition-all duration-300 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-primary rounded-md">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Round {round.roundNumber}</h3>
          </div>
          {selectedWinner && (
            <Badge className="bg-accent text-accent-foreground">
              <CheckCircle className="w-3 h-3 mr-1" />
              Team {selectedWinner} Won
            </Badge>
          )}
        </div>

        {round.sittingOut && (
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Sitting Out:</span> {round.sittingOut}
            </p>
          </div>
        )}

        {round.matches.map((match, matchIndex) => (
          <div key={matchIndex} className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">TEAM A</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{match.teamA[0]}</p>
                    <p className="text-sm font-medium text-foreground">{match.teamA[1]}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center px-3">
                  <span className="text-lg font-bold text-muted-foreground">VS</span>
                </div>

                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="text-xs font-semibold text-secondary">TEAM B</span>
                    <Users className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{match.teamB[0]}</p>
                    <p className="text-sm font-medium text-foreground">{match.teamB[1]}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Winner selection buttons */}
            <div className="flex gap-3">
              <Button
                variant={selectedWinner === 'A' ? 'default' : 'outline'}
                className={`flex-1 ${selectedWinner === 'A' ? 'bg-gradient-primary' : ''}`}
                onClick={() => handleSelectWinner('A')}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Team A Won
              </Button>
              <Button
                variant={selectedWinner === 'B' ? 'default' : 'outline'}
                className={`flex-1 ${selectedWinner === 'B' ? 'bg-gradient-secondary' : ''}`}
                onClick={() => handleSelectWinner('B')}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Team B Won
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
