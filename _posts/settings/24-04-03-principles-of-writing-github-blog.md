---
title: github blog 작성 원칙
date: 2024-04-03 13:00:00 +0900
categories: [settings]
tags: [github, blog, principles]
---

## 개요

아래 내용을 준수하여 글을 작성하기 위해 작성된 문서이다.

## `_posts` 폴더구조 / categories

폴더구조 = categories 를 의미한다.

- 아래 폴더구조는 글이 작성됨에 따라 변경 될 예정
- 폴더명은 반드시 영문 소문자로 작성
- 폴더는(카테고리) 최대 2단계까지 구성

```tree
📦_posts
 ┣ 📂daily : 그날의 IT뉴스
 ┣ 📂dev
 ┃ ┣ 📂nest : nest
 ┃ ┗ 📂nextjs : nextjs
 ┣ 📂ref : 참조정보
```

## 파일명

`YY-MM-DD-제목.md`

## 제목

- 한글 제목을 영문 번역하여 사용
- 공백은 `-` 로 대체

## front matter

아래 4가지 속성 정보를 사용

```yaml
# 사용 예시
title: github blog 작성 원칙
date: 2024-04-03 14:33:00 +0900
categories: [ruleset]
tags: [TAG]
```

## assets 작성

- 이미지는 `assets/posts/카테고리/하위카테고리/파일명` 으로 작성
- `파일명` 은 `YY-MM-DD-제목-순번` 으로 작성 (순번은 01 부터 99 까지)
