/* =========================================================
   Good Neighbors 케이스 스터디 (good-neighbors.html) 전용 인터랙션
   - work-gdz.js 와 같은 구조 + 이 작업에만 있는 것(컬러 코드 복사 · 서체 굵기 전환)
   1) [data-reveal]       화면에 들어오면 .is-in → 아래에서 올라오며 나타남
   2) [data-scrub]        큰 문장을 단어로 나눠 스크롤에 따라 하나씩 진해짐
   3) [data-autoscroll]   긴 페이지를 프레임(브라우저 · 폰 · 태블릿) 안에서 위아래로 천천히 스크롤
   4) [data-count]        숫자 카운트
   6) [data-weights]      서체 굵기 전환 (Light · Regular · Medium · Bold)
   - '움직임 줄이기' 설정이면 움직임은 건너뛰고 결과만 보여 줌
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const hasIO = 'IntersectionObserver' in window;

  /* 1) 등장 */
  const revealEls = document.querySelectorAll('[data-reveal]');
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

  /* 3) 자동 스크롤: (이미지 높이 - 프레임 높이) 만큼 이동, 길이에 비례한 시간 */
  const SCREEN = '.gn-browser-screen, .gm-phone-screen, .gn-tablet-screen';
  const scrollers = [...document.querySelectorAll('[data-autoscroll]')];
  const measure = (fig) => {
    const screen = fig.querySelector(SCREEN);
    const img = screen && screen.querySelector('img');
    if (!img || !img.naturalHeight) return;
    const dist = Math.max(0, img.clientHeight - screen.clientHeight);
    const speed = Number(fig.dataset.autoscroll) || 70; // px/s
    fig.style.setProperty('--dist', `${dist}px`);
    // 0.6 = 흐르는 속도 비율 (1 이면 원래 속도, 작을수록 느림)
    fig.style.setProperty('--dur', `${(Math.max(5, dist / speed) / 0.6).toFixed(1)}s`);
  };
  scrollers.forEach((fig) => {
    const img = fig.querySelector(`${SCREEN.split(',').map((s) => `${s.trim()} img`).join(',')}`);
    if (!img) return;
    if (img.complete) measure(fig);
    else img.addEventListener('load', () => measure(fig), { once: true });
  });
  window.addEventListener('resize', () => scrollers.forEach(measure));
  if (hasIO && !reduce) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        measure(e.target);
        e.target.classList.toggle('is-play', e.isIntersecting);
      });
    }, { threshold: 0.25 });
    scrollers.forEach((fig) => sio.observe(fig));
  }

  /* 4) 숫자 카운트 */
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

  /* 6) 서체 굵기 전환 */
  document.querySelectorAll('[data-weights]').forEach((group) => {
    const stage = document.querySelector(group.dataset.weights);
    const btns = [...group.querySelectorAll('button')];
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (stage) stage.style.setProperty('--wt', b.dataset.wt);
    }));
  });

  /* 2) 스크롤마다 갱신 */
  let ticking = false;
  const update = () => {
    ticking = false;
    if (reduce) return;
    const vh = window.innerHeight;
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
