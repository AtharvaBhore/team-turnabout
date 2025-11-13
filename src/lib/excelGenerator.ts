import ExcelJS from 'exceljs';
import { Schedule } from './scheduleGenerator';

export async function generateExcelFile(
  players: string[],
  schedule: Schedule
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: MATCH SCHEDULE
  const scheduleSheet = workbook.addWorksheet('Match Schedule');
  
  // Add header row with styling
  scheduleSheet.columns = [
    { header: 'Round', key: 'round', width: 10 },
    { header: 'Team A - Player 1', key: 'teamA1', width: 20 },
    { header: 'Team A - Player 2', key: 'teamA2', width: 20 },
    { header: 'Team B - Player 1', key: 'teamB1', width: 20 },
    { header: 'Team B - Player 2', key: 'teamB2', width: 20 },
    { header: 'Winner', key: 'winner', width: 15 },
  ];
  
  // Style header row
  scheduleSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  scheduleSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0078D4' },
  };
  scheduleSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Add match data
  let rowNumber = 2;
  schedule.rounds.forEach(round => {
    const match = round.match;
    const row = scheduleSheet.addRow({
      round: round.roundNumber,
      teamA1: match.teamA[0],
      teamA2: match.teamA[1],
      teamB1: match.teamB[0],
      teamB2: match.teamB[1],
      winner: 'Not Played',
    });
    
    // Add data validation for Winner column
    const winnerCell = row.getCell('winner');
    winnerCell.dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Team A,Team B,Not Played"'],
    };
    
    // Center align all cells
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    
    rowNumber++;
  });
  
  // Sheet 2: PLAYER STATS
  const statsSheet = workbook.addWorksheet('Player Stats');
  
  // Add header row
  statsSheet.columns = [
    { header: 'Player Name', key: 'player', width: 20 },
    { header: 'Wins', key: 'wins', width: 10 },
    { header: 'Losses', key: 'losses', width: 10 },
    { header: 'Win %', key: 'winPercent', width: 12 },
  ];
  
  // Style header row
  statsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  statsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF27AE60' },
  };
  statsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Add player rows with formulas
  players.forEach((player, index) => {
    const playerRow = statsSheet.addRow({
      player: player,
    });
    
    const rowNum = index + 2;
    
    // WINS formula: Count "Team A" when player is in Team A columns OR "Team B" when player is in Team B columns
    const winsFormula = `SUMPRODUCT((('Match Schedule'!B:B="${player}")+('Match Schedule'!C:C="${player}"))*(('Match Schedule'!F:F="Team A"))+` +
      `(('Match Schedule'!D:D="${player}")+('Match Schedule'!E:E="${player}"))*(('Match Schedule'!F:F="Team B")))`;
    
    playerRow.getCell('wins').value = { formula: winsFormula };
    
    // LOSSES formula: Count "Team B" when player is in Team A columns OR "Team A" when player is in Team B columns
    const lossesFormula = `SUMPRODUCT((('Match Schedule'!B:B="${player}")+('Match Schedule'!C:C="${player}"))*(('Match Schedule'!F:F="Team B"))+` +
      `(('Match Schedule'!D:D="${player}")+('Match Schedule'!E:E="${player}"))*(('Match Schedule'!F:F="Team A")))`;
    
    playerRow.getCell('losses').value = { formula: lossesFormula };
    
    // WIN % formula
    playerRow.getCell('winPercent').value = {
      formula: `IF((B${rowNum}+C${rowNum})=0,0,B${rowNum}/(B${rowNum}+C${rowNum}))`,
    };
    playerRow.getCell('winPercent').numFmt = '0.0%';
    
    playerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadExcel(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
