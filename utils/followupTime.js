const IST_OFFSET_MINUTES = 330; // +5 hours 30 minutes
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;

const YEAR_FIRST_REGEX = /^(\d{4})[\/-](\d{2})[\/-](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?)?$/i;
const DAY_FIRST_REGEX = /^(\d{2})[\/-](\d{2})[\/-](\d{4})(?:[ ,T](\d{2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?)?$/i;
const US_MONTH_FIRST_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})(?:[ ,T](\d{2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?)?$/i;
const AMPM_WITH_COMMA_REGEX = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i;
const EXPLICIT_TZ_REGEX = /([zZ]|[+-]\d{2}:?\d{2})$/;

const pad = (value) => String(value).padStart(2, "0");

const clampNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const to24Hour = (hour, ampm) => {
  const h = clampNumber(hour);
  if (h === null) return null;
  if (!ampm) return h;
  const normalized = ampm.toUpperCase();
  if (normalized === "AM") {
    return h === 12 ? 0 : h;
  }
  if (normalized === "PM") {
    return h === 12 ? 12 : h + 12;
  }
  return h;
};

const buildIsoWithIstOffset = (year, month, day, hour = 0, minute = 0, second = 0) => {
  const y = clampNumber(year);
  const m = clampNumber(month);
  const d = clampNumber(day);
  const hh = clampNumber(hour);
  const mm = clampNumber(minute);
  const ss = clampNumber(second);
  if ([y, m, d, hh, mm, ss].some((part) => part === null)) return null;
  return `${pad(y)}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:${pad(ss)}+05:30`;
};

const tryParsePattern = (value, regex, order = "YMD") => {
  if (!value) return null;
  const match = String(value).trim().match(regex);
  if (!match) return null;

  let year;
  let month;
  let day;

  if (order === "YMD") {
    [, year, month, day] = match;
  } else if (order === "DMY") {
    [, day, month, year] = match;
  } else if (order === "MDY") {
    [, month, day, year] = match;
  }

  const hour = to24Hour(match[4], match[7]);
  const minute = match[5] ?? "0";
  const second = match[6] ?? "0";
  const iso = buildIsoWithIstOffset(year, month, day, hour ?? match[4] ?? 0, minute, second);
  if (!iso) return null;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeTimeString = (value) =>
  String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,/g, " , ")
    .trim();

const tryParseAmpmWithComma = (value) => {
  if (!value) return null;
  const match = String(value).trim().match(AMPM_WITH_COMMA_REGEX);
  if (!match) return null;
  const [, day, month, year, hour, minute, second, ampm] = match;
  const hour24 = to24Hour(hour, ampm);
  const iso = buildIsoWithIstOffset(year, month, day, hour24, minute, second ?? "0");
  if (!iso) return null;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const tryIstPatterns = (value) => {
  const yearFirst = tryParsePattern(value, YEAR_FIRST_REGEX, "YMD");
  if (yearFirst) return yearFirst;

  const dayFirst = tryParsePattern(value, DAY_FIRST_REGEX, "DMY");
  if (dayFirst) return dayFirst;

  const monthFirst = tryParsePattern(value, US_MONTH_FIRST_REGEX, "MDY");
  if (monthFirst) return monthFirst;

  return tryParseAmpmWithComma(value);
};

const parseNumericString = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  const ms = value.length === 10 ? num * 1000 : num;
  const parsed = new Date(ms);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseFollowupInput = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }

  if (typeof value !== "string") return null;

  const trimmed = normalizeTimeString(value);
  if (!trimmed) return null;

  if (EXPLICIT_TZ_REGEX.test(trimmed)) {
    const zoned = new Date(trimmed);
    if (!Number.isNaN(zoned.getTime())) {
      return zoned;
    }
  }

  const istPreferred = tryIstPatterns(trimmed);
  if (istPreferred) return istPreferred;

  const numeric = parseNumericString(trimmed);
  if (numeric) return numeric;

  const native = new Date(trimmed);
  return Number.isNaN(native.getTime()) ? null : native;
};

const formatIstDbString = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = pad(ist.getUTCMonth() + 1);
  const day = pad(ist.getUTCDate());
  const hours = pad(ist.getUTCHours());
  const minutes = pad(ist.getUTCMinutes());
  const seconds = pad(ist.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

module.exports = {
  IST_OFFSET_MS,
  parseFollowupInput,
  formatIstDbString,
};
