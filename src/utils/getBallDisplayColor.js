import { getBallColorGroup } from "../constants";

export function getBallDisplayColor(number) {
  const group = getBallColorGroup(number);
  
  if (group.center === "#60A5FA") return "blue";
  if (group.center === "#FB7185") return "red";
  return "green";
}