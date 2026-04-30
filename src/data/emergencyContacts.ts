/**
 * Global Emergency Contacts Database
 *
 * Source: Vision Voyages Travel — Global 911 Emergency Contacts (Apr 2026)
 *
 * Each entry is keyed by ISO-3166-1 alpha-2 country code (matches what
 * Google Places API returns in `countryCode` field).
 *
 * Data shape:
 *   - police, fire, ambulance: numbers (some countries share one)
 *   - primary: the single number to display in the metrics bar
 *   - notes: optional caveats (English speakers, landline-only, etc.)
 *
 * When the same number serves all three (e.g. 911), we surface it once.
 * For countries with separate numbers, primary defaults to police.
 */

export interface EmergencyContact {
  police?: string;
  fire?: string;
  ambulance?: string;
  /** The single number shown in the compact UI; falls back to police if absent. */
  primary: string;
  /** True when one number covers police + fire + ambulance. */
  unified: boolean;
  notes?: string;
}

export const EMERGENCY_CONTACTS: Record<string, EmergencyContact> = {
  // ── A ─────────────────────────────────────────
  AF: { police: '119', fire: '102', ambulance: '119', primary: '119', unified: false, notes: 'Local operators do not speak English.' },
  AX: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  AL: { police: '129', fire: '127', ambulance: '128', primary: '129', unified: false, notes: 'Emergency response support is deemed unreliable.' },
  DZ: { police: '17', ambulance: '14', primary: '17', unified: false, notes: 'Landline only. From mobile, dial 021-71-14-14 (fire), 021-23-63-81 (ambulance), 021-73-53-50 (police).' },
  AS: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  AD: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  AO: { police: '113', fire: '115', ambulance: '112', primary: '113', unified: false, notes: 'Operators may not speak English.' },
  AI: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  AG: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  AR: { police: '911', fire: '107', ambulance: '100', primary: '911', unified: false, notes: 'Argentina is converting to 911 nationwide.' },
  AM: { police: '102', fire: '101', ambulance: '103', primary: '102', unified: false, notes: '104 for gas leaks.' },
  AW: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  AU: { police: '000', fire: '000', ambulance: '000', primary: '000', unified: true },
  AT: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  AZ: { police: '102', fire: '101', ambulance: '103', primary: '112', unified: false, notes: '112 for Ministry of Emergency Situations.' },

  // ── B ─────────────────────────────────────────
  BS: { police: '911', fire: '919', ambulance: '911', primary: '911', unified: false },
  BH: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true, notes: '199 for traffic accidents without injuries.' },
  BD: { police: '999', primary: '999', unified: false, notes: '999 connects to Dhaka Metro Police Exchange. Outside Dhaka, dial 02-999. English not guaranteed.' },
  BB: { police: '211', fire: '311', ambulance: '511', primary: '211', unified: false },
  BY: { police: '102', fire: '101', ambulance: '103', primary: '102', unified: false },
  BE: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  BZ: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  BM: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  BT: { police: '113', fire: '110', ambulance: '112', primary: '113', unified: false },
  BO: { police: '110', fire: '119', ambulance: '118', primary: '110', unified: false, notes: 'English speakers unlikely to answer.' },
  BA: { police: '122', fire: '123', ambulance: '124', primary: '122', unified: false },
  BW: { police: '999', fire: '998', ambulance: '997', primary: '999', unified: false },
  BR: { police: '190', fire: '193', ambulance: '192', primary: '190', unified: false, notes: '193 also covers medical emergencies.' },
  VG: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  BN: { police: '993', fire: '995', ambulance: '991', primary: '993', unified: false, notes: '998 for Search & Rescue.' },
  BG: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  MM: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },
  BI: { primary: '22-22-37-77', unified: false, notes: 'Bujumbura police only. No comparable number outside the capital.' },

  // ── C ─────────────────────────────────────────
  KH: { police: '117', fire: '118', ambulance: '119', primary: '117', unified: false },
  CM: { primary: '112', unified: true, notes: 'Dial 112 in major cities for ambulance services.' },
  CA: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  CV: { police: '132', fire: '131', ambulance: '130', primary: '132', unified: false },
  KY: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  CF: { police: '117', primary: '117', unified: false, notes: 'Gendarmerie: 2161 2200.' },
  TD: { police: '17', ambulance: '18', primary: '17', unified: false, notes: 'Embassy after-hours: (235) 6662 2100.' },
  CL: { police: '133', fire: '132', ambulance: '131', primary: '133', unified: false },
  CN: { police: '110', fire: '119', ambulance: '120', primary: '110', unified: false, notes: 'English speakers rarely available. 999 in Beijing/Shanghai (privately operated).' },
  CX: { police: '000', fire: '000', ambulance: '000', primary: '000', unified: true },
  CC: { primary: '(08) 9162 6600', unified: false },
  CO: { police: '123', fire: '123', ambulance: '123', primary: '123', unified: true, notes: 'English speakers unlikely to answer.' },
  KM: { police: '17', ambulance: '18', primary: '17', unified: false, notes: '18 for Gendarmerie.' },
  CG: { primary: '242066-65-4804', unified: true, notes: 'Police response often slow (45+ min). Recourse for victims very limited.' },
  CK: { police: '999', fire: '998', ambulance: '996', primary: '999', unified: false },
  CR: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  CI: { police: '111', fire: '170', ambulance: '180', primary: '111', unified: false, notes: '111 is the local 911 equivalent.' },
  HR: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  CU: { police: '106', ambulance: '105', primary: '106', unified: false },
  CY: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  CZ: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true, notes: 'Local: 158 (police), 150 (fire), 155 (ambulance).' },

  // ── D ─────────────────────────────────────────
  DK: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  DJ: { police: '17', fire: '18', ambulance: '351351', primary: '17', unified: false },
  DM: { police: '911', fire: '999', ambulance: '911', primary: '911', unified: false },
  DO: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },

  // ── E ─────────────────────────────────────────
  EC: { police: '101', fire: '102', ambulance: '131', primary: '911', unified: false, notes: 'Dial 911 in Quito/Ibarra; 112 in Guayaquil/Cuenca/Loja.' },
  EG: { police: '122', fire: '180', ambulance: '123', primary: '122', unified: false },
  SV: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  EE: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  ET: { police: '991', fire: '993', ambulance: '992', primary: '991', unified: false },

  // ── F ─────────────────────────────────────────
  FK: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },
  FO: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  FJ: { police: '911', fire: '911', ambulance: '917', primary: '911', unified: false },
  FI: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  FR: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true, notes: 'Also: 17 (police), 18 (fire), 15 (ambulance).' },
  GF: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true, notes: 'Also: 17 (police), 18 (fire), 15 (ambulance).' },
  PF: { police: '17', fire: '18', ambulance: '15', primary: '17', unified: false },

  // ── G ─────────────────────────────────────────
  GA: { police: '1730', fire: '18', ambulance: '1300-1399', primary: '1730', unified: false, notes: 'Major cities: Libreville (177, 72-00-37), Port Gentil (55-22-36), Franceville (67-72-76).' },
  GM: { police: '117', fire: '118', ambulance: '116', primary: '117', unified: false, notes: 'Police 24/7 line: (220) 422-4914.' },
  GE: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true, notes: 'Police dispatcher speaks Georgian and Russian only.' },
  DE: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true, notes: '110 also for police, 19222 for local-dial ambulance.' },
  GH: { police: '191', fire: '192', ambulance: '193', primary: '191', unified: false },
  GI: { police: '112', fire: '190', ambulance: '190', primary: '112', unified: false },
  GR: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  GU: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  GT: { police: '110', fire: '122', ambulance: '123', primary: '110', unified: false },
  GG: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },
  GY: { police: '911', fire: '913', ambulance: '911', primary: '911', unified: false, notes: 'Numbers not always operational. Police may be slow; ambulance not always available.' },

  // ── H ─────────────────────────────────────────
  HT: { police: '114', fire: '114', ambulance: '114', primary: '114', unified: true },
  VA: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  HN: { police: '199', fire: '199', ambulance: '199', primary: '199', unified: true },
  HK: { police: '999', ambulance: '999', primary: '999', unified: false },
  HU: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },

  // ── I ─────────────────────────────────────────
  IS: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  IN: { police: '100', fire: '101', ambulance: '102', primary: '112', unified: false, notes: '112 from mobile phones is universal.' },
  ID: { police: '110', fire: '113', ambulance: '118', primary: '110 / 112', unified: false, notes: '112 is the modern mobile-friendly unified number. 110 is the traditional police line.' },
  IR: { police: '110', fire: '125', ambulance: '115', primary: '110', unified: false, notes: 'English speakers generally unavailable.' },
  IQ: { police: '104', fire: '122', ambulance: '115', primary: '104', unified: false },
  IE: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  IM: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },
  IL: { police: '100', fire: '101', ambulance: '102', primary: '112', unified: false, notes: '112 also works for all emergencies from mobile.' },
  IT: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },

  // ── J ─────────────────────────────────────────
  JM: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  JP: { police: '110', fire: '119', ambulance: '119', primary: '110', unified: false },
  JE: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true, notes: 'UK 999 also works.' },
  JO: { police: '191', fire: '191', ambulance: '191', primary: '191', unified: true, notes: 'Some areas of Amman use 911.' },

  // ── K ─────────────────────────────────────────
  KZ: { police: '103', fire: '103', ambulance: '103', primary: '103', unified: true },
  KE: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },
  KI: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true, notes: 'Also: 992 (police), 993 (fire), 994 (ambulance).' },
  KR: { police: '112', fire: '119', ambulance: '119', primary: '112', unified: false, notes: '02-112 from cell phone.' },
  KW: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  KG: { police: '102', fire: '101', ambulance: '103', primary: '102', unified: false },

  // ── L ─────────────────────────────────────────
  LA: { police: '191', fire: '190', ambulance: '195', primary: '191', unified: false, notes: 'Tourist Police Vientiane: 021-251-128.' },
  LV: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  LB: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  LS: { police: '123', fire: '121', ambulance: '122', primary: '123', unified: false, notes: 'Police 24/7: (266) 5888-1010.' },
  LR: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true, notes: 'Also dial 355. No landline service in Liberia.' },
  LY: { police: '193', fire: '193', ambulance: '193', primary: '193', unified: true, notes: 'Generally monitored only in Arabic.' },
  LI: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  LT: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  LU: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },

  // ── M ─────────────────────────────────────────
  MO: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },
  MK: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  MG: { police: '117', fire: '117', ambulance: '118', primary: '117', unified: false, notes: 'Antananarivo police: 22-227-35, 22-281-70 (Malagasy or French only).' },
  MW: { police: '997', fire: '999', ambulance: '998', primary: '997', unified: false },
  MY: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true, notes: 'Royal Malaysia Police KL: 03-2115-9999.' },
  MV: { police: '119', fire: '118', ambulance: '102', primary: '119', unified: false, notes: 'Coast Guard: 191. Hospital ambulances must be called individually.' },
  ML: { police: '17', fire: '18', ambulance: '15', primary: '17', unified: false },
  MT: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  MH: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true, notes: 'Also: 1911.' },
  MQ: { police: '17', fire: '18', ambulance: '15', primary: '17', unified: false },
  MR: { police: '117', ambulance: '118', primary: '117', unified: false },
  MU: { police: '999', fire: '115', ambulance: '114', primary: '999', unified: false },
  YT: { ambulance: '15', primary: '15', unified: false },
  MX: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  FM: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true, notes: 'Pohnpei: 320-221.' },
  MD: { police: '902', fire: '901', ambulance: '903', primary: '902', unified: false, notes: 'English speakers rare.' },
  MC: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true, notes: 'Also: 17 (police), 18 (fire), 15 (ambulance).' },
  MN: { police: '102', fire: '101', ambulance: '103', primary: '102', unified: false },
  ME: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true, notes: 'Also: 122 (police), 123 (fire), 124 (ambulance).' },
  MS: { police: '911', fire: '999', ambulance: '911', primary: '911', unified: false },
  MA: { police: '190', fire: '190', ambulance: '190', primary: '190', unified: true },
  MZ: { police: '119', fire: '198', ambulance: '117', primary: '119', unified: false },

  // ── N ─────────────────────────────────────────
  NA: { police: '1011', fire: '2032270', ambulance: '2032276', primary: '1011', unified: false, notes: 'Windhoek emergency: 211-111. Tourist Protection Units in Windhoek and Walvis Bay.' },
  NR: { police: '118', fire: '117', ambulance: '118', primary: '118', unified: false },
  NP: { police: '100', fire: '101', ambulance: '102', primary: '100', unified: false, notes: 'Most police speak English; speak slowly.' },
  NL: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  NC: { police: '17', fire: '18', ambulance: '15', primary: '17', unified: false, notes: '16 for sea rescue.' },
  NZ: { police: '111', fire: '111', ambulance: '111', primary: '111', unified: true },
  NI: { police: '118', fire: '118', ambulance: '118', primary: '118', unified: true },
  NG: { police: '199', fire: '199', ambulance: '199', primary: '199', unified: true },
  NU: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },
  NF: { police: '000', fire: '000', ambulance: '000', primary: '000', unified: true },
  NO: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },

  // ── O ─────────────────────────────────────────
  OM: { police: '9999', fire: '9999', ambulance: '9999', primary: '9999', unified: true },

  // ── P ─────────────────────────────────────────
  PK: { police: '15', fire: '16', ambulance: '15', primary: '15', unified: false, notes: 'Punjab: 1122. 112 from GSM forwards to local emergency.' },
  PW: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  PA: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  PG: { police: '000', fire: '000', ambulance: '000', primary: '000', unified: true },
  PY: { police: '911', fire: '132', ambulance: '911', primary: '911', unified: false, notes: 'Fire/rescue: 131 or 132.' },
  PE: { police: '105', fire: '116', ambulance: '117', primary: '105', unified: false },
  PH: { police: '117', fire: '117', ambulance: '117', primary: '117', unified: true },
  PL: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  PT: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  PR: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  QA: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },

  // ── R ─────────────────────────────────────────
  RE: { police: '17', fire: '18', ambulance: '112', primary: '17', unified: false },
  RO: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  RU: { police: '102', fire: '101', ambulance: '103', primary: '112', unified: false, notes: '112 began operating in 2011.' },
  RW: { primary: '112', unified: true },

  // ── S ─────────────────────────────────────────
  BL: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  SH: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  KN: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  LC: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  MF: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  PM: { police: '17', fire: '18', ambulance: '15', primary: '17', unified: false },
  VC: { police: '911', fire: '999', ambulance: '911', primary: '911', unified: false },
  WS: { police: '995', fire: '994', ambulance: '996', primary: '995', unified: false },
  SM: { police: '113', fire: '115', ambulance: '118', primary: '113', unified: false },
  ST: { police: '222222', fire: '222222', ambulance: '222222', primary: '222222', unified: true },
  SA: { police: '999', fire: '998', ambulance: '997', primary: '999', unified: false },
  RS: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  SC: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },
  SL: { police: '999', fire: '19', ambulance: '999', primary: '999', unified: false },
  SG: { police: '999', fire: '995', ambulance: '995', primary: '999', unified: false },
  SK: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  SI: { police: '113', fire: '112', ambulance: '112', primary: '113', unified: false },
  SB: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true, notes: 'Hospital: 911. Disaster: 955. Fire: 988.' },
  ZA: { police: '10111', fire: '10177', ambulance: '10177', primary: '10111', unified: false },
  ES: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  LK: { police: '119', fire: '110', ambulance: '110', primary: '119', unified: false },
  SD: { primary: '112', unified: false, notes: 'Khartoum emergency: 999.' },
  SR: { police: '115', fire: '115', ambulance: '115', primary: '115', unified: true, notes: 'English unlikely.' },
  SJ: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true, notes: 'Iridium/Inmarsat phones do not support 112; phone Governor on call.' },
  SZ: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },
  SE: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  CH: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  SY: { police: '112', fire: '113', ambulance: '110', primary: '112', unified: false, notes: 'Operators not likely to speak English.' },

  // ── T ─────────────────────────────────────────
  TW: { police: '110', fire: '119', ambulance: '119', primary: '110', unified: false, notes: '112 from GSM forwards to local emergency.' },
  TJ: { police: '102', fire: '101', ambulance: '103', primary: '102', unified: false },
  TZ: { police: '111', fire: '111', ambulance: '111', primary: '111', unified: true },
  TH: { police: '191', fire: '199', ambulance: '1554', primary: '191', unified: false },
  TL: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true, notes: '723-0365 additional number.' },
  TG: { police: '117', fire: '118', ambulance: '8200', primary: '117', unified: false, notes: '172 for Gendarmerie.' },
  TO: { police: '922', fire: '999', ambulance: '933', primary: '922', unified: false },
  TT: { police: '999', fire: '990', ambulance: '990', primary: '999', unified: false, notes: 'Ambulance 811. Coast Guard: 634-4440. Anti-Crime: 555 / 800-TIPS.' },
  TN: { police: '197', fire: '197', ambulance: '197', primary: '197', unified: true, notes: 'Service in Arabic or French. Less reliable in rural areas.' },
  TR: { police: '155', fire: '110', ambulance: '112', primary: '155', unified: false },
  TM: { police: '102', fire: '101', ambulance: '103', primary: '102', unified: false },
  TC: { police: '911', fire: '999', ambulance: '911', primary: '911', unified: false },
  TV: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },

  // ── U ─────────────────────────────────────────
  UG: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true },
  UA: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  AE: { police: '999', fire: '997', ambulance: '998', primary: '999', unified: false },
  GB: { police: '999', fire: '999', ambulance: '999', primary: '999', unified: true, notes: '112 also works.' },
  US: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  UY: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },
  UZ: { police: '102', fire: '101', ambulance: '103', primary: '102', unified: false },

  // ── V ─────────────────────────────────────────
  VU: { police: '112', fire: '112', ambulance: '112', primary: '112', unified: true },
  VE: { police: '171', fire: '171', ambulance: '171', primary: '171', unified: true, notes: 'English speakers generally unavailable.' },
  VN: { police: '113', fire: '114', ambulance: '115', primary: '113', unified: false },
  VI: { police: '911', fire: '911', ambulance: '911', primary: '911', unified: true },

  // ── W ─────────────────────────────────────────
  PS: { police: '101', fire: '101', ambulance: '101', primary: '101', unified: true },
  EH: { fire: '150', primary: '150', unified: false },

  // ── Y ─────────────────────────────────────────
  YE: { police: '199', fire: '199', ambulance: '199', primary: '199', unified: true, notes: 'Operators do not speak English.' },

  // ── Z ─────────────────────────────────────────
  ZM: { police: '999', fire: '993', ambulance: '991', primary: '999', unified: false },
  ZW: { police: '999', fire: '993', ambulance: '994', primary: '999', unified: false, notes: 'Harare Central Police: 777-777. Fire: 783-983. MARS Ambulance: 771-221.' },
};

/**
 * Universal fallback when country is unknown, unsupported, or not in the database.
 * 112 is recognized in 100+ countries, including the entire EU.
 */
export const FALLBACK_EMERGENCY: EmergencyContact = {
  primary: '112',
  unified: true,
  notes: 'Universal emergency number recognized in 100+ countries.',
};

/**
 * Look up emergency contacts by ISO-3166-1 alpha-2 country code.
 * Returns the FALLBACK if country is unknown.
 */
export function getEmergencyContact(countryCode?: string): EmergencyContact {
  if (!countryCode) return FALLBACK_EMERGENCY;
  const upper = countryCode.toUpperCase();
  return EMERGENCY_CONTACTS[upper] || FALLBACK_EMERGENCY;
}
