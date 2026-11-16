import { processInput } from './tool.ts';
import { initTheme } from './theme.ts';
import { initModals } from './modals.ts';
import { showToast } from './toast.ts';
import { auditCookies } from './cookies.ts';
import { auditVault } from './vault.ts';

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
  let lastOutput = '';

  if (processBtn && inputEl && outputRegion) {
    processBtn.addEventListener('click', () => {
      const val = inputEl.value;
      if (!val.trim()) {
        showToast('Please enter input');
        return;
      }
      const res = processInput(val);
      if (res.success) {
        lastOutput = res.data;
        outputRegion.innerHTML = `<pre style="font-family: var(--font-mono); white-space: pre-wrap;"><code>${escapeHtml(res.data)}</code></pre>`;
        showToast('Completed successfully!');
      } else {
        lastOutput = '';
        outputRegion.innerHTML = `<div class="error-banner">${escapeHtml(res.error || 'Processing failed')}</div>`;
        showToast('Error: ' + (res.error || 'Processing failed'));
      }
    });
  }

  if (clearBtn && inputEl && outputRegion) {
    clearBtn.addEventListener('click', () => {
      inputEl.value = '';
      lastOutput = '';
      outputRegion.innerHTML = '<div class="output-placeholder">Output results will appear here in real-time.</div>';
      showToast('Cleared');
    });
  }

  if (copyBtn && inputEl) {
    copyBtn.addEventListener('click', async () => {
      const targetText = lastOutput || inputEl.value;
      if (!targetText) {
        showToast('Nothing to copy.');
        return;
      }
      await navigator.clipboard.writeText(targetText);
      showToast('Copied to clipboard!');
    });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
