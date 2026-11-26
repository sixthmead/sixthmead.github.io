/* =========================================================
   LG 에너지솔루션 케이스 스터디 (lg-energy-solution.html) 전용 인터랙션
   - 일부러 최소한만: 움직임은 정보를 돕는 곳에만
   1) [data-reveal]      화면에 들어오면 .is-in → 살짝 올라오며 나타남
   2) [data-autoscroll]  브라우저 목업이 지나가는 동안 안의 메인 페이지가 위로 흐름
   3) [data-swatch]      아이콘 컬러 버튼 → 같은 순서의 이미지로 교체 (좌우 화살표로도 이동)
   6) [data-construct]   아이콘 설계 판: 처음 보일 때 그려지고, 마우스를 올리면 다시 그려짐
   7) .lg-prims          기본 도형 5개: 흰 박스 안 도형이 로고처럼 접혔다 펼쳐지며 등장, 마우스를 올리면 다시 재생
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

  /* 6) [data-construct] 아이콘 설계 판: 화면에 들어오면 그려지고, 마우스를 올리면 다시 그려짐
     - 순서·움직임은 work-lges.css 8-0-1, 여기서는 재생 시작과 선 길이만 맡음 */
  const board = document.querySelector('[data-construct]');
  if (board && !reduce) {
    const svg = board.querySelector('.lg-cx');
    const lines = [...board.querySelectorAll('.lg-cx-grid path, .lg-cx-key > *')];
    const gridCount = board.querySelectorAll('.lg-cx-grid path').length;
    const PLAY_TIME = 3300;          // 마지막 숫자가 다 나타날 때까지 (ms)
    let playing = false;

    // 선마다 화면 길이(--len)와 지연(--d) 넣기 — 선 굵기가 화면 기준이라 길이도 화면 px 로 맞춤
    const measure = () => {
      const scale = svg.getScreenCTM().a;
      lines.forEach((el, i) => {
        el.style.setProperty('--len', `${(el.getTotalLength() * scale + 2).toFixed(1)}px`);
        // 격자: 0.05초 간격 / 키라인: 격자 뒤 0.45초부터 0.1초 간격
        const d = i < gridCount ? i * 0.05 : 0.45 + (i - gridCount) * 0.1;
        el.style.setProperty('--d', `${d}s`);
      });
    };

    const play = () => {
      if (playing) return;            // 그리는 중에는 다시 시작하지 않음
      playing = true;
      measure();
      board.classList.remove('is-play');
      void board.offsetWidth;          // 애니메이션을 처음부터 다시 시작하게 함
      board.classList.add('is-play');
      board.classList.remove('cx-wait');
      setTimeout(() => {
        board.classList.remove('is-play');   // 끝나면 완성된 그림 상태로 (창 크기가 바뀌어도 선이 끊기지 않게)
        playing = false;
      }, PLAY_TIME);
    };

    board.classList.add('cx-wait');
    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { play(); cio.disconnect(); }
      }, { threshold: 0.4 });
      cio.observe(board);
    } else {
      play();
    }
    board.addEventListener('mouseenter', play);
  }

  /* 7) .lg-prims 기본 도형 5개: 흰 박스는 그대로, 박스 안 도형만 헤더 로고(logo-anim.js)처럼 변신
     ① 박스 모서리에 작게 접혀 있다가 → ② 가운데로 슬라이드 → ③ 90° 회전이 풀리며 커짐 → ④ 철컥 잠김
     - 왼쪽 도형부터 차례로 / 처음 화면에 들어올 때 1회 + 마우스를 올리면 다시 재생 */
  const prims = document.querySelector('.lg-prims');
  if (prims && !reduce && prims.animate) {
    const shapes = [...prims.querySelectorAll('svg > *')];   // 박스(svg) 안 도형
    const MECH = 'cubic-bezier(0.75, 0, 0.15, 1)';           // 빠르게 움직이고 딱 멈춤 (로고와 같은 곡선)
    const ROT = [90, -90, 180, -180, 90];                     // 90° 단위로만 접혀 있음
    // 도형마다 접혀 있는 자리 (박스 좌표 40 기준, 모서리 쪽) — 서로 다른 방향에서 들어옴
    const FROM = [[-11, -11], [11, -11], [-11, 11], [11, 11], [0, -12]];
    const DURATION = 1500;
    const STAGGER = 80;
    let primsBusy = false;
    const t = (x, y, r, sc) => `translate(${x}px, ${y}px) rotate(${r}deg) scale(${sc})`;

    shapes.forEach((el) => {             // 도형 자기 중심을 기준으로 돌고 커지게
      el.style.transformBox = 'fill-box';
      el.style.transformOrigin = 'center';
    });

    const playPrims = () => {
      if (primsBusy) return;
      primsBusy = true;
      prims.classList.remove('is-wait');
      shapes.forEach((el, i) => {
        const [x, y] = FROM[i % FROM.length];
        const r0 = ROT[i % ROT.length];
        const kx = -Math.sign(x) * 1.5;  // 잠길 때 반동 (들어온 반대쪽으로 살짝)
        const ky = -Math.sign(y) * 1.5;
        el.animate([
          // 1) 모서리에 작게 접힌 상태로 등장
          { offset: 0,    transform: t(x, y, r0, 0.2),   opacity: 0, easing: MECH },
          { offset: 0.12, transform: t(x, y, r0, 0.4),   opacity: 1, easing: 'linear' },
          { offset: 0.18, transform: t(x, y, r0, 0.4),   opacity: 1, easing: MECH },
          // 2) 가운데로 슬라이드
          { offset: 0.42, transform: t(0, 0, r0, 0.4),   opacity: 1, easing: 'linear' },
          { offset: 0.48, transform: t(0, 0, r0, 0.4),   opacity: 1, easing: MECH },
          // 3) 90° 회전이 풀리며 원래 크기로
          { offset: 0.7,  transform: t(0, 0, 0, 1),      opacity: 1, easing: 'linear' },
          { offset: 0.75, transform: t(0, 0, 0, 1),      opacity: 1, easing: MECH },
          // 4) 철컥 잠김
          { offset: 0.87, transform: t(kx, ky, 0, 1.08), opacity: 1, easing: 'ease-out' },
          { offset: 0.94, transform: t(-kx / 3, -ky / 3, 0, 0.97), opacity: 1, easing: 'ease-in-out' },
          { offset: 1,    transform: t(0, 0, 0, 1),      opacity: 1 },
        ], { duration: DURATION, delay: i * STAGGER, fill: 'backwards' });
      });
      setTimeout(() => { primsBusy = false; }, DURATION + shapes.length * STAGGER + 200);
    };

    prims.classList.add('is-wait');                 // 첫 재생 전: 도형만 숨김 (work-lges.css)
    if ('IntersectionObserver' in window) {
      const pio = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { playPrims(); pio.disconnect(); }
      }, { threshold: 0.6 });
      pio.observe(prims);
    } else {
      playPrims();
    }
    prims.addEventListener('mouseenter', playPrims);
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
      // 기준 상자: 서브 페이지 패널은 패널 전체 (폰이 화면에 붙어 따라오므로 폰 위치로는 진행을 잴 수 없음)
      const r = (el.closest('.lg-pair-stage') || el).getBoundingClientRect();
      // 목업이 화면에 다 들어올 때까지(위 끝이 화면 30% 지점에 닿기 전)는 맨 위 화면에 머묾
      // → 그 뒤 스크롤한 만큼 내려가, 목업 높이의 90% 를 지나면 페이지 끝까지 다 보임
      const p = clamp((vh * 0.3 - r.top) / (r.height * 0.9));
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
