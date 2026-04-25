/* ===== Config ===== */
const GH_USER = "kelfy87";
const GH_PROFILE = `https://github.com/${GH_USER}`;
const GH_API_USER = `https://api.github.com/users/${GH_USER}`;
const GH_API_REPOS = `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`;

/* ===== Loader ===== */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hide'), 900);
});

/* ===== 3D tilt ===== */
const tilt = document.getElementById('tilt');
const card = document.getElementById('card');

tilt.addEventListener('mousemove', (e) => {
  const r = tilt.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;
  const rotY = (px - 0.5) * 18;
  const rotX = (0.5 - py) * 18;
  const tX = (px - 0.5) * 10;
  const tY = (py - 0.5) * 10;
  card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translate3d(${tX}px, ${tY}px, 0)`;
});

tilt.addEventListener('mouseleave', () => {
  card.style.transform = 'rotateX(0deg) rotateY(0deg) translate3d(0,0,0)';
});

/* ===== Music ===== */
const audio = document.getElementById('audio');
const musicBtn = document.getElementById('musicBtn');
const eq = document.getElementById('eq');
const musicHint = document.getElementById('musicHint');
const volumeSlider = document.getElementById('volumeSlider');

let playing = false;
let musicReady = false;

function setMusicState(state, text){
  playing = state;
  eq.classList.toggle('playing', state);
  musicBtn.classList.toggle('is-playing', state);
  musicBtn.setAttribute('aria-pressed', String(state));
  musicHint.textContent = text || (state ? 'Выключить' : 'Включить');
}

let savedVolume = 80;
try{
  savedVolume = Number(localStorage.getItem('musicVolume'));
}catch(error){
  savedVolume = 80;
}
const initialVolume = Number.isFinite(savedVolume) ? savedVolume : 80;
volumeSlider.value = String(initialVolume);
audio.volume = initialVolume / 100;

audio.addEventListener('canplay', () => {
  musicReady = true;
  if(!playing) setMusicState(false, 'Включить');
});
audio.addEventListener('playing', () => setMusicState(true));
audio.addEventListener('pause', () => setMusicState(false));
audio.addEventListener('ended', () => setMusicState(false));
audio.addEventListener('error', () => {
  musicReady = false;
  setMusicState(false, 'Файл не найден');
});

musicBtn.addEventListener('click', async () => {
  if(playing){
    audio.pause();
    return;
  }

  try{
    setMusicState(false, musicReady ? 'Запускаю...' : 'Загружаю...');
    audio.muted = false;
    await audio.play();
  }catch(error){
    setMusicState(false, 'Нажми еще раз');
  }
});

volumeSlider.addEventListener('input', () => {
  const volume = Number(volumeSlider.value);
  audio.volume = volume / 100;
  try{
    localStorage.setItem('musicVolume', String(volume));
  }catch(error){
    // Громкость все равно меняется, даже если браузер запретил сохранение.
  }
  if(volume === 0){
    setMusicState(playing, 'Без звука');
  }else if(!playing){
    setMusicState(false, 'Включить');
  }
});

/* ===== Smooth page navigation ===== */
const navLinks = [...document.querySelectorAll('.nav a[data-target]')];
const pageSections = [...document.querySelectorAll('[data-section]')];

function scrollToSection(id){
  const section = document.getElementById(id);
  if(!section) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
}

function setActiveNav(id){
  for(const link of navLinks){
    link.classList.toggle('active', link.dataset.target === id);
  }
}

for(const link of navLinks){
  link.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToSection(link.dataset.target);
    setActiveNav(link.dataset.target);
  });
}

if('IntersectionObserver' in window){
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    for(const entry of entries){
      if(entry.isIntersecting) entry.target.classList.add('visible');
    }

    if(visible){
      setActiveNav(visible.target.id);
    }
  }, {
    rootMargin: '-20% 0px -55% 0px',
    threshold: [0.15, 0.3, 0.6]
  });

  for(const section of pageSections){
    sectionObserver.observe(section);
  }
}else{
  for(const section of pageSections){
    section.classList.add('visible');
  }
}

document.getElementById('links')?.classList.add('visible');
setActiveNav(location.hash.replace('#', '') || 'links');

/* ===== GitHub data ===== */
const avatarImg = document.getElementById('avatarImg');

function setNick(text){
  document.getElementById('uNick').textContent = text;
  document.getElementById('brandTitle').textContent = text;
  document.getElementById('aboutNick').textContent = text;
  document.getElementById('footerNick').textContent = text;

  const heroNick = document.getElementById('heroNick');
  heroNick.textContent = text;
  heroNick.setAttribute('data-text', text);
}

document.getElementById('profileUrl').textContent = GH_PROFILE;
document.getElementById('openGitHubBtn').onclick = () => window.open(GH_PROFILE, '_blank');
document.getElementById('scrollReposBtn').onclick = () => scrollToSection('repos');
document.getElementById('btnProfile').onclick = () => window.open(GH_PROFILE, '_blank');
document.getElementById('btnRepos').onclick = () => window.open(`${GH_PROFILE}?tab=repositories`, '_blank');

async function loadGitHub(){
  try{
    const userResponse = await fetch(GH_API_USER, { headers: { Accept: 'application/vnd.github+json' } });
    if(!userResponse.ok) throw new Error('user fetch failed');
    const user = await userResponse.json();

    setNick(user.login || GH_USER);

    if(user.avatar_url){
      avatarImg.src = user.avatar_url;
      avatarImg.alt = `${user.login} avatar`;
    }

    document.getElementById('heroBio').textContent =
      user.bio || 'Профиль GitHub в черно-красном неоне. Репозитории, статистика и быстрые ссылки.';

    document.getElementById('stRepos').textContent = `${user.public_repos ?? '—'}`;
    document.getElementById('stFollowers').textContent = `${user.followers ?? '—'}`;
    document.getElementById('stFollowing').textContent = `${user.following ?? '—'}`;
    document.getElementById('stLocation').textContent = user.location || '—';
    document.getElementById('stCompany').textContent = user.company || '—';
    document.getElementById('stBlog').textContent = (user.blog || '').trim() || '—';

    const reposResponse = await fetch(GH_API_REPOS, { headers: { Accept: 'application/vnd.github+json' } });
    if(!reposResponse.ok) throw new Error('repos fetch failed');
    const repos = await reposResponse.json();

    const top = repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, 8);

    const repoList = document.getElementById('repoList');
    repoList.innerHTML = '';

    if(!top.length){
      repoList.innerHTML = `
        <div class="item">
          <b>Пока нет топ-репозиториев</b>
          <span>Или все публичные репозитории являются форками.</span>
        </div>`;
      return;
    }

    for(const repo of top){
      const lang = repo.language || '—';
      const stars = repo.stargazers_count ?? 0;
      const forks = repo.forks_count ?? 0;
      const updated = repo.updated_at ? new Date(repo.updated_at).toLocaleDateString('ru-RU') : '—';
      const desc = repo.description || 'Описание не добавлено.';

      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `
        <div class="repo">
          <b><a href="${repo.html_url}" target="_blank" rel="noreferrer">${repo.name}</a></b>
          <span>${desc}</span>
          <div class="meta">
            <span class="badge">★ ${stars}</span>
            <span class="badge">Forks ${forks}</span>
            <span class="badge">${lang}</span>
            <span class="badge">${updated}</span>
          </div>
        </div>`;
      repoList.appendChild(item);
    }
  }catch(error){
    document.getElementById('repoList').innerHTML = `
      <div class="item">
        <b>Не удалось загрузить GitHub-данные</b>
        <span>Проверь интернет или лимит GitHub API. Локальный аватар skin.png останется на месте.</span>
      </div>`;
  }
}

loadGitHub();

/* ===== Canvas space stars ===== */
const canvas = document.getElementById('space');
const ctx = canvas.getContext('2d');

let W;
let H;
let stars;
let mouse = { x: null, y: null };

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX * devicePixelRatio;
  mouse.y = e.clientY * devicePixelRatio;
});

window.addEventListener('mouseleave', () => {
  mouse.x = null;
  mouse.y = null;
});

function rand(a, b){
  return a + Math.random() * (b - a);
}

function clamp(n, min, max){
  return Math.max(min, Math.min(max, n));
}

function initStars(){
  const count = Math.floor((window.innerWidth * window.innerHeight) / 9000);
  stars = new Array(count).fill(0).map(() => ({
    x: rand(0, W),
    y: rand(0, H),
    r: rand(0.6, 2.2) * devicePixelRatio,
    s: rand(0.15, 0.75) * devicePixelRatio,
    a: rand(0.15, 0.9),
    tw: rand(0, Math.PI * 2)
  }));
}

function resize(){
  W = canvas.width = window.innerWidth * devicePixelRatio;
  H = canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  initStars();
}

window.addEventListener('resize', resize);

function draw(){
  ctx.clearRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.5, H * 0.15, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
  glow.addColorStop(0, 'rgba(255,27,61,0.06)');
  glow.addColorStop(0.45, 'rgba(214,10,44,0.03)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  for(const star of stars){
    const dx = mouse.x ? mouse.x - star.x : 0;
    const dy = mouse.y ? mouse.y - star.y : 0;
    const d = Math.hypot(dx, dy) || 9999;

    if(d < 220 * devicePixelRatio){
      star.x += dx / d * 0.35 * devicePixelRatio;
      star.y += dy / d * 0.35 * devicePixelRatio;
    }

    star.y += star.s;
    star.x += star.s * 0.12;

    if(star.y > H + 10) star.y = -10;
    if(star.x > W + 10) star.x = -10;

    star.tw += 0.03;
    const twinkle = (Math.sin(star.tw) + 1) / 2;
    const alpha = clamp(star.a * (0.6 + twinkle * 0.7), 0.05, 1);

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();

    if(star.r > 1.6 * devicePixelRatio){
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,27,61,${alpha * 0.10})`;
      ctx.fill();
    }
  }

  requestAnimationFrame(draw);
}

resize();
draw();
