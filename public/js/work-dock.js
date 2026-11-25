/* =========================================================
   하단 플로팅 챕터 표시 (Work 상세 페이지 공통) — 스타일은 css/work-dock.css
   - LG에너지솔루션 페이지의 .lg-dock 과 같은 동작:
     히어로를 지나면 나타나고, 다음 작업 영역에 가까워지면 숨음
     현재 챕터 이름 + 전체 진행률 + 챕터 점(누르면 이동)
   - 쓰는 법: 섹션에 data-chapter="이름" (id 가 없으면 자동으로 붙임)
   - 표시 글자는 섹션 안의 라벨("02 — Main Page")을 그대로 읽어 옴 → 라벨과 항상 일치
     번호 라벨이 없는 섹션(Intro 등)은 data-chapter 이름만 표시
             어두운 섹션에는 data-dark → 그 위에서 독 색 반전
   - 페이지에 이미 .lg-dock 이 있으면(LG 페이지) 아무것도 하지 않음
   ========================================================= */
(() => {
  if (document.querySelector('.lg-dock')) return;

  const chapters = [...document.querySelectorAll('main [data-chapter]')];
  if (chapters.length < 2) return;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // 섹션 라벨에서 번호 · 이름 읽기 (.num 이 든 첫 라벨)
  const titles = chapters.map((c) => {
    const num = c.querySelector('.section-label .num, .lg-label .num');
    if (!num) return c.dataset.chapter;
    return num.parentElement.textContent.replace(/\s+/g, ' ').trim();
  });

  // 1) 마크업 만들기 (.page 밖, body 끝에 둬야 페이지 전환 transform 의 영향을 안 받음)
  const dock = document.createElement('nav');
  dock.className = 'work-dock';
  dock.setAttribute('aria-label', '챕터 이동');
  dock.innerHTML =
    '<span class="work-dock-label">Intro</span>' +
    '<span class="work-dock-bar" aria-hidden="true"><i></i></span>' +
    '<ol class="work-dock-dots"></ol>';

  const label = dock.querySelector('.work-dock-label');
  const bar = dock.querySelector('.work-dock-bar i');
  const list = dock.querySelector('.work-dock-dots');

  const links = chapters.map((c, i) => {
    if (!c.id) c.id = `chapter-${i + 1}`;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${c.id}`;
    a.setAttribute('aria-label', titles[i]);
    li.append(a);
    list.append(li);
    return a;
  });

  document.body.append(dock);

  const darkSections = [...document.querySelectorAll('[data-dark]')];
  const nextEl = document.querySelector('.work-next, .lg-next');

  // 2) 스크롤마다 갱신
  let ticking = false;

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - vh;

    const nearEnd = nextEl && nextEl.getBoundingClientRect().top < vh * 0.7;
    dock.classList.toggle('is-visible', y > vh * 0.6 && !nearEnd);
    bar.style.setProperty('--progress', clamp(max > 0 ? y / max : 0).toFixed(3));

    // 현재 챕터 = 화면 40% 선을 지난 마지막 섹션 (아직 없으면 Intro)
    const line = vh * 0.4;
    let idx = -1;
    chapters.forEach((c, i) => {
      if (c.getBoundingClientRect().top <= line) idx = i;
    });
    const text = idx < 0 ? 'Intro' : titles[idx];
    if (label.textContent !== text) label.textContent = text;
    links.forEach((a, i) => {
      const on = i === idx;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });

    // 독이 어두운 섹션 위에 있으면 색 반전
    const dockY = vh - 40;
    const onDark = darkSections.some((s) => {
      const r = s.getBoundingClientRect();
      return r.top < dockY && r.bottom > dockY;
    });
    dock.classList.toggle('is-dark', onDark);
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', update);
  update();
})();
