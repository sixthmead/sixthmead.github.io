/* =========================================================
   포트폴리오 기본 동작
   ========================================================= */

/* ---------- 1. 전체 화면 메뉴 열고 닫기 ----------
   body 에 .menu-open 클래스를 붙였다 뗐다 하면
   나머지 연출(원형으로 펼쳐짐, X 모양, 항목 순차 등장)은 CSS 가 처리 */
const menuToggle = document.querySelector('.menu-toggle');
const siteMenu = document.getElementById('site-menu');

if (menuToggle && siteMenu) {
  // 메뉴 열기/닫기 공통 함수 (open 이 true 면 열고, false 면 닫음)
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', open);
    menuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    siteMenu.setAttribute('aria-hidden', !open);
  };

  // 메뉴 버튼: 지금 상태의 반대로 바꿈
  menuToggle.addEventListener('click', () => {
    setMenu(!document.body.classList.contains('menu-open'));
  });

  // 메뉴 안의 링크를 누르면 메뉴를 닫고 해당 섹션으로 이동 (이동은 href 가 처리)
  siteMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  // Esc 키를 누르면 메뉴 닫기
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });

  // 메뉴가 열린 채로 창을 데스크톱 너비(1024px 이상)로 넓히면 자동으로 닫기
  // (데스크톱에선 메뉴가 숨겨지므로, 열린 상태로 남으면 스크롤이 막힘)
  const desktopQuery = window.matchMedia('(min-width: 1024px)');
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });
}

/* ---------- 2. 헤더의 서울 현재 시각 (데스크톱에서만 보임) ----------
   사용자가 어느 나라에서 보든 서울 시간으로 표시, 1분마다 갱신 */
const timeEl = document.getElementById('local-time');

if (timeEl) {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    minute: '2-digit',
  });

  const updateTime = () => {
    const now = new Date();
    timeEl.textContent = formatter.format(now);   // 예: 오후 3:24
    timeEl.dateTime = now.toISOString();
  };

  updateTime();
  setInterval(updateTime, 60 * 1000);
}

/* ---------- 3. 푸터 연도 자동 표시 ---------- */
// #year (푸터) 와 .js-year (작업 목록 화면 아래 줄 등) 모두 올해 연도로 채움
document.querySelectorAll('#year, .js-year').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

/* ---------- 4. 인트로 (이 탭에서 처음 들어왔을 때만) ----------
   index.html 머리의 스크립트가 html 에 .is-intro 를 붙였을 때만 실행
   (시간은 모두 ms, CSS 의 transition 시간과 맞춰 둠)
   1) 0 ~         : 이름·문구가 아래에서 올라옴 (CSS 애니메이션)
   2) OPEN_AT     : .intro-open → 이미지가 좌우로 열리고, 두 단어가 양 끝으로 밀려남
                    동시에 컷 이미지를 CUT_SPEED 마다 한 장씩 바꿈
   3) MIN_TIME 이 지나고 페이지(사진 등)가 다 불러와지면 (느려도 MAX_TIME 이면 진행)
                  : .intro-exit → 무대가 작아지고 본문이 아래에서 위로 덮음
   4) EXIT_TIME 뒤 : 클래스를 모두 빼서 인트로를 치움 */
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const intro = document.querySelector('.intro');

