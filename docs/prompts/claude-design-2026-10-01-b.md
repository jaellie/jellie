# Claude Design에 붙여넣을 프롬프트 (2026-10-01 · 로고)

```
첨부한 로고 이미지 2개를 게임에 넣어줘. (투명 배경 PNG, 픽셀아트)
- logo-ko.png : 두근두근, 내 운명의 사람
- logo-en.png : Doki Doki Destiny Lover

1. 첫 화면(언어 고르기)
   - 맨 위 큰 제목 글자 대신 로고 이미지. 가로 약 화면의 85%, 가운데 정렬.
   - 처음엔 폰 언어로 보여주기: navigator.language 가 "ko"로 시작하면 logo-ko, 아니면 logo-en.
   - [한국어] / [English] 버튼에 손가락을 올리거나(hover/터치) 누르면 그 언어 로고로 바뀌게.

2. 설정 화면 맨 위
   - 고른 언어의 로고를 작게 (가로 약 65%). 한국어 → logo-ko, English → logo-en.
   - [새 인생]으로 첫 화면에 돌아오면 다시 1번처럼.

3. 공통
   - image-rendering: pixelated (픽셀이 흐려지지 않게), 정수배가 아니어도 괜찮지만 너무 작게 줄이진 말기.
   - alt 텍스트: "두근두근, 내 운명의 사람" / "Doki Doki Destiny Lover".
```
