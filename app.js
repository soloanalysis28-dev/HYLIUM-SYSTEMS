const sidebar = document.querySelector('#sidebar');
const sidebarToggle = document.querySelector('#sidebar-toggle');
const operationsToggle = document.querySelector('#operations-toggle');
const operationsMenu = document.querySelector('#operations-menu');
const search = document.querySelector('#global-search');
const noResults = document.querySelector('#no-results');

sidebarToggle?.addEventListener('click', () => {
  const collapsed = sidebar.classList.toggle('collapsed');
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  sidebarToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
});

operationsToggle?.addEventListener('click', () => {
  const expanded = operationsToggle.getAttribute('aria-expanded') === 'true';
  operationsToggle.setAttribute('aria-expanded', String(!expanded));
  operationsMenu.hidden = expanded;
});

document.querySelectorAll('.nav-item[href]').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((nav) => nav.classList.remove('active'));
    if (!item.classList.contains('nav-button')) item.classList.add('active');
    if (window.innerWidth <= 700) sidebar.classList.remove('mobile-open');
  });
});

function filterDashboard(query) {
  const normalized = query.trim().toLowerCase();
  const cards = [...document.querySelectorAll('.kpi-card')];
  const labels = [...document.querySelectorAll('.nav-item:not(.nav-button), .subnav a')];
  const searchable = [...cards, ...labels];
  if (!normalized) {
    searchable.forEach((el) => { el.style.display = ''; });
    noResults.hidden = true;
    return;
  }
  let matches = 0;
  cards.forEach((card) => {
    const visible = card.textContent.toLowerCase().includes(normalized);
    card.style.display = visible ? '' : 'none';
    if (visible) matches += 1;
  });
  labels.forEach((label) => {
    label.style.opacity = label.textContent.toLowerCase().includes(normalized) ? '1' : '.35';
  });
  noResults.hidden = matches > 0;
}

search?.addEventListener('input', (event) => filterDashboard(event.target.value));
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    search?.focus();
  }
});

// Mobile menu uses a real control while retaining the clean desktop header.
const mobileMenuButton = document.createElement('button');
mobileMenuButton.className = 'mobile-menu-button';
mobileMenuButton.type = 'button';
mobileMenuButton.setAttribute('aria-label', 'Open navigation');
mobileMenuButton.innerHTML = '<span class="icon icon-menu"></span>';
document.querySelector('.topbar')?.prepend(mobileMenuButton);
mobileMenuButton.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
