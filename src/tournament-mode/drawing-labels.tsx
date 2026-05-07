import { useCallback, Fragment } from "react";
import { useDrawing } from "../drawing-context";
import styles from "./drawing-labels.css";
import { Icon } from "@blueprintjs/core";
import { CaretLeft, CaretRight } from "@blueprintjs/icons";
import { useAtomValue } from "jotai";
import { showPlayerAndRoundLabels } from "../config-state";
import { useAppDispatch } from "../state/store";
import { drawingsSlice } from "../state/drawings.slice";
import { getAllPlayers, playerCount } from "../models/Drawing";
import { CountingSet } from "../utils/counting-set";

export function MatchLabels() {
  const showLabels = useAtomValue(showPlayerAndRoundLabels);
  const playerDisplayOrder = useDrawing((d) => d.playerDisplayOrder);
  const meta = useDrawing((d) => d.meta);
  const winners = useDrawing((d) => d.winners);
  const charts = useDrawing((d) => d.charts);
  const bans = useDrawing((d) => d.bans);
  if (!showLabels) {
    return null;
  }

  const isGauntlet = meta.type === "startgg" && meta.subtype === "gauntlet";
  let winsPerPlayer: CountingSet<number> | undefined;
  let pointsPerPlayer: Map<number, number> | undefined;
  if (isGauntlet) {
    pointsPerPlayer = new Map();
    const scoresByEntrant = meta.scoresByEntrant || {};
    const numPlayers = playerCount(meta);
    const drawnCharts = charts
      ? charts.filter((c) => c.type === "DRAWN" && !bans[c.id])
      : [];
    for (
      let playerIndex = 0;
      playerIndex < meta.entrants.length;
      playerIndex++
    ) {
      const playerId = meta.entrants[playerIndex].id;
      let score = 0;
      for (const c of drawnCharts) {
        const chartId = c.id;
        const chartScores: Array<{ pId: string; score: number }> = [];
        for (const entrant of meta.entrants) {
          const s = scoresByEntrant[entrant.id]?.[chartId];
          if (typeof s === "number") {
            chartScores.push({ pId: entrant.id, score: s });
          }
        }
        chartScores.sort((a, b) => b.score - a.score);
        let currentPlacement = 1;
        let lastScore = -1;
        for (let i = 0; i < chartScores.length; i++) {
          const { pId, score: sc } = chartScores[i];
          if (sc !== lastScore) {
            currentPlacement = i + 1;
            lastScore = sc;
          }
          if (pId === playerId) {
            score +=
              currentPlacement === 1
                ? numPlayers + 1
                : numPlayers - currentPlacement + 1;
            break;
          }
        }
      }
      pointsPerPlayer.set(playerIndex, score);
    }
  } else {
    winsPerPlayer = new CountingSet<number>();
    for (const pIdx of Object.values(winners)) {
      if (pIdx === null) {
        continue;
      }
      winsPerPlayer.add(pIdx);
    }
  }

  const allPlayers = getAllPlayers({ meta, playerDisplayOrder });

  return (
    <div className={styles.headers}>
      <div className={styles.title}>{meta.title}</div>
      <div className={styles.players}>
        {allPlayers.map((name, idx) => {
          const displayScore = isGauntlet
            ? pointsPerPlayer?.get(playerDisplayOrder[idx]) || 0
            : winsPerPlayer?.get(playerDisplayOrder[idx]) || 0;
          const ret = (
            <span key={idx}>
              {name} ({displayScore})
            </span>
          );
          if (allPlayers.length === 2 && idx === 0) {
            return (
              <Fragment key={idx}>
                {ret}
                <Versus />
              </Fragment>
            );
          }
          return ret;
        })}
      </div>
    </div>
  );
}

function Versus() {
  const dispatch = useAppDispatch();
  const parentId = useDrawing((s) => s.id);
  const ipp = useCallback(
    () => dispatch(drawingsSlice.actions.incrementPriorityPlayer(parentId)),
    [dispatch, parentId],
  );
  const priorityPlayer = useDrawing((s) => s.priorityPlayer);
  return (
    <div className={styles.versus} onClick={ipp}>
      <Icon
        icon={
          <CaretLeft
            style={{
              visibility: priorityPlayer === 1 ? "visible" : "hidden",
              verticalAlign: "middle",
            }}
          />
        }
      />
      {" vs "}
      <Icon
        icon={
          <CaretRight
            style={{
              visibility: priorityPlayer === 2 ? "visible" : "hidden",
              verticalAlign: "middle",
            }}
          />
        }
      />
    </div>
  );
}
