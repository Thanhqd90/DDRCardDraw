import classNames from "classnames";
import { detectedLanguage } from "../utils";
import styles from "./song-card.module.css";
import { useState } from "react";
import { IconMenu } from "./icon-menu";
import { CardLabel } from "./card-label";
import { DrawnChart } from "../models/Drawing";
import { AbbrDifficulty } from "../game-data-utils";
import { useDifficultyColor } from "../hooks/useDifficultyColor";
import { ShockBadge } from "./shock-badge";
import { Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

const isJapanese = detectedLanguage === "ja";

type Player = 1 | 2;

interface Props {
  chart: DrawnChart;
  vetoedBy: Player | undefined;
  protectedBy: Player | undefined;
  replacedBy: Player | undefined;
  replacedWith: DrawnChart | undefined;
  onVeto: (p: Player) => void;
  onProtect: (p: Player) => void;
  onReplace: (p: Player, chart: DrawnChart) => void;
  onReset: () => void;
}

export function SongCard(props: Props) {
  const {
    chart,
    vetoedBy,
    protectedBy,
    replacedBy,
    replacedWith,
    onVeto,
    onProtect,
    onReplace,
    onReset
  } = props;

  const [showingIconMenu, setShowIconMenu] = useState(false);
  const showIcons = () => setShowIconMenu(true);
  const hideIcons = () => {
    setShowIconMenu(false);
    return true;
  };

  const {
    name,
    nameTranslation,
    artist,
    artistTranslation,
    bpm,
    difficultyClass,
    level,
    hasShock,
    jacket
  } = replacedWith || chart;
  const diffAccentColor = useDifficultyColor(difficultyClass);

  const rootClassname = classNames(styles.chart, {
    [styles.vetoed]: vetoedBy,
    [styles.protected]: protectedBy || replacedBy
  });

  let jacketBg = {};
  if (jacket) {
    jacketBg = {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("jackets/${jacket}")`
    };
  }

  return (
    <div
      className={rootClassname}
      onClick={showingIconMenu ? undefined : showIcons}
    >
      {vetoedBy && (
        <CardLabel left={vetoedBy === 1}>
          P{vetoedBy}
          <Icon icon={IconNames.BAN_CIRCLE} />
        </CardLabel>
      )}
      {protectedBy && (
        <CardLabel left={protectedBy === 1}>
          P{protectedBy}
          <Icon icon={IconNames.LOCK} />
        </CardLabel>
      )}
      {replacedBy && (
        <CardLabel left={replacedBy === 1}>
          P{replacedBy}
          <Icon icon={IconNames.INHERITANCE} />
        </CardLabel>
      )}
      {showingIconMenu && (
        <IconMenu
          onProtect={(p: Player) => hideIcons() && onProtect(p)}
          onPocketPicked={(p: Player, c: DrawnChart) =>
            hideIcons() && onReplace(p, c)
          }
          onVeto={(p: Player) => hideIcons() && onVeto(p)}
          onlyReset={!!(vetoedBy || protectedBy || replacedBy)}
          onReset={() => hideIcons() && onReset()}
          onClose={hideIcons}
        />
      )}
      <div className={styles.cardCenter} style={jacketBg}>
        <div className={styles.name} title={nameTranslation}>
          {name}
        </div>
        {isJapanese ? null : (
          <div className={styles.nameTranslation}>{nameTranslation}</div>
        )}
        <div className={styles.artist} title={artistTranslation}>
          {artist}
        </div>
      </div>
      <div
        className={styles.cardFooter}
        style={{ backgroundColor: diffAccentColor }}
      >
        <div className={styles.bpm}>{bpm} BPM</div>
        {hasShock && <ShockBadge />}
        <div className={styles.difficulty}>
          <AbbrDifficulty diffClass={difficultyClass} /> {level}
        </div>
      </div>
    </div>
  );
}
