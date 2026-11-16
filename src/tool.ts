// Auto-synthesized by OTHRYS DeepCoder Fleet Engine for onepager-jsonviewer
// Verified pipeline: parseJson -> stringifyCanonical
export interface ToolResult {
  success: boolean;
  data: string;
  error?: string;
  warnings?: string[];
}

export const SYNTHESIZED_PIPELINE: readonly string[] = ["parseJson","stringifyCanonical"];

type PrimitiveFn = (val: unknown) => unknown;
type JsonRecord = Record<string, unknown>;

function asString(val: unknown, name: string): string {
  if (typeof val !== 'string') throw new TypeError(`${name} expects string`);
  return val;
}

function asRecords(val: unknown, name: string): JsonRecord[] {
  if (!Array.isArray(val)) throw new TypeError(`${name} expects record array`);
  return val as JsonRecord[];
}

function csvClean(raw: unknown): string {
  const input = asString(raw, 'csvClean');
  if (input === '') return '';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < input.length && input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' && i + 1 < input.length && input[i + 1] === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (inQuotes) throw new SyntaxError('Unterminated quoted field');
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows
    .map((r) => r.map((f) => (/[,\"\r\n]/.test(f) ? `"${f.replace(/"/g, '""')}"` : f)).join(','))
    .join('\n');
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
      i++;
    } else {
      current += ch;
      i++;
    }
  }
  fields.push(current);
  return fields;
}

function csvToJson(raw: unknown): JsonRecord[] {
  const input = asString(raw, 'csvToJson');
  if (!input) return [];
  const lines = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  if (headers.length === 0) throw new RangeError('Empty header row');
  if (new Set(headers).size !== headers.length) throw new RangeError('Duplicate header');
  const records: JsonRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '') continue;
    const fields = parseCsvLine(lines[i]);
    if (fields.length !== headers.length) {
      throw new RangeError(`Row ${i + 1} has ${fields.length} fields, expected ${headers.length}`);
    }
    const record: JsonRecord = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = fields[j] ?? '';
    }
    records.push(record);
  }
  return records;
}

function quoteCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

function jsonToCsv(raw: unknown): string {
  const records = asRecords(raw, 'jsonToCsv');
  if (records.length === 0) return '';
  const headers = Object.keys(records[0]);
  const lines: string[] = [headers.join(',')];
  for (const rec of records) {
    lines.push(headers.map((h) => quoteCsvField(rec[h] == null ? '' : String(rec[h]))).join(','));
  }
  return lines.join('\n');
}

const BAD_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function canonicalizeJson(value: unknown, seen = new Set<unknown>()): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error('INVALID_JSON');
    seen.add(value);
    const out = value.map((item) => canonicalizeJson(item, seen));
    seen.delete(value);
    return out;
  }
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) throw new Error('INVALID_JSON');
    seen.add(value);
    const rec = value as JsonRecord;
    const out: JsonRecord = {};
    for (const k of Object.keys(rec).sort()) {
      if (BAD_KEYS.has(k)) throw new Error('UNSAFE_KEY');
      out[k] = canonicalizeJson(rec[k], seen);
    }
    seen.delete(value);
    return out;
  }
  throw new Error('INVALID_JSON');
}

function sortRecords(raw: unknown, key: string, direction: 'asc' | 'desc'): JsonRecord[] {
  const records = asRecords(raw, 'sortRecords');
  const sorted = [...records];
  const cmp = (a: JsonRecord, b: JsonRecord): number => {
    const va = a[key];
    const vb = b[key];
    if (va == null && vb == null) return 0;
    if (va == null) return direction === 'asc' ? 1 : -1;
    if (vb == null) return direction === 'asc' ? -1 : 1;
    const na = Number(va);
    const nb = Number(vb);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      if (na < nb) return direction === 'asc' ? -1 : 1;
      if (na > nb) return direction === 'asc' ? 1 : -1;
      return 0;
    }
    const sa = String(va);
    const sb = String(vb);
    if (sa < sb) return direction === 'asc' ? -1 : 1;
    if (sa > sb) return direction === 'asc' ? 1 : -1;
    return 0;
  };
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    let j = i - 1;
    while (j >= 0 && cmp(cur, sorted[j]) < 0) {
      sorted[j + 1] = sorted[j];
      j--;
    }
    sorted[j + 1] = cur;
  }
  return sorted;
}

function splitWords(str: string): string[] {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([a-z0-9])_([a-z0-9])/g, '$1 $2')
    .replace(/([a-z0-9])-([a-z0-9])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase());
}

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256Hex(raw: unknown): string {
  const input = asString(raw, 'sha256Hex');
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const totalLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(totalLen);
  padded.set(bytes, 0);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number): number => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (hh + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hh) >>> 0;
  }
  return Array.from(h, (x) => x.toString(16).padStart(8, '0')).join('');
}

function textStatsSummary(raw: unknown): string {
  const input = asString(raw, 'textStatsSummary');
  const characters = Array.from(input).length;
  const charactersNoSpaces = Array.from(input.replace(/\s+/g, '')).length;
  const trimmed = input.trim();
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  const lines = input === '' ? 0 : input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').length;
  const readingTimeSeconds = words === 0 ? 0 : Math.ceil((words / 200) * 60);
  return JSON.stringify({ characters, charactersNoSpaces, words, lines, readingTimeSeconds });
}

function normalizeEmailTs(raw: unknown): string {
  const input = asString(raw, 'normalizeEmail').trim();
  if (!input || input.length > 254) return 'INVALID_EMAIL';
  const parts = input.split('@');
  if (parts.length !== 2) return 'INVALID_EMAIL';
  const local = parts[0].toLowerCase();
  const domain = parts[1].toLowerCase();
  if (!local || local.length > 64 || !domain) return 'INVALID_EMAIL';
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return 'INVALID_EMAIL';
  if (!/^[a-z0-9._%+\-]+$/i.test(local)) return 'INVALID_EMAIL';
  const labels = domain.split('.');
  if (labels.length < 2) return 'INVALID_EMAIL';
  for (const label of labels) {
    if (!label || label.length > 63 || !/^[a-z0-9-]+$/.test(label) || label.startsWith('-') || label.endsWith('-')) {
      return 'INVALID_EMAIL';
    }
  }
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) return 'INVALID_EMAIL';
  return `${local}@${domain}`;
}

function normalizeIsoDateTs(raw: unknown): string {
  const s = asString(raw, 'normalizeIsoDate').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(s);
  if (!m) return 'INVALID_DATE';
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return 'INVALID_DATE';
  if (s.includes('T')) {
    const parsed = new Date(s);
    if (!Number.isFinite(parsed.getTime())) return 'INVALID_DATE';
    return parsed.toISOString().slice(0, 10);
  }
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function normalizeUrlTs(raw: unknown): string {
  const s = asString(raw, 'normalizeUrl').trim();
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return 'INVALID_URL';
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'INVALID_URL';
  u.hash = '';
  const entries = [...u.searchParams.entries()].sort(([ak, av], [bk, bv]) =>
    ak < bk ? -1 : ak > bk ? 1 : av < bv ? -1 : av > bv ? 1 : 0
  );
  u.search = '';
  for (const [k, v] of entries) u.searchParams.append(k, v);
  let out = u.toString();
  if (u.pathname === '/' && !u.search) out = out.replace(/\/$/, '');
  return out;
}

function escapeHtmlStr(raw: unknown): string {
  return asString(raw, 'escapeHtml')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescapeHtmlStr(raw: unknown): string {
  return asString(raw, 'unescapeHtml')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function normalizePathTs(raw: unknown): string {
  let p = asString(raw, 'normalizePath').trim();
  if (!p) throw new TypeError('normalizePath expects non-empty string');
  let isAbsolute = false;
  let root = '';
  if (/^[a-zA-Z]:[\\/]/.test(p)) {
    isAbsolute = true;
    root = p[0].toLowerCase() + ':/';
    p = p.slice(3);
  } else if (/^\\\\[^\\]+\\[^\\]+/.test(p)) {
    isAbsolute = true;
    const match = p.match(/^\\\\[^\\]+\\[^\\]+/);
    if (match) {
      root = '//' + match[0].slice(2).replace(/\\/g, '/');
      p = p.slice(match[0].length);
    }
  } else if (p.startsWith('/')) {
    isAbsolute = true;
    root = '/';
    p = p.slice(1);
  }
  const norm: string[] = [];
  for (const comp of p.split(/[\\/]+/).filter((c) => c !== '' && c !== '.')) {
    if (comp === '..') {
      if (norm.length > 0 && norm[norm.length - 1] !== '..') norm.pop();
      else if (!isAbsolute) norm.push('..');
    } else {
      norm.push(comp);
    }
  }
  let res = norm.join('/');
  if (root !== '') res = root + res;
  if (res === '' && isAbsolute) return root;
  return res || '.';
}

function recordsToMarkdownTableTs(raw: unknown): string {
  const records = asRecords(raw, 'recordsToMarkdownTable');
  if (records.length === 0) return '';
  const columns = [...new Set(records.flatMap((r) => Object.keys(r)))].sort();
  if (columns.length === 0) return '';
  const esc = (v: unknown): string =>
    v == null ? '' : String(v).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r\n|\r|\n/g, '<br>');
  const row = (vals: string[]): string => '| ' + vals.join(' | ') + ' |';
  const lines = [row(columns), row(columns.map(() => '---'))];
  for (const r of records) lines.push(row(columns.map((c) => esc(r[c]))));
  return lines.join('\n');
}

function linesToChecklistTs(raw: unknown): string {
  if (!Array.isArray(raw)) throw new TypeError('linesToChecklist expects array');
  const out: string[] = [];
  for (const item of raw) {
    const t = String(item).trim();
    if (!t) continue;
    if (/^- \[[ xX]\] /.test(t)) out.push(t);
    else out.push(`- [ ] ${t.replace(/^[-*]\s+/, '')}`);
  }
  return out.join('\n');
}

function estimateTokensTs(raw: unknown): string {
  const input = asString(raw, 'estimateTokens');
  const characters = Array.from(input).length;
  const trimmed = input.trim();
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  const estimatedTokens = characters === 0 ? 0 : Math.ceil(characters / 4);
  const fits8k = estimatedTokens <= 8192;
  const utilization32kPct = Number(((estimatedTokens / 32768) * 100).toFixed(2));
  return JSON.stringify({ estimatedTokens, words, characters, fits8k, utilization32kPct });
}

function estimateVramFitTs(raw: unknown): string {
  const s = asString(raw, 'estimateVramFit').trim();
  if (!s) throw new TypeError('estimateVramFit expects non-empty string');
  let paramsB = 7;
  let quant = 'Q4_K_M';
  let context = 8192;
  if (s.startsWith('{')) {
    const obj = JSON.parse(s) as JsonRecord;
    if (typeof obj.paramsB === 'number' && Number.isFinite(obj.paramsB) && obj.paramsB > 0) paramsB = obj.paramsB;
    if (typeof obj.quant === 'string' && obj.quant.trim()) quant = obj.quant.trim().toUpperCase();
    if (typeof obj.context === 'number' && Number.isFinite(obj.context) && obj.context > 0) context = obj.context;
  } else {
    const pm = /(\d+(?:\.\d+)?)\s*B\b/i.exec(s);
    if (!pm) throw new RangeError('estimateVramFit requires parameter size like 7B');
    paramsB = Number(pm[1]);
    const qm = /\b(FP16|BF16|Q8_0|Q8|Q6_K|Q6|Q5_K_M|Q5|Q4_K_M|Q4_K_S|Q4|Q3|Q2)\b/i.exec(s);
    if (qm) quant = qm[1].toUpperCase();
    const cm = /\b(\d{4,6})\b/.exec(s.replace(pm[0], ''));
    if (cm) context = Number(cm[1]);
  }
  const bpwMap: Record<string, number> = {
    FP16: 2.0, BF16: 2.0, Q8_0: 1.05, Q8: 1.05,
    Q6_K: 0.82, Q6: 0.82, Q5_K_M: 0.72, Q5: 0.72,
    Q4_K_M: 0.6, Q4_K_S: 0.58, Q4: 0.6, Q3: 0.48, Q2: 0.38,
  };
  const bpw = bpwMap[quant] ?? 0.6;
  const weightsGb = Number((paramsB * bpw).toFixed(2));
  const kvCacheGb = Number(((context / 1024) * 0.08 * Math.max(1, paramsB / 7)).toFixed(2));
  const requiredVramGb = Number((weightsGb + kvCacheGb + 0.6).toFixed(2));
  const recommendedTier =
    requiredVramGb <= 8 ? '8GB_VRAM'
      : requiredVramGb <= 12 ? '12GB_VRAM'
        : requiredVramGb <= 16 ? '16GB_VRAM'
          : requiredVramGb <= 24 ? '24GB_VRAM'
            : 'MULTI_GPU_OR_CPU_OFFLOAD';
  return JSON.stringify({ paramsB, quant, context, requiredVramGb, recommendedTier });
}

function auditProposalConsistencyTs(raw: unknown): string {
  const input = asString(raw, 'auditProposalConsistency');
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const byKey = new Map<string, string[]>();
  let fieldCount = 0;
  for (const r of lines) {
    const line = r.replace(/^[-*]\s+/, '').trim();
    if (!line || line.startsWith('#') || /^https?:\/\//i.test(line)) continue;
    const m = /^([^:\n]{2,80}):\s+(.+)$/.exec(line);
    if (!m) continue;
    let rawKey = m[1].trim();
    const val = m[2].trim();
    if (!rawKey || !val || /^https?$/i.test(rawKey)) continue;
    if (rawKey.includes(' - ')) rawKey = rawKey.split(' - ').pop()!.trim();
    else if (rawKey.includes(' | ')) rawKey = rawKey.split(' | ').pop()!.trim();
    const key = rawKey.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!key) continue;
    fieldCount++;
    if (!byKey.has(key)) byKey.set(key, []);
    const list = byKey.get(key)!;
    if (!list.includes(val)) list.push(val);
  }
  if (fieldCount === 0) throw new RangeError('auditProposalConsistency requires Key: Value lines');
  const mismatches: string[] = [];
  for (const key of [...byKey.keys()].sort()) {
    const vals = byKey.get(key)!;
    if (vals.length > 1) mismatches.push(`MISMATCH [${key}]: ${vals.join(' vs ')}`);
  }
  return mismatches.length > 0 ? mismatches.join('\n') : `CONSISTENT: ${byKey.size} keys verified`;
}

const PEPPOL_RULES_TS: Record<string, [string, string]> = {
  'BR-01': ['Missing Invoice specification identifier', 'Set cbc:CustomizationID to urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0'],
  'BR-02': ['Missing Invoice number', 'Populate cbc:ID with a non-empty unique invoice identifier'],
  'BR-04': ['Missing Invoice issue date', 'Populate cbc:IssueDate in YYYY-MM-DD format'],
  'BR-06': ['Missing Seller legal name', 'Populate cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName'],
  'BR-08': ['Missing Seller postal address', 'Populate cac:AccountingSupplierParty/cac:Party/cac:PostalAddress with country code'],
  'BR-16': ['Invoice must contain at least one invoice line', 'Add at least one cac:InvoiceLine element'],
  'BR-CO-10': ['Sum of Invoice line net amounts must equal Invoice total without VAT', 'Recalculate cac:LegalMonetaryTotal/cbc:LineExtensionAmount'],
  'BR-CO-15': ['Invoice total amount with VAT must equal Total without VAT plus VAT total', 'Recalculate cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount'],
  'BR-S-08': ['Standard-rated VAT category taxable amount mismatch', 'Reconcile cac:TaxSubtotal/cbc:TaxableAmount for Category S'],
  'PEPPOL-EN16931-R001': ['Missing Business Process identifier', 'Set cbc:ProfileID to urn:fdc:peppol.eu:2017:poacc:billing:01:1.0'],
  'PEPPOL-EN16931-R010': ['Missing Buyer electronic address', 'Set cac:AccountingCustomerParty/cac:Party/cbc:EndpointID with valid schemeID'],
  'PEPPOL-EN16931-R020': ['Missing Seller electronic address', 'Set cac:AccountingSupplierParty/cac:Party/cbc:EndpointID with valid schemeID'],
};

function explainPeppolErrorTs(raw: unknown): string {
  const s = asString(raw, 'explainPeppolError').trim();
  const m = /\b(PEPPOL-EN16931-R\d{3}|BR-[A-Z]{1,4}-\d{2}|BR-\d{2})\b/i.exec(s);
  if (!m) throw new RangeError('explainPeppolError requires a BR-* or PEPPOL-EN16931-* rule code');
  const code = m[1].toUpperCase();
  const entry = PEPPOL_RULES_TS[code];
  if (entry) return `${code} | ${entry[0]} | Fix: ${entry[1]}`;
  return `${code} | EN 16931 / Peppol BIS 3.0 validation rule failed | Fix: Validate UBL 2.1 XML element matching ${code}`;
}

function verifyReceiptProofTs(raw: unknown): string {
  const s = asString(raw, 'verifyReceiptProof').trim();
  const obj = JSON.parse(s) as JsonRecord;
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new TypeError('verifyReceiptProof expects JSON object');
  const markers = ['status', 'schema', 'paidApiCalls', 'receiptDigest', 'digestSha256', 'sha256'];
  if (!markers.some((k) => Object.prototype.hasOwnProperty.call(obj, k))) {
    throw new RangeError('verifyReceiptProof requires receipt keys');
  }
  const missingKeys: string[] = [];
  if (!obj.status) missingKeys.push('status');
  if (!Object.prototype.hasOwnProperty.call(obj, 'paidApiCalls')) missingKeys.push('paidApiCalls');
  if (!obj.receiptDigest && !obj.digestSha256 && !obj.sha256) missingKeys.push('digest');
  const zeroPaidCalls = obj.paidApiCalls === 0;
  const valid = zeroPaidCalls && missingKeys.length === 0;
  return JSON.stringify({
    valid,
    zeroPaidCalls,
    status: String(obj.status || ''),
    missingKeys,
  });
}

const PRIMITIVE_TABLE: Record<string, PrimitiveFn> = {
  csvClean,
  csvToJson,
  jsonToCsv,
  canonicalizeJson: (v) => canonicalizeJson(v),
  stringifyCanonical: (v) => JSON.stringify(canonicalizeJson(v)),
  jsonMinify: (v) => JSON.stringify(JSON.parse(asString(v, 'jsonMinify'))),
  jsonPretty: (v) => JSON.stringify(JSON.parse(asString(v, 'jsonPretty')), null, 2) + '\n',
  sortByScoreDesc: (v) => sortRecords(v, 'score', 'desc'),
  sortByNameAsc: (v) => sortRecords(v, 'name', 'asc'),
  sortByIdAsc: (v) => sortRecords(v, 'id', 'asc'),
  toLower: (v) => asString(v, 'toLower').toLowerCase(),
  toUpper: (v) => asString(v, 'toUpper').toUpperCase(),
  toTitleCase: (v) => splitWords(asString(v, 'toTitleCase')).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' '),
  toCamelCase: (v) => splitWords(asString(v, 'toCamelCase')).map((t, i) => (i === 0 ? t : t.charAt(0).toUpperCase() + t.slice(1))).join(''),
  toSnakeCase: (v) => splitWords(asString(v, 'toSnakeCase')).join('_'),
  toKebabCase: (v) => splitWords(asString(v, 'toKebabCase')).join('-'),
  dedupeLinesTrim: (v) => {
    if (!Array.isArray(v)) throw new TypeError('dedupeLinesTrim expects array');
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of v) {
      const s = String(item).trim();
      if (!s) continue;
      const k = s.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(s);
      }
    }
    return out;
  },
  normalizeText: (v) => asString(v, 'normalizeText').toLowerCase().replace(/[-_/]+/g, ' ').replace(/\s+/g, ' ').trim(),
  slugify: (v) =>
    asString(v, 'slugify')
      .normalize('NFKD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
  sha256Hex,
  parseJson: (v) => JSON.parse(asString(v, 'parseJson')) as unknown,
  splitLines: (v) => String(v).replace(/\r\n/g, '\n').split('\n'),
  joinLines: (v) => {
    if (!Array.isArray(v)) throw new TypeError('joinLines expects array');
    return v.join('\n');
  },
  joinHyphen: (v) => {
    if (!Array.isArray(v)) throw new TypeError('joinHyphen expects array');
    return v.join('-');
  },
  textStatsSummary,
  normalizeEmail: normalizeEmailTs,
  normalizeIsoDate: normalizeIsoDateTs,
  normalizeUrl: normalizeUrlTs,
  escapeHtml: escapeHtmlStr,
  unescapeHtml: unescapeHtmlStr,
  normalizePath: normalizePathTs,
  recordsToMarkdownTable: recordsToMarkdownTableTs,
  linesToChecklist: linesToChecklistTs,
  estimateTokens: estimateTokensTs,
  estimateVramFit: estimateVramFitTs,
  auditProposalConsistency: auditProposalConsistencyTs,
  explainPeppolError: explainPeppolErrorTs,
  verifyReceiptProof: verifyReceiptProofTs,
};

export function executeSynthesizedPipeline(input: unknown): unknown {
  let current: unknown = input;
  for (const step of SYNTHESIZED_PIPELINE) {
    const fn = PRIMITIVE_TABLE[step];
    if (!fn) throw new Error(`Unknown primitive: ${step}`);
    current = fn(current);
  }
  return current;
}

export function processInput(input: string): ToolResult {
  try {
    let prepared: unknown = input;
    const expectedType: string = "string";
    if (expectedType === 'lines') {
      prepared = input.replace(/\r\n/g, '\n').split('\n');
    } else if (expectedType === 'json' || expectedType === 'records') {
      prepared = JSON.parse(input) as unknown;
    }
    const result = executeSynthesizedPipeline(prepared);
    const data = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      data: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
