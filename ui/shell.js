import { assetUrl, escapeHtml, pageUrl } from './core-data.js';

const fmt = (value) => new Intl.NumberFormat().format(value || 0);

function navItem(view, label, icon, activeView) {
  const active = view === activeView ? ' is-active' : '';
  return `<button class="nav-item${active}" data-view="${view}" type="button"><span class="nav-icon">${icon}</span><span>${label}</span></button>`;
}

function thumb(path, className, alt = '') {
  return path
    ? `<img class="${className}" src="${assetUrl(path)}" alt="${escapeHtml(alt)}">`
    : `<span class="${className}"></span>`;
}

export function sidebar(activeView = 'home', recent = []) {
  return `<aside class="sidebar">
    <div class="sidebar-top">
      <button class="wordmark" data-view="home" type="button">core</button>
      <button class="collapse-btn" type="button" aria-label="Collapse sidebar">«</button>
    </div>
    <nav class="nav-group" aria-label="Core Wiki navigation">
      ${navItem('home', 'Home', '⌂', activeView)}
      ${navItem('cores', 'Cores', '◫', activeView)}
      ${navItem('articles', 'Articles', '☰', activeView)}
      ${navItem('graph', 'Core Graph', '◉', activeView)}
      ${navItem('quiz', 'Find Your Core', '◈', activeView)}
      ${navItem('archive', 'Archive', '⌲', activeView)}
      ${navItem('about', 'About', 'ⓘ', activeView)}
    </nav>
    <section class="recent-block">
      <p class="block-label">Recently viewed</p>
      <div class="recent-list">
        ${recent.length ? recent.map((item) => `<a class="recent-item" href="${pageUrl(item.name)}">
          ${thumb(item.path, 'recent-thumb', item.name)}
          <div><div class="recent-name">${escapeHtml(item.name)}</div><div class="recent-meta">${fmt(item.count)} graphics</div></div>
        </a>`).join('') : '<div class="recent-meta">No recently viewed cores yet.</div>'}
      </div>
    </section>
    <div class="contribute-card">
      <div><p class="contribute-title">Contribute to Core Wiki</p><p class="contribute-copy">Help expand the index.</p></div><span>→</span>
    </div>
  </aside>`;
}

export function topbar(value = '') {
  return `<div class="topbar">
    <button class="topbar-back hidden" id="topbarBack" type="button" aria-label="Go back">←</button>
    <form class="search-wrap" id="searchForm">
      <input class="search-input" id="searchInput" name="core" type="search" autocomplete="off" spellcheck="false" placeholder="Search the Core Wiki" value="${escapeHtml(value)}">
      <div class="search-actions"><button class="icon-btn hidden" id="clearButton" type="button">×</button><button class="search-submit" type="submit">Open</button></div>
    </form>
    <div class="icon-strip"><button class="icon-btn" id="themeToggle" type="button" aria-label="Toggle dark mode">☼</button><button class="icon-btn" type="button">◌</button><div class="avatar">K</div></div>
  </div>`;
}

export function footer() {
  return '<div class="footer-line"><span>© 2026 Core Wiki. All rights reserved.</span><div class="footer-links"><span>Privacy</span><span>Terms</span><span>Contact</span></div></div>';
}

export function imageThumb(path, className, alt = '') {
  return thumb(path, className, alt);
}
