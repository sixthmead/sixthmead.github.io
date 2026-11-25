# CLAUDE.md

## [프로젝트]
내 포트폴리오 사이트. 순수 HTML, CSS, JavaScript만 쓰고 프레임워크는 쓰지 않아. 파일은 public/ 폴더 안에만 만들어. 배포는 GitHub Pages(무료, 공개 저장소)로 하고, public/ 폴더를 GitHub Actions로 게시해. 배포 설정 파일(.github/workflows/)만 public/ 밖에 둬도 돼. Cloudflare, Netlify, Vercel은 쓰지 않아. 원본 파일(.psd 등)과 _to_delete/ 같은 임시 폴더는 공개 저장소에 올리지 않아.

## [레퍼런스]
bigly.studio의 구조와 분위기만 참고해. 문구, 이미지, 영상, 로고, 코드는 절대 복사하지 마.

## [디자인]
배경 #FFFFFF(흰색), 본문 #0A0A0A, 포인트 색은 보라→핑크 그라데이션(#A747F6 → #E05EA0), 그라데이션을 못 쓰는 곳은 중간색 #C352CB. 큰 제목과 넉넉한 여백. 섹션 라벨은 괄호 없이 "09 — Outcome" 형식(번호만 Bold, 번호 없는 라벨은 "About"처럼 글자만), 번호는 01 형식. 글꼴은 영문 Montserrat(Google Fonts, 굵기 100~900), 한글 Pretendard. 프로젝트 페이지 안의 실제 서비스 서체 견본(Goodiez·Good Neighbors의 Montserrat, Noul의 Open Sans 등)은 원래 서체 유지. 큰 제목 굵기 700, 작은 라벨 글자는 Light 300. 자간(letter-spacing)은 전체 -0.5px (그림 SVG 안 글자만 0). 이탤릭은 로고 옆 인사말과 메인 히어로의 "UI/UX Designer"·About 제목의 "Design Partner"(Times New Roman 이탤릭, class hero-title-serif), 프로젝트 페이지 번호형 섹션 제목의 이름 부분(예: "08 — Mobile"의 Mobile, Times New Roman 이탤릭 Bold, 색 rgba(10,10,10,0.55)·어두운 배경은 반투명 흰색. "Next project"도 같은 스타일)에만.
글자 크기는 css/style.css 의 타입 스케일 11단계(var(--t-…))만 사용 (1440px 기준): display 88 · h1 64(섹션 제목) · h2 48(강조 문장) · h3 32 · h4 24 · lead 20 · body-lg 18 · body 16 · sm 14 · caption 13 · micro 11. 새 요소도 이 중에서 고르고 임의 크기를 만들지 않기 (목업 속 가짜 UI·타이포그래피 견본은 예외). 굵기 400(보통)인 본문·설명·링크·캡션은 각 단계의 80% 버전(var(--t-lead-r), --t-body-lg-r(예외: 16px), --t-body-r, --t-sm-r, --t-caption-r)을 쓰고, 제목·강조(500~700)와 라벨(300)은 원래 단계를 씀.

## [페이지 구성]
1. 히어로(한 줄 소개 + 문장 안에 작은 이미지가 끼는 연출)
2. 서비스 3개
3. 대표 작업 4개(카드 클릭 시 work/ 상세 페이지)
4. 미션
5. 강점 3개
6. 소개
7. 컨택트와 SNS

## [작업 규칙]
한 번에 한 섹션만 작업, 모바일 우선 반응형, 이해하기 쉬운 주석, 파일을 바꾸기 전에 무엇을 바꿀지 먼저 설명.
