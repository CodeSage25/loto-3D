export const initialState = {
  phase: "IDLE",
  drawnBalls: [],
  finalBalls: [],
  drawOrder: [],
  totalDrawn: 0,
  statusMessage: "",
};

export function drawReducer(state, action) {
  switch (action.type) {
    case "START_DRAW":
      return {
        ...state,
        phase: "DRAWING_PHASE1",
        drawOrder: action.drawOrder,
        drawnBalls: [],
        finalBalls: [],
        totalDrawn: 0,
        statusMessage: " — Tirage de 8 boules...",
      };
    case "BALL_DRAWN_P1": {
      const newDrawn = [...state.drawnBalls, action.ballNumber];
      return {
        ...state,
        drawnBalls: newDrawn,
        totalDrawn: state.totalDrawn + 1,
        statusMessage: ` — ${newDrawn.length}/8 boules tirées`,
      };
    }
    case "START_CLEARING":
      return {
        ...state,
        phase: "CLEARING",
        statusMessage: "💨 Wait...",
      };
    case "CLEARING_PROGRESS":
      return {
        ...state,
        statusMessage: `💨 ... ${action.count}/77`,
      };
    case "START_PHASE3":
      return {
        ...state,
        phase: "DRAWING_PHASE3",
        statusMessage: "⭐ — 5 dernières boules...",
      };
    case "BALL_DRAWN_P3": {
      const newFinal = [...state.finalBalls, action.ballNumber];
      return {
        ...state,
        finalBalls: newFinal,
        totalDrawn: state.totalDrawn + 1,
        statusMessage: `⭐  — ${newFinal.length}/5 boules`,
      };
    }
    case "FINISH":
      return {
        ...state,
        phase: "DONE",
        statusMessage: "🎉 Tirage terminé félicitation !",
      };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}
