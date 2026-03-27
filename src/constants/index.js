export const IS_MOBILE =
  typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

export const BOULIER_RADIUS = 4.0;
export const BALL_RADIUS_DISPLAY = 1.44;
export const BALL_RADIUS = 0.4;
export const TOTAL_BALLS = 90;
export const DRAW_DELAY = 1800;

export const PHASE1_COUNT = 8;
export const PHASE2_EVACUATE = 77;
export const PHASE3_COUNT = 5;

// Tube de réception gauche 1 (Phase 1 — 8 boules)
export const TUBE_RADIUS = 0.55;
export const TUBE_LENGTH = 7.0;
export const TUBE_LEFT_ENTRY_X = -1.8;
export const TUBE_LEFT_Y = -7.0;

// ═══ Tube de réception gauche 2 (Phase 3 — 5 boules) ═══
export const TUBE2_LENGTH = 7.0;
export const TUBE2_RADIUS = 0.55;
export const TUBE2_VERTICAL_GAP = 1.8;
export const TUBE2_ENTRY_X = TUBE_LEFT_ENTRY_X; // ✅ Même X d'entrée que le tube 1
export const TUBE2_Y = TUBE_LEFT_Y - TUBE2_VERTICAL_GAP; // En dessous du tube 1

// Canal gauche
export const CANAL_WIDTH = BALL_RADIUS * 3;
export const CANAL_DEPTH = BALL_RADIUS * 3;

// Canal droit
export const CANAL_RIGHT_WIDTH = BALL_RADIUS * 3.5;

// Boîte de collection droite
export const BOX_X = 7.0;
export const BOX_Y = -6.5;
export const BOX_WIDTH = 7.0;
export const BOX_HEIGHT = 3.0;
export const BOX_DEPTH = 3.5;

// Entonnoirs sous le boulier
export const FUNNEL_TOP_RADIUS = BALL_RADIUS * 3;
export const FUNNEL_BOTTOM_RADIUS = BALL_RADIUS * 2;
export const FUNNEL_HEIGHT = 0.8;

export const BALL_COLORS = {
  blue: { center: "#60A5FA", edge: "#2563EB" },
  red: { center: "#FB7185", edge: "#DC2626" },
  green: { center: "#4ADE80", edge: "#16A34A" },
};

export const getBallColorGroup = (num) => {
  if (num <= 30) return BALL_COLORS.blue;
  if (num <= 60) return BALL_COLORS.red;
  return BALL_COLORS.green;
};
