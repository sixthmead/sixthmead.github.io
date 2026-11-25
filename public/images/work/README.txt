작업 이미지 폴더

[폴더 구조]
images/work/project-01/ ~ project-05/  (작업 번호마다 폴더 하나)

[썸네일 · 커버 → js/works-data.js 한 곳에서 관리]
- thumb : 썸네일. 메인 Works 카드 + 작업 목록 페이지(데스크톱 스택 · 모바일 목록)에 함께 쓰임
          가로형(약 16:10 ~ 4:3)을 권장. 비율이 달라도 가운데 기준으로 잘려서 꽉 참
- cover : 상세 페이지의 커버 + 제목 옆 작은 썸네일
- 기본 경로는 project-0N/thumb.jpg, project-0N/cover.jpg
  → 이 이름으로 넣으면 바로 보이고, 다른 이름·형식(.png, .webp)을 쓰려면 js/works-data.js 의 경로만 고치면 됨

[갤러리 → 각 상세 페이지 HTML 에서 관리]
- gallery-01.jpg ~ gallery-03.jpg : 상세 페이지 갤러리

[참고]
- 파일이 없으면 자동으로 자리 표시(회색 또는 보라~핑크 그라데이션)가 보입니다.

[project-03 GUT Morning · project-04 Goodiez 추가 이미지]
- screen-01.jpg ~ screen-03.jpg : 모바일 화면 3장 (세로 9:19.5, 권장 1080×2340)
- gallery-01.jpg : 넓은 이미지 16:9 (권장 2560×1440)
- gallery-02.jpg ~ gallery-03.jpg : 나란히 2장 4:5 (권장 1600×2000)
- 각 상세 HTML 맨 위 주석에 자리별 추천 내용이 적혀 있음

[project-05 Good Neighbors]
- thumb.jpg / cover.jpg 를 넣으면 목록·상세에 바로 보임 (경로는 js/works-data.js)
- gallery-01~03.jpg, screen-01~03.jpg 는 project-03 · 04 와 같은 규칙
