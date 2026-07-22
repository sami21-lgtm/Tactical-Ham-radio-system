// ==========================================
// 1. LIVE CLOCKS (UTC & LOCAL)
// ==========================================
function updateClocks() {
  const now = new Date();
  const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };

  // UTC Time
  const utcHours = String(now.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
  const utcSeconds = String(now.getUTCSeconds()).padStart(2, '0');
  document.getElementById('utc-time').textContent = `${utcHours}:${utcMinutes}:${utcSeconds}`;
  document.getElementById('utc-date').textContent = now.toLocaleDateString('en-US', { ...dateOptions, timeZone: 'UTC' });

  // Local Time
  const localHours = String(now.getHours()).padStart(2, '0');
  const localMinutes = String(now.getMinutes()).padStart(2, '0');
  const localSeconds = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('local-time').textContent = `${localHours}:${localMinutes}:${localSeconds}`;
  document.getElementById('local-date').textContent = now.toLocaleDateString('en-US', dateOptions);
}

setInterval(updateClocks, 1000);
updateClocks();

// ==========================================
// 2. LIVE WEATHER API (Open-Meteo - Free, No Key)
// Location: GA, USA (33.9501°N, 84.2650°W)
// ==========================================
async function fetchWeather() {
  const lat = 33.9501;
  const lon = -84.2650;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const current = data.current;
    document.getElementById('temp-val').textContent = Math.round(current.temperature_2m);
    document.getElementById('humidity-val').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-val').textContent = `${Math.round(current.wind_speed_10m)} mph`;

    // Simple Weather Code mapping
    const code = current.weather_code;
    let condition = "Clear Sky";
    let icon = "☀️";

    if (code >= 1 && code <= 3) { condition = "Partly Cloudy"; icon = "⛅"; }
    else if (code >= 51 && code <= 67) { condition = "Light Rain"; icon = "🌧️"; }
    else if (code >= 80 && code <= 99) { condition = "Showers/Storm"; icon = "⛈️"; }

    document.getElementById('weather-condition').textContent = condition;
    document.getElementById('weather-icon').textContent = icon;

  } catch (err) {
    console.error("Error fetching weather:", err);
    document.getElementById('weather-condition').textContent = "Weather Unavailable";
  }
}

fetchWeather();
setInterval(fetchWeather, 300000); // 5 মিনিট পর পর আপডেট হবে

// ==========================================
// 3. LIVE SPACE WEATHER & KP INDEX API (NOAA SWPC)
// ==========================================
async function fetchSolarData() {
  const kpUrl = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";

  try {
    const response = await fetch(kpUrl);
    const data = await response.json();
    
    // Get last valid Kp index value from array
    const latestEntry = data[data.length - 1];
    const kpIndex = latestEntry[1];

    document.getElementById('kp-val').textContent = kpIndex;
    document.getElementById('k-gauge-val').textContent = kpIndex;

    // Change Kp color dynamically based on storm levels
    const kpElement = document.getElementById('kp-val');
    if (kpIndex >= 5) kpElement.style.color = '#ef4444'; // Red (Geomagnetic Storm)
    else if (kpIndex >= 3) kpElement.style.color = '#eab308'; // Yellow
    else kpElement.style.color = '#22c55e'; // Green

  } catch (err) {
    console.error("Error fetching solar data:", err);
  }
}

fetchSolarData();
setInterval(fetchSolarData, 600000); // ১০ মিনিট পর পর আপডেট হবে

// Dropdown Change Event for NASA SDO Live Image
document.getElementById('sdo-select').addEventListener('change', function(e) {
  const imgFileName = e.target.value;
  document.getElementById('sdo-img').src = `https://sdo.gsfc.nasa.gov/assets/img/latest/${imgFileName}`;
});

// ==========================================
// 4. LIVE NOAA SWPC ALERTS TICKER API
// ==========================================
async function fetchNOAAAlerts() {
  const alertUrl = "https://services.swpc.noaa.gov/products/alerts.json";

  try {
    const response = await fetch(alertUrl);
    const data = await response.json();

    if (data && data.length > 0) {
      // Extract last 3 latest alerts
      const recentAlerts = data.slice(-3).map(a => a.message.split('\n')[0]).join('  ||  ');
      document.getElementById('alert-ticker').textContent = recentAlerts;
    }
  } catch (err) {
    console.error("Error fetching alerts:", err);
    document.getElementById('alert-ticker').textContent = "Active DXpeditions, current solar conditions, and NOAA SWPC live tracking operational.";
  }
}

fetchNOAAAlerts();

// ==========================================
// 5. INTERACTIVE MAP (Leaflet.js)
// ==========================================
const map = L.map('map', {
  center: [30, -40],
  zoom: 3,
  zoomControl: true,
  attributionControl: false
});

// Dark Theme Basemap Tiles (CartoDB Dark Matter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  subdomains: 'abcd'
}).addTo(map);

// Live Spots / Contacts Array
const spots = [
  { coords: [33.9501, -84.2650], label: "NOWRL (Home Base)", color: "#ef4444" },
  { coords: [48.8566, 2.3522], label: "EU Spot: Paris (20m FT8)", color: "#38bdf8" },
  { coords: [51.5074, -0.1278], label: "EU Spot: London (40m CW)", color: "#22c55e" },
  { coords: [-23.5505, -46.6333], label: "SA Spot: Sao Paulo (10m SSB)", color: "#eab308" }
];

// Add Markers
spots.forEach(spot => {
  L.circleMarker(spot.coords, {
    radius: 6,
    color: spot.color,
    fillColor: spot.color,
    fillOpacity: 0.8
  }).addTo(map).bindPopup(`<b>${spot.label}</b>`);
});

// Draw Radio Propagation Signal Lines
const signalLines = [
  [[33.9501, -84.2650], [48.8566, 2.3522]],
  [[33.9501, -84.2650], [-23.5505, -46.6333]]
];

signalLines.forEach(line => {
  L.polyline(line, {
    color: '#ef4444',
    weight: 1.5,
    opacity: 0.7,
    dashArray: '5, 5'
  }).addTo(map);
});

