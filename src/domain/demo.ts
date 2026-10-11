/**
 * Demo content for the design gallery: our own layouts rendered with sample data,
 * so people see each style before choosing. The photo and map here are ours
 * (generated art and our own map render); the owner's reference samples are never shipped.
 */

import type { RunnerCount } from './catalog';
import { createDesignDocument, type DesignDocument } from './design-document';
import type { XY } from './route/geometry';

/** A city-marathon loop, normalised to a unit box (x, y pairs). */
const ROUTE_XY = [
  0.0, 0.561, 0.0104, 0.5453, 0.0184, 0.5271, 0.0246, 0.5035, 0.0368, 0.4754, 0.0506, 0.4444, 0.0684, 0.4254, 0.0803,
  0.3966, 0.1004, 0.386, 0.1162, 0.369, 0.1381, 0.3585, 0.1561, 0.3569, 0.1689, 0.3527, 0.1901, 0.3573, 0.208, 0.3513,
  0.2305, 0.3426, 0.2459, 0.3286, 0.2551, 0.3136, 0.2732, 0.2952, 0.2805, 0.2733, 0.2922, 0.2456, 0.306, 0.2247, 0.3121,
  0.2, 0.3278, 0.1823, 0.3451, 0.1602, 0.3659, 0.1454, 0.3813, 0.1395, 0.4014, 0.1265, 0.4237, 0.1198, 0.4542, 0.113,
  0.4779, 0.1073, 0.497, 0.1104, 0.5142, 0.1131, 0.5321, 0.1281, 0.5416, 0.142, 0.5489, 0.1635, 0.5651, 0.19, 0.5772,
  0.2068, 0.5838, 0.2322, 0.5923, 0.248, 0.6077, 0.256, 0.6224, 0.2681, 0.6399, 0.2649, 0.66, 0.27, 0.6754, 0.2623,
  0.6989, 0.2611, 0.7208, 0.2542, 0.7352, 0.2424, 0.7558, 0.2392, 0.7825, 0.2215, 0.7972, 0.2073, 0.821, 0.1923, 0.8479,
  0.1722, 0.865, 0.1573, 0.8901, 0.1459, 0.9153, 0.1396, 0.9279, 0.139, 0.9448, 0.1422, 0.9619, 0.165, 0.9756, 0.1862,
  0.9831, 0.207, 0.9899, 0.2359, 0.996, 0.2571, 1.0, 0.2833, 0.9993, 0.3041, 0.9865, 0.3244, 0.9701, 0.3448, 0.9468,
  0.3677, 0.9274, 0.3782, 0.8989, 0.3977, 0.8779, 0.4133, 0.8662, 0.4402, 0.8543, 0.4546, 0.8528, 0.4712, 0.8661, 0.494,
  0.8873, 0.5147, 0.8987, 0.5444, 0.923, 0.5587, 0.9396, 0.5793, 0.9502, 0.6096, 0.9556, 0.6273, 0.9433, 0.6449, 0.9301,
  0.6714, 0.9165, 0.6943, 0.8941, 0.711, 0.8762, 0.7385, 0.8533, 0.754, 0.8301, 0.7663, 0.8032, 0.7717, 0.7838, 0.7667,
  0.7586, 0.7608, 0.7382, 0.7513, 0.7221, 0.7329, 0.6993, 0.7224, 0.6778, 0.7034, 0.6505, 0.6948, 0.6324, 0.6955,
  0.6213, 0.7137, 0.6108, 0.7295, 0.5981, 0.7581, 0.5826, 0.7853, 0.5805, 0.8149, 0.5681, 0.8376, 0.5499, 0.8605,
  0.5362, 0.8719, 0.5243, 0.8694, 0.4982, 0.8683, 0.4792, 0.8488, 0.4505, 0.8337, 0.4348, 0.8245, 0.4048, 0.8111,
  0.3914, 0.8, 0.3658, 0.7964, 0.346, 0.7969, 0.338, 0.8154, 0.3183, 0.8349, 0.3027, 0.8528, 0.2922, 0.8644, 0.2723,
  0.8801, 0.2578, 0.8925, 0.2431, 0.8927, 0.2264, 0.8905, 0.213, 0.8724, 0.1995, 0.8582, 0.1822, 0.8365, 0.1674, 0.8094,
  0.1526, 0.7813, 0.1371, 0.7617, 0.1187, 0.7501, 0.1064, 0.7317, 0.0974, 0.7177, 0.0792, 0.7029, 0.0677, 0.6921,
  0.0506, 0.6776, 0.0406, 0.6639, 0.0361, 0.657, 0.0261, 0.6497,
];

export const DEMO_ROUTE: XY[] = Array.from({ length: ROUTE_XY.length / 2 }, (_, i) => ({
  x: ROUTE_XY[i * 2],
  y: ROUTE_XY[i * 2 + 1],
}));

export const DEMO_PHOTO = {
  uri: require('../../assets/images/demo/demo-city.jpg') as number,
  width: 1000,
  height: 1414,
};

/** Graphite map of central KL with the demo route, from our own map style (OSM credit included). */
export const DEMO_MAP = {
  uri: require('../../assets/images/demo/demo-map-graphite.jpg') as number,
  width: 900,
  height: 900,
};

const RUNNERS = [
  { name: 'Aisyah Rahman', bib: '2104', timeSeconds: 3 * 3600 + 32 * 60 + 17 },
  { name: 'Daniel Lee', bib: '2381', timeSeconds: 4 * 3600 + 5 * 60 + 10 },
  { name: 'Priya Nair', bib: '1977', timeSeconds: 3 * 3600 + 58 * 60 + 41 },
  { name: 'Marcus Tan', bib: '3012', timeSeconds: 4 * 3600 + 21 * 60 + 3 },
  { name: 'Siti Hajar', bib: '2650', timeSeconds: 4 * 3600 + 44 * 60 + 29 },
  { name: 'Jason Wong', bib: '1840', timeSeconds: 3 * 3600 + 47 * 60 + 55 },
];

export function demoDocument(designId: string, runnerCount: RunnerCount): DesignDocument {
  const doc = createDesignDocument(designId, runnerCount);
  return {
    ...doc,
    text: { title: 'KL Marathon', date: '5 October 2026', city: 'Kuala Lumpur', country: 'Malaysia' },
    runners: RUNNERS.slice(0, runnerCount).map((r, i) => ({ ...r, distanceKm: i === 0 ? 42.2 : undefined })),
    route: { ...doc.route, points: DEMO_ROUTE },
  };
}
