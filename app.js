// ============================================================
// KONFIGURATION — hier deine Google Apps Script URL eintragen
// ============================================================
const CONFIG = {
  APPS_SCRIPT_URL: '', // <- nach Setup eintragen
  DEMO_MODE: false,     // <- auf false setzen wenn Apps Script läuft
};

// ============================================================
// Demo-Daten (werden durch Google Sheets ersetzt)
// ============================================================
const DEMO_DATA = [
  { id: '1', name: 'Anna Schmidt', title: 'Product Designer', avatar: '', current_location: 'Berlin', current_lat: 52.52, current_lng: 13.405, current_until: '2026-05-20', next_location: 'Barcelona', next_lat: 41.3851, next_lng: 2.1734, next_from: '2026-05-22', next_until: '2026-06-15' },
  { id: '2', name: 'Max Weber', title: 'Frontend Developer', avatar: '', current_location: 'Lissabon', current_lat: 38.7223, current_lng: -9.1393, current_until: '2026-05-18', next_location: 'Barcelona', next_lat: 41.3851, next_lng: 2.1734, next_from: '2026-05-20', next_until: '2026-06-10' },
  { id: '3', name: 'Lisa Chen', title: 'Data Engineer', avatar: '', current_location: 'Bangkok', current_lat: 13.7563, current_lng: 100.5018, current_until: '2026-06-01', next_location: 'Bali', next_lat: -8.3405, next_lng: 115.092, next_from: '2026-06-05', next_until: '2026-07-01' },
  { id: '4', name: 'Tom Müller', title: 'Sales Lead', avatar: '', current_location: 'New York', current_lat: 40.7128, current_lng: -74.006, current_until: '2026-05-25', next_location: 'Miami', next_lat: 25.7617, next_lng: -80.1918, next_from: '2026-05-27', next_until: '2026-06-15' },
  { id: '5', name: 'Sophie Braun', title: 'Content Strategist', avatar: '', current_location: 'Tokyo', current_lat: 35.6762, current_lng: 139.6503, current_until: '2026-06-10', next_location: 'Seoul', next_lat: 37.5665, next_lng: 126.978, next_from: '2026-06-12', next_until: '2026-07-01' },
  { id: '6', name: 'Paul Fischer', title: 'Backend Developer', avatar: '', current_location: 'Kapstadt', current_lat: -33.9249, current_lng: 18.4241, current_until: '2026-05-30', next_location: 'Nairobi', next_lat: -1.2921, next_lng: 36.8219, next_from: '2026-06-02', next_until: '2026-06-20' },
  { id: '7', name: 'Mia Hoffmann', title: 'Marketing Manager', avatar: '', current_location: 'Medellín', current_lat: 6.2476, current_lng: -75.5658, current_until: '2026-05-28', next_location: 'Mexico City', next_lat: 19.4326, next_lng: -99.1332, next_from: '2026-06-01', next_until: '2026-06-25' },
  { id: '8', name: 'Jonas Klein', title: 'DevOps Engineer', avatar: '', current_location: 'Dubai', current_lat: 25.2048, current_lng: 55.2708, current_until: '2026-05-15', next_location: 'Istanbul', next_lat: 41.0082, next_lng: 28.9784, next_from: '2026-05-18', next_until: '2026-06-10' },
  { id: '9', name: 'Elena Wolf', title: 'UX Researcher', avatar: '', current_location: 'Barcelona', current_lat: 41.3851, current_lng: 2.1734, current_until: '2026-06-01', next_location: 'Berlin', next_lat: 52.52, next_lng: 13.405, next_from: '2026-06-03', next_until: '2026-06-30' },
  { id: '10', name: 'David Becker', title: 'CTO', avatar: '', current_location: 'Chiang Mai', current_lat: 18.7061, current_lng: 98.9817, current_until: '2026-05-31', next_location: 'Bali', next_lat: -8.3405, next_lng: 115.092, next_from: '2026-06-03', next_until: '2026-07-01' },
];

// ============================================================
// Farben für Marker (pro Person konsistent)
// ============================================================
const COLORS = [
  '#4a9eff', '#ff6b6b', '#51cf66', '#ffd43b', '#cc5de8',
  '#ff922b', '#20c997', '#f06595', '#74c0fc', '#a9e34b',
];

function getColor(index) {
  return COLORS[index % COLORS.length];
}

