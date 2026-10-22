import { expect, it } from 'vitest';
import { runResistanceCalibration } from './resistance-calibration.mts';

it('meets Friday reference targets and improves the next commuting week without unlimited collection', () => {
 const results = runResistanceCalibration();
 expect(runResistanceCalibration()).toEqual(results);
 const scenario = (name: string) => results.find(result => result.name === name)!.weeks;
 const commute = scenario('commute'), adventure = scenario('weekend-adventure');
 expect(commute[0].fridayReward).toBeGreaterThanOrEqual(60);
 expect(commute[0].fridayReward).toBeLessThanOrEqual(70);
 expect(commute[3].fridayReward).toBeGreaterThanOrEqual(45);
 expect(commute[3].fridayReward).toBeLessThanOrEqual(55);
 for (const week of adventure) {
  expect(week.afterLabReward).toBeGreaterThanOrEqual(85);
  expect(week.afterLabReward).toBeLessThanOrEqual(90);
 }
 expect(adventure[1].fridayReward).toBeGreaterThan(commute[1].fridayReward);
 expect(adventure[1].meanVisitReward).toBeGreaterThan(commute[1].meanVisitReward);
 expect(scenario('high-mileage')[3].fridayReward).toBeLessThan(85);
 expect(scenario('alternating-hotspots')[3].fridayReward).toBeLessThan(85);
 for (const result of results) for (const week of result.weeks) {
  expect(week.fridayReward).toBeGreaterThanOrEqual(25);
  expect(week.meanVisitReward).toBeLessThanOrEqual(100);
 }
});
