/* =========================================================
   About 페이지 전용 스크립트
   - [data-reveal] 요소가 화면에 들어오면 .is-in 을 붙여 아래에서 올라오게 함 (about.css 6번)
   - 한 번 나타난 요소는 다시 숨기지 않음
   - IntersectionObserver 를 못 쓰는 브라우저 · 동작 줄이기 설정이면 바로 모두 보여 줌
   ========================================================= */
(function () {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  items.forEach((el) => io.observe(el));
})();