if (intro && root.classList.contains('is-intro')) {
  const cuts = [...intro.querySelectorAll('.intro-cut')];
  const leftWord = intro.querySelector('.intro-word--left');
  const rightWord = intro.querySelector('.intro-word--right');

  const OPEN_AT = reduceMotion ? 0 : 1400;      // 이미지가 열리기 시작하는 때
  const CUT_SPEED = 150;                        // 컷 한 장이 보이는 시간 (작을수록 빠르게 깜빡임)
  const MIN_TIME = reduceMotion ? 800 : 4000;   // 인트로를 보여주는 최소 시간
  const MAX_TIME = 6000;                        // 로딩이 느려도 이 시간이 지나면 넘어감
  const EXIT_TIME = reduceMotion ? 400 : 1200;  // 본문이 올라와 덮는 시간

  let pageLoaded = document.readyState === 'complete';
  window.addEventListener('load', () => { pageLoaded = true; });
  const start = performance.now();

  // 두 단어를 화면 양 끝(좌우 여백 위치)까지 밀어낼 거리 계산
  const setWordShift = () => {
    const gutter = parseFloat(getComputedStyle(root).getPropertyValue('--space-gutter')) || 20;
    const l = leftWord.getBoundingClientRect();
    const r = rightWord.getBoundingClientRect();
    leftWord.style.setProperty('--x', `${gutter - l.left}px`);
    rightWord.style.setProperty('--x', `${window.innerWidth - gutter - r.right}px`);
  };

  // 컷 전환: 다음 장 보여주기 (마지막 다음엔 처음으로)
  let current = 0;
  const showNext = () => {
    cuts[current].classList.remove('is-active');
    current = (current + 1) % cuts.length;
    cuts[current].classList.add('is-active');
  };

  // 끝낼 수 있을 때까지 기다리기
  const waitUntilReady = async () => {
    for (;;) {
      const elapsed = performance.now() - start;
      if (elapsed >= MIN_TIME && (pageLoaded || elapsed >= MAX_TIME)) return;
      await wait(100);
    }
  };

  (async () => {
    // 2) 이미지 열기 + 단어 밀어내기 + 컷 전환 시작
    await wait(OPEN_AT);
    setWordShift();
    root.classList.add('intro-open');
    const cutTimer = (!reduceMotion && cuts.length > 1) ? setInterval(showNext, CUT_SPEED) : null;

    // 3) 본문이 아래에서 올라와 덮음
    await waitUntilReady();
    root.classList.add('intro-exit');
    await wait(EXIT_TIME);

    // 4) 정리
    clearInterval(cutTimer);
    root.classList.remove('is-intro', 'intro-open', 'intro-exit');

    // 다른 페이지에서 ../index.html#works 처럼 들어왔다면, 인트로가 끝난 뒤 그 섹션으로 이동
    // (인트로 동안엔 스크롤이 막혀 있어서 브라우저가 자동으로 못 감)
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) target.scrollIntoView();
    }
  })();
}

/* ---------- 5. 작업 상세 페이지: 제목 글자 하나씩 올라오기 ----------
   data-split 이 붙은 제목을 [단어 span > 글자 span] 으로 나눔
   - 단어 span 이 마스크 역할 (넘치는 부분을 가림)
   - 글자마다 --i 순번을 매겨서 CSS(work.css)가 조금씩 늦게 올라오게 함
   - 화면 읽기 프로그램은 aria-label 의 원래 제목을 읽고, 나눈 글자는 건너뜀 */
