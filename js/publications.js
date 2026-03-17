/**
 * publications.js
 * Fetches data/publications.json and renders the publications list.
 *
 * JSON schema for each entry:
 * {
 *   "title":   string  — may contain HTML (e.g. <em> for species names)
 *   "authors": string  — comma-separated; "Gresham D" is bolded automatically
 *   "journal": string  — plain text
 *   "year":    number
 *   "doi":     string  — optional bare DOI, e.g. "10.1371/journal.pgen.1011355"
 *   "links":   array of { "label": string, "url": string, "icon": string (FA class) }
 * }
 *
 * Years >= OLDER_THRESHOLD get their own section; earlier years are grouped as "Earlier".
 * Year filter buttons are generated automatically from the data.
 */

(async function () {
  const HIGHLIGHT_AUTHOR  = 'Gresham D';
  const OLDER_THRESHOLD   = 2021;   // years below this are grouped as "Earlier"
  const DATA_PATH         = 'data/publications.json';

  const listEl          = document.getElementById('pub-list');
  const filterContainer = document.querySelector('.pub-filter-btns');
  const searchInput     = document.getElementById('pub-search');

  if (!listEl) return;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  listEl.innerHTML = '<p class="pub-loading"><i class="fa-solid fa-spinner fa-spin"></i>&nbsp; Loading publications…</p>';

  let pubs;
  try {
    const res = await fetch(DATA_PATH);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    pubs = await res.json();
  } catch (err) {
    listEl.innerHTML =
      `<p class="pub-error"><i class="fa-solid fa-triangle-exclamation"></i>&nbsp; ` +
      `Could not load publications. ${err.message}</p>`;
    return;
  }

  // ── Sort newest-first, assign display numbers ──────────────────────────────
  pubs.sort((a, b) => b.year - a.year);
  pubs.forEach((p, i) => { p._num = i + 1; });

  // ── Determine year keys ────────────────────────────────────────────────────
  const yearKey = p => (p.year >= OLDER_THRESHOLD ? String(p.year) : 'older');

  const uniqueYears = [...new Set(pubs.map(yearKey))];
  const sortedYears = uniqueYears
    .filter(y => y !== 'older')
    .sort((a, b) => Number(b) - Number(a));
  if (pubs.some(p => p.year < OLDER_THRESHOLD)) sortedYears.push('older');

  // ── Build year filter buttons ──────────────────────────────────────────────
  if (filterContainer) {
    filterContainer.innerHTML =
      '<button class="filter-btn active" data-filter="all">All Years</button>';
    sortedYears.forEach(y => {
      const btn = document.createElement('button');
      btn.className     = 'filter-btn';
      btn.dataset.filter = y;
      btn.textContent   = y === 'older' ? 'Earlier' : y;
      filterContainer.appendChild(btn);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  renderAll(pubs, sortedYears);

  // ── Search + filter ────────────────────────────────────────────────────────
  let activeFilter = 'all';

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  function applyFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    document.querySelectorAll('.pub-entry').forEach(entry => {
      const matchesQuery  = !query || entry.dataset.searchText.includes(query);
      const matchesFilter = activeFilter === 'all' || entry.dataset.yearKey === activeFilter;
      entry.style.display = matchesQuery && matchesFilter ? '' : 'none';
    });

    // Hide section headings when all their entries are hidden
    document.querySelectorAll('.pub-year-group').forEach(group => {
      const anyVisible = [...group.querySelectorAll('.pub-entry')]
        .some(e => e.style.display !== 'none');
      group.style.display = anyVisible ? '' : 'none';
    });
  }

  // ── DOM builders ───────────────────────────────────────────────────────────
  function renderAll(pubs, yearOrder) {
    const groups = {};
    pubs.forEach(p => {
      const key = yearKey(p);
      (groups[key] ??= []).push(p);
    });

    listEl.innerHTML = '';

    yearOrder.forEach(key => {
      if (!groups[key]) return;
      const section = document.createElement('div');
      section.className = 'pub-year-group';

      const h2 = document.createElement('h2');
      h2.className   = 'pub-year-heading';
      h2.textContent = key === 'older' ? 'Earlier Publications' : key;
      section.appendChild(h2);

      groups[key].forEach(pub => section.appendChild(buildEntry(pub, key)));
      listEl.appendChild(section);
    });
  }

  function buildEntry(pub, key) {
    const entry = document.createElement('div');
    entry.className           = 'pub-entry';
    entry.dataset.yearKey     = key;
    // Plain-text search index (strip any HTML tags from title)
    entry.dataset.searchText  = [pub.title.replace(/<[^>]+>/g, ''), pub.authors, pub.journal, pub.year]
      .join(' ').toLowerCase();

    // Number badge
    const num = document.createElement('span');
    num.className   = 'pub-number';
    num.textContent = pub._num;

    // Content wrapper
    const content = document.createElement('div');
    content.className = 'pub-content';

    // Title — HTML allowed so <em> works for species names
    const titleEl = document.createElement('div');
    titleEl.className = 'pub-title';
    const doiUrl = pub.doi ? `https://doi.org/${pub.doi}` : (pub.links?.find(l => l.label === 'DOI')?.url || '');
    titleEl.innerHTML = doiUrl
      ? `<a href="${doiUrl}" target="_blank" rel="noopener">${pub.title}</a>`
      : pub.title;

    // Authors — bold the lab PI automatically
    const authorsEl = document.createElement('div');
    authorsEl.className = 'pub-authors';
    const escapedAuthor = HIGHLIGHT_AUTHOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    authorsEl.innerHTML = pub.authors.replace(
      new RegExp(escapedAuthor, 'g'),
      `<strong>${HIGHLIGHT_AUTHOR}</strong>`
    );

    // Journal + year
    const journalEl = document.createElement('div');
    journalEl.className = 'pub-journal';
    journalEl.innerHTML = `<em>${pub.journal}</em> · ${pub.year}`;

    // Links
    const linksEl = document.createElement('div');
    linksEl.className = 'pub-links';
    (pub.links || []).forEach(link => {
      if (!link.url) return;       // skip links with no URL yet
      const a = document.createElement('a');
      a.className  = 'pub-link';
      a.href       = link.url;
      a.target     = '_blank';
      a.rel        = 'noopener';
      a.innerHTML  = `<i class="${link.icon}"></i> ${link.label}`;
      linksEl.appendChild(a);
    });

    content.append(titleEl, authorsEl, journalEl, linksEl);
    entry.append(num, content);
    return entry;
  }
})();
