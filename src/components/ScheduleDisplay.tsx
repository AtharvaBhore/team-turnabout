import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Trophy, TrendingUp } from 'lucide-react';
import { Schedule } from '@/lib/scheduleGenerator';
import { RoundCard } from './RoundCard';
import { toast } from 'sonner';
import { generateExcelFile, downloadExcel } from '@/lib/excelGenerator';
import { useState } from 'react';

interface ScheduleDisplayProps {
  schedule: Schedule;
  players: string[];
  playerStats: Array<{ name: string; totalMatches: number; sitsOut: number }>;
}

export function ScheduleDisplay({ schedule, players, playerStats }: ScheduleDisplayProps) {
  const [isGenerating, setIsGenerating] = useState(false);

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

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-card bg-gradient-primary text-primary-foreground">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-foreground/20 rounded-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Schedule Generated</h2>
              <p className="text-sm opacity-90">
                {schedule.totalRounds} rounds • {players.length} players
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

      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-secondary rounded-lg">
            <TrendingUp className="w-5 h-5 text-secondary-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Player Statistics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {playerStats.map((stat) => (
            <div
              key={stat.name}
              className="p-4 bg-muted/50 rounded-lg border border-border"
            >
              <p className="font-semibold text-foreground mb-2">{stat.name}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Matches:</span>
                <span className="font-medium text-foreground">{stat.totalMatches}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sits out:</span>
                <span className="font-medium text-foreground">{stat.sitsOut}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Match Schedule</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {schedule.rounds.map((round) => (
            <RoundCard key={round.roundNumber} round={round} />
          ))}
        </div>
      </div>
    </div>
  );
}
