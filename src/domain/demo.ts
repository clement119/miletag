/**
 * Demo content for the design gallery: our own layouts rendered with sample data,
 * so people see each style before choosing. The photo and map here are ours
 * (generated art and our own map render); the owner's reference samples are never shipped.
 */

import type { RunnerCount } from './catalog';
import { createDesignDocument, type DesignDocument } from './design-document';
import type { LngLat, XY } from './route/geometry';

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

/** The same loop through central Kuala Lumpur, as lon/lat pairs (for map backgrounds). */
const ROUTE_LNGLAT = [
  101.651, 3.14262, 101.65188, 3.14395, 101.65256, 3.1455, 101.65309, 3.1475, 101.65413, 3.14989, 101.6553, 3.15253,
  101.65681, 3.15414, 101.65783, 3.15659, 101.65953, 3.15749, 101.66088, 3.15894, 101.66274, 3.15983, 101.66427,
  3.15996, 101.66536, 3.16032, 101.66716, 3.15993, 101.66868, 3.16044, 101.67059, 3.16118, 101.6719, 3.16237, 101.67268,
  3.16364, 101.67422, 3.16521, 101.67484, 3.16707, 101.67584, 3.16942, 101.67701, 3.1712, 101.67753, 3.1733, 101.67886,
  3.1748, 101.68033, 3.17668, 101.6821, 3.17794, 101.68341, 3.17844, 101.68512, 3.17955, 101.68701, 3.18012, 101.68961,
  3.1807, 101.69162, 3.18118, 101.69325, 3.18092, 101.69471, 3.18069, 101.69623, 3.17941, 101.69704, 3.17823, 101.69766,
  3.1764, 101.69903, 3.17415, 101.70006, 3.17272, 101.70062, 3.17056, 101.70135, 3.16922, 101.70265, 3.16854, 101.7039,
  3.16751, 101.70539, 3.16778, 101.7071, 3.16735, 101.70841, 3.168, 101.71041, 3.16811, 101.71227, 3.16869, 101.71349,
  3.1697, 101.71524, 3.16997, 101.71751, 3.17147, 101.71876, 3.17268, 101.72079, 3.17395, 101.72307, 3.17566, 101.72452,
  3.17693, 101.72666, 3.1779, 101.7288, 3.17843, 101.72987, 3.17849, 101.73131, 3.17821, 101.73276, 3.17627, 101.73393,
  3.17447, 101.73456, 3.17271, 101.73514, 3.17025, 101.73566, 3.16845, 101.736, 3.16622, 101.73594, 3.16445, 101.73485,
  3.16273, 101.73346, 3.16099, 101.73148, 3.15905, 101.72983, 3.15815, 101.72741, 3.1565, 101.72562, 3.15517, 101.72463,
  3.15288, 101.72362, 3.15166, 101.72349, 3.15025, 101.72462, 3.14831, 101.72642, 3.14655, 101.72739, 3.14403,
  101.72946, 3.14281, 101.73087, 3.14106, 101.73177, 3.13848, 101.73223, 3.13698, 101.73118, 3.13548, 101.73006,
  3.13323, 101.7289, 3.13128, 101.727, 3.12987, 101.72548, 3.12753, 101.72353, 3.12621, 101.72156, 3.12516, 101.71927,
  3.12471, 101.71762, 3.12513, 101.71548, 3.12563, 101.71375, 3.12644, 101.71238, 3.128, 101.71044, 3.1289, 101.70861,
  3.13051, 101.70629, 3.13124, 101.70475, 3.13118, 101.70381, 3.12964, 101.70292, 3.12829, 101.70184, 3.12586,
  101.70052, 3.12355, 101.70034, 3.12103, 101.69929, 3.1191, 101.69774, 3.11716, 101.69658, 3.11619, 101.69557, 3.1164,
  101.69335, 3.11649, 101.69173, 3.11815, 101.68929, 3.11944, 101.68796, 3.12022, 101.68541, 3.12136, 101.68427, 3.1223,
  101.68209, 3.12261, 101.68041, 3.12256, 101.67973, 3.12099, 101.67806, 3.11933, 101.67673, 3.11781, 101.67584,
  3.11683, 101.67415, 3.11549, 101.67291, 3.11444, 101.67166, 3.11442, 101.67024, 3.11461, 101.66911, 3.11615,
  101.66796, 3.11735, 101.66649, 3.1192, 101.66523, 3.1215, 101.66397, 3.12389, 101.66265, 3.12556, 101.66109, 3.12654,
  101.66004, 3.12811, 101.65928, 3.1293, 101.65773, 3.13055, 101.65675, 3.13147, 101.6553, 3.1327, 101.65445, 3.13387,
  101.65407, 3.13445, 101.65322, 3.13508,
];

export const DEMO_GEO: LngLat[] = Array.from(
  { length: ROUTE_LNGLAT.length / 2 },
  (_, i) => [ROUTE_LNGLAT[i * 2], ROUTE_LNGLAT[i * 2 + 1]] as LngLat,
);

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

/**
 * What the editor shows: the user's document with sample content filling anything
 * they haven't added yet, so the design looks like its gallery preview from the start.
 * Display only. The real document (and the Next checks) never contain samples.
 */
export function withSamples(doc: DesignDocument): { doc: DesignDocument; usingSamples: boolean } {
  const demo = demoDocument(doc.designId, doc.runners.length as RunnerCount);
  const pick = (value: string, sample: string) => (value.trim() ? value : sample);
  const text = {
    title: pick(doc.text.title, demo.text.title),
    date: pick(doc.text.date, demo.text.date),
    city: pick(doc.text.city, demo.text.city),
    country: pick(doc.text.country, demo.text.country),
  };
  const runners = doc.runners.map((r, i) => ({
    ...r,
    name: pick(r.name, demo.runners[i].name),
    bib: r.bib?.trim() ? r.bib : demo.runners[i].bib,
    timeSeconds: r.timeSeconds ?? demo.runners[i].timeSeconds,
    distanceKm: i === 0 ? (r.distanceKm ?? 42.2) : r.distanceKm,
  }));
  const route = { ...doc.route, points: doc.route.points ?? DEMO_ROUTE, geo: doc.route.geo ?? DEMO_GEO };
  const usingSamples =
    Object.values(doc.text).some((v) => !v.trim()) ||
    doc.runners.some((r) => !r.name.trim() || !r.bib?.trim() || !r.timeSeconds) ||
    !doc.route.geo ||
    (doc.background.type === 'photo' && !doc.background.photo);
  return { doc: { ...doc, text, runners, route }, usingSamples };
}
