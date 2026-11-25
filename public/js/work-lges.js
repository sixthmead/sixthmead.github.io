/* =========================================================
   LG 에너지솔루션 케이스 스터디 (project-01.html) 전용 인터랙션
   - 일부러 최소한만: 움직임은 정보를 돕는 곳에만
   1) [data-reveal]      화면에 들어오면 .is-in → 살짝 올라오며 나타남
   2) [data-autoscroll]  브라우저 목업이 지나가는 동안 안의 메인 페이지가 위로 흐름
   3) [data-swatch]      아이콘 컬러 버튼 → 같은 순서의 이미지로 교체 (좌우 화살표로도 이동)
   - 하단 챕터 독은 공통 work-dock.js 가 맡음
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* 1) 등장 */
  const reveals = document.querySelectorAll('.lg [data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* 3) 아이콘 컬러 버튼 */
  document.querySelectorAll('[data-swatch]').forEach((set) => {
    const tabs = [...set.querySelectorAll('.lg-swatch button')];
    const imgs = [...set.querySelectorAll('.lg-iconboard-stack img')];
    const select = (i) => {
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      imgs.forEach((img, k) => img.classList.toggle('is-on', k === i));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        select(n); tabs[n].focus();
      });
    });
    select(0);
  });

  /* 4) [data-scrub] Overview 큰 문장: 단어로 나눠 스크롤에 따라 하나씩 진해짐 (다른 상세 페이지와 같은 연출) */
  const scrubs = [...document.querySelectorAll('.lg [data-scrub]')].map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    return { el, words: [...el.querySelectorAll('.w')] };
  });
  if (reduce) {
    scrubs.forEach(({ words }) => words.forEach((w) => w.classList.add('on')));
  } else if (scrubs.length) {
    let scrubTick = false;
    const scrubUpdate = () => {
      scrubTick = false;
      const vh = window.innerHeight;
      scrubs.forEach(({ el, words }) => {
        const r = el.getBoundingClientRect();
        const p = clamp((vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.6));
        const n = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < n));
      });
    };
    const onScrub = () => { if (!scrubTick) { scrubTick = true; requestAnimationFrame(scrubUpdate); } };
    window.addEventListener('scroll', onScrub, { passive: true });
    window.addEventListener('resize', onScrub);
    scrubUpdate();
  }

  /* 5) [data-stage] 메인 스크롤 무대 (Noul 과 같은 방식)
     - 데스크톱: 무대가 화면보다 길어서 브라우저가 고정된 채 안의 페이지가 위로 흐름
     - 모바일: 무대가 짧으니 화면을 지나가는 동안 흐름
     - 주소창 오른쪽 진행률 %, 오른쪽 목록은 지금 보이는 장면에 표시 */
  const stage = document.querySelector('.lg [data-stage]');
  const stageImg = stage && stage.querySelector('[data-stage-img]');
  if (stage && stageImg && !reduce) {
    const stagePct = stage.querySelector('[data-stage-pct]');
    const legend = [...stage.querySelectorAll('.lg-stage-legend li')];
    const marks = stage.dataset.marks.split(',').map(Number);
    const total = Number(stage.dataset.total) || 1;
    let stageTick = false;
    const stageUpdate = () => {
      stageTick = false;
      if (!stageImg.naturalHeight) return;
      const vh = window.innerHeight;
      const r = stage.getBoundingClientRect();
      const fh = stageImg.parentElement.clientHeight;
      const ih = stageImg.clientHeight;
      const sticky = r.height > vh * 1.5;
      const p = sticky ? clamp(-r.top / (r.height - vh)) : clamp((vh - r.top) / (vh + r.height));
      const shift = Math.max(0, ih - fh) * p;
      stageImg.style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`;
      if (stagePct) stagePct.textContent = `Main — ${Math.round(p * 100)}%`;
      if (legend.length && ih) {
        const at = ((shift + fh * 0.4) / ih) * total; // 화면 40% 지점이 원본 이미지의 어디인지
        let idx = 0;
        marks.forEach((m, i) => { if (at >= m) idx = i; });
        legend.forEach((li, i) => li.classList.toggle('is-on', i === idx));
      }
    };
    const onStage = () => { if (!stageTick) { stageTick = true; requestAnimationFrame(stageUpdate); } };
    window.addEventListener('scroll', onStage, { passive: true });
    window.addEventListener('resize', onStage);
    stageImg.addEventListener('load', stageUpdate);
    stageUpdate();
  }

  /* 2) 브라우저 · 폰 목업 자동 스크롤 (화면 창 = .lg-browser-view 또는 .lg-phone-view) */
  const frames = [...document.querySelectorAll('[data-autoscroll]')].map((el) => ({
    el,
    view: el.querySelector('.lg-browser-view, .lg-phone-view'),
    img: el.querySelector('.lg-browser-view img, .lg-phone-view img'),
  })).filter((f) => f.view && f.img);
  if (reduce || !frames.length) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    frames.forEach(({ el, view, img }) => {
      if (!img.naturalHeight) return;
      const r = el.getBoundingClientRect();
      // 목업 위 끝이 화면 80% 에 닿을 때 0 → 위로 거의 빠져나갈 때 1
      const p = clamp((vh * 0.8 - r.top) / (vh * 0.6 + r.height * 0.6));
      const shift = Math.max(0, img.clientHeight - view.clientHeight) * p;
      img.style.transform = `translate3d(0, ${-shift.toFixed(1)}px, 0)`;
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frames.forEach(({ img }) => img.addEventListener('load', update));
  update();
})();