function generateAvatar(name, color) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <circle cx="22" cy="22" r="22" fill="${color}"/>
    <text x="22" y="22" text-anchor="middle" dy=".35em" font-family="sans-serif" font-size="16" font-weight="600" fill="#fff">${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

// ============================================================
// Theme
// ============================================================
const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

function isDark() {
  return document.body.classList.contains('dark');
}

function applyTheme(dark) {
  if (dark) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  document.getElementById('theme-switch').checked = dark;
  localStorage.setItem('theme', dark ? 'dark' : 'light');

  if (tileLayer) map.removeLayer(tileLayer);
  tileLayer = L.tileLayer(dark ? TILES.dark : TILES.light, {
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);
}

// ============================================================
// Map Setup
// ============================================================
const map = L.map('map', {
  zoomControl: false,
  attributionControl: false,
}).setView([25, 10], 3);

L.control.zoom({ position: 'bottomright' }).addTo(map);

let tileLayer = L.tileLayer(TILES.light, {
  maxZoom: 19,
  subdomains: 'abcd',
}).addTo(map);

L.control.attribution({ position: 'bottomleft' })
  .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>')
  .addTo(map);

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') applyTheme(true);

// ============================================================
// State
// ============================================================
let teamData = [];
let markers = [];
let routeLines = [];

// ============================================================
// Daten laden
// ============================================================
async function loadData() {
  if (CONFIG.DEMO_MODE || !CONFIG.APPS_SCRIPT_URL) {
    teamData = DEMO_DATA;
    return;
  }

  try {
    const res = await fetch(CONFIG.APPS_SCRIPT_URL);
    teamData = await res.json();
  } catch (e) {
    console.error('Fehler beim Laden:', e);
    teamData = DEMO_DATA;
  }
}

// ============================================================
// Karte befüllen
// ============================================================
function renderMap() {
  markers.forEach(m => map.removeLayer(m));
  routeLines.forEach(l => map.removeLayer(l));
  markers = [];
  routeLines = [];

  teamData.forEach((person, i) => {
    const color = getColor(i);
    const avatarUrl = person.avatar || generateAvatar(person.name, color);

    const icon = L.divIcon({
      className: '',
      html: `<img src="${avatarUrl}" class="avatar-marker" style="border-color: ${color}; width:40px; height:40px;" />`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([person.current_lat, person.current_lng], { icon })
      .addTo(map)
      .bindPopup(`<strong>${person.name}</strong><br>${person.current_location}`);

    marker.on('click', () => showDetail(person, i));
    markers.push(marker);

    if (person.next_location && person.next_lat) {
      const nextIcon = L.divIcon({
        className: '',
        html: `<img src="${avatarUrl}" class="avatar-marker avatar-marker-next" style="border-color: ${color}; width:30px; height:30px;" />`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const nextMarker = L.marker([person.next_lat, person.next_lng], { icon: nextIcon })
        .addTo(map)
        .bindPopup(`<strong>${person.name}</strong><br>Ab ${formatDate(person.next_from)}: ${person.next_location}`);

      nextMarker.on('click', () => showDetail(person, i));
      markers.push(nextMarker);

      const line = L.polyline(
        [[person.current_lat, person.current_lng], [person.next_lat, person.next_lng]],
        { color, weight: 2, opacity: 0.3, dashArray: '6 8' }
      ).addTo(map);
      routeLines.push(line);
    }
  });
}

// ============================================================
// Sidebar: Team-Liste
// ============================================================
function renderTeamList(filter = '') {
  const list = document.getElementById('team-list');
  const filtered = teamData.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.current_location.toLowerCase().includes(filter.toLowerCase()) ||
    (p.next_location && p.next_location.toLowerCase().includes(filter.toLowerCase()))
  );

  list.innerHTML = filtered.map((person, i) => {
    const idx = teamData.indexOf(person);
    const color = getColor(idx);
    const avatarUrl = person.avatar || generateAvatar(person.name, color);
    return `
      <div class="team-member" onclick="focusPerson(${idx})">
        <img src="${avatarUrl}" class="avatar" style="border-color: ${color}" />
        <div class="member-info">
          <div class="member-name">${person.name}</div>
          ${person.title ? `<div class="member-title">${person.title}</div>` : ''}
          <div class="member-location">📍 ${person.current_location}${person.next_location ? ` → ${person.next_location}` : ''}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// Proximity Alerts
// ============================================================
function findProximityMatches() {
  const matches = [];
  const PROXIMITY_KM = 100;

  for (let i = 0; i < teamData.length; i++) {
    for (let j = i + 1; j < teamData.length; j++) {
      const a = teamData[i];
      const b = teamData[j];

      if (a.next_location && b.next_location) {
        const dist = haversine(a.next_lat, a.next_lng, b.next_lat, b.next_lng);
        if (dist < PROXIMITY_KM) {
          const overlap = dateOverlap(a.next_from, a.next_until, b.next_from, b.next_until);
          if (overlap) {
            matches.push({ a, b, location: a.next_location, from: overlap.from, until: overlap.until });
          }
        }
      }

      if (a.next_location && b.current_location) {
        const dist = haversine(a.next_lat, a.next_lng, b.current_lat, b.current_lng);
        if (dist < PROXIMITY_KM) {
          const overlap = dateOverlap(a.next_from, a.next_until, null, b.current_until);
          if (overlap) {
            matches.push({ a, b, location: a.next_location, from: overlap.from, until: overlap.until });
          }
        }
      }
    }
  }

  return matches;
}

function renderAlerts() {
  const container = document.getElementById('proximity-alerts');
  const matches = findProximityMatches();

  if (matches.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = matches.map(m => `
    <div class="proximity-alert">
      <span class="alert-icon">✨</span>
      <span class="alert-text">
        <strong>${m.a.name}</strong> und <strong>${m.b.name}</strong>
        sind beide in <strong>${m.location}</strong>
        (${formatDate(m.from)} – ${formatDate(m.until)})
      </span>
    </div>
  `).join('');
}

// ============================================================
// Detail-Panel
// ============================================================
function showDetail(person, index) {
  const panel = document.getElementById('person-detail');
  const content = document.getElementById('detail-content');
  const color = getColor(index);
  const avatarUrl = person.avatar || generateAvatar(person.name, color);

  content.innerHTML = `
    <img src="${avatarUrl}" class="detail-avatar" style="border-color: ${color}" />
    <div class="detail-name">${person.name}</div>
    ${person.title ? `<div class="detail-title">${person.title}</div>` : ''}
    <div class="detail-section">
      <div class="detail-label">Aktueller Standort</div>
      <div class="detail-value">📍 ${person.current_location}</div>
      ${person.current_until ? `<div class="detail-value" style="font-size:12px; color:#666; margin-top:2px;">bis ${formatDate(person.current_until)}</div>` : ''}
    </div>
    ${person.next_location ? `
      <div class="detail-section detail-next">
        <div class="detail-label">Nächster Standort</div>
        <div class="detail-value">✈️ ${person.next_location}</div>
        <div class="detail-value" style="font-size:12px; margin-top:2px;">ab ${formatDate(person.next_from)}${person.next_until ? ` bis ${formatDate(person.next_until)}` : ''}</div>
      </div>
    ` : ''}
  `;

  panel.classList.remove('hidden');
}

function focusPerson(index) {
  const person = teamData[index];
  map.flyTo([person.current_lat, person.current_lng], 6, { duration: 1 });
  showDetail(person, index);
}

// ============================================================
// Helpers
// ============================================================
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function dateOverlap(fromA, untilA, fromB, untilB) {
  const startA = fromA ? new Date(fromA) : new Date('2000-01-01');
  const endA = untilA ? new Date(untilA) : new Date('2099-12-31');
  const startB = fromB ? new Date(fromB) : new Date('2000-01-01');
  const endB = untilB ? new Date(untilB) : new Date('2099-12-31');

  const overlapStart = new Date(Math.max(startA, startB));
  const overlapEnd = new Date(Math.min(endA, endB));

  if (overlapStart <= overlapEnd) {
    return { from: overlapStart.toISOString().slice(0, 10), until: overlapEnd.toISOString().slice(0, 10) };
  }
  return null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

// ============================================================
// Events
// ============================================================
document.getElementById('search').addEventListener('input', (e) => {
  renderTeamList(e.target.value);
});

document.getElementById('close-detail').addEventListener('click', () => {
  document.getElementById('person-detail').classList.add('hidden');
});

document.getElementById('theme-switch').addEventListener('change', (e) => {
  applyTheme(e.target.checked);
});

// ============================================================
// Init
// ============================================================
async function init() {
  await loadData();
  renderMap();
  renderTeamList();
  renderAlerts();
}

init();
