import { useState } from 'react';
import { PlayerInput } from '@/components/PlayerInput';
import { ScheduleDisplay } from '@/components/ScheduleDisplay';
import { generateSchedule, calculatePlayerStats, Schedule } from '@/lib/scheduleGenerator';
import { Calendar } from 'lucide-react';

const Index = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [players, setPlayers] = useState<string[]>([]);

  const handleGenerateSchedule = (playerList: string[]) => {
    const generatedSchedule = generateSchedule(playerList);
    setSchedule(generatedSchedule);
    setPlayers(playerList);
  };

  const playerStats = schedule && players.length > 0
    ? calculatePlayerStats(players, schedule)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-card">
              <Calendar className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Team Rotation Scheduler
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate fair and balanced 2v2 match schedules with automated team rotation
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PlayerInput onGenerateSchedule={handleGenerateSchedule} />
          </div>

          <div className="lg:col-span-2">
            {schedule && players.length > 0 ? (
              <ScheduleDisplay
                schedule={schedule}
                players={players}
                playerStats={playerStats}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center p-8">
                  <div className="p-4 bg-muted rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Schedule Generated Yet
                  </h3>
                  <p className="text-muted-foreground">
                    Enter your players and click "Generate Schedule" to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Built with Round-Robin Perfect Matching Algorithm (Circle Method)</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
