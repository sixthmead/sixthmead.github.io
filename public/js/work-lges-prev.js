/* =========================================================
   LG Energy Solution 케이스 스터디 (project-01-v2.html) 전용 인터랙션
   1) [data-reveal]  화면에 들어오면 .is-in → 아래에서 올라오며 나타남
   2) [data-scrub]   큰 문장을 단어로 나눠 스크롤에 따라 하나씩 진해짐
   3) [data-cover]   히어로 커버가 스크롤에 따라 화면 가득 펼쳐짐 (--p 0→1)
   4) [data-speed]   요소마다 다른 속도로 움직이는 패럴랙스
   5) [data-count]   숫자가 0부터 올라감
   6) .lg-dock       하단 챕터 독: 현재 챕터 이름 · 진행률 · 다크 섹션 반전
   - '움직임 줄이기' 설정이면 2~5 는 건너뛰고 결과만 보여 줌
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* 1) 등장 */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
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

  /* 5) 숫자 카운트 */
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const end = Number(el.dataset.count);
        const dur = 1400;
        const t0 = performance.now();
        const tick = (t) => {
          const k = clamp((t - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(end * eased);
          if (k < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* 3 · 4 · 6) 스크롤마다 갱신 */
  const cover = document.querySelector('[data-cover]');
  const coverWrap = cover && cover.parentElement;
  const speeds = [...document.querySelectorAll('[data-speed]')];
  const dock = document.querySelector('.lg-dock');
  const dockLabel = document.querySelector('[data-dock-label]');
  const dockProgress = document.querySelector('[data-dock-progress]');
  const dockLinks = [...document.querySelectorAll('.lg-dock-dots a')];
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const darkSections = [...document.querySelectorAll('[data-dark]')];

  // 메인 페이지 스크롤 무대
  const stage = document.querySelector('[data-stage]');
  const stageImg = document.querySelector('[data-stage-img]');
  const stagePct = document.querySelector('[data-stage-pct]');
  const legend = [...document.querySelectorAll('.lg-stage-legend li')];
  // Figma 메인(1920×8711) 기준 각 구역 시작 y — Hero, Solution, Product, Materials, Global, Next-gen, Newsroom
  const MARKS = [0, 1080, 2160, 2960, 4100, 5861, 7510];
  const MAIN_H = 8711;

  let ticking = false;

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;

    if (!reduce) {
      // 커버: 화면 아래쪽에서 들어와 위쪽 25% 지점에 닿을 때까지 0 → 1
      if (cover) {
        const r = cover.getBoundingClientRect();
        const p = clamp((vh - r.top) / (vh * 0.75));
        coverWrap.style.setProperty('--p', p.toFixed(3));
        cover.style.setProperty('--p', p.toFixed(3));
      }

      // 패럴랙스: 화면 가운데를 기준으로 떨어진 만큼 이동
      speeds.forEach((el) => {
        const r = el.getBoundingClientRect();
        const offset = (r.top + r.height / 2 - vh / 2) * Number(el.dataset.speed);
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      });

      // 단어 스크럽: 문장이 화면 85% → 35% 구간을 지나는 동안 순서대로 켜짐
      scrubs.forEach(({ el, words }) => {
        const r = el.getBoundingClientRect();
        const p = clamp((vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.6));
        const n = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < n));
      });
    }

    // 스크롤 무대: 데스크톱은 고정된 프레임 안에서, 모바일은 지나가는 동안 화면이 흐름
    if (stage && stageImg && stageImg.naturalHeight) {
      const r = stage.getBoundingClientRect();
      const frame = stageImg.parentElement;
      const fh = frame.clientHeight;
      const ih = stageImg.clientHeight;
      const sticky = r.height > vh * 1.5;
      const p = sticky
        ? clamp(-r.top / (r.height - vh))
        : clamp((vh - r.top) / (vh + r.height));
      const shift = Math.max(0, ih - fh) * p;
      stageImg.style.transform = `translate3d(0, ${-shift.toFixed(1)}px, 0)`;
      if (stagePct) stagePct.textContent = `Main — ${Math.round(p * 100)}%`;
      if (legend.length && ih) {
        const at = ((shift + fh * 0.4) / ih) * MAIN_H;
        let idx = 0;
        MARKS.forEach((m, i) => { if (at >= m) idx = i; });
        legend.forEach((li, i) => li.classList.toggle('is-on', i === idx));
      }
    }

    // 독: 히어로를 지나면 나타나고, 맨 아래(다음 작업)에서 숨음
    if (dock) {
      const max = document.documentElement.scrollHeight - vh;
      const total = clamp(y / max);
      const nextEl = document.querySelector('.lg-next');
      const nearEnd = nextEl && nextEl.getBoundingClientRect().top < vh * 0.7;
      dock.classList.toggle('is-visible', y > vh * 0.6 && !nearEnd);
      dockProgress.style.setProperty('--progress', total.toFixed(3));

      // 현재 챕터 = 화면 40% 선을 지나고 있는 섹션
      const line = vh * 0.4;
      let current = chapters[0];
      chapters.forEach((c) => {
        if (c.getBoundingClientRect().top <= line) current = c;
      });
      if (current) {
        const idx = chapters.indexOf(current);
        const name = current.dataset.chapter;
        const label = idx > 0 ? `${String(idx).padStart(2, '0')} — ${name}` : name;
        if (dockLabel.textContent !== label) dockLabel.textContent = label;
        dockLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${current.id}`));
      }

      // 독이 다크 섹션 위에 있으면 색 반전
      const dockY = vh - 40;
      const onDark = darkSections.some((s) => {
        const r = s.getBoundingClientRect();
        return r.top < dockY && r.bottom > dockY;
      });
      dock.classList.toggle('is-dark', onDark);
    }
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (reduce) scrubs.forEach(({ words }) => words.forEach((w) => w.classList.add('on')));
  if (stageImg) stageImg.addEventListener('load', update);
  update();
})();
