/**
 * OTHRYS JSON Viewer Engine
 * Zero-dependency, client-side, strongly typed JSON analysis, tree rendering, and tabular extraction.
 */

export interface JsonMetrics {
  byteSize: number;
  formattedSize: string;
  totalKeys: number;
  maxDepth: number;
  rootType: 'object' | 'array' | 'primitive';
  itemCount: number;
}

export interface TableExtraction {
  columns: string[];
  rows: Record<string, string>[];
}

export const SAMPLE_PAYLOADS: Record<'classroom' | 'api' | 'config', { label: string; json: string }> = {
  classroom: {
    label: 'Classroom Roster (Education)',
    json: JSON.stringify(
      {
        course: "CS101: Introduction to Data Structures",
        semester: "Fall 2026",
        teacher: {
          name: "Prof. Hendrik Pauwels",
          office: "Lab 3B",
          email: "teacher@school.internal"
        },
        classStats: {
          enrolled: 4,
          passingGrade: 60,
          averageScore: 84.5
        },
        students: [
          { id: 101, name: "Alice Van Damme", score: 92, status: "passed", projects: ["CLI Parser", "Web Scraper"] },
          { id: 102, name: "Bob Peeters", score: 78, status: "passed", projects: ["Portfolio"] },
          { id: 103, name: "Chloe Jacobs", score: 89, status: "passed", projects: ["Game 2D", "API"] },
          { id: 104, name: "David Maes", score: 79, status: "passed", projects: ["Database Tool"] }
        ]
      },
      null,
      2
    )
  },
  api: {
    label: 'REST API Response (Web Dev)',
    json: JSON.stringify(
      {
        status: "success",
        code: 200,
        pagination: {
          currentPage: 1,
          totalPages: 5,
          perPage: 2,
          totalRecords: 10
        },
        data: [
          { id: "usr_01", username: "alex99", role: "moderator", verified: true, lastLogin: "2026-11-16T17:30:00Z" },
          { id: "usr_02", username: "sarah_k", role: "admin", verified: true, lastLogin: "2026-11-16T18:15:00Z" }
        ],
        meta: {
          server: "cloudflare-edge",
          region: "eu-west",
          executionMs: 1.42
        }
      },
      null,
      2
    )
  },
  config: {
    label: 'App Configuration (DevOps)',
    json: JSON.stringify(
      {
        appName: "SovereignFleetApp",
        version: "2.4.0",
        environment: "production",
        features: {
          zeroTracking: true,
          offlineSync: true,
          clientVault: true,
          debugMode: false
        },
        storage: {
          quotaMb: 50,
          encryption: "AES-GCM-256",
          autoEvictAfterDays: 30
        },
        allowedOrigins: [
          "https://othrys.be",
          "https://jsonviewer.othrys.be",
          "https://jsonfix.othrys.be"
        ]
      },
      null,
      2
    )
  }
};

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function analyzeJson(val: unknown, rawText: string): JsonMetrics {
  const byteSize = new TextEncoder().encode(rawText).length;
  let totalKeys = 0;
  let maxDepth = 0;

  function traverse(node: unknown, depth: number): void {
    if (depth > maxDepth) maxDepth = depth;
    if (node && typeof node === 'object') {
      if (Array.isArray(node)) {
        for (const item of node) {
          traverse(item, depth + 1);
        }
      } else {
        const keys = Object.keys(node);
        totalKeys += keys.length;
        for (const k of keys) {
          traverse((node as Record<string, unknown>)[k], depth + 1);
        }
      }
    }
  }

  traverse(val, 0);

  const rootType = Array.isArray(val)
    ? 'array'
    : val && typeof val === 'object'
    ? 'object'
    : 'primitive';

  const itemCount = Array.isArray(val)
    ? val.length
    : val && typeof val === 'object'
    ? Object.keys(val).length
    : 1;

  return {
    byteSize,
    formattedSize: formatByteSize(byteSize),
    totalKeys,
    maxDepth,
    rootType,
    itemCount
  };
}

