import ExcelJS from 'exceljs';
import { Schedule } from './scheduleGenerator';

/**
 * Generate Excel file with:
 * - Match schedule (Team A / Team B)
 * - "Winner (A/B)" column (drop-down)
 * - Player stats (Wins, Losses, Win %)
 *
 * Uses COUNTIFS formulas (robust) to compute wins/losses.
 */
export async function generateExcelFile(
  players: string[],
  schedule: Schedule
): Promise<Blob> {

  const workbook = new ExcelJS.Workbook();

  // =======================================================
  // SHEET 1: MATCH SCHEDULE
  // =======================================================
  const scheduleSheet = workbook.addWorksheet('Match Schedule');

  scheduleSheet.columns = [
    { header: 'Round', key: 'round', width: 10 },
    { header: 'Team A - Player 1', key: 'teamA1', width: 20 },
    { header: 'Team A - Player 2', key: 'teamA2', width: 20 },
    { header: 'Team B - Player 1', key: 'teamB1', width: 20 },
    { header: 'Team B - Player 2', key: 'teamB2', width: 20 },
    { header: 'Winner (A/B)', key: 'winner', width: 15 },
  ];

  // Header styling
  const headerRow = scheduleSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0078D4' },
  };
  headerRow.alignment = { horizontal: 'center' };
  scheduleSheet.views = [{ state: "frozen", ySplit: 1 }];

  // Populate matches
  schedule.rounds.forEach((round) => {
    const m = round.matches[0];

    const row = scheduleSheet.addRow({
      round: round.roundNumber,
      teamA1: m.teamA[0],
      teamA2: m.teamA[1],
      teamB1: m.teamB[0],
      teamB2: m.teamB[1],
      winner: "", // user will choose A or B
    });

    // Data validation: allow A or B or blank
    row.getCell('winner').dataValidation = {
      type: 'list',
      formulae: ['"A,B"'],
      allowBlank: true,
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Invalid value',
      error: 'Please choose A or B',
    };

    row.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // =======================================================
  // SHEET 2: PLAYER STATS (COUNTIFS-based)
  // =======================================================
  const statsSheet = workbook.addWorksheet('Player Stats');

  statsSheet.columns = [
    { header: 'Player', key: 'player', width: 25 },
    { header: 'Wins', key: 'wins', width: 12 },
    { header: 'Losses', key: 'losses', width: 12 },
    { header: 'Win %', key: 'winPercent', width: 12 },
  ];

  const statHeader = statsSheet.getRow(1);
  statHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  statHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF27AE60' },
  };
  statHeader.alignment = { horizontal: 'center' };
  statsSheet.views = [{ state: "frozen", ySplit: 1 }];

  // We'll use row-limited COUNTIFS ranges (2..999) to avoid full-column problems.
  // Columns in 'Match Schedule' sheet:
  // B = Team A Player 1, C = Team A Player 2, D = Team B Player 1, E = Team B Player 2, F = Winner

  players.forEach((player, idx) => {
    const rowNum = idx + 2;
    statsSheet.getCell(`A${rowNum}`).value = player;

    // Wins:
    // Count rows where Winner="A" and player is in Team A (col B or C)
    // plus rows where Winner="B" and player is in Team B (col D or E)
    const winsFormula =
      `=COUNTIFS('Match Schedule'!$F$2:$F$999,"A",'Match Schedule'!$B$2:$B$999,"${player}")` +
      `+COUNTIFS('Match Schedule'!$F$2:$F$999,"A",'Match Schedule'!$C$2:$C$999,"${player}")` +
      `+COUNTIFS('Match Schedule'!$F$2:$F$999,"B",'Match Schedule'!$D$2:$D$999,"${player}")` +
      `+COUNTIFS('Match Schedule'!$F$2:$F$999,"B",'Match Schedule'!$E$2:$E$999,"${player}")`;

    statsSheet.getCell(`B${rowNum}`).value = { formula: winsFormula };

    // Losses:
    // Count rows where Winner="B" and player is in Team A (col B or C)
    // plus rows where Winner="A" and player is in Team B (col D or E)
    const lossesFormula =
      `=COUNTIFS('Match Schedule'!$F$2:$F$999,"B",'Match Schedule'!$B$2:$B$999,"${player}")` +
      `+COUNTIFS('Match Schedule'!$F$2:$F$999,"B",'Match Schedule'!$C$2:$C$999,"${player}")` +
      `+COUNTIFS('Match Schedule'!$F$2:$F$999,"A",'Match Schedule'!$D$2:$D$999,"${player}")` +
      `+COUNTIFS('Match Schedule'!$F$2:$F$999,"A",'Match Schedule'!$E$2:$E$999,"${player}")`;

    statsSheet.getCell(`C${rowNum}`).value = { formula: lossesFormula };

    // Win percentage:
    statsSheet.getCell(`D${rowNum}`).value = {
      formula: `=IF((B${rowNum}+C${rowNum})=0,0,B${rowNum}/(B${rowNum}+C${rowNum}))`,
    };
    statsSheet.getCell(`D${rowNum}`).numFmt = '0.00%';

    // Center align
    statsSheet.getRow(rowNum).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Optional: freeze header rows on both sheets
  scheduleSheet.views = [{ state: 'frozen', ySplit: 1 }];
  statsSheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Generate buffer and return blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Trigger download in browser
 */
export function downloadExcel(blob: Blob, filename = 'match_schedule.xlsx') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
