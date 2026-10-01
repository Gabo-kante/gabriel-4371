import { describe, expect, it } from "vitest";
import { SNAILS, RACES, getWinsBySnail, BETS, getBetOutcomes } from "./simulatedData";

describe("datos simulados del dashboard", () => {
  it("tiene 6 caracoles con ids únicos", () => {
    expect(SNAILS).toHaveLength(6);
    expect(new Set(SNAILS.map((snail) => snail.id)).size).toBe(6);
  });

  it("tiene 6 carreras con ids únicos", () => {
    expect(RACES).toHaveLength(6);
    expect(new Set(RACES.map((race) => race.id)).size).toBe(6);
  });

  it("cada carrera la gana un caracol que existe", () => {
    const ids = new Set(SNAILS.map((snail) => snail.id));
    expect(RACES.every((race) => ids.has(race.winnerId))).toBe(true);
  });

  it("las victorias de todos los caracoles suman exactamente 6", () => {
    const total = getWinsBySnail().reduce((sum, item) => sum + item.wins, 0);
    expect(total).toBe(6);
  });

  it("toda apuesta apunta a una carrera y a un caracol que existen", () => {
    const raceIds = new Set(RACES.map((race) => race.id));
    const snailIds = new Set(SNAILS.map((snail) => snail.id));
    expect(BETS.every((bet) => raceIds.has(bet.raceId) && snailIds.has(bet.snailId))).toBe(true);
  });

  it("apuestas ganadas + perdidas = total de apuestas", () => {
    const { won, lost, total } = getBetOutcomes();
    expect(won + lost).toBe(total);
    expect(total).toBe(BETS.length);
  });

  it("mantiene el resultado esperado del conjunto de datos actual", () => {
    expect(getBetOutcomes()).toEqual({ won: 5, lost: 7, total: 12 });
  });

  it("una apuesta gana solo si su caracol ganó esa carrera", () => {
    const races = [{ id: 1, winnerId: "a" }];
    const bets = [
      { raceId: 1, snailId: "a", amountCents: 100 },
      { raceId: 1, snailId: "b", amountCents: 100 },
    ];
    expect(getBetOutcomes(bets, races)).toEqual({ won: 1, lost: 1, total: 2 });
  });
});