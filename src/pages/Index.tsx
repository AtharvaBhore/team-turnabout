import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerInput } from '@/components/PlayerInput';
import { ScheduleDisplay } from '@/components/ScheduleDisplay';
import { HistoryPage } from '@/components/HistoryPage';
import { StatsPage } from '@/components/StatsPage';
import { ChartsPage } from '@/components/ChartsPage';
import { generateSchedule, calculatePlayerStats, Schedule } from '@/lib/scheduleGenerator';
import { Calendar, History, BarChart3, TrendingUp } from 'lucide-react';

const Index = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const STORAGE_KEY = "team-turnabout-live-session";

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (parsed.schedule && parsed.players) {
        setSchedule(parsed.schedule);
        setPlayers(parsed.players);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleGenerateSchedule = (playerList: string[]) => {
    const generatedSchedule = generateSchedule(playerList);
    setSchedule(generatedSchedule);
    setPlayers(playerList);
  };

  const playerStats =
    schedule && players.length > 0
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
              Badminton Scheduler
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate fair 2v2 match schedules, track results live, and view performance analytics
          </p>
        </header>

        <Tabs defaultValue="scheduler" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto">
            <TabsTrigger value="scheduler" className="gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Scheduler</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduler">
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
                    onClearSession={() => {
                      setSchedule(null);
                      setPlayers([]);
                    }}
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
          </TabsContent>

          <TabsContent value="history">
            <HistoryPage />
          </TabsContent>

          <TabsContent value="stats">
            <StatsPage />
          </TabsContent>

          <TabsContent value="charts">
            <ChartsPage />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Built with Team Rotation Algorithm</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
