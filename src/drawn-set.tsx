import { memo, useContext, useState } from "react";
import { SongCard } from "./song-card";
import { ProgressBar } from "@blueprintjs/core";
import styles from "./drawn-set.css";
import {
  Drawing,
  DrawnChart,
  PlayerActionOnChart,
  PocketPick,
} from "./models/Drawing";
import { ConfigStateContext } from "./config-state";
import { useForceUpdate } from "./hooks/useForceUpdate";

const HUE_STEP = (255 / 8) * 3;
let hue = Math.floor(Math.random() * 255);

function getRandomGradiant() {
  hue += HUE_STEP;
  return `linear-gradient(hsl(${hue}, 40%, 80%), transparent, transparent)`;
}

interface Props {
  drawing: Drawing;
}

function DrawnSetImpl({ drawing }: Props) {
  const forceUpdate = useForceUpdate();
  const { orderByAction } = useContext(ConfigStateContext);
  const [backgroundImage] = useState(getRandomGradiant());

  function renderChart(chart: DrawnChart) {
    const veto = drawing.bans.find((b) => b.chartId === chart.id);
    const protect = drawing.protects.find((b) => b.chartId === chart.id);
    const pocketPick = drawing.pocketPicks.find((b) => b.chartId === chart.id);
    return (
      <SongCard
        key={chart.id}
        iconCallbacks={{
          onVeto: handleBanProtectReplace.bind(
            undefined,
            drawing.bans,
            chart.id as number
          ),
          onProtect: handleBanProtectReplace.bind(
            undefined,
            drawing.protects,
            chart.id as number
          ),
          onReplace: handleBanProtectReplace.bind(
            undefined,
            drawing.pocketPicks,
            chart.id as number
          ),
          onReset: handleReset.bind(undefined, chart.id as number),
        }}
        vetoedBy={veto && veto.player}
        protectedBy={protect && protect.player}
        replacedBy={pocketPick && pocketPick.player}
        replacedWith={pocketPick && pocketPick.pick}
        chart={chart}
      />
    );
  }

  /**
   * handles any of the protect/pocket-pick/ban actions a user may take on a drawn chart
   * @param arr array containing any previous actions of this type, to be mutated
   * @param chartId id of the chart being acted upon
   * @param player the player acting on the chart, 1 or 2
   * @param chart new chart being pocket picked, if this is a pocket pick action
   */
  function handleBanProtectReplace(
    arr: Array<PlayerActionOnChart> | Array<PocketPick>,
    chartId: number,
    player: 1 | 2,
    chart?: DrawnChart
  ) {
    if (orderByAction) {
      const indexToCut = drawing.charts.findIndex(
        (chart) => chart.id === chartId
      );
      const [shiftedChart] = drawing.charts.splice(indexToCut, 1);
      if (arr === drawing.bans) {
        // insert at tail of list
        const insertPoint = drawing.charts.length;
        drawing.charts.splice(insertPoint, 0, shiftedChart);
      } else {
        // insert at head of list, behind other picks
        const insertPoint =
          drawing.protects.length + drawing.pocketPicks.length;
        drawing.charts.splice(insertPoint, 0, shiftedChart);
      }
    }

    const existingBanIndex = arr.findIndex((b) => b.chartId === chart?.id);
    if (existingBanIndex >= 0) {
      arr.splice(existingBanIndex, 1);
    } else {
      arr.push({ player, pick: chart!, chartId });
    }
    forceUpdate();
  }

  function handleReset(chartId: number) {
    drawing.bans = drawing.bans.filter((p) => p.chartId !== chartId);
    drawing.protects = drawing.protects.filter((p) => p.chartId !== chartId);
    drawing.pocketPicks = drawing.pocketPicks.filter(
      (p) => p.chartId !== chartId
    );
    forceUpdate();
  }

  return (
    <div
      key={drawing.id}
      className={styles.chartList}
      style={{ backgroundImage }}
    >
      {drawing.charts.map(renderChart)}
    </div>
  );
}

export const DrawnSet = memo(DrawnSetImpl);
