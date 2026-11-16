import { describe, it, expect } from 'vitest';
import {
  analyzeJson,
  escapeHtml,
  extractTableData,
  formatByteSize,
  highlightText,
  renderTableView,
  renderTreeView,
  SAMPLE_PAYLOADS
} from '../src/viewer-engine.ts';

describe('JSON Viewer Engine', () => {
  it('correctly escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")&\'</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&amp;&#039;&lt;/script&gt;'
    );
  });

  it('formats byte sizes accurately', () => {
    expect(formatByteSize(500)).toBe('500 B');
    expect(formatByteSize(2048)).toBe('2.0 KB');
    expect(formatByteSize(1048576 * 2.5)).toBe('2.50 MB');
  });

  it('analyzes JSON payloads for depth, keys, and byte sizes', () => {
    const raw = JSON.stringify({ a: 1, b: [2, { c: true }] });
    const parsed = JSON.parse(raw);
    const metrics = analyzeJson(parsed, raw);

    expect(metrics.rootType).toBe('object');
    expect(metrics.totalKeys).toBe(3); // a, b, c
    expect(metrics.maxDepth).toBe(3);
    expect(metrics.itemCount).toBe(2);
    expect(metrics.byteSize).toBe(new TextEncoder().encode(raw).length);
  });

  it('renders interactive tree view with data-path attributes and type spans', () => {
    const data = {
      title: 'Classroom Test',
      students: [{ id: 1, name: 'Alice' }]
    };
    const html = renderTreeView(data);

    expect(html).toContain('class="jv-node jv-object-node"');
    expect(html).toContain('data-path="$.title"');
    expect(html).toContain('data-path="$.students[0].name"');
    expect(html).toContain('class="jv-str"');
    expect(html).toContain('class="jv-num"');
    expect(html).toContain('Alice');
  });

  it('highlights search queries in keys and values', () => {
    const res = highlightText('Hello World Alice', 'Alice');
    expect(res).toBe('Hello World <mark class="jv-match">Alice</mark>');
  });

  it('extracts tabular data from nested arrays of objects', () => {
    const data = {
      course: 'Science',
      roster: [
        { name: 'Alice', grade: 'A' },
        { name: 'Bob', grade: 'B' }
      ]
    };
    const table = extractTableData(data);
    expect(table).not.toBeNull();
    expect(table?.columns).toEqual(['name', 'grade']);
    expect(table?.rows).toHaveLength(2);
    expect(table?.rows[0]['name']).toBe('Alice');

    const tableHtml = renderTableView(data);
    expect(tableHtml).toContain('<table class="jv-table"');
    expect(tableHtml).toContain('<th>name</th>');
    expect(tableHtml).toContain('<td>Alice</td>');
  });

  it('provides complete, valid sample payloads for classroom, API, and config', () => {
    for (const key of ['classroom', 'api', 'config'] as const) {
      const sample = SAMPLE_PAYLOADS[key];
      expect(sample.label.length).toBeGreaterThan(5);
      const parsed = JSON.parse(sample.json);
      expect(typeof parsed).toBe('object');
    }
  });
});
