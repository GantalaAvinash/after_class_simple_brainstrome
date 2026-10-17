import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { compile } from '../vendor/vue.esm-browser.prod.js';

for (const page of ['index', 'admin']) {
  test(page + ' page compiles with the actual pinned Vue browser compiler', async () => {
    const html = await readFile(new URL('../' + page + '.html', import.meta.url), 'utf8');
    const root = html.indexOf('<div id=');
    assert.ok(root >= 0);
    const template = html.slice(root, html.lastIndexOf('</div>') + 6);
    // Entity decoding normally uses document.createElement in the browser.
    // Identity decoding is sufficient for syntax checks of these templates;
    // this test never simulates DOM interaction or mounts an application.
    const render = compile(template, { decodeEntities: (value) => value, onError: (error) => { throw error; } });
    assert.equal(typeof render, 'function');
  });
}