document.querySelectorAll('[data-split]').forEach((title) => {
  const text = title.textContent.trim().replace(/\s+/g, ' ');
  title.setAttribute('aria-label', text);

  // 제목 안에서 <span class="…"> 로 감싼 부분은 그 class 를 나눈 단어에도 이어 줌
  // (예: <span class="hero-title-serif">Design Partner</span> → 두 단어 모두 세리프 이탤릭)
  const words = [];
  title.childNodes.forEach((node) => {
    const cls = node.nodeType === 1 ? node.className : '';
    const t = node.textContent.trim();
    if (!t) return;
    // 감싼 구간은 한 묶음으로 (그라데이션이 구간 전체에 하나로 이어지게, 띄어쓰기는 줄바꿈 안 되는 공백)
    if (cls) words.push({ w: t.replace(/\s+/g, ' '), cls });
    else t.split(/\s+/).forEach((w) => words.push({ w, cls }));
  });
  title.textContent = '';

  let index = 0;
  words.forEach(({ w: word, cls }, wordIndex) => {
    if (wordIndex > 0) title.append(' ');   // 단어 사이 띄어쓰기 (여기서 줄바꿈 가능)

    const wordEl = document.createElement('span');
    wordEl.className = cls ? `work-title-word ${cls}` : 'work-title-word';
    wordEl.setAttribute('aria-hidden', 'true');

    [...word].forEach((char) => {
      const charEl = document.createElement('span');
      charEl.className = 'work-title-char';
      charEl.textContent = char;
      charEl.style.setProperty('--i', index++);
      wordEl.append(charEl);
    });

    title.append(wordEl);
  });

  title.classList.add('is-split');   // 이 클래스가 붙으면 CSS 애니메이션 시작

  // 감싼 구간(class 있는 묶음): 그라데이션이 글자마다 끊기지 않게
  // 묶음 전체 폭(--gw)과 각 글자의 위치(--gx)를 넣어 한 장의 그라데이션처럼 보이게 함
  const groups = [...title.querySelectorAll('.work-title-word')].filter((w) => w.classList.length > 1);
  if (groups.length) {
    const fit = () => groups.forEach((w) => {
      const left = w.getBoundingClientRect().left;   // 묶음 왼쪽 끝 기준 (세로로 움직여도 가로 위치는 그대로)
      w.style.setProperty('--gw', `${w.getBoundingClientRect().width}px`);
      w.querySelectorAll('.work-title-char').forEach((c) => {
        c.style.setProperty('--gx', `${(left - c.getBoundingClientRect().left).toFixed(1)}px`);
      });
    });
    fit();
    if (document.fonts) document.fonts.ready.then(fit);   // 글꼴이 늦게 들어와 폭이 바뀌어도 다시 맞춤
    window.addEventListener('resize', fit);
  }
});

/* ---------- 6. 작업 목록 페이지: 3D 카드 스택 자동 전환 (데스크톱) ----------
   [카드 자리]  (getSlots 함수)
   - 겹치는 순서는 HTML 순서: 맨 마지막 카드가 맨 앞(가장 크게 보임)
   - 맨 앞 카드는 장 수와 상관없이 항상 같은 자리(아래로 30%, 앞으로 45px)
   - 뒤 카드는 한 장씩 갈수록 뒤로 15px (그래서 조금씩 작아 보임)
   - 뒤 카드가 위로 삐져나와 보이는 띠 높이를 화면에서 직접 계산
     · 카드 위쪽 빈 공간을 나눠 씀 → 카드가 많아도(최대 7장) 뒤 카드가 잘 보임
     · 뒤로 갈수록 띠가 조금씩 좁아짐 (원근감), 한 띠의 최대 높이는 카드 높이의 10.6%

   [움직임 순서]
   1) 펼치기 (1.2초) : 모든 카드가 자기 자리로 이동, 맨 앞 카드부터 0.1초 간격으로 출발
                        (페이지를 처음 열면 한 자리에 겹쳐 있던 카드가 이렇게 펼쳐짐)
   2) 0.5초 멈춤
   3) 떨어지기 (0.7초) : 맨 앞 카드가 카드 높이의 150% 만큼 아래로 빠르게 떨어짐
   4) 떨어진 카드를 HTML 맨 앞(= 맨 뒤 카드)으로 옮기고 다시 1) 부터
      → 떨어진 카드는 다른 카드들 뒤로 지나가며 맨 뒤 자리로 올라감
   - 1200px 이상 화면에서만, 탭이 보이는 동안에만 돌아감
   - '동작 줄이기'를 켠 사용자에게는 움직임 없이 펼친 상태로 고정 */
const worksStack = document.querySelector('.works-stack');

