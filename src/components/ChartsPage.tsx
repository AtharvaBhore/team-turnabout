import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { fetchPlayerStats, fetchPlayerTrends, PlayerStat, PlayerTrendPoint } from '@/lib/api';
import { BarChart3 } from 'lucide-react';
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts';

const COLORS = [
  'hsl(210 100% 48%)',
  'hsl(150 65% 48%)',
  'hsl(30 90% 55%)',
  'hsl(280 65% 55%)',
  'hsl(0 84% 60%)',
  'hsl(190 80% 50%)',
  'hsl(45 95% 55%)',
  'hsl(330 65% 55%)',
];

export function ChartsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [trends, setTrends] = useState<Record<string, PlayerTrendPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, trendData] = await Promise.all([fetchPlayerStats(), fetchPlayerTrends()]);
      setPlayerStats(stats);
      setTrends(trendData);
    } catch {
      setError('Could not load chart data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-muted-foreground p-4">Loading charts...</p>;
  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">{error}</p>
      </Card>
    );
  }

  // Bar chart data: win rate comparison
  const barData = playerStats.map((s) => ({
    name: s.name,
    winRate: s.winPercentage,
    wins: s.wins,
    losses: s.losses,
  }));

  const barConfig: ChartConfig = {
    winRate: { label: 'Win Rate %', color: 'hsl(210 100% 48%)' },
  };

  // Line chart data: trend over sessions
  const playerNames = Object.keys(trends);
  const maxSessions = Math.max(0, ...playerNames.map((p) => trends[p].length));
  const lineData = Array.from({ length: maxSessions }, (_, i) => {
    const point: any = { session: `S${i + 1}` };
    for (const name of playerNames) {
      point[name] = trends[name]?.[i]?.winRate ?? null;
    }
    return point;
  });

  const lineConfig: ChartConfig = {};
  playerNames.forEach((name, i) => {
    lineConfig[name] = { label: name, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-primary rounded-lg">
          <BarChart3 className="w-6 h-6 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Performance Charts</h2>
      </div>

      {/* Win Rate Comparison Bar Chart */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-bold text-foreground mb-4">Win Rate Comparison</h3>
        {barData.length === 0 ? (
          <p className="text-muted-foreground text-center">No data yet</p>
        ) : (
          <ChartContainer config={barConfig} className="h-[300px] w-full">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="winRate" fill="var(--color-winRate)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </Card>

      {/* Trend Line Chart */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-bold text-foreground mb-4">Performance Trend Across Sessions</h3>
        {lineData.length === 0 ? (
          <p className="text-muted-foreground text-center">No session data yet</p>
        ) : (
          <ChartContainer config={lineConfig} className="h-[350px] w-full">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session" />
              <YAxis domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {playerNames.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </Card>
    </div>
  );
}
