// Navigation scroll handling
const container = document.getElementById('scroll-container');
document.querySelectorAll('#main-nav a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
  });
});

// Leaflet map setup
const map = L.map('map', {
  zoomControl: true,
  scrollWheelZoom: false
}).setView([20, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load GeoJSON
fetch('data/final_cities_v2_world_map.geojson')
  .then(r => r.json())
  .then(data => {
    L.geoJSON(data, {
      style: () => ({ color: '#e91e63', weight: 1, fillOpacity: 0.6 }),
      onEachFeature: (feature, layer) => {
        const name = feature.properties.name || 'Location';
        layer.bindPopup(`<strong>${name}</strong>`);
      }
    }).addTo(map);
  });

// Load personas for teaser
fetch('data/persona_profiles.json')
  .then(r => r.json())
  .then(data => {
    window.__personas = data;
    const personas = Object.values(data);
    document.getElementById('total-count').textContent = personas.length;
    const listEl = document.getElementById('persona-list');
    personas.forEach(p => {
      const card = document.createElement('div');
      card.className = 'persona-card';
      card.innerHTML = `<h3>${p.name}</h3><p>${p.description}</p><p><em>${p.percentage.toFixed(1)}%</em></p>`;
      listEl.append(card);
    });
    const dominant = personas.reduce((a,b) => a.percentage > b.percentage ? a : b);
    document.getElementById('dominant-blurb').textContent =
      `The majority—nearly ${dominant.percentage.toFixed(1)}%—are ${dominant.name}.`;
  });

// Quiz logic
let questions = [], current = 0, score = 0;
fetch('data/questions.json')
  .then(r => r.json())
  .then(d => { questions = d; });

const qEl = document.getElementById('quiz-question');
const aEl = document.getElementById('quiz-answers');
const nextBtn = document.getElementById('next-btn');

function showQuestion(idx) {
  const q = questions[idx];
  qEl.textContent = q.text;
  aEl.innerHTML = '';
  q.options.forEach((opt,i) => {
    const li = document.createElement('li');
    li.textContent = opt;
    li.onclick = () => {
      score += q.scores[i];
      aEl.querySelectorAll('li').forEach(x => x.classList.remove('selected'));
      li.classList.add('selected');
      nextBtn.classList.remove('hidden');
    };
    aEl.append(li);
  });
  nextBtn.classList.add('hidden');
}

nextBtn.onclick = () => {
  current++;
  if (current < questions.length) {
    showQuestion(current);
  } else {
    const personas = Object.values(window.__personas || {});
    const match = personas.sort((a,b) =>
      Math.abs(score - a.features.fear_index) - Math.abs(score - b.features.fear_index)
    )[0];
    document.getElementById('quiz-slide').innerHTML = `<h2>Your Persona:</h2><p><strong>${match.name}</strong></p><a href="#analysis-embed">See full analysis →</a>`;
  }
};

document.getElementById('start-quiz').onclick = () => {
  container.scrollTo({ top: document.getElementById('quiz-slide').offsetTop, behavior: 'smooth' });
  showQuestion(0);
};