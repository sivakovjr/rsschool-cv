
(function initSlider() {
  const track = document.getElementById('sliderTrack');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');

  if (!track || !prevBtn || !nextBtn) return;

  let currentIndex = 0;

  function getSlideWidth() {
    const word = track.querySelector('.slider-word');
    const image = track.querySelector('.slider-image');
    if (!word || !image) return 0;
    const gap = 20;
    return word.offsetWidth + gap + image.offsetWidth + gap;
  }

  function getMaxIndex() {
    const words = track.querySelectorAll('.slider-word');
    return Math.max(0, words.length - 1);
  }

  function updateSlider() {
    const slideWidth = getSlideWidth();
    track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    prevBtn.style.opacity = currentIndex === 0 ? '0.4' : '1';
    nextBtn.style.opacity = currentIndex >= getMaxIndex() ? '0.4' : '1';
  }

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSlider();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < getMaxIndex()) {
      currentIndex++;
      updateSlider();
    }
  });

  updateSlider();
})();


(function initCountdown() {
  const daysEl = document.getElementById('timerDays');
  const hoursEl = document.getElementById('timerHours');
  const minutesEl = document.getElementById('timerMinutes');
  const secondsEl = document.getElementById('timerSeconds');

  if (!daysEl) return;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function getNextNewYear() {
    const now = new Date();
    return new Date(now.getFullYear() + 1, 0, 1);
  }

  function tick() {
    const now = new Date();
    const target = getNextNewYear();
    const diff = target - now;

    if (diff <= 0) return;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  tick();
  setInterval(tick, 1000);
})();


(function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const cards = document.querySelectorAll('.gift-card[data-category]');

  if (!tabs.length || !cards.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('tab--active')) return;

      tabs.forEach(t => {
        t.classList.remove('tab--active');
        t.setAttribute('aria-selected', 'false');
      });

      tab.classList.add('tab--active');
      tab.setAttribute('aria-selected', 'true');

      const filter = tab.dataset.filter;

      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
})();
