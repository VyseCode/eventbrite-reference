export function hasEnded(endIso: string) {
  return new Date(endIso).getTime() <= Date.now();
}

export function isPast(startIso: string) {
  return new Date(startIso).getTime() <= Date.now();
}