if (worksStack) {
  const SPREAD_TIME = 1200;   // 펼치기: 카드 한 장이 이동하는 시간
  const STAGGER = 100;        // 펼치기: 카드끼리 출발 간격
  const HOLD_TIME = 500;      // 펼친 뒤 멈춰 있는 시간
  const DROP_TIME = 700;      // 떨어지는 시간
  const EASE_IN_OUT = 'cubic-bezier(0.45, 0, 0.55, 1)';   // 천천히 출발 → 빠르게 → 천천히 도착
  const EASE_IN = 'cubic-bezier(0.11, 0, 0.5, 0)';        // 천천히 출발해서 점점 빠르게

  // HTML 에는 01, 02, 03 … 순서로 적혀 있음
  // → 01 이 맨 앞에 오도록 화면에서는 순서를 뒤집어 둠 (맨 마지막 = 맨 앞)
  [...worksStack.children].reverse().forEach((card) => worksStack.append(card));

  const getCards = () => [...worksStack.querySelectorAll('.works-card')];

  const FRONT_Y = 30;          // 맨 앞 카드: 카드 높이의 30% 만큼 아래로
  const FRONT_Z = 45;          // 맨 앞 카드: 앞으로 45px
  const STEP_Z = 15;           // 뒤로 한 장마다 15px 씩 뒤로
  const MAX_GAP = 0.106;       // 뒤 카드 띠 최대 높이 (카드 높이 대비)
  const GAP_RATIO = 0.9;       // 뒤로 한 장 갈 때마다 띠 높이 × 0.9
  const TOP_SPACE = 0.06;      // 맨 뒤 카드 위로 남겨 둘 여백 (무대 높이 대비)

  // 카드 수(count)에 맞춰 각 카드의 펼친 자리 [y %, z px] 목록을 만듦 (0 = 맨 뒤)
  // 원근 때문에 화면에 보이는 위치 ≠ 실제 위치라서,
  // "화면에서 이 높이에 보이려면 실제로 얼마나 올려야 하나"를 거꾸로 계산함
  const getSlots = (count) => {
    const card = worksStack.querySelector('.works-card');
    const h = card.offsetHeight;                       // 카드 높이
    // 스택이 숨겨져 있으면(좁은 화면) 크기를 잴 수 없음 → 15% 간격 기본값
    if (!h) {
      return Array.from({ length: count }, (_, i) => {
        const k = count - 1 - i;
        return [FRONT_Y - 15 * k, FRONT_Z - STEP_Z * k];
      });
    }
    const top = card.offsetTop;                        // 옮기기 전 카드 위쪽 위치
    const originY = worksStack.clientHeight;           // 시점 높이 (무대 맨 아래)
    const depth = parseFloat(getComputedStyle(worksStack).perspective) || 200;
    const scaleAt = (z) => depth / (depth - z);        // 앞으로 z 만큼 오면 커지는 비율
    // 실제 위쪽 위치 ↔ 화면에 보이는 위쪽 위치
    const toScreen = (y, z) => originY + (top + (h * y) / 100 - originY) * scaleAt(z);
    const toY = (screenTop, z) => ((originY + (screenTop - originY) / scaleAt(z) - top) / h) * 100;

    const backCount = count - 1;                        // 맨 앞을 뺀 뒤 카드 수
    const frontTop = toScreen(FRONT_Y, FRONT_Z);        // 맨 앞 카드 위쪽이 보이는 높이
    const space = frontTop - originY * TOP_SPACE;       // 뒤 카드 띠들이 쓸 수 있는 높이
    let sum = 0;
    for (let k = 0; k < backCount; k += 1) sum += GAP_RATIO ** k;
    const firstGap = Math.min(h * MAX_GAP, sum ? space / sum : 0);

    const slots = [];
    let screenTop = frontTop;
    for (let k = 0; k < count; k += 1) {               // k = 0 맨 앞, 1 그 뒤 …
      const z = FRONT_Z - STEP_Z * k;
      if (k > 0) screenTop -= firstGap * GAP_RATIO ** (k - 1);
      slots.unshift([k === 0 ? FRONT_Y : toY(screenTop, z), z]);
    }
    return slots;
  };

  // 카드 위치 → transform 글자로 (y = 카드 높이 대비 %, z = 앞으로 당기는 거리 px)
  const toTransform = (y, z) => `translate3d(-50%, ${y}%, ${z}px)`;

  // 카드를 지금 위치에서 새 위치(y, z)로 움직임
  // - 출발·도착 위치를 직접 알려 주는 방식(Web Animations API)이라
  //   카드를 HTML 안에서 옮긴 직후에도 순간 이동 없이 항상 부드럽게 움직임
  // - 지금 위치는 card.dataset 에 기억해 둠 (처음엔 모두 0, 0 = 한 자리에 겹친 상태)
  const moveCard = (card, y, z, options) => {
    const fromY = Number(card.dataset.y || 0);
    const fromZ = Number(card.dataset.z || 0);
    card.dataset.y = y;
    card.dataset.z = z;
    card.style.transform = toTransform(y, z);          // 끝난 뒤 머무를 자리
    card.animate(
      [{ transform: toTransform(fromY, fromZ) }, { transform: toTransform(y, z) }],
      { ...options, fill: 'backwards' }                 // 출발 전(대기 시간)엔 원래 자리에 머묾
    );
  };

  // 1) 펼치기
  const spread = async () => {
    const cards = getCards();
    const last = cards.length - 1;
    const slots = getSlots(cards.length);
    cards.forEach((card, i) => {
      moveCard(card, ...slots[i], {
        duration: SPREAD_TIME,
        delay: (last - i) * STAGGER,      // 맨 앞(마지막) 카드가 가장 먼저 출발
        easing: EASE_IN_OUT,
      });
    });
    await wait(SPREAD_TIME + last * STAGGER);
  };

  // 2)~4) 멈췄다가 맨 앞 카드 떨어뜨리고 맨 뒤로 보내기
  const drop = async () => {
    await wait(HOLD_TIME);
    const cards = getCards();
    const front = cards[cards.length - 1];
    moveCard(front, Number(front.dataset.y) + 150, Number(front.dataset.z), {
      duration: DROP_TIME,
      easing: EASE_IN,
    });
    await wait(DROP_TIME);
    worksStack.prepend(front);   // HTML 맨 앞 = 맨 뒤에 그려짐 → 다음 펼치기에서 다른 카드 뒤로 올라감
  };

  const desktopQuery = window.matchMedia('(min-width: 1200px)');
  const canPlay = () => desktopQuery.matches && !document.hidden;
  let playing = false;
  let introDone = false;
  const INTRO_HOLD = 400;            // 첫 등장 전, 겹친 상태로 보여 주는 시간

  const play = async () => {
    if (playing || !canPlay()) return;
    playing = true;
    if (!introDone) {
      // 첫 등장: 카드들이 한 자리에 겹친 모습을 잠깐 보여 준 뒤 펼침
      introDone = true;
      await wait(INTRO_HOLD);
    }
    await spread();                  // 펼치기 (처음엔 겹친 상태 → 펼친 상태)
    while (canPlay()) {
      await drop();
      await spread();
    }
    playing = false;                 // 화면이 좁아지거나 탭을 떠나면 한 바퀴 끝난 뒤 멈춤
  };

  if (reduceMotion) {
    // 움직임 없이 펼친 자리에 바로 놓기
    const cards = getCards();
    const slots = getSlots(cards.length);
    cards.forEach((card, i) => { card.style.transform = toTransform(...slots[i]); });
  } else {
    // 화면을 데스크톱 폭으로 넓히거나, 다른 탭에 갔다가 돌아오면 다시 시작
    desktopQuery.addEventListener('change', play);
    document.addEventListener('visibilitychange', play);
    play();
  }
}

