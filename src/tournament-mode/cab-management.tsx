import {
  Button,
  Card,
  ControlGroup,
  InputGroup,
  Menu,
  MenuItem,
  MenuItemProps,
  Popover,
  Tooltip,
} from "@blueprintjs/core";
import { useAppDispatch, useAppState } from "../state/store";
import React, { ReactNode, useCallback, useState } from "react";
import { CabInfo, eventSlice } from "../state/event.slice";
import {
  Add,
  CaretLeft,
  CaretRight,
  Cross,
  DiagramTree,
  Font,
  Layers,
  MobileVideo,
  More,
  People,
  Person,
  Remove,
} from "@blueprintjs/icons";
import { detectedLanguage } from "../utils";
import { useSetAtom } from "jotai";
import { mainTabAtom } from "./main-view";
import { playerNameByIndex } from "../models/Drawing";
import { drawingsSlice } from "../state/drawings.slice";
import { copyObsSource, routableCabSourcePath } from "./copy-obs-source";
import { useHref } from "react-router-dom";

const MAX_OBS_PLAYERS = 8;
const DEFAULT_OBS_PLAYERS = 2;

function getPlayerObsSourceItems(playerCount: number) {
  const safePlayerCount = Math.min(
    Math.max(playerCount, DEFAULT_OBS_PLAYERS),
    MAX_OBS_PLAYERS,
  );

  return Array.from({ length: safePlayerCount }, (_, index) => {
    const playerNumber = index + 1;

    return [
      {
        text: `Player ${playerNumber}`,
        stub: `p${playerNumber}`,
      },
      {
        text: `Player ${playerNumber} Name`,
        stub: `p${playerNumber}-name`,
      },
      {
        text: `Player ${playerNumber} Score`,
        stub: `p${playerNumber}-score`,
      },
    ];
  }).flat();
}

export function CabManagement() {
  const [isCollapsed, setCollapsed] = useState(true);
  const cabs = useAppState(eventSlice.selectors.allCabs);

  if (isCollapsed) {
    return (
      <div style={{ width: "40px", paddingTop: "1em" }}>
        <Tooltip content="Show cabs">
          <Button minimal onClick={() => setCollapsed(false)}>
            <CaretRight />
          </Button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div style={{ padding: "1em", overflow: "auto" }}>
      <div>
        <AddCabControl>
          <Tooltip content="Hide cabs">
            <Button minimal onClick={() => setCollapsed(true)}>
              <CaretLeft />
            </Button>
          </Tooltip>
        </AddCabControl>
      </div>
      <div>
        {cabs.map((cab) => (
          <CabSummary key={cab.id} cab={cab} />
        ))}
      </div>
    </div>
  );
}

function AddCabControl(props: { children?: ReactNode }) {
  const [name, setName] = useState("");
  const dispatch = useAppDispatch();
  const addCab = useCallback(() => {
    dispatch(eventSlice.actions.addCab(name));
    setName("");
  }, [dispatch, name]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        addCab();
      }}
    >
      <ControlGroup>
        <InputGroup
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Cab name"
        />
        <Button onClick={addCab} icon={<Add />} />
        {props.children}
      </ControlGroup>
    </form>
  );
}

