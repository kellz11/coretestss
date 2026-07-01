import { clean, getStats, loadManifest, normalize } from './core-data.js';
import { loadCore } from './article.js';
import { homeView, coreView } from './views.js';
import { aboutView, archiveView, articlesView, coresView } from './sections.js';
import { graphView, mountCoreGraph } from './graph.js';
import { quizView, wireQuiz } from './quiz.js';

const app = document.getElementById('app');
const RECENT_KEY = 'coreWikiRecent';
const THEME_KEY = 'coreWikiTheme';
const VALID_VIEWS = new Set(['home', 'cores', 'articles', 'graph', 'archive', 'about', 'quiz']);
let graphCleanup = null;
let appNavs = 0;

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
}

function initTheme() {
  let theme = localStorage.getItem(THEME_KEY);
  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(theme);
}

function getRecentNames() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

function remember(title) {
  const next = [title, ...getRecentNames().filter((item) => normalize(item) !== normalize(title))].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

async function recentRecords() {
  const manifest = await loadManifest();
  return getRecentNames().map((name) => {
    const record = manifest.get(normalize(name));
    return record ? { name: record.name, count: record.paths.length, path: record.paths[0] || '' } : null;
  }).filter(Boolean);
}

function currentView() {
  const params = new URL(location.href).searchParams;
  if (params.get('core')) return 'core';
  const view = params.get('view') || 'home';
  return VALID_VIEWS.has(view) ? view : 'home';
}

function stopGraph() {
  if (typeof graphCleanup === 'function') graphCleanup();
  graphCleanup = null;
}

function goView(view) {
  const target = VALID_VIEWS.has(view) ? view : 'home';
  const url = new URL(location.href);
  url.search = '';
  if (target !== 'home') url.searchParams.set('view', target);
  appNavs += 1;
  history.pushState({ view: target }, '', url);
  renderRoute().catch(renderError);
}

function navigateCore(title) {
  const value = clean(title);
  if (!value) return;
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('core', value);
  appNavs += 1;
  history.pushState({ core: value }, '', url);
  renderCore(value).catch(renderError);
}

function wireThemeToggle() {
  const button = document.getElementById('themeToggle');
  if (!button) return;
  const setIcon = () => { button.textContent = document.documentElement.dataset.theme === 'dark' ? '☾' : '☼'; };
  setIcon();
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    setIcon();
  });
}

function wireCommon() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => goView(button.dataset.view));
  });

  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('clearButton');
  const refreshClear = () => clear?.classList.toggle('hidden', !input?.value);
  refreshClear();

  input?.addEventListener('input', refreshClear);
  clear?.addEventListener('click', () => {
    input.value = '';
    refreshClear();
    input.focus();
  });
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    navigateCore(input?.value);
  });

  wireThemeToggle();

  const back = document.getElementById('topbarBack');
  if (back) {
    const onHome = currentView() === 'home';
    back.classList.toggle('hidden', onHome);
    back.addEventListener('click', () => {
      if (appNavs > 0) history.back();
      else goView('home');
    });
  }

  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => image.remove(), { once: true });
  });
}

document.addEventListener('click', (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href]');
  if (!link || link.target === '_blank') return;
  let url;
  try { url = new URL(link.href, location.href); } catch { return; }
  if (url.origin !== location.origin) return;
  const core = url.searchParams.get('core');
  if (!core) return;
  event.preventDefault();
  navigateCore(core);
});

function wireSimpleFilter() {
  const input = document.getElementById('sectionSearch');
  const empty = document.getElementById('noResults');
  if (!input) return;

  input.addEventListener('input', () => {
    const needle = input.value.toLowerCase().trim();
    let visible = 0;
    document.querySelectorAll('.filterable').forEach((item) => {
      const haystack = (item.dataset.search || '').toLowerCase();
      const show = !needle || haystack.includes(needle);
      item.classList.toggle('hidden', !show);
      if (show) visible += 1;
    });
    empty?.classList.toggle('hidden', visible > 0);
  });
}

function wireArticle() {
  const card = document.getElementById('articleCard');
  const body = document.getElementById('articleBody');
  const button = document.getElementById('articleToggle');
  if (!card || !body || !button) return;

  requestAnimationFrame(() => {
    if (body.scrollHeight <= body.clientHeight + 8) button.classList.add('hidden');
  });
  button.addEventListener('click', () => {
    const expanded = body.classList.toggle('is-expanded');
    card.classList.toggle('is-expanded', expanded);
    button.textContent = expanded ? 'Show less' : 'Read full article';
  });
}

async function renderHome() {
  document.title = 'Core Wiki';
  const [stats, recent] = await Promise.all([getStats(), recentRecords()]);
  app.innerHTML = homeView(stats, recent);
  wireCommon();
  document.getElementById('browseAll')?.addEventListener('click', (event) => {
    document.querySelectorAll('[data-core-card]').forEach((card) => card.classList.remove('hidden'));
    event.currentTarget.classList.add('hidden');
  });
}

async function renderGraph() {
  const [stats, recent] = await Promise.all([getStats(), recentRecords()]);
  document.title = 'Core Graph - Core Wiki';
  app.innerHTML = graphView(stats, recent);
  wireCommon();
  graphCleanup = mountCoreGraph(stats.records);
}

async function renderQuiz() {
  const [stats, recent] = await Promise.all([getStats(), recentRecords()]);
  document.title = 'Find Your Core - Core Wiki';
  app.innerHTML = quizView(stats, recent);
  wireCommon();
  wireQuiz();
}

async function renderSection(view) {
  if (view === 'graph') return renderGraph();
  if (view === 'quiz') return renderQuiz();
  const [stats, recent] = await Promise.all([getStats(), recentRecords()]);
  const builders = { cores: coresView, articles: articlesView, archive: archiveView, about: aboutView };
  const builder = builders[view] || coresView;
  document.title = `${view.charAt(0).toUpperCase() + view.slice(1)} - Core Wiki`;
  app.innerHTML = builder(stats, recent);
  wireCommon();
  wireSimpleFilter();
}

async function renderCore(title) {
  const core = await loadCore(title);
  remember(core.title);
  document.title = `${core.title} - Core Wiki`;
  const recent = await recentRecords();
  app.innerHTML = coreView(core, recent);
  wireCommon();
  wireArticle();
}

async function renderRoute() {
  stopGraph();
  app.innerHTML = '<div class="loading-wrap">Loading Core Wiki...</div>';
  const params = new URL(location.href).searchParams;
  const core = params.get('core');
  if (core) return renderCore(core);
  const view = currentView();
  return view === 'home' ? renderHome() : renderSection(view);
}

function renderError(error) {
  stopGraph();
  app.innerHTML = `<div class="error-wrap"><div><h2>Page unavailable</h2><p>${String(error?.message || 'The page could not be loaded.')}</p><p><a href="./">Return home</a></p></div></div>`;
}

initTheme();
window.addEventListener('popstate', () => {
  appNavs = Math.max(0, appNavs - 1);
  renderRoute().catch(renderError);
});
renderRoute().catch(renderError);
