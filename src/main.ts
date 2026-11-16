import { processInput } from './tool.ts';
import { initTheme } from './theme.ts';
import { initModals } from './modals.ts';
import { showToast } from './toast.ts';
import { auditCookies } from './cookies.ts';
import { auditVault } from './vault.ts';
import {
  analyzeJson,
  escapeHtml,
  renderTableView,
  renderTreeView,
  SAMPLE_PAYLOADS
} from './viewer-engine.ts';
import './viewer.css';

type ViewMode = 'tree' | 'formatted' | 'table' | 'raw';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initModals();

  const audit = auditCookies();
  const vault = auditVault();
  console.log(`[OTHRYS] JSON Viewer initialized. Cookies: ${audit.totalCookies}, Client-Vault: ${vault.clientSideOnly}`);

  const inputEl = document.getElementById('app-input') as HTMLTextAreaElement | null;
  const outputRegion = document.getElementById('output-region');
  const processBtn = document.getElementById('action-process');
  const clearBtn = document.getElementById('action-clear');
  const copyBtn = document.getElementById('action-copy');

  // Metrics elements
  const metricSize = document.getElementById('metric-size');
  const metricKeys = document.getElementById('metric-keys');
  const metricDepth = document.getElementById('metric-depth');
  const metricType = document.getElementById('metric-type');

  // View state
  let currentParsed: unknown = null;
  let currentRaw = '';
  let activeTab: ViewMode = 'tree';
  let searchQuery = '';

  function updateMetrics(parsed: unknown, raw: string): void {
    if (!metricSize || !metricKeys || !metricDepth || !metricType) return;
    try {
      const stats = analyzeJson(parsed, raw);
      metricSize.textContent = stats.formattedSize;
      metricKeys.textContent = String(stats.totalKeys);
      metricDepth.textContent = String(stats.maxDepth);
      metricType.textContent = stats.rootType.toUpperCase();
    } catch {
      metricSize.textContent = '-';
      metricKeys.textContent = '-';
      metricDepth.textContent = '-';
      metricType.textContent = '-';
    }
  }

  function renderCurrentView(): void {
    if (!outputRegion) return;

    if (!currentParsed && !currentRaw) {
      outputRegion.innerHTML = '<div class="output-placeholder">Enter JSON above or click a classroom preset to begin exploration.</div>';
      return;
    }

    if (activeTab === 'tree') {
      const treeHtml = renderTreeView(currentParsed, searchQuery);
      outputRegion.innerHTML = `
        <div class="view-controls">
          <div class="tabs-group" role="tablist">
            <button type="button" class="tab-btn active" data-tab="tree">🌳 Tree View</button>
            <button type="button" class="tab-btn" data-tab="formatted">📄 Formatted</button>
            <button type="button" class="tab-btn" data-tab="table">📊 Table</button>
            <button type="button" class="tab-btn" data-tab="raw">📦 Compact</button>
          </div>
          <div class="search-box">
            <span aria-hidden="true">🔍</span>
            <input type="text" id="tree-search" placeholder="Search keys or values..." value="${escapeHtml(searchQuery)}" aria-label="Search JSON tree" />
          </div>
          <div class="tree-actions">
            <button type="button" id="btn-expand-all" class="mini-btn" title="Expand all branches">⤢ Expand All</button>
            <button type="button" id="btn-collapse-all" class="mini-btn" title="Collapse all branches">⤡ Collapse All</button>
          </div>
        </div>
        <div class="jv-tree-container" id="tree-root">
          ${treeHtml}
        </div>
      `;
      wireTreeEvents();
    } else if (activeTab === 'formatted') {
      const formatted = JSON.stringify(currentParsed, null, 2);
      outputRegion.innerHTML = `
        <div class="view-controls">
          <div class="tabs-group" role="tablist">
            <button type="button" class="tab-btn" data-tab="tree">🌳 Tree View</button>
            <button type="button" class="tab-btn active" data-tab="formatted">📄 Formatted</button>
            <button type="button" class="tab-btn" data-tab="table">📊 Table</button>
            <button type="button" class="tab-btn" data-tab="raw">📦 Compact</button>
          </div>
        </div>
        <pre style="font-family: var(--font-mono); white-space: pre-wrap; padding: 1rem; max-height: 580px; overflow: auto; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color);"><code>${escapeHtml(formatted)}</code></pre>
      `;
      wireTabEvents();
    } else if (activeTab === 'table') {
      const tableHtml = renderTableView(currentParsed, searchQuery);
      outputRegion.innerHTML = `
        <div class="view-controls">
          <div class="tabs-group" role="tablist">
            <button type="button" class="tab-btn" data-tab="tree">🌳 Tree View</button>
            <button type="button" class="tab-btn" data-tab="formatted">📄 Formatted</button>
            <button type="button" class="tab-btn active" data-tab="table">📊 Table</button>
            <button type="button" class="tab-btn" data-tab="raw">📦 Compact</button>
          </div>
          <div class="search-box">
            <span aria-hidden="true">🔍</span>
            <input type="text" id="table-search" placeholder="Filter table cells..." value="${escapeHtml(searchQuery)}" aria-label="Filter table cells" />
          </div>
        </div>
        ${tableHtml || '<div class="output-placeholder">No uniform array of objects found in payload to render as a table. Use Tree View instead.</div>'}
      `;
      wireTabEvents();
      const tableSearch = document.getElementById('table-search') as HTMLInputElement | null;
      if (tableSearch) {
        tableSearch.addEventListener('input', () => {
          searchQuery = tableSearch.value;
          renderCurrentView();
        });
      }
    } else if (activeTab === 'raw') {
      const canonical = processInput(currentRaw);
      const rawText = canonical.success ? canonical.data : JSON.stringify(currentParsed);
      outputRegion.innerHTML = `
        <div class="view-controls">
          <div class="tabs-group" role="tablist">
            <button type="button" class="tab-btn" data-tab="tree">🌳 Tree View</button>
            <button type="button" class="tab-btn" data-tab="formatted">📄 Formatted</button>
            <button type="button" class="tab-btn" data-tab="table">📊 Table</button>
            <button type="button" class="tab-btn active" data-tab="raw">📦 Compact</button>
          </div>
        </div>
        <textarea readonly class="app-textarea" style="height: 380px; font-family: var(--font-mono);">${escapeHtml(rawText)}</textarea>
      `;
      wireTabEvents();
    }
  }

  function wireTabEvents(): void {
    const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab') as ViewMode;
        if (tab) {
          activeTab = tab;
          renderCurrentView();
        }
      });
    });
  }

  function wireTreeEvents(): void {
    wireTabEvents();

    const searchInput = document.getElementById('tree-search') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value;
        renderCurrentView();
        const treeRoot = document.getElementById('tree-root');
        if (treeRoot && searchQuery.trim()) {
          const details = treeRoot.querySelectorAll('details');
          details.forEach((d) => (d.open = true));
        }
      });
    }

    const expandAllBtn = document.getElementById('btn-expand-all');
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        const details = document.querySelectorAll('#tree-root details');
        details.forEach((d) => ((d as HTMLDetailsElement).open = true));
        showToast('All nodes expanded');
      });
    }

    const collapseAllBtn = document.getElementById('btn-collapse-all');
    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        const details = document.querySelectorAll('#tree-root details');
        details.forEach((d) => ((d as HTMLDetailsElement).open = false));
        showToast('All nodes collapsed');
      });
    }

    // Path pill copy
    const pathButtons = document.querySelectorAll<HTMLButtonElement>('[data-copy-path]');
    pathButtons.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const path = btn.getAttribute('data-copy-path');
        if (path) {
          await navigator.clipboard.writeText(path);
          showToast(`Copied JSONPath: ${path}`);
        }
      });
    });

    // Click on key to copy path
    const keys = document.querySelectorAll<HTMLElement>('.jv-key, .jv-str, .jv-num, .jv-bool, .jv-null');
    keys.forEach((el) => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        const path = el.getAttribute('data-path');
        if (path) {
          await navigator.clipboard.writeText(path);
          showToast(`Copied JSONPath: ${path}`);
        }
      });
    });
  }

  function runViewer(): void {
    if (!inputEl || !outputRegion) return;
    const val = inputEl.value;
    if (!val.trim()) {
      showToast('Please enter input');
      return;
    }

    try {
      currentParsed = JSON.parse(val);
      currentRaw = val;
      updateMetrics(currentParsed, val);
      renderCurrentView();
      showToast('Completed successfully!');
    } catch (err) {
      currentParsed = null;
      currentRaw = '';
      const errMsg = err instanceof Error ? err.message : String(err);
      outputRegion.innerHTML = `
        <div class="error-banner" style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); padding: 1.25rem; border-radius: var(--radius-md); color: var(--text-primary);">
          <div style="font-weight: 700; color: var(--danger); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>⚠️</span> Invalid JSON Syntax
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 1rem;">${escapeHtml(errMsg)}</div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
            Got trailing commas, unquoted keys, single quotes, or Python literals?
          </p>
          <a href="https://jsonfix.othrys.be/" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="display: inline-block; font-size: 0.8rem; text-decoration: none;">
            Auto-Repair in JSONFix ↗
          </a>
        </div>
      `;
      showToast('Error: ' + errMsg);
    }
  }

  if (processBtn) {
    processBtn.addEventListener('click', runViewer);
  }

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to run
  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runViewer();
      }
    });
  }

  // Presets
  const presetChips = document.querySelectorAll<HTMLButtonElement>('[data-preset]');
  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.getAttribute('data-preset') as keyof typeof SAMPLE_PAYLOADS;
      if (key && SAMPLE_PAYLOADS[key] && inputEl) {
        inputEl.value = SAMPLE_PAYLOADS[key].json;
        runViewer();
        showToast(`Loaded ${SAMPLE_PAYLOADS[key].label}`);
      }
    });
  });

  if (clearBtn && inputEl && outputRegion) {
    clearBtn.addEventListener('click', () => {
      inputEl.value = '';
      currentParsed = null;
      currentRaw = '';
      searchQuery = '';
      updateMetrics(null, '');
      outputRegion.innerHTML = '<div class="output-placeholder">Output results will appear here in real-time.</div>';
      showToast('Cleared');
    });
  }

  if (copyBtn && inputEl) {
    copyBtn.addEventListener('click', async () => {
      let targetText = '';
      if (currentParsed) {
        targetText = activeTab === 'raw'
          ? JSON.stringify(currentParsed)
          : JSON.stringify(currentParsed, null, 2);
      } else {
        targetText = inputEl.value;
      }
      if (!targetText) {
        showToast('Nothing to copy.');
        return;
      }
      await navigator.clipboard.writeText(targetText);
      showToast('Copied to clipboard!');
    });
  }

  // Auto-run if initial textarea has valid JSON
  if (inputEl && inputEl.value.trim()) {
    runViewer();
  }
});
