/* =========================================================
   작업 이미지 목록 (썸네일 · 커버를 이 파일 한 곳에서 관리)

   - thumb : 썸네일 → 메인 Works 카드, 작업 목록 페이지(데스크톱 스택 · 모바일 목록)
   - cover : 커버   → 상세 페이지의 큰 커버 이미지 + 제목 옆 작은 썸네일

   [바꾸는 법]
   - 경로만 고치면 그 이미지가 쓰이는 모든 페이지에 한 번에 반영됨
   - 경로는 public 폴더 기준으로 적기 (예: 'images/work/project-01/thumb.jpg')
   - .png / .webp 도 그대로 쓸 수 있음 (예: 'images/work/project-01/main.png')
   - 영상(.mp4 / .webm / .mov)도 됨 → 소리 없이 자동 재생 · 반복
     thumbPoster(또는 coverPoster)에 이미지를 적어 두면 영상이 불러와지기 전에 그 이미지가 보임
   - 비워 두거나('') 파일이 없으면 자리 표시(회색 · 그라데이션)가 보임

   [작업 추가]
   - 아래에 'project-05': { thumb: '...', cover: '...' }, 처럼 한 줄 추가
   - HTML 에서는 <img data-work-img="project-05:thumb"> 처럼 이름만 적으면 됨
   ========================================================= */
const WORK_IMAGES = {
  'project-01': {
    thumb: 'images/work/project-01/thumb.mp4',
    thumbPoster: 'images/work/project-01/thumb.jpg',   // 영상이 불러와지기 전 + 작업 목록 페이지에서 보일 이미지
    cover: 'images/work/project-01/cover.jpg',
  },
  'project-02': {
    thumb: 'images/work/project-02/thumb.jpg',
    cover: 'images/work/project-02/cover.jpg',
  },
  'project-03': {
    thumb: 'images/work/project-03/thumb.jpg',
    cover: 'images/work/project-03/cover.jpg',
  },
  'project-04': {
    thumb: 'images/work/project-04/thumb.jpg',
    cover: 'images/work/project-04/cover.jpg',
  },
  'project-05': {
    thumb: 'images/work/project-05/thumb.jpg',
    cover: 'images/work/project-05/cover.jpg',
  },
  'project-07': {
    thumb: 'images/work/project-07/thumb.jpg',
    cover: 'images/work/project-07/cover.jpg',
  },
};
