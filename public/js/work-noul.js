/* =========================================================
   Noul 케이스 스터디 (work/project-02.html) 전용 인터랙션
   1) [data-reveal]     화면에 들어오면 .is-in → 올라오며 나타남 (막대 · 원형 차트도 이때 채워짐)
   2) [data-scrub]      큰 문장을 단어로 나눠 스크롤에 따라 하나씩 진해짐
   3) [data-count]      숫자가 0부터 올라감
   4) [data-speed]      패럴랙스
   5) [data-stage]      메인 페이지 전체 화면이 고정 브라우저 프레임 안에서 스크롤에 맞춰 흐름
   6) [data-kv]         키 비주얼 시안 5종 — 탭 + 자동 넘김
   7) [data-tabs]       miLab 분해도 4단계 — 탭 + 자동 넘김
   8) [data-autoscroll] 긴 페이지 이미지가 프레임 안에서 위아래로 천천히 흐름
   - '움직임 줄이기' 설정이면 자동 효과는 끄고 결과만 보여 줌
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const hasIO = 'IntersectionObserver' in window;

  /* 1) 등장 */
  const revealEls = document.querySelectorAll('.nl [data-reveal]');
  if (hasIO && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* 2) 단어 스크럽 준비 */
  const scrubs = [...document.querySelectorAll('.nl [data-scrub]')].map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    return { el, words: [...el.querySelectorAll('.w')] };
  });
  if (reduce) scrubs.forEach(({ words }) => words.forEach((w) => w.classList.add('on')));

  /* 3) 숫자 카운트 */
  if (hasIO && !reduce) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const end = Number(el.dataset.count);
        const t0 = performance.now();
        const tick = (t) => {
          const k = clamp((t - t0) / 1400);
          el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4))).toLocaleString('en-US');
          if (k < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.nl [data-count]').forEach((el) => cio.observe(el));
  }

  /* 6 · 7) 탭 + 자동 넘김 (공통) */
  const makeRotator = ({ root, tabs, panes, interval, onChange }) => {
    let idx = 0;
    let timer = null;
    let t0 = 0;
    let raf = 0;
    let visible = false;
    let userPicked = false;

    const show = (i) => {
      idx = (i + panes.length) % panes.length;
      panes.forEach((p, k) => p.classList.toggle('is-on', k === idx));
      tabs.forEach((b, k) => {
        b.setAttribute('aria-selected', String(k === idx));
        b.tabIndex = k === idx ? 0 : -1;
      });
      if (onChange) onChange(idx);
      t0 = performance.now();
    };

    const loop = (t) => {
      const p = clamp((t - t0) / interval);
      if (onChange && onChange.progress) onChange.progress(p);
      if (p >= 1) show(idx + 1);
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (reduce || userPicked || raf) return;
      t0 = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    tabs.forEach((b, k) => {
      b.addEventListener('click', () => {
        userPicked = true;   // 직접 고르면 자동 넘김 멈춤
        stop();
        if (onChange && onChange.progress) onChange.progress(1);
        show(k);
      });
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const next = idx + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
        tabs[(next + tabs.length) % tabs.length].click();
        tabs[idx].focus();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', () => { if (visible) play(); });

    if (hasIO) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        visible ? play() : stop();
      }, { threshold: 0.35 }).observe(root);
    }
    show(0);
  };

  const kv = document.querySelector('[data-kv]');
  if (kv) {
    const badge = kv.querySelector('[data-kv-badge]');
    const bar = kv.querySelector('[data-kv-bar]');
    const labels = ['Final', 'Option B', 'Option C', 'Option D', 'Option E'];
    const onChange = (i) => {
      if (badge) { badge.textContent = labels[i] || ''; badge.classList.toggle('is-alt', i > 0); }
    };
    onChange.progress = (p) => bar && bar.style.setProperty('--p', p.toFixed(3));
    makeRotator({
      root: kv,
      tabs: [...kv.querySelectorAll('[role="tab"]')],
      panes: [...kv.querySelectorAll('.nl-kv-slide')],
      interval: 4200,
      onChange,
    });
  }

  document.querySelectorAll('[data-tabs]').forEach((root) => {
    makeRotator({
      root,
      tabs: [...root.querySelectorAll('[role="tab"]')],
      panes: [...root.querySelectorAll('.nl-explode-stage img')],
      interval: 3200,
    });
  });

  /* 8) 긴 이미지 자동 흐름: 이미지 높이 - 프레임 높이 만큼 */
  const autos = [...document.querySelectorAll('.nl [data-autoscroll]')];
  const measure = (fig) => {
    const frame = fig.querySelector('.nl-tall-frame');
    const img = frame && frame.querySelector('img');
    if (!img || !img.naturalHeight) return;
    const shift = Math.max(0, img.clientHeight - frame.clientHeight);
    fig.style.setProperty('--shift', `${shift.toFixed(0)}px`);
    // 0.6 = 흐르는 속도 비율 (1 이면 원래 속도, 작을수록 느림)
    fig.style.setProperty('--dur', `${(clamp(shift / 120, 8, 40) / 0.6).toFixed(1)}s`);
  };
  autos.forEach((fig) => {
    const img = fig.querySelector('img');
    if (img) img.addEventListener('load', () => measure(fig));
    measure(fig);
  });
  if (hasIO && !reduce) {
    const aio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        measure(e.target);
        e.target.classList.toggle('is-playing', e.isIntersecting);
      });
    }, { threshold: 0.2 });
    autos.forEach((f) => aio.observe(f));
  }

  /* 4 · 5) 스크롤마다 갱신 */
  const speeds = [...document.querySelectorAll('.nl [data-speed]')];
  const stage = document.querySelector('[data-stage]');
  const stageImg = stage && stage.querySelector('[data-stage-img]');
  const stagePct = stage && stage.querySelector('[data-stage-pct]');
  const legend = stage ? [...stage.querySelectorAll('.nl-stage-legend li')] : [];
  const marks = stage ? stage.dataset.marks.split(',').map(Number) : [];
  const total = stage ? Number(stage.dataset.total) : 1;
  const desktop = window.matchMedia('(min-width: 1024px)');
  let ticking = false;

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;

    if (!reduce) {
      if (desktop.matches) {
        speeds.forEach((el) => {
          const r = el.getBoundingClientRect();
          el.style.translate = `0 ${((r.top + r.height / 2 - vh / 2) * Number(el.dataset.speed)).toFixed(1)}px`;
        });
      }
      scrubs.forEach(({ el, words }) => {
        const r = el.getBoundingClientRect();
        const p = clamp((vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.6));
        const n = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < n));
      });
    }

    if (stage && stageImg && stageImg.naturalHeight) {
      const r = stage.getBoundingClientRect();
      const frame = stageImg.parentElement;
      const fh = frame.clientHeight;
      const ih = stageImg.clientHeight;
      const sticky = r.height > vh * 1.5;
      const p = sticky ? clamp(-r.top / (r.height - vh)) : clamp((vh - r.top) / (vh + r.height));
      const shift = Math.max(0, ih - fh) * p;
      stageImg.style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`;
      if (stagePct) stagePct.textContent = `Index — ${Math.round(p * 100)}%`;
      if (legend.length && ih) {
        const at = ((shift + fh * 0.4) / ih) * total;
        let idx = 0;
        marks.forEach((m, i) => { if (at >= m) idx = i; });
        legend.forEach((li, i) => li.classList.toggle('is-on', i === idx));
      }
    }
  };

  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { autos.forEach(measure); onScroll(); });
  if (stageImg) stageImg.addEventListener('load', update);
  update();
})();
