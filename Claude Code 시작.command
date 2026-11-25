#!/bin/zsh
# 더블클릭하면 Claude Code를 이 폴더에서 실행합니다.
# 1) claude 명령을 찾을 수 있도록 PATH 등록 (한 번만 추가됨)
grep -q '.local/bin' ~/.zshrc 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
export PATH="$HOME/.local/bin:$PATH"
# 2) 이 파일이 있는 폴더(Claude_Work)로 이동
cd "$(dirname "$0")"
if ! command -v claude >/dev/null 2>&1; then
  echo "Claude Code를 찾을 수 없어요. 이 창을 캡처해서 Claude에게 보여주세요."
  read -k1
  exit 1
fi
clear
echo "Claude Code를 시작합니다."
echo "- 처음이면: 안내에 따라 claude.ai와 같은 계정으로 로그인하세요."
echo "- Figma 로그인: 입력창에 /mcp 입력 → figma 선택 → Authenticate"
echo ""
# 3) Claude Code 실행
claude
