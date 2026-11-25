/* =========================================================
   Goodiez 케이스 스터디 (project-04.html) 전용 인터랙션 — work-gut.js 와 같은 구조, 이미지 경로 · 화면 띠만 다름
   1) [data-reveal]        화면에 들어오면 .is-in → 아래에서 올라오며 나타남
   2) [data-scrub]         큰 문장을 단어로 나눠 스크롤에 따라 하나씩 진해짐
   3) .gm-phone--scroll    긴 화면을 폰 프레임 안에서 위아래로 천천히 스크롤
   4) [data-intro]         인트로 4장 전환 (탭 + 자동 재생)
   5) [data-speed]         패럴랙스
   6) [data-count]         숫자 카운트
   7) [data-wall]          하단 화면 띠 채우기
   - '움직임 줄이기' 설정이면 움직임은 건너뛰고 결과만 보여 줌
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const hasIO = 'IntersectionObserver' in window;
  const IMG = '../images/work/project-04/screens/';

  /* 7) 화면 띠: 두 줄, 각 줄을 두 번 반복해 끊김 없이 흐르게 */
  const WALL = [
    ['home-light', 'game-detail', 'ask-review', 'profile', 'signin', 'selling-detail', 'game-condition', 'bid'],
    ['home-dark', 'search-market', 'verification', 'buy-confirm', 'ask-listing', 'popup-push', 'home-full', 'ask-listing-error'],
  ];
  document.querySelectorAll('[data-wall]').forEach((row, i) => {
    const list = WALL[i % WALL.length];
    const html = list.map((n) => `<figure class="gm-phone" aria-hidden="true"><div class="gm-phone-screen"><img src="${IMG}${n}.png" alt="" loading="lazy"></div></figure>`).join('');
    row.innerHTML = html + html;
  });

  /* 1) 등장 */
  const revealEls = document.querySelectorAll('[data-reveal], [data-progress]');
  if (hasIO && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* 2) 단어 스크럽 준비 */
  const scrubs = [...document.querySelectorAll('[data-scrub]')].map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    return { el, words: [...el.querySelectorAll('.w')] };
  });
  if (reduce) scrubs.forEach(({ words }) => words.forEach((w) => w.classList.add('on')));

  /* 3) 긴 화면 스크롤: 이미지 높이 - 프레임 높이 만큼 이동, 길이에 비례한 시간 */
  const scrollPhones = [...document.querySelectorAll('.gm-phone--scroll')];
  const measure = (fig) => {
    const screen = fig.querySelector('.gm-phone-screen');
    const img = screen && screen.querySelector('img');
    if (!img || !img.naturalHeight) return;
    // 하단에 고정한 내비게이션(.gm-nav)이 있으면 그 높이만큼 더 내려서
    // 스크린샷 맨 아래 내용이 내비게이션에 가려지지 않게 함
    const nav = screen.querySelector('.gm-nav');
    const navH = nav ? nav.offsetHeight : 0;
    const dist = Math.max(0, img.clientHeight + navH - screen.clientHeight);
    const speed = fig.classList.contains('gm-phone--slow') ? 45 : 60; // px/s
    fig.style.setProperty('--dist', `${dist}px`);
    // 0.6 = 흐르는 속도 비율 (1 이면 원래 속도, 작을수록 느림)
    fig.style.setProperty('--dur', `${(Math.max(4, dist / speed) / 0.6).toFixed(1)}s`);
  };
  scrollPhones.forEach((fig) => {
    const img = fig.querySelector('img');
    if (!img) return;
    if (img.complete) measure(fig);
    else img.addEventListener('load', () => measure(fig), { once: true });
  });
  window.addEventListener('resize', () => scrollPhones.forEach(measure));

  if (hasIO && !reduce) {
    const pio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        measure(e.target);
        e.target.classList.toggle('is-play', e.isIntersecting);
      });
    }, { threshold: 0.25 });
    scrollPhones.forEach((fig) => pio.observe(fig));
  }

  /* 4) 인트로 전환 */
  const introPhone = document.querySelector('[data-intro-phone]');
  const introTabs = [...document.querySelectorAll('[data-intro]')];
  if (introPhone && introTabs.length) {
    const slides = [...introPhone.querySelectorAll('.gm-phone-screen img')];
    let cur = 0;
    let timer = null;
    const go = (i) => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-on', k === cur));
      introTabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === cur)));
    };
    const play = () => {
      if (reduce) return;
      clearInterval(timer);
      timer = setInterval(() => go(cur + 1), 2600);
    };
    introTabs.forEach((t) => t.addEventListener('click', () => {
      go(Number(t.dataset.intro));
      play();
    }));
    if (hasIO) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? play() : clearInterval(timer)));
      }, { threshold: 0.3 }).observe(introPhone);
    }
  }

  /* 6) 숫자 카운트 */
  const counters = document.querySelectorAll('[data-count]');
  if (hasIO && !reduce) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const end = Number(el.dataset.count);
        const t0 = performance.now();
        const tick = (t) => {
          const k = clamp((t - t0) / 1400);
          el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4)));
          if (k < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* 2 · 5) 스크롤마다 갱신 */
  const speeds = [...document.querySelectorAll('[data-speed]')];
  let ticking = false;
  const update = () => {
    ticking = false;
    if (reduce) return;
    const vh = window.innerHeight;
    const wide = window.innerWidth >= 1024;

    speeds.forEach((el) => {
      if (!wide) { el.style.translate = ''; return; }
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - vh / 2) * Number(el.dataset.speed);
      el.style.translate = `0 ${offset.toFixed(1)}px`;
    });

    scrubs.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.6));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    });
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
