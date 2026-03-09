import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchPlayerStats, fetchDuoStats, PlayerStat, DuoStat } from '@/lib/api';
import { TrendingUp, TrendingDown, Users, Award, BarChart3 } from 'lucide-react';

export function StatsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [duoStats, setDuoStats] = useState<DuoStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [players, duos] = await Promise.all([fetchPlayerStats(), fetchDuoStats()]);
      setPlayerStats(players);
      setDuoStats(duos);
    } catch {
      setError('Could not load statistics. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const bestDuo = duoStats.length > 0 ? duoStats[0] : null;
  const worstDuo = duoStats.length > 0 ? duoStats[duoStats.length - 1] : null;

  if (loading) return <p className="text-muted-foreground p-4">Loading statistics...</p>;
  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-primary rounded-lg">
          <BarChart3 className="w-6 h-6 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Statistics</h2>
      </div>

      {/* Duo highlights */}
      {bestDuo && worstDuo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 shadow-card border-l-4 border-l-accent">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h4 className="font-bold text-foreground">Best Duo</h4>
            </div>
            <p className="text-lg font-semibold text-foreground">{bestDuo.duo}</p>
            <p className="text-sm text-muted-foreground">
              {bestDuo.winPercentage}% win rate • {bestDuo.wins}W / {bestDuo.losses}L
            </p>
          </Card>
          <Card className="p-5 shadow-card border-l-4 border-l-destructive">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              <h4 className="font-bold text-foreground">Lowest Win Rate Duo</h4>
            </div>
            <p className="text-lg font-semibold text-foreground">{worstDuo.duo}</p>
            <p className="text-sm text-muted-foreground">
              {worstDuo.winPercentage}% win rate • {worstDuo.wins}W / {worstDuo.losses}L
            </p>
          </Card>
        </div>
      )}

      <Tabs defaultValue="players">
        <TabsList>
          <TabsTrigger value="players">Player Stats</TabsTrigger>
          <TabsTrigger value="duos">Duo Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          {playerStats.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No match data yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {playerStats.map((s, i) => (
                <Card key={s.name} className="p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Award className="w-4 h-4 text-yellow-500" />}
                      <p className="font-semibold text-foreground">{s.name}</p>
                    </div>
                    <Badge variant="secondary">{s.winPercentage}%</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-center">
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium text-foreground">{s.played}</p>
                      <p className="text-xs text-muted-foreground">Played</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium text-accent">{s.wins}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium text-destructive">{s.losses}</p>
                      <p className="text-xs text-muted-foreground">Losses</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="duos">
          {duoStats.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No duo data yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {duoStats.map((d) => (
                <Card key={d.duo} className="p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <p className="font-semibold text-foreground">{d.duo}</p>
                    </div>
                    <Badge variant="secondary">{d.winPercentage}%</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-center">
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium text-foreground">{d.played}</p>
                      <p className="text-xs text-muted-foreground">Played</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium text-accent">{d.wins}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium text-destructive">{d.losses}</p>
                      <p className="text-xs text-muted-foreground">Losses</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
