---
title: github blog 설정
date: 2024-04-18 17:00:00 +0900
categories: [settings]
tags: [github, blog, ruby, jekyll, docs, giscus]
---

## 설치 ( 루비, jekyll, chirpy starter(theme) )

- [rubyinstaller](https://rubyinstaller.org/)

  - 루비 설치

- [chirpy : jekyll theme](https://chirpy.cotes.page/)
  - 정적 사이트 생성기 jekyll 의 chirpy theme
  - github template 사용하여 설치하는 것을 추천

## 추가설치 플러그인

- [jekyll-target-blank](https://github.com/keithmifsud/jekyll-target-blank) : 플러그인을 사용하여 target="\_blank" 속성을 사용할 수 있다.

## Google Ad 승인 이후 script 추가하는 방법

- 최상위 경로에 `_includes` 폴더를 생성 후 `head.html` 파일을 복사한다
- `head.html` 파일은 gems/테마폴더 하위에 위치한다
- `윈도우즈 예시)` : `D:\Ruby32-x64\lib\ruby\gems\3.2.0\gems\jekyll-theme-chirpy-6.5.5\_includes`

이후 head.html 에 복사한 구글광고 스크립트를 추가하면 전체 페이지에 반영된다

## 참조링크

- [favicon-generator](https://www.favicon-generator.org/)
- [chirpy : option-1-using-the-chirpy-starter](https://chirpy.cotes.page/posts/getting-started/#option-1-using-the-chirpy-starter)
- [jekyllrb : docs](https://jekyllrb.com/docs/)
- [giscus](https://giscus.app/ko)
