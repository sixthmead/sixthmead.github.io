/* =========================================================
   Hyundaitel 안면인식 도어폰 케이스 스터디 (hyundaitel.html) 전용 인터랙션
   1) [data-reveal]  화면에 들어오면 .is-in → 아래에서 올라오며 나타남
   2) [data-scrub]   큰 문장을 단어로 나눠 스크롤에 따라 하나씩 진해짐
   3) [data-count]   숫자 카운트
   4) .ht-flow       플로우 선이 그려지는 효과 (.is-in 이 붙으면 CSS 가 처리)
   5) [data-reg]     얼굴 등록 스텝: 탭(안경 미착용/착용) + 자동 재생 + 이전/다음
   6) [data-msg]     메시지 카테고리 탭
   - '움직임 줄이기' 설정이면 움직임은 건너뛰고 결과만 보여 줌
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const hasIO = 'IntersectionObserver' in window;
  const IMG = '../images/work/project-07/';

  /* ---------- 5) 얼굴 등록 스텝 데이터 ---------- */
  const STEP = {
    call:    { img: 'screens/n-01.jpg', t: '호출 버튼을 눌러주세요.', n: '물리 버튼 한 번으로 등록 의사를 확인하고 시작' },
    twice:   { img: 'screens/g-08.jpg', t: '두번 촬영합니다.', n: '안경 착용자에게 촬영이 두 번임을 미리 예고' },
    gOn:     { img: 'screens/g-09.jpg', t: '안경을 쓰고 등록 준비가 되면 호출 버튼을 눌러 주세요.', n: '첫 번째 촬영 조건 안내 — 안경 착용' },
    ready:   { img: 'screens/g-02.jpg', t: '촬영 준비가 되었습니다.', n: '청록 브래킷 안에 얼굴이 들어오면 준비 완료' },
    shoot:   { img: 'screens/g-03.jpg', t: '촬영 중입니다.', n: '흰색 브래킷과 REC 표시로 촬영 상태 전환' },
    proc:    { img: 'screens/g-04.jpg', t: '등록 중입니다.', n: '점선 링이 돌며 처리 중임을 표시' },
    gOff:    { img: 'screens/g-10.jpg', t: '안경을 벗고 등록 준비가 되면 호출 버튼을 눌러 주세요.', n: '두 번째 촬영 조건 안내 — 같은 루프 반복' },
    ready2:  { img: 'screens/g-11.jpg', t: '촬영 준비가 되었습니다.', n: '두 번째 촬영 — 동일한 상태 규칙' },
    shoot2:  { img: 'screens/g-12.jpg', t: '촬영 중입니다.', n: '' },
    proc2:   { img: 'screens/g-13.jpg', t: '등록 중입니다.', n: '' },
    done:    { img: 'screens/g-05.jpg', t: '등록을 완료했습니다.', n: '실선 링으로 결과 확정, 하단 바 반전' },
    wallpad: { img: 'screens/g-06.jpg', t: '월패드에서 다음 절차를 진행해 주세요.', n: '이후 설정은 실내 월패드로 자연스럽게 연결' },
  };
  const FLOWS = {
    plain:   ['call', 'ready', 'shoot', 'proc', 'done', 'wallpad'],
    glasses: ['twice', 'gOn', 'ready', 'shoot', 'proc', 'gOff', 'ready2', 'shoot2', 'proc2', 'done', 'wallpad'],
  };

  const reg = document.querySelector('[data-reg]');
  if (reg) {
    const imgEl = reg.querySelector('[data-reg-img]');
    const countEl = reg.querySelector('[data-reg-count]');
    const list = reg.querySelector('[data-reg-list]');
    const bar = reg.querySelector('[data-reg-bar]');
    const tabs = [...reg.querySelectorAll('[data-reg-tab]')];
    const playBtn = reg.querySelector('[data-reg-play]');
    const DUR = 2600;
    let flow = 'plain';
    let cur = 0;
    let timer = null;
    let playing = !reduce;
    let visible = false;
    const pad = (n) => String(n).padStart(2, '0');

    /* 이미지 미리 불러오기 */
    Object.values(STEP).forEach((s) => { const i = new Image(); i.src = IMG + s.img; });

    const renderList = () => {
      const keys = FLOWS[flow];
      list.innerHTML = keys.map((k, i) => {
        const s = STEP[k];
        return `<li><button type="button" data-i="${i}"><span class="ht-mono">${pad(i + 1)}</span><strong>${s.t}</strong>${s.n ? `<em>${s.n}</em>` : ''}</button></li>`;
      }).join('');
    };

    const go = (i) => {
      const keys = FLOWS[flow];
      cur = (i + keys.length) % keys.length;
      const s = STEP[keys[cur]];
      imgEl.classList.remove('is-swap');
      void imgEl.offsetWidth; // 애니메이션 다시 시작
      imgEl.src = IMG + s.img;
      imgEl.alt = s.t;
      imgEl.classList.add('is-swap');
      countEl.textContent = `${pad(cur + 1)} / ${pad(keys.length)}`;
      list.querySelectorAll('button').forEach((b, k) => {
        b.classList.toggle('is-on', k === cur);
        b.classList.toggle('is-past', k < cur);
        if (k === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      bar.style.width = `${((cur + 1) / keys.length) * 100}%`;
    };

    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => {
      stop();
      if (!playing || !visible) return;
      timer = setInterval(() => go(cur + 1), DUR);
    };
    const setPlaying = (v) => {
      playing = v;
      playBtn.setAttribute('aria-pressed', String(v));
      playBtn.setAttribute('aria-label', v ? '자동 재생 멈춤' : '자동 재생');
      reg.classList.toggle('is-paused', !v);
      start();
    };

    const setFlow = (f) => {
      flow = f;
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.regTab === f)));
      renderList();
      go(0);
      start();
    };

    tabs.forEach((t) => t.addEventListener('click', () => setFlow(t.dataset.regTab)));
    list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      go(Number(b.dataset.i));
      start();
    });
    reg.querySelector('[data-reg-prev]').addEventListener('click', () => { go(cur - 1); start(); });
    reg.querySelector('[data-reg-next]').addEventListener('click', () => { go(cur + 1); start(); });
    playBtn.addEventListener('click', () => setPlaying(!playing));

    renderList();
    go(0);
    setPlaying(playing);

    if (hasIO) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => { visible = e.isIntersecting; visible ? start() : stop(); });
      }, { threshold: 0.35 }).observe(reg);
    } else {
      visible = true;
      start();
    }
  }

  /* ---------- 6) 메시지 카테고리 ---------- */
  const MSG = {
    a: {
      d: '집을 비웠거나 방해받고 싶지 않을 때, 초인종 대신 방문자에게 먼저 보여 주는 메시지',
      list: ['아기가 자고 있어요 노크해 주세요', '강아지가 크게 짖어요 노크해 주세요', '초인종 대신 노크해 주세요', '안녕하세요', '방범시스템 작동중', '신문 사절', '전단지 부착 금지', '좋은 하루 되세요', '택배는 문 앞에 놓아주시고, 문자 부탁드려요', '방범 녹화중', '직접입력'],
    },
    b: {
      d: '얼굴 인증에 성공한 가족을 맞이하는 출입 인사',
      list: ['오늘도 수고했어요', '어서오세요', '사랑해요', '잘 다녀왔어요?', '고생했어요', '안녕하세요', '좋은 하루 되세요', 'Hello~!', 'Welcome!', '즐거운 저녁 보내세요~'],
    },
    c: {
      d: '모임·명절처럼 손님을 맞는 날을 위한 메시지',
      list: ['생일 파티에 초대합니다', '모임에 오신 걸 환영해요', '방문을 환영합니다', '어서오세요', '반갑습니다', '안녕하세요', '찾아주셔서 감사합니다', '새해 복 많이 받으세요~', '즐거운 한가위 보내세요~', 'Merry Christmas~'],
    },
  };

  const msg = document.querySelector('[data-msg]');
  if (msg) {
    const grid = msg.querySelector('[data-msg-grid]');
    const desc = msg.querySelector('[data-msg-desc]');
    const tabs = [...msg.querySelectorAll('[data-msg-tab]')];
    const render = (key) => {
      const m = MSG[key];
      const items = m.list.map((label, i) => ({ src: `msg/${key}-${String(i + 1).padStart(2, '0')}.jpg`, label }));
      if (key !== 'a') items.push({ src: 'msg/a-11.jpg', label: '직접입력' }); // 모든 카테고리 공통 마지막 칸
      grid.innerHTML = items.map((it, i) => `<li style="--i:${i}"><img src="${IMG}${it.src}" alt="${it.label}" loading="lazy"></li>`).join('');
      desc.textContent = m.d;
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.msgTab === key)));
      grid.classList.remove('is-anim');
      void grid.offsetWidth;
      if (!reduce) grid.classList.add('is-anim');
    };
    tabs.forEach((t) => t.addEventListener('click', () => render(t.dataset.msgTab)));
    render('a');
  }

  /* ---------- 1) 등장 ---------- */
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

  /* ---------- 2) 단어 스크럽 ---------- */
  const scrubs = [...document.querySelectorAll('[data-scrub]')].map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    return { el, words: [...el.querySelectorAll('.w')] };
  });
  if (reduce) scrubs.forEach(({ words }) => words.forEach((w) => w.classList.add('on')));

  /* ---------- 3) 숫자 카운트 ---------- */
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

  /* 스크롤마다 스크럽 갱신 */
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
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
