export interface Snail {
  id: string;
  name: string;
}

export interface Race {
  id: number;
  winnerId: string;
}

export interface SimulatedBet {
  raceId: number;
  snailId: string;
  amountCents: number;
}

export const SNAILS: readonly Snail[] = [
  { id: "s1", name: "Rayo" },
  { id: "s2", name: "Sombra" },
  { id: "s3", name: "Gary" },
  { id: "s4", name: "Brisa" },
  { id: "s5", name: "Rocky" },
  { id: "s6", name: "Turbo" },
];

// Un día simulado: 6 carreras, un ganador por carrera
export const RACES: readonly Race[] = [
  { id: 1, winnerId: "s3" },
  { id: 2, winnerId: "s1" },
  { id: 3, winnerId: "s3" },
  { id: 4, winnerId: "s5" },
  { id: 5, winnerId: "s2" },
  { id: 6, winnerId: "s3" },
];

// Apuestas del usuario en ese día. Ganada = su caracol ganó esa carrera.
export const BETS: readonly SimulatedBet[] = [
  { raceId: 1, snailId: "s3", amountCents: 5_000 },
  { raceId: 1, snailId: "s1", amountCents: 2_000 },
  { raceId: 2, snailId: "s2", amountCents: 3_000 },
  { raceId: 3, snailId: "s3", amountCents: 4_000 },
  { raceId: 3, snailId: "s5", amountCents: 1_500 },
  { raceId: 4, snailId: "s5", amountCents: 2_500 },
  { raceId: 4, snailId: "s4", amountCents: 1_000 },
  { raceId: 5, snailId: "s6", amountCents: 2_000 },
  { raceId: 5, snailId: "s2", amountCents: 3_500 },
  { raceId: 6, snailId: "s3", amountCents: 6_000 },
  { raceId: 6, snailId: "s4", amountCents: 1_000 },
  { raceId: 6, snailId: "s1", amountCents: 2_000 },
];

export interface SnailWins {
  snailId: string;
  name: string;
  wins: number;
}

export function getWinsBySnail(
  snails: readonly Snail[] = SNAILS,
  races: readonly Race[] = RACES,
): SnailWins[] {
  return snails.map(({ id, name }) => ({
    snailId: id,
    name,
    wins: races.filter((race) => race.winnerId === id).length,
  }));
}

export interface BetOutcomes {
  won: number;
  lost: number;
  total: number;
}

export function getBetOutcomes(
  bets: readonly SimulatedBet[] = BETS,
  races: readonly Race[] = RACES,
): BetOutcomes {
  const winnerByRace = new Map(races.map((race) => [race.id, race.winnerId]));
  const won = bets.filter((bet) => winnerByRace.get(bet.raceId) === bet.snailId).length;
  return { won, lost: bets.length - won, total: bets.length };
}