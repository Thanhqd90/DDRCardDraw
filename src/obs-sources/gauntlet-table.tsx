import React from "react";
import { useParams } from "react-router-dom";
import { useAppState } from "../state/store";
import { drawingsSlice } from "../state/drawings.slice";
import "./gauntlet-table.css";

type ScoreValue = number | string | undefined | null;

function getScoreNumber(score: ScoreValue): number {
  if (typeof score === "number") {
    return score;
  }

  if (typeof score === "string") {
    const parsed = Number(score.replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatScore(score: ScoreValue): string {
  const scoreNumber = getScoreNumber(score);

  if (!scoreNumber) {
    return "-";
  }

  return scoreNumber.toLocaleString();
}

function getPointsForPlacement(placement: number, numPlayers: number): number {
  return placement === 1 ? numPlayers + 1 : numPlayers - placement + 1;
}

function getPlacementLabel(placement: number): string {
  if (placement % 100 >= 11 && placement % 100 <= 13) {
    return `${placement}th`;
  }

  switch (placement % 10) {
    case 1:
      return `${placement}st`;
    case 2:
      return `${placement}nd`;
    case 3:
      return `${placement}rd`;
    default:
      return `${placement}th`;
  }
}

export function GauntletTableSource() {
  const params = useParams<"cabId">();

  const drawing = useAppState((s) => {
    if (!params.cabId) return null;

    const cab = s.event.cabs[params.cabId];

    if (!cab?.activeMatch) return null;

    if (typeof cab.activeMatch === "string") {
      return s.drawings.entities[cab.activeMatch];
    }

    return drawingsSlice.selectors.selectMergedByCompoundId(s, cab.activeMatch);
  });

  if (!drawing) {
    return null;
  }

  const activeDrawing = drawing;

  if (!("entrants" in activeDrawing.meta)) {
    return null;
  }

  const scoresByEntrant: Record<
    string,
    Record<string, ScoreValue>
  > = "scoresByEntrant" in activeDrawing.meta
    ? (activeDrawing.meta.scoresByEntrant ?? {})
    : {};

  const pointsAwardedMode =
    "pointsAwardedMode" in activeDrawing.meta
      ? (activeDrawing.meta.pointsAwardedMode ?? true)
      : true;

  const players = activeDrawing.meta.entrants;
  const numPlayers = players.length;

  const charts = (activeDrawing.charts ?? []).filter(
    (chart) =>
      (chart.type === "DRAWN" || chart.type === "PLACEHOLDER") &&
      !activeDrawing.bans?.[chart.id],
  );

  function getChartName(chart: (typeof charts)[number]): string {
    if (chart.type === "PLACEHOLDER") {
      return "Free Pick";
    }

    const maybeReplacedBy = activeDrawing.pocketPicks?.[chart.id]?.pick;

    if (maybeReplacedBy) {
      return maybeReplacedBy.nameTranslation || maybeReplacedBy.name;
    }

    return chart.nameTranslation || chart.name;
  }

  function calculatePointsForChart(chartId: string): Record<string, number> {
    if (!pointsAwardedMode) return {};

    const chartScores = players
      .map((entrant) => {
        const score = scoresByEntrant[entrant.id]?.[chartId];

        return {
          playerId: entrant.id,
          score: getScoreNumber(score),
          hasScore: score !== undefined && score !== null && score !== "",
        };
      })
      .filter((entry) => entry.hasScore)
      .sort((a, b) => b.score - a.score);

    const points: Record<string, number> = {};

    let currentPlacement = 1;
    let lastScore: number | null = null;

    for (let i = 0; i < chartScores.length; i++) {
      const { playerId, score } = chartScores[i];

      if (score !== lastScore) {
        currentPlacement = i + 1;
        lastScore = score;
      }

      points[playerId] = getPointsForPlacement(currentPlacement, numPlayers);
    }

    return points;
  }

  const pointsByChart = charts.reduce<Record<string, Record<string, number>>>(
    (result, chart) => {
      result[chart.id] = calculatePointsForChart(chart.id);
      return result;
    },
    {},
  );

  const rows = players.map((entrant) => {
    const playerScores = scoresByEntrant[entrant.id] ?? {};

    const totalScore = charts.reduce((sum, chart) => {
      return sum + getScoreNumber(playerScores[chart.id]);
    }, 0);

    const totalPoints = charts.reduce((sum, chart) => {
      return sum + (pointsByChart[chart.id]?.[entrant.id] ?? 0);
    }, 0);

    return {
      id: entrant.id,
      name: entrant.name,
      playerScores,
      totalScore,
      totalPoints,
    };
  });

  const sortedRows = [...rows].sort((a, b) => {
    if (pointsAwardedMode && b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    return b.totalScore - a.totalScore;
  });

  const rankedRows: Array<(typeof rows)[number] & { placement: number }> = [];

  for (let index = 0; index < sortedRows.length; index++) {
    const row = sortedRows[index];
    const previousRankedRow = rankedRows[index - 1];

    const placement =
      previousRankedRow &&
      previousRankedRow.totalPoints === row.totalPoints &&
      previousRankedRow.totalScore === row.totalScore
        ? previousRankedRow.placement
        : index + 1;

    rankedRows.push({
      ...row,
      placement,
    });
  }

  return (
    <div className="gauntlet-table-source">
      <h1>{activeDrawing.meta.title}</h1>

      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            {charts.map((chart, index) => (
              <th key={chart.id}>
                {getChartName(chart) || `Chart ${index + 1}`}
              </th>
            ))}
            <th>Total Score</th>
            {pointsAwardedMode ? <th>Total Points</th> : null}
          </tr>
        </thead>

        <tbody>
          {rankedRows.map((player) => (
            <tr key={player.id}>
              <td className="rank-cell">
                {getPlacementLabel(player.placement)}
              </td>

              <td className="player-cell">{player.name}</td>

              {charts.map((chart) => {
                const score = player.playerScores[chart.id];
                const points = pointsByChart[chart.id]?.[player.id];

                return (
                  <td key={chart.id}>
                    <div className="score-value">{formatScore(score)}</div>
                    {pointsAwardedMode && points ? (
                      <div className="points-value">{points} pts</div>
                    ) : null}
                  </td>
                );
              })}

              <td className="total-score-cell">
                {player.totalScore ? player.totalScore.toLocaleString() : "-"}
              </td>

              {pointsAwardedMode ? (
                <td className="total-points-cell">{player.totalPoints}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
