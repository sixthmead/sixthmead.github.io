/* =========================================================
   헤더 로고 애니메이션 (참고: Dribbble "&more" 후반부)
   - 트랜스포머처럼 변신: 가운데 접혀 있던 부품들이
     ① 가로로 슬라이드 → ② 90° 단위 회전·확장 → ③ 세로로 맞물려 철컥 잠김
     (코어에 가까운 부품부터 차례로 펼쳐짐)
   - 페이지 로드 시 1회 + 로고에 마우스를 올리면 다시 재생
   - <img src=".../logo.svg"> 를 같은 모양의 인라인 SVG 로 바꿔서
     조각(path)마다 따로 움직임
   ========================================================= */
(function () {
  var SVG =
    '<svg class="logo-svg" viewBox="0 0 296 48" width="296" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Yi Jinkwang">' +
    '<defs>' +
    '<linearGradient id="logo_g0" x1="80" y1="16" x2="80" y2="32" gradientUnits="userSpaceOnUse"><stop stop-color="#A747F6"/><stop offset="1" stop-color="#E05EA0"/></linearGradient>' +
    '<linearGradient id="logo_g1" x1="136" y1="16" x2="136" y2="32" gradientUnits="userSpaceOnUse"><stop stop-color="#A747F6"/><stop offset="1" stop-color="#E05EA0"/></linearGradient>' +
    '<linearGradient id="logo_g2" x1="276" y1="0" x2="276" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#A747F6"/><stop offset="1" stop-color="#E05EA0"/></linearGradient>' +
    '</defs>' +
    '<path d="M48 0L0 48H17.6L33.6 32V48H48V0Z" fill="#FF6B6B"/>' +
    '<path d="M72 0H88V48H72V0Z" fill="#FF6B6B"/>' +
    '<path d="M56 16H104V32H56V16Z" fill="url(#logo_g0)"/>' +
    '<path d="M136 0C122.744 0 112 10.744 112 24C112 37.256 122.744 48 136 48C149.256 48 160 37.256 160 24C160 10.744 149.256 0 136 0ZM136 40C127.164 40 120 32.836 120 24C120 15.164 127.164 8 136 8C144.836 8 152 15.164 152 24C152 32.836 144.836 40 136 40Z" fill-rule="evenodd" clip-rule="evenodd" fill="#FF6B6B"/>' +
    '<path d="M136 16C140.42 16 144 19.58 144 24C144 28.42 140.42 32 136 32C131.58 32 128 28.42 128 24C128 19.58 131.58 16 136 16Z" fill="url(#logo_g1)"/>' +
    '<path d="M168 24H216V48H168V24Z" fill="#FF6B6B"/>' +
    '<path d="M192 24H168V0" fill="#FF6B6B"/>' +
    '<path d="M216 0V24H192" fill="#FF6B6B"/>' +
    '<path d="M224 0H240V48H224V0Z" fill="#FF6B6B"/>' +
    '<path d="M248 0H264V48H248V0Z" fill="#FF6B6B"/>' +
    '<path d="M248 48V0L296 48" fill="#FF6B6B"/>' +
    '<path d="M264 24V0H288" fill="url(#logo_g2)"/>' +
    '</svg>';

  var img = document.querySelector('.logo img[src$="logo.svg"]');
  if (!img) return;

  var wrap = document.createElement('span');
  wrap.innerHTML = SVG;
  var svg = wrap.firstChild;
  img.replaceWith(svg);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !svg.animate) return;

  var pieces = Array.prototype.slice.call(svg.querySelectorAll('path'));
  var CX = 148;                       // 로고 가로 가운데 (SVG 좌표)
  // 기계적인 "착-착" 느낌: 빠르게 움직이고 딱 멈춤
  var MECH = 'cubic-bezier(0.75, 0, 0.15, 1)';
  var HOLD = 'linear';
  var ROT = [90, -90, 180, -180];     // 90° 단위로만 접혀 있음
  var running = false;

  // 조각 정보(중심, 가운데까지 거리)를 한 번만 계산
  var info = pieces.map(function (p, i) {
    var b = p.getBBox();
    var cx = b.x + b.width / 2;
    return { p: p, dx: CX - cx, dist: Math.abs(CX - cx), i: i };
  });
  // 가운데(코어)에 가까운 부품부터 펼쳐지도록 순서 매김
  var order = info.slice().sort(function (a, b) { return a.dist - b.dist; });
  order.forEach(function (o, rank) { o.rank = rank; });

  function t(x, y, r, s) {
    return 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg) scale(' + s + ')';
  }

  function play() {
    if (running) return;
    running = true;
    var maxEnd = 0, lastAnim;

    info.forEach(function (o) {
      // 접힌 상태: 모두 가운데로 모여 위아래로 층층이 쌓여 있음
      var sy = ((o.rank % 2) ? 1 : -1) * (6 + (o.rank % 4) * 7);
      var r0 = ROT[(o.i + o.rank) % ROT.length];
      var dx = o.dx;
      var kick = dx === 0 ? 0 : -Math.sign(dx) * 3;   // 잠길 때 반동 방향

      var delay = o.rank * 45;
      var anim = o.p.animate([
        // 1) 코어 블록 등장 (작게 접힌 상태)
        { offset: 0,    transform: t(dx, sy, r0, 0.2),  opacity: 0, easing: MECH },
        { offset: 0.1,  transform: t(dx, sy, r0, 0.5),  opacity: 1, easing: HOLD },
        { offset: 0.16, transform: t(dx, sy, r0, 0.5),  opacity: 1, easing: MECH },
        // 2) 가로로 슬라이드해 제 칸으로 뻗어 나감
        { offset: 0.4,  transform: t(0, sy, r0, 0.5),   opacity: 1, easing: HOLD },
        { offset: 0.46, transform: t(0, sy, r0, 0.5),   opacity: 1, easing: MECH },
        // 3) 90° 단위로 회전하며 펼쳐짐 + 원래 크기로 확장
        { offset: 0.66, transform: t(0, sy, 0, 1),      opacity: 1, easing: HOLD },
        { offset: 0.71, transform: t(0, sy, 0, 1),      opacity: 1, easing: MECH },
        // 4) 세로로 맞물리며 잠김 (철컥 반동)
        { offset: 0.86, transform: t(kick, 0, 0, 1.05), opacity: 1, easing: 'ease-out' },
        { offset: 0.93, transform: t(-kick / 3, 0, 0, 0.98), opacity: 1, easing: 'ease-in-out' },
        { offset: 1,    transform: t(0, 0, 0, 1),       opacity: 1 }
      ], {
        duration: 1900,
        delay: delay,
        fill: 'backwards'
      });
      if (delay >= maxEnd) { maxEnd = delay; lastAnim = anim; }
    });

    // 마지막 부품이 잠기는 순간 로고 전체가 살짝 "쿵"
    lastAnim.onfinish = function () {
      svg.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(1.5px)', offset: 0.35 },
        { transform: 'translateY(0)' }
      ], { duration: 220, easing: 'ease-out' });
      running = false;
    };
  }

  // 각 조각이 자기 중심을 기준으로 돌고 커지게
  pieces.forEach(function (p) {
    p.style.transformBox = 'fill-box';
    p.style.transformOrigin = 'center';
  });

  play();
  svg.closest('.logo').addEventListener('mouseenter', play);
})();
