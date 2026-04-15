document.addEventListener('DOMContentLoaded', () => {

  const isGiftsPage = window.location.pathname.includes('gifts');
  const basePath = isGiftsPage ? '../assets/' : './assets/';
  const jsonPath = basePath + 'gifts.json';

  // ==========================================
  // 1. БУРГЕР-МЕНЮ
  // ==========================================
  (function initBurger() { 
    const burger = document.getElementById('burger'); 
    const nav = document.getElementById('nav'); 
    if (!burger || !nav) return; 

    const navLinks = nav.querySelectorAll('a');

    function closeBurger() {
      nav.classList.remove('nav--open');
      burger.setAttribute('aria-expanded', 'false');
      burger.classList.remove('burger--active'); 
      document.body.style.overflow = ''; 
    }

    burger.addEventListener('click', () => { 
      nav.classList.toggle('nav--open'); 
      const isOpen = nav.classList.contains('nav--open'); 
      burger.setAttribute('aria-expanded', isOpen); 
      burger.classList.toggle('burger--active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : ''; 
    }); 

    navLinks.forEach(link => link.addEventListener('click', closeBurger));
    window.addEventListener('resize', () => { if (window.innerWidth > 768) closeBurger(); });
  })();

  // ==========================================
  // 2. СЛАЙДЕР
  // ==========================================
  (function initSlider() {
    const track = document.getElementById('sliderTrack');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    if (!track || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    function getMaxClicks() { return window.innerWidth > 768 ? 3 : 6; }

    function updateSlider() {
      const maxClicks = getMaxClicks();
      if (currentIndex > maxClicks) currentIndex = maxClicks;
      const wrapper = track.parentElement; 
      const maxScroll = track.scrollWidth - wrapper.clientWidth;
      const step = maxScroll / maxClicks;
      track.style.transform = `translateX(-${currentIndex * step}px)`;
      prevBtn.style.opacity = currentIndex === 0 ? '0.4' : '1';
      prevBtn.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
      nextBtn.style.opacity = currentIndex === maxClicks ? '0.4' : '1';
      nextBtn.style.pointerEvents = currentIndex === maxClicks ? 'none' : 'auto';
    }

    prevBtn.addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; updateSlider(); } });
    nextBtn.addEventListener('click', () => { if (currentIndex < getMaxClicks()) { currentIndex++; updateSlider(); } });
    window.addEventListener('resize', () => { currentIndex = 0; updateSlider(); });
    setTimeout(updateSlider, 100);
  })();

  // ==========================================
  // 3. ТАЙМЕР
  // ==========================================
  (function initCountdown() {
    const daysEl = document.getElementById('timerDays');
    const hoursEl = document.getElementById('timerHours');
    const minutesEl = document.getElementById('timerMinutes');
    const secondsEl = document.getElementById('timerSeconds');
    if (!daysEl) return;

    function tick() {
      const now = new Date();
      const nextYear = now.getUTCFullYear() + 1;
      const target = new Date(Date.UTC(nextYear, 0, 1, 0, 0, 0)); 
      const diff = target - now;
      if (diff <= 0) return;
      daysEl.textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
      hoursEl.textContent = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      minutesEl.textContent = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      secondsEl.textContent = Math.floor((diff % (1000 * 60)) / 1000);
    }
    tick(); setInterval(tick, 1000);
  })();

  // ==========================================
  // 4. МОДАЛЬНОЕ ОКНО
  // ==========================================
  function getCategoryWord(categoryStr) {
    return categoryStr.toLowerCase().replace('for ', '').trim();
  }

  function openModal(gift) {
    const categoryWord = getCategoryWord(gift.category);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay'; 
    
    function generateStars(value) {
      const cleanValue = value.toString().replace(/\+/g, '');
      const activeCount = parseInt(cleanValue) / 100;
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        const isInactive = i > activeCount ? 'class="star-inactive"' : '';
        starsHtml += `<img src="${basePath}snowflake.svg" ${isInactive} alt="snowflake">`;
      }
      return starsHtml;
    }

    const powers = gift.superpowers;
    const items = [
      { name: 'Live', val: powers.live.toString().replace(/\+/g, '') },
      { name: 'Create', val: powers.create.toString().replace(/\+/g, '') },
      { name: 'Love', val: powers.love.toString().replace(/\+/g, '') },
      { name: 'Dream', val: powers.dream.toString().replace(/\+/g, '') }
    ];

    let listHtml = '';
    items.forEach(item => {
      listHtml += `
        <li>
          <span class="sp-name">${item.name}</span> 
          <span class="sp-value">
            +${item.val}
            <div class="sp-stars">${generateStars(item.val)}</div>
          </span>
        </li>`;
    });

    overlay.innerHTML = `
      <div class="modal">
        <button class="modal-close">×</button>
        <div class="modal-img-wrapper">
          <img src="${basePath}gift-${categoryWord}.png" alt="${gift.category}">
        </div>
        <div class="modal-content">
          <span class="gift-card__tag gift-card__tag--${categoryWord}">${gift.category}</span>
          <h3 class="gift-title">${gift.name}</h3>
          <p class="gift-description">${gift.description}</p>
          <div class="gift-superpowers">
            <h4 class="superpowers-title">Adds superpowers to:</h4>
            <ul>${listHtml}</ul>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden'; 
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('modal-close')) {
        overlay.remove();
        document.body.style.overflow = '';
      }
    });
  }

  // ==========================================
  // 5. ГЕНЕРАЦИЯ КАРТОЧЕК
  // ==========================================
  function createCardElement(gift) {
    const card = document.createElement('div');
    card.className = 'gift-card'; 
    const categoryWord = getCategoryWord(gift.category);
    
    card.innerHTML = `
      <div class="gift-card__image">
        <img src="${basePath}gift-${categoryWord}.png" alt="${gift.category}">
      </div>
      <div class="gift-card__info">
        <span class="gift-card__tag gift-card__tag--${categoryWord}">${gift.category}</span>
        <span class="gift-card__name">${gift.name}</span>
      </div>`;
    card.addEventListener('click', () => openModal(gift));
    return card;
  }

  function renderCards(giftsArray, container) {
    if (!container) return;
    container.innerHTML = ''; 
    giftsArray.forEach(gift => container.appendChild(createCardElement(gift)));
  }

  fetch(jsonPath) 
    .then(res => res.json())
    .then(data => {
      const bestGiftsContainer = document.querySelector('.best-gifts__grid'); 
      const allGiftsContainer = document.querySelector('.gifts-grid'); 
      if (bestGiftsContainer) renderCards([...data].sort(() => 0.5 - Math.random()).slice(0, 4), bestGiftsContainer);
      if (allGiftsContainer) { renderCards(data, allGiftsContainer); initTabs(data, allGiftsContainer); }
    })
    .catch(err => console.error(err));

  function initTabs(giftsData, container) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('tab--active')) return;
        tabs.forEach(t => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');
        const filter = tab.dataset.filter; 
        const filtered = filter === 'all' ? giftsData : giftsData.filter(g => getCategoryWord(g.category) === filter.toLowerCase());
        renderCards(filtered, container);
      });
    });
  }
});