// import { Component } from "react";
// import { ProgressBar } from "@blueprintjs/core";

// interface Props {
//   turnCounter: number;
//   className?: string;
//   height: number;
// }

// let message ='Waiting for set';
//     let currentTurn ='orange';
//     let progressValue = .22
//     if (turnCounter === 0) {
//       message = 'Player 1 Protect';
//       currentTurn = 'green';
//       progressValue = .22
//     }
//     if (turnCounter === 1) {
//       message = 'Player 2 Protect';
//       currentTurn = 'blue';
//       progressValue = .42
//     }
//     if (turnCounter === 2 ) {
//       message = 'Player 1 Veto';
//       currentTurn = 'green';
//       progressValue = .56
//     }
//     if (turnCounter === 3 ) {
//       message = 'Player 2 Veto';
//       currentTurn = 'blue';
//       progressValue = .70
//     }
//     if (turnCounter === 4 ) {
//       message = 'Player 1 Veto';
//       currentTurn = 'green';
//       progressValue = .84
//     }
//     if (turnCounter === 5 ) {
//       message = 'Player 2 Veto';
//       currentTurn = 'blue';
//       progressValue = .96
//     }
//     if (turnCounter === 6) {
//       message = 'Draw complete';
//       currentTurn = 'orange';
//       progressValue = 1.0
//     }

// export function SongJacket(props: Props) {
//   if (props.song.jacket) {
//     return (
//       <img
//         src={`jackets/${props.song.jacket}`}
//         className={props.className}
//         style={{ height: `${props.height}px` }}
//       />

//       <ProgressBar intent={'success'} value={progressValue} />
//       <h2 style={{textAlign: 'center', color: currentTurn}}>{message}</h2>
//     );
//   }
//   return (
//     <div className={props.className}>
//       <Music size={props.height} />
//     </div>
//   );
// }


