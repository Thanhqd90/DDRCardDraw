import { useContext, memo } from "react";
import { DrawnSet } from "./drawn-set";
import styles from "./drawing-list.css";
import { DrawStateContext } from "./draw-state";
import { Drawing } from "./models/Drawing";
import { ConfigStateContext } from "./config-state";
import { EligibleChartsList } from "./eligible-charts-list";
import { Callout, NonIdealState } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import logo from "./assets/bite5.png";
import { Link } from "@blueprintjs/icons/lib/esm/generated/16px/paths";

const renderDrawing = (drawing: Drawing) => (
  <DrawnSet key={drawing.id} drawing={drawing} />
);

const ScrollableDrawings = memo((props: { drawings: Drawing[] }) => {
  return <div>{props.drawings.map(renderDrawing)}</div>;
});

export function DrawingList() {
  const { drawings } = useContext(DrawStateContext);
  const configState = useContext(ConfigStateContext);
  if (configState.showPool) {
    return <EligibleChartsList />;
  }
  if (!drawings.length) {
    return (
      <div className={styles.empty}>
        <NonIdealState
          icon={<img src={logo} height={256} />}
          title="The Beast in the East 5 SMX Card Draw"
          action={
            <>
            <Callout intent="danger" icon={IconNames.ArrowTopLeft}>
              Choose a tournament round, then click 'Draw'
            </Callout>
            <a href="https://bit.ly/BITE5-SMX" target="_blank">
            <Callout intent="primary" icon={IconNames.DOCUMENT}>
              See tournament rules
            </Callout>
            </a>
            <a href="https://docs.google.com/spreadsheets/d/1ZVVcTKbEEj13qaLj8CfT9q3doOFMe6RZWuRYHfjdf1A/" target="_blank">
            <Callout intent="success" icon={IconNames.LIST_COLUMNS}>
              See current qualifier standings
            </Callout>
            </a>
            </>
          }
        />
      </div>
    );
  }
  return <ScrollableDrawings drawings={drawings} />;
}