function CabSummary({ cab }: { cab: CabInfo }) {
  const dispatch = useAppDispatch();
  const removeCab = useCallback(
    () => dispatch(eventSlice.actions.removeCab(cab.id)),
    [dispatch, cab.id],
  );

  const drawing = useAppState((s) => {
    if (!cab.activeMatch) return null;
    if (typeof cab.activeMatch === "string") {
      return s.drawings.entities[cab.activeMatch];
    }
    return drawingsSlice.selectors.selectMergedByCompoundId(s, cab.activeMatch);
  });

  const playerCount = drawing?.playerDisplayOrder.length ?? DEFAULT_OBS_PLAYERS;
  const playerObsSourceItems = getPlayerObsSourceItems(playerCount);

  const sourcesMenu = (
    <Menu>
      <MenuItem icon={<MobileVideo />} text="OBS Sources">
        <CopySourceMenuItem
          icon={<Layers />}
          text="Cards"
          stub="cards"
          cabId={cab.id}
        />
        <CopySourceMenuItem
          icon={<Font />}
          text="Title"
          stub="title"
          cabId={cab.id}
        />
        <CopySourceMenuItem
          icon={<DiagramTree />}
          text="Current Phase"
          stub="phase"
          cabId={cab.id}
        />
        <CopySourceMenuItem
          icon={<DiagramTree />}
          text="Gauntlet Table"
          stub="gauntlet-table"
          cabId={cab.id}
        />
        <CopySourceMenuItem
          icon={<People />}
          text="All Players"
          stub="players"
          cabId={cab.id}
        />
        {Array.from({ length: playerCount }, (_, index) => {
          const playerNumber = index + 1;

          return (
            <MenuItem
              key={`player-${playerNumber}`}
              icon={<Person />}
              text={`Player ${playerNumber}`}
            >
              <CopySourceMenuItem
                text="Full"
                stub={`p${playerNumber}`}
                cabId={cab.id}
              />
              <CopySourceMenuItem
                text="Name"
                stub={`p${playerNumber}-name`}
                cabId={cab.id}
              />
              <CopySourceMenuItem
                text="Score"
                stub={`p${playerNumber}-score`}
                cabId={cab.id}
              />
            </MenuItem>
          );
        })}
      </MenuItem>

      <MenuItem icon={<Remove />} text="Remove Cab" onClick={removeCab} />
    </Menu>
  );

  return (
    <div id={cab.id}>
      <h1>
        {cab.name}{" "}
        <Popover content={sourcesMenu}>
          <Button minimal icon={<More />} />
        </Popover>{" "}
      </h1>
      <CurrentMatch cab={cab} />
    </div>
  );
}

function CopySourceMenuItem(
  props: Pick<MenuItemProps, "icon" | "text"> & { stub: string; cabId: string },
) {
  const href = useHref(routableCabSourcePath(props.cabId, props.stub));
  return (
    <MenuItem
      icon={props.icon}
      text={props.text}
      onClick={(e) => {
        e.preventDefault();
        copyObsSource(e.currentTarget.href);
      }}
      href={href}
    />
  );
}

const listFormatter = new Intl.ListFormat(detectedLanguage, {
  style: "short",
  type: "unit",
});

function CurrentMatch(props: { cab: CabInfo }) {
  const dispatch = useAppDispatch();
  const removeCab = useCallback(
    () => dispatch(eventSlice.actions.clearCabAssignment(props.cab.id)),
    [dispatch, props.cab.id],
  );
  const drawing = useAppState((s) => {
    if (!props.cab.activeMatch) return null;
    if (typeof props.cab.activeMatch === "string") {
      return s.drawings.entities[props.cab.activeMatch];
    }
    return drawingsSlice.selectors.selectMergedByCompoundId(
      s,
      props.cab.activeMatch,
    );
  });
  const setMainTab = useSetAtom(mainTabAtom);

  const scrollToDrawing = useCallback(() => {
    if (!drawing) {
      return;
    }
    const el = document.getElementById(`drawing:${drawing.id}`);
    if (!el) {
      return;
    }
    const priorFocus = document.querySelector(
      "[data-focused]",
    ) as HTMLElement | null;
    if (priorFocus) {
      delete priorFocus.dataset.focused;
    }
    setMainTab("drawings");
    el.scrollIntoView({ behavior: "smooth" });
    el.dataset.focused = "";
  }, [drawing, setMainTab]);

  if (!drawing) {
    return <p>No match</p>;
  }
  const filledPlayers = drawing.playerDisplayOrder.map((pIdx, idx) =>
    playerNameByIndex(drawing.meta, pIdx, `Player ${idx + 1}`),
  );
  const assignmentType =
    typeof props.cab.activeMatch === "string" ? "match" : "set";
  return (
    <Card
      elevation={2}
      style={{ position: "relative" }}
      compact
      interactive
      onClick={scrollToDrawing}
    >
      <Button
        minimal
        small
        icon={<Cross />}
        style={{ position: "absolute", right: "0.5em", top: "0.5em" }}
        onClick={removeCab}
      />
      <h3>
        {drawing.meta.title} ({assignmentType})
      </h3>
      <p>{listFormatter.format(filledPlayers)}</p>
    </Card>
  );
}
