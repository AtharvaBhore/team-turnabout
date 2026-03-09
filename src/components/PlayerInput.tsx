import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Users, Plus, Minus, Play } from 'lucide-react';
import { toast } from 'sonner';
import { fetchPlayers } from '@/lib/api';

interface PlayerInputProps {
  onGenerateSchedule: (players: string[]) => void;
}

interface Player {
  _id: string;
  name: string;
}

export function PlayerInput({ onGenerateSchedule }: PlayerInputProps) {
  const [playerCount, setPlayerCount] = useState<number>(6);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(Array(6).fill(''));

  // Fetch players from backend
  useEffect(() => {
    const fetchData = async () => {
      const players = await fetchPlayers();
      setPlayers(players);
    };
    fetchData();
  }, []);

  // Handle player count change
  const handlePlayerCountChange = (count: number) => {
    if (count < 4) {
      toast.error('Minimum 4 players required');
      return;
    }
    if (count > 8) {
      toast.error('Maximum 8 players allowed');
      return;
    }

    setPlayerCount(count);
    setSelectedPlayers(prev => {
      const updated = [...prev];
      updated.length = count;
      return updated.fill('', prev.length);
    });
  };

  // Handle dropdown change
  const handlePlayerChange = (index: number, playerName: string) => {
    const newSelection = [...selectedPlayers];
    newSelection[index] = playerName;
    setSelectedPlayers(newSelection);
  };

  const validateAndGenerate = () => {
    if (selectedPlayers.some(p => p === '')) {
      toast.error('Select all players');
      return;
    }

    if (new Set(selectedPlayers).size !== selectedPlayers.length) {
      toast.error('Players must be unique');
      return;
    }

    toast.success('Schedule generated successfully!');
    onGenerateSchedule(selectedPlayers);
  };

  return (
    <Card className="p-6 shadow-card hover:shadow-hover transition-shadow duration-300">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Setup Players</h2>
            <p className="text-sm text-muted-foreground">
              Select players for the match
            </p>
          </div>
        </div>

        {/* Player count */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label>Number of Players</Label>
            <input
              type="number"
              min={4}
              max={8}
              value={playerCount}
              onChange={(e) =>
                handlePlayerCountChange(parseInt(e.target.value))
              }
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePlayerCountChange(playerCount - 1)}
            disabled={playerCount <= 4}
          >
            <Minus className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePlayerCountChange(playerCount + 1)}
            disabled={playerCount >= 8}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Player dropdowns */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {selectedPlayers.map((player, index) => (
            <div key={index}>
              <Label>Player {index + 1}</Label>

              <select
                value={player}
                onChange={(e) => handlePlayerChange(index, e.target.value)}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="">Select player</option>

                {players
                  .filter(p => !selectedPlayers.includes(p.name) || p.name === player)
                  .map(p => (
                    <option key={p._id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          ))}
        </div>

        <Button
          onClick={validateAndGenerate}
          className="w-full"
          size="lg"
        >
          <Play className="w-5 h-5 mr-2" />
          Generate Schedule
        </Button>
      </div>
    </Card>
  );
}