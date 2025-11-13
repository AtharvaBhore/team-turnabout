import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Users, Plus, Minus, Play } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerInputProps {
  onGenerateSchedule: (players: string[]) => void;
}

export function PlayerInput({ onGenerateSchedule }: PlayerInputProps) {
  const [playerCount, setPlayerCount] = useState<number>(6);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array(6).fill('').map((_, i) => `Player ${i + 1}`)
  );

  // 🔥 STRICT LIMITS: MIN 4 — MAX 8
  const handlePlayerCountChange = (count: number) => {
    if (count < 4) {
      toast.error('Minimum 4 players required for 2v2 matches');
      return;
    }
    if (count > 8) {
      toast.error('Maximum 8 players allowed');
      return;
    }

    setPlayerCount(count);

    const newNames = Array(count)
      .fill('')
      .map((_, i) => playerNames[i] || `Player ${i + 1}`);

    setPlayerNames(newNames);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const validateAndGenerate = () => {
    const trimmedNames = playerNames.map((name) => name.trim());

    if (trimmedNames.some((n) => n === '')) {
      toast.error('All player names must be filled');
      return;
    }

    if (new Set(trimmedNames).size !== trimmedNames.length) {
      toast.error('Player names must be unique');
      return;
    }

    if (trimmedNames.length < 4) {
      toast.error('Minimum 4 players required for 2v2 matches');
      return;
    }

    toast.success('Schedule generated successfully!');
    onGenerateSchedule(trimmedNames);
  };

  return (
    <Card className="p-6 shadow-card hover:shadow-hover transition-shadow duration-300">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Setup Players</h2>
            <p className="text-sm text-muted-foreground">
              Configure your team roster
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 🔥 PLAYER COUNT INPUT */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="playerCount" className="text-sm font-medium">
                Number of Players
              </Label>
              <Input
                id="playerCount"
                type="number"
                min={4}
                max={8}   // ⬅️ HARD LIMIT HERE
                value={playerCount}
                onChange={(e) =>
                  handlePlayerCountChange(parseInt(e.target.value))
                }
                className="mt-1.5"
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
              disabled={playerCount >= 8} // ⬅️ LIMIT HERE
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* PLAYER NAME INPUTS */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {playerNames.map((name, index) => (
              <div key={index} className="animate-fade-in">
                <Label
                  htmlFor={`player-${index}`}
                  className="text-sm font-medium"
                >
                  Player {index + 1}
                </Label>
                <Input
                  id={`player-${index}`}
                  type="text"
                  value={name}
                  onChange={(e) =>
                    handlePlayerNameChange(index, e.target.value)
                  }
                  placeholder={`Enter player ${index + 1} name`}
                  className="mt-1.5"
                />
              </div>
            ))}
          </div>
        </div>

        {/* GENERATE BUTTON */}
        <Button
          onClick={validateAndGenerate}
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          size="lg"
        >
          <Play className="w-5 h-5 mr-2" />
          Generate Schedule
        </Button>
      </div>
    </Card>
  );
}
