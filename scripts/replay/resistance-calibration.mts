import { pathToFileURL } from 'node:url';
import {
 BALANCE, collectRestoration, collectionFactor, commitResistance, createResistance,
 resistanceAt, resistanceWeight, restorationFraction, selectResistanceCentre, visitRewardFraction,
} from '../../packages/game/src/index.ts';

const day = 86400000;
const home = { longitude: 23.76, latitude: 61.49 };
const far = { longitude: 24.06, latitude: 61.49 };
const scenarios = ['commute', 'weekend-adventure', 'local-walks', 'alternating-hotspots', 'fresh-replacements', 'high-mileage', 'multiple-targets'] as const;
const percent = (value: number) => +(100 * value).toFixed(2);

export function runResistanceCalibration() {
 return scenarios.map(name => {
  let state = createResistance();
  let visitCount = 0;
  const weeks: { week: number; meanVisitReward: number; fridayReward: number; afterLabReward: number | null }[] = [];
  for (let week = 0; week < 4; week++) {
   const rewards: number[] = [];
   let fridayReward = 1;
   for (let weekday = 0; weekday < 5; weekday++) {
    const visits = name === 'local-walks' ? 1 : name === 'high-mileage' ? 4 : 2;
    for (let visit = 0; visit < visits; visit++) {
     const at = (week * 7 + weekday) * day + ((name === 'high-mileage' ? 0 : 8) + visit * 6) * 3600000;
     const targets = name === 'multiple-targets' ? 3 : 1;
     for (let target = 0; target < targets; target++) {
      const point = name === 'alternating-hotspots' && weekday % 2 === 1 ? far : home;
      const localResistance = resistanceAt(state, at, event => resistanceWeight(point, event));
      rewards.push(visitRewardFraction(localResistance));
      const strength = name === 'fresh-replacements' ? 1 : BALANCE.repeatCleaningStrength[Math.min(visitCount, 3)];
      state = commitResistance(state, { id: `${name}-${week}-${weekday}-${visit}-${target}`, at, point, strength }, true).state;
     }
     visitCount++;
     if (name === 'high-mileage') {
      const result = collectRestoration(state, `ride-lab-${week}-${weekday}-${visit}`, at + 1, 10000, restorationFraction(10000, collectionFactor(state, at)));
      state = result.state;
     }
    }
   }
   const fridayAt = (week * 7 + 4) * day + 20 * 3600000;
   fridayReward = visitRewardFraction(resistanceAt(state, fridayAt, point => resistanceWeight(home, point)));
   let afterLabReward: number | null = null;
   if (name === 'weekend-adventure' || name === 'alternating-hotspots') {
    const at = (week * 7 + 5) * day + 12 * 3600000;
    // A 10 km fixture offer, captured before departure; geographic snapshot remains unchanged.
    const reference = selectResistanceCentre(state, at);
    if (!reference) throw new Error('Expected established centre');
    state = collectRestoration(state, `weekend-${week}`, at, 10000, restorationFraction(10000, collectionFactor(state, at))).state;
    afterLabReward = percent(visitRewardFraction(resistanceAt(state, at, point => resistanceWeight(home, point))));
   }
   weeks.push({ week: week + 1, meanVisitReward: percent(rewards.reduce((a, b) => a + b, 0) / rewards.length), fridayReward: percent(fridayReward), afterLabReward });
  }
  return { name, weeks };
 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 console.log(JSON.stringify(runResistanceCalibration(), null, 2));
}
