import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Circle } from 'lucide-react';
import { Round } from '@/lib/scheduleGenerator';

interface RoundCardProps {
  round: Round;
}

export function RoundCard({ round }: RoundCardProps) {
  return (
    <Card className="p-5 shadow-card hover:shadow-hover transition-all duration-300 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-primary rounded-md">
              <Circle className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Round {round.roundNumber}</h3>
          </div>
          <Badge variant="secondary" className="bg-gradient-secondary">
            1 Match
          </Badge>
        </div>

        {round.sittingOut.length > 0 && (
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Sitting Out:</span>{' '}
              {round.sittingOut.join(', ')}
            </p>
          </div>
        )}

        <div className="p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">TEAM A</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{round.match.teamA[0]}</p>
                <p className="text-sm font-medium text-foreground">{round.match.teamA[1]}</p>
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
                <p className="text-sm font-medium text-foreground">{round.match.teamB[0]}</p>
                <p className="text-sm font-medium text-foreground">{round.match.teamB[1]}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