export function highlightText(text: string, query?: string): string {
  const escaped = escapeHtml(text);
  if (!query || !query.trim()) return escaped;
  const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${q})`, 'gi');
  return escaped.replace(regex, '<mark class="jv-match">$1</mark>');
}

export function renderTreeView(node: unknown, query?: string, path = '$'): string {
  const q = query?.trim().toLowerCase() || '';

  if (node === null) {
    return `<span class="jv-null" data-path="${escapeHtml(path)}" title="Click to copy JSONPath">null</span>`;
  }
  if (typeof node === 'boolean') {
    return `<span class="jv-bool" data-path="${escapeHtml(path)}" title="Click to copy JSONPath">${node}</span>`;
  }
  if (typeof node === 'number') {
    return `<span class="jv-num" data-path="${escapeHtml(path)}" title="Click to copy JSONPath">${node}</span>`;
  }
  if (typeof node === 'string') {
    const display = highlightText(`"${node}"`, q);
    return `<span class="jv-str" data-path="${escapeHtml(path)}" title="Click to copy JSONPath">${display}</span>`;
  }

  if (Array.isArray(node)) {
    if (node.length === 0) {
      return `<span class="jv-bracket" data-path="${escapeHtml(path)}">[]</span>`;
    }

    const itemsHtml = node
      .map((item, idx) => {
        const itemPath = `${path}[${idx}]`;
        const rendered = renderTreeView(item, q, itemPath);
        return `<li class="jv-tree-item"><span class="jv-index" data-path="${escapeHtml(itemPath)}">${idx}:</span> ${rendered}</li>`;
      })
      .join('');

    return `
      <details class="jv-node jv-array-node" open>
        <summary class="jv-summary" data-path="${escapeHtml(path)}">
          <span class="jv-toggle-caret" aria-hidden="true">▼</span>
          <span class="jv-bracket">[</span>
          <span class="jv-count">${node.length} ${node.length === 1 ? 'item' : 'items'}</span>
          <span class="jv-bracket">]</span>
          <button type="button" class="jv-path-pill" data-copy-path="${escapeHtml(path)}" title="Copy JSONPath (${escapeHtml(path)})">path</button>
        </summary>
        <ul class="jv-children">${itemsHtml}</ul>
      </details>
    `;
  }

  if (typeof node === 'object') {
    const keys = Object.keys(node as Record<string, unknown>);
    if (keys.length === 0) {
      return `<span class="jv-brace" data-path="${escapeHtml(path)}">{}</span>`;
    }

    const entriesHtml = keys
      .map((key) => {
        const entryPath = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
          ? `${path}.${key}`
          : `${path}["${key.replace(/"/g, '\\"')}"]`;
        const childVal = (node as Record<string, unknown>)[key];
        const keyDisplay = highlightText(`"${key}"`, q);
        const childRendered = renderTreeView(childVal, q, entryPath);
        return `
          <li class="jv-tree-item">
            <span class="jv-key" data-path="${escapeHtml(entryPath)}" title="Click to copy JSONPath">${keyDisplay}</span><span class="jv-colon">:</span> ${childRendered}
          </li>
        `;
      })
      .join('');

    return `
      <details class="jv-node jv-object-node" open>
        <summary class="jv-summary" data-path="${escapeHtml(path)}">
          <span class="jv-toggle-caret" aria-hidden="true">▼</span>
          <span class="jv-brace">{</span>
          <span class="jv-count">${keys.length} ${keys.length === 1 ? 'key' : 'keys'}</span>
          <span class="jv-brace">}</span>
          <button type="button" class="jv-path-pill" data-copy-path="${escapeHtml(path)}" title="Copy JSONPath (${escapeHtml(path)})">path</button>
        </summary>
        <ul class="jv-children">${entriesHtml}</ul>
      </details>
    `;
  }

  return escapeHtml(String(node));
}

export function extractTableData(val: unknown): TableExtraction | null {
  let targetArray: unknown[] | null = null;

  if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
    targetArray = val;
  } else if (val && typeof val === 'object') {
    for (const key of Object.keys(val)) {
      const prop = (val as Record<string, unknown>)[key];
      if (Array.isArray(prop) && prop.length > 0 && typeof prop[0] === 'object' && prop[0] !== null) {
        targetArray = prop;
        break;
      }
    }
  }

  if (!targetArray || targetArray.length === 0) return null;

  const colSet = new Set<string>();
  for (const item of targetArray) {
    if (item && typeof item === 'object') {
      for (const k of Object.keys(item)) {
        colSet.add(k);
      }
    }
  }

  const columns = Array.from(colSet);
  if (columns.length === 0) return null;

  const rows = targetArray.map((item) => {
    const row: Record<string, string> = {};
    const obj = (item || {}) as Record<string, unknown>;
    for (const col of columns) {
      const v = obj[col];
      if (v === undefined) {
        row[col] = '';
      } else if (v === null) {
        row[col] = 'null';
      } else if (typeof v === 'object') {
        row[col] = JSON.stringify(v);
      } else {
        row[col] = String(v);
      }
    }
    return row;
  });

  return { columns, rows };
}

export function renderTableView(val: unknown, query?: string): string | null {
  const table = extractTableData(val);
  if (!table) return null;

  const q = query?.trim().toLowerCase() || '';

  const ths = table.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
  const trs = table.rows
    .map((row, idx) => {
      const tds = table.columns
        .map((col) => {
          const rawCell = row[col] ?? '';
          const highlighted = highlightText(rawCell, q);
          return `<td>${highlighted}</td>`;
        })
        .join('');
      return `<tr><td class="jv-table-idx">${idx + 1}</td>${tds}</tr>`;
    })
    .join('');

  return `
    <div class="jv-table-wrap">
      <table class="jv-table" role="table">
        <thead>
          <tr>
            <th class="jv-table-idx">#</th>
            ${ths}
          </tr>
        </thead>
        <tbody>
          ${trs}
        </tbody>
      </table>
    </div>
  `;
}