/* ---------- 7. 작업 썸네일 · 커버 이미지(또는 영상) 채우기 ----------
   <img data-work-img="project-01:thumb"> 처럼 [작업 이름:이미지 종류]만 적힌 img 에
   js/works-data.js 의 경로를 넣어 줌 (썸네일 · 커버를 그 파일 한 곳에서 관리하기 위함)
   - 경로는 public 폴더 기준 → works-data.js 파일 위치로 public 폴더 주소를 알아내서 붙임
     (그래서 메인(index.html)이든 work/ 안의 페이지든 같은 경로를 그대로 씀)
   - 경로가 .mp4 / .webm / .mov 면 img 를 영상으로 바꿔 끼움
     (소리 없이 자동 재생 · 반복, 휴대폰에서도 화면 안에서 재생)
     · 영상이 불러와지기 전엔 [종류]Poster 이미지(예: thumbPoster)를 보여 줌
     · '동작 줄이기'를 켠 사용자에게는 재생하지 않고 정지 화면만 보여 줌
     · img 에 data-work-still 이 있으면 영상 대신 [종류]Poster 이미지를 씀 (작업 목록 페이지)
   - 경로가 비었거나 목록에 없으면 img 를 지움 → 자리 표시가 보임
   - 파일이 없으면 지움 → 자리 표시가 보임 */
