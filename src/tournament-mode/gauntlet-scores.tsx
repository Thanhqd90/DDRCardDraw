import { HotkeysProvider, Checkbox } from "@blueprintjs/core";
import {
  Column,
  Table2,
  EditableCell2,
  ColumnProps,
  Cell,
} from "@blueprintjs/table";
import { useDrawing } from "../drawing-context";
import { type DrawnChart, StartggGauntletMeta } from "../models/Drawing";
import { ReactElement } from "react";
import { inferShortname } from "../controls/player-names";
import { useDispatch } from "react-redux";
import { drawingsSlice } from "../state/drawings.slice";
import { ScoreSortableColumn } from "./sortable-columns";

export default function GauntletScoreEditor({
  meta,
}: {
  meta: StartggGauntletMeta;
}) {
  const drawingId = useDrawing((d) => d.compoundId);
  const bans = useDrawing((d) => d.bans);
  const pocketPicks = useDrawing((d) => d.pocketPicks);
  const charts = useDrawing((d) => d.charts).filter(
    (c) => (c.type === "DRAWN" || c.type === "PLACEHOLDER") && !bans[c.id],
  );
  const dispatch = useDispatch();
  const players = meta.entrants;

  // Calculate points per song if pointsAwardedMode is enabled
  const pointsAwardedMode = meta.pointsAwardedMode ?? true;
  const numPlayers = players.length;

  // Function to calculate points for a chart
  function calculatePointsForChart(chartId: string): Record<string, number> {
    if (!pointsAwardedMode || !meta.scoresByEntrant) return {};
    const scores: Array<{ playerId: string; score: number }> = [];
    for (const entrant of players) {
      const score = meta.scoresByEntrant[entrant.id]?.[chartId];
      if (typeof score === "number") {
        scores.push({ playerId: entrant.id, score });
      }
    }
    scores.sort((a, b) => b.score - a.score); // descending
    const points: Record<string, number> = {};
    let currentPlacement = 1;
    let lastScore = -1;
    for (let i = 0; i < scores.length; i++) {
      const { playerId, score } = scores[i];
      if (score !== lastScore) {
        currentPlacement = i + 1;
        lastScore = score;
      }
      points[playerId] =
        currentPlacement === 1
          ? numPlayers + 1
          : numPlayers - currentPlacement + 1;
    }
    return points;
  }

  // Calculate totals and rankings
  const playerTotals = players.map((entrant, idx) => {
    let totalScore = 0;
    let totalPoints = 0;
    for (const chart of charts) {
      const score = meta.scoresByEntrant?.[entrant.id]?.[chart.id];
      if (typeof score === "number") {
        totalScore += score;
      }
      if (pointsAwardedMode) {
        const points = calculatePointsForChart(chart.id)[entrant.id] || 0;
        totalPoints += points;
      }
    }
    return { idx, totalScore, totalPoints };
  });

  // Sort for ranking
  const rankedPlayers = [...playerTotals].sort((a, b) => {
    if (pointsAwardedMode) {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.totalScore - a.totalScore;
    }
    return b.totalScore - a.totalScore;
  });

  // Map idx to placement
  const placementMap = new Map<number, number>();
  rankedPlayers.forEach((p, rank) => {
    placementMap.set(p.idx, rank + 1);
  });

  const playerOrderMap = rankedPlayers.map((p) => p.idx);

  function updateScore(playerIdx: number, chartId: string, rawInput: string) {
    const playerId = players[playerIdx].id;
    const score = Number.parseInt(rawInput, 10);
    if (!Number.isSafeInteger(score)) {
      return;
    }
    dispatch(
      drawingsSlice.actions.addPlayerScore({
        drawingId,
        chartId,
        playerId,
        score,
      }),
    );
  }

  function playerCellRenderer(displayIdx: number) {
    const playerIdx = playerOrderMap[displayIdx];
    return (
      <Cell style={{ fontSize: "16px", padding: "10px 8px" }}>
        {inferShortname(players[playerIdx].name)}
      </Cell>
    );
  }
  function getPlayerScore(displayIdx: number, chartId: string) {
    const playerIdx = playerOrderMap[displayIdx];
    if (meta.scoresByEntrant) {
      const playerId = players[playerIdx].id;
      const scoreNum = meta.scoresByEntrant[playerId][chartId];
      if (typeof scoreNum === "number") {
        return scoreNum;
      }
    }
  }

  function playerScoreRenderer(displayIdx: number, chartId: string) {
    const playerIdx = playerOrderMap[displayIdx];
    const score = getPlayerScore(displayIdx, chartId)?.toLocaleString();
    const points = pointsAwardedMode
      ? calculatePointsForChart(chartId)[players[playerIdx].id]
      : undefined;
    const displayValue =
      pointsAwardedMode && points !== undefined
        ? `${score || ""} (${points})`
        : score;
    return (
      <EditableCell2
        style={{ textAlign: "right", fontSize: "16px", padding: "8px 10px" }}
        value={displayValue}
        onConfirm={(value) => updateScore(playerIdx, chartId, value)}
      />
    );
  }

  const chartCols = charts.map<ReactElement<ColumnProps>>((c) => {
    let songName: string;
    if (c.type === "PLACEHOLDER") {
      songName = "Free Pick";
    } else {
      songName = c.nameTranslation || c.name;
    }
    const maybeReplacedBy = pocketPicks[c.id]?.pick;
    if (maybeReplacedBy) {
      songName = maybeReplacedBy.nameTranslation || maybeReplacedBy.name;
    }
    const sortableColumn = new ScoreSortableColumn(songName, c.id);
    return sortableColumn.getColumn(
      (rowIdx) => playerScoreRenderer(rowIdx, c.id),
      () => {}, // disable sorting since we have live ranking
    );
  });

  chartCols.unshift(
    <Column key="players" name="Player" cellRenderer={playerCellRenderer} />,
  );

  // Add total columns
  chartCols.push(
    <Column
      key="total-score"
      name="Total Score"
      cellRenderer={(rowIdx) => {
        const playerIdx = playerOrderMap[rowIdx];
        const total = playerTotals[playerIdx].totalScore.toLocaleString();
        return (
          <Cell
            style={{
              textAlign: "right",
              fontSize: "16px",
              padding: "10px 8px",
            }}
          >
            {total}
          </Cell>
        );
      }}
    />,
  );

  if (pointsAwardedMode) {
    chartCols.push(
      <Column
        key="total-points"
        name="Total Points"
        cellRenderer={(rowIdx) => {
          const playerIdx = playerOrderMap[rowIdx];
          const total = playerTotals[playerIdx].totalPoints;
          return (
            <Cell
              style={{
                textAlign: "right",
                fontSize: "16px",
                padding: "10px 8px",
              }}
            >
              {total}
            </Cell>
          );
        }}
      />,
    );
  }

  chartCols.push(
    <Column
      key="placement"
      name="Placement"
      cellRenderer={(rowIdx) => {
        const playerIdx = playerOrderMap[rowIdx];
        const placement = placementMap.get(playerIdx);
        return (
          <Cell
            style={{
              textAlign: "center",
              fontSize: "16px",
              padding: "10px 8px",
            }}
          >
            {placement}
          </Cell>
        );
      }}
    />,
  );

  return (
    <HotkeysProvider>
      <div style={{ marginBottom: "10px" }}>
        <Checkbox
          checked={pointsAwardedMode}
          onChange={() => {
            dispatch(
              drawingsSlice.actions.updateOne({
                id: drawingId[0],
                changes: {
                  meta: { ...meta, pointsAwardedMode: !pointsAwardedMode },
                },
              }),
            );
          }}
        >
          Enable Points Awarded Mode
        </Checkbox>
      </div>
      <div
        style={{
          overflowX: "auto",
          width: "100%",
          paddingBottom: "12px",
          fontSize: "16px",
        }}
      >
        <Table2
          numRows={players.length}
          enableFocusedCell
          defaultColumnWidth={160}
          rowHeights={new Array(players.length).fill(50)}
          columnWidths={[
            200,
            ...charts.map(() => 160),
            160,
            ...(pointsAwardedMode ? [160] : []),
            140,
          ]} // player, charts, total score, total points?, placement
          cellRendererDependencies={[
            playerOrderMap,
            players,
            charts,
            bans,
            pocketPicks,
            meta.scoresByEntrant,
            pointsAwardedMode,
            playerTotals,
            placementMap,
          ]}
        >
          {chartCols}
        </Table2>
      </div>
    </HotkeysProvider>
  );
}
