import { useParams } from "react-router-dom";
import { drawingsSlice } from "../state/drawings.slice";
import { useAppState } from "../state/store";
import {
  getAllPlayers,
  playerNameByIndex,
  playerCount,
} from "../models/Drawing";

export function GlobalLabel() {
  const params = useParams<"roomName" | "labelId">();
  const text = useAppState((s) => {
    if (!params.labelId) return null;
    const label = s.event.obsLabels[params.labelId];
    if (!label) return null;
    return label.value;
  });
  return <h1>{text}</h1>;
}

export function CabTitle() {
  const params = useParams<"roomName" | "cabId">();
  const text = useAppState((s) => {
    const drawingId = s.event.cabs[params.cabId!].activeMatch;
    if (!drawingId) return null;
    const [parent] = drawingsSlice.selectors.byCompoundOrPlainId(s, drawingId);
    if (!parent) return null;
    return parent.meta.title;
  });
  return <h1>{text}</h1>;
}

export function CabPlayers() {
  const params = useParams<"roomName" | "cabId">();
  const text = useAppState((s) => {
    const drawingId = s.event.cabs[params.cabId!].activeMatch;
    if (!drawingId) return null;
    const [parent] = drawingsSlice.selectors.byCompoundOrPlainId(s, drawingId);
    if (!parent) return null;
    return getAllPlayers(parent).join(", ");
  });
  return <h1>{text}</h1>;
}

export function CabPlayer(props: {
  p: number;
  displayType?: "NameAndScore" | "Name" | "Score";
}) {
  const { displayType = "NameAndScore " } = props;
  const params = useParams<"roomName" | "cabId">();
  const text = useAppState((s) => {
    const drawingId = s.event.cabs[params.cabId!].activeMatch;
    if (!drawingId) return null;
    const [parent] = drawingsSlice.selectors.byCompoundOrPlainId(s, drawingId);
    if (!parent) return null;
    const playerIndex = parent.playerDisplayOrder[props.p - 1];
    const name = playerNameByIndex(parent.meta, playerIndex, "");
    if (parent.meta.type === "startgg" && parent.meta.subtype === "gauntlet") {
      const scoresByEntrant = parent.meta.scoresByEntrant || {};
      const playerId = parent.meta.entrants[playerIndex].id;
      const numPlayers = playerCount(parent.meta);
      const charts = parent.charts
        ? parent.charts.filter((c) => c.type === "DRAWN" && !parent.bans[c.id])
        : [];
      let score = 0;
      for (const c of charts) {
        const chartId = c.id;
        const chartScores: Array<{ pId: string; score: number }> = [];
        for (const entrant of parent.meta.entrants) {
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
      if (displayType === "Name") {
        return name;
      }
      if (displayType === "Score") {
        return score;
      }
      return `${name} (${score})`;
    }
    const score = Object.values(parent.winners).reduce<number>((prev, curr) => {
      if (curr === playerIndex) return prev + 1;
      return prev;
    }, 0);
    if (displayType === "Name") {
      return name;
    }
    if (displayType === "Score") {
      return score;
    }
    return `${name} (${score})`;
  });
  return <h1>{text}</h1>;
}

export function PhaseName() {
  const params = useParams<"roomName" | "cabId">();
  const text = useAppState((s) => {
    const drawingId = s.event.cabs[params.cabId!].activeMatch;
    if (!drawingId) return null;
    const [parent] = drawingsSlice.selectors.byCompoundOrPlainId(s, drawingId);
    if (!parent) return null;
    return parent.meta.type === "startgg" ? parent.meta.phaseName : null;
  });

  return <h1>{text}</h1>;
}