const workImgs = document.querySelectorAll('img[data-work-img]');

if (workImgs.length) {
  const dataScript = document.querySelector('script[src$="works-data.js"]');
  const images = typeof WORK_IMAGES === 'object' ? WORK_IMAGES : {};
  // works-data.js 는 public/js/ 안에 있으므로 한 단계 위가 public 폴더
  const siteRoot = dataScript ? new URL('..', dataScript.src) : new URL('./', location.href);
  const toUrl = (path) => new URL(path, siteRoot).href;
  const isVideo = (path) => /\.(mp4|webm|mov)$/i.test(path);

  // img 자리에 넣을 영상 만들기
  const makeVideo = (src, poster) => {
    const video = document.createElement('video');
    video.muted = true;               // 소리 없이 (자동 재생하려면 꼭 필요)
    video.loop = true;
    video.playsInline = true;         // 아이폰에서 전체 화면으로 열리지 않게
    video.setAttribute('aria-hidden', 'true');   // 꾸밈용 영상이라 화면 읽기에서 제외
    if (poster) video.poster = toUrl(poster);
    if (reduceMotion) {
      video.preload = 'metadata';     // 재생하지 않고 첫 화면만
    } else {
      video.autoplay = true;
      video.preload = 'auto';
    }
    video.addEventListener('error', () => video.remove());   // 파일이 없으면 자리 표시로
    video.src = toUrl(src);
    return video;
  };

  workImgs.forEach((img) => {
    const [work, kind] = img.dataset.workImg.split(':');
    const item = images[work] || {};
    let path = item[kind];

    // data-work-still 이 붙은 자리: 영상 대신 정지 이미지([종류]Poster)를 씀 (없으면 자리 표시)
    if (path && isVideo(path) && 'workStill' in img.dataset) {
      path = item[`${kind}Poster`];
    }

    if (!path) {
      img.remove();
    } else if (isVideo(path)) {
      img.replaceWith(makeVideo(path, item[`${kind}Poster`]));
    } else {
      img.src = toUrl(path);
    }
  });
}

/* ---------- 8. Contact: 메일 주소 복사 버튼 ----------
   버튼을 누르면 data-copy 의 주소를 클립보드에 넣고,
   2초 동안 "Copied" 로 바꿔 보여 준 뒤 원래대로 돌림 */
document.querySelectorAll('.contact-copy').forEach((button) => {
  const label = button.querySelector('.contact-copy-text');
  const status = button.parentElement.querySelector('[data-copy-status]');
  const original = label.textContent;
  let timer;

  // 클립보드 API 가 안 되는 브라우저용 예전 방식
  const fallbackCopy = (text) => {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'absolute';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  };

  button.addEventListener('click', async () => {
    const text = button.dataset.copy;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = fallbackCopy(text);
    }

    label.textContent = ok ? 'Copied' : 'Failed';
    button.classList.toggle('is-copied', ok);
    if (status) status.textContent = ok ? '메일 주소를 복사했어요' : '복사하지 못했어요';

    clearTimeout(timer);
    timer = setTimeout(() => {
      label.textContent = original;
      button.classList.remove('is-copied');
      if (status) status.textContent = '';
    }, 2000);
  });
});
