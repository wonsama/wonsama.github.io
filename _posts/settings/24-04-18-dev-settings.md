---
title: 나의 개발 환경 구성
date: 2024-04-18 17:30:00 +0900
categories: [settings]
tags: [dev, tools, environment]
---

잘 만드는 것도 중요하지만, 우선 만드는 것이 중요하다고 생각하는 요즘 ...

## Language

- [x] Node.js
- [ ] Bun - NodeJS 보다 성능이 좋다 함. 윈도우즈의 경우 우분투에 설치해야 되는 불편함이 있음.
- [x] Java - Spring Boot / 간단한 배치 어플리케이션 만들때 사용, JPA 대신 mybatis 에 익숙함
- [ ] Kotlin - 사용하지 않음 / 또 배워야 한다 ...
- [x] Python - AI 개발관련 langchain / Django / Flask 사용
- [x] Flutter - 모바일 앱 개발 / Dart / React Native 도 좋지만 호환성 문제가 터지면 관리하기가 쉽지 않음
- [x] Godot - 2D 플렛포머 게임 개발 / GDScript 사용 / 사실 c# 기반 유니티가 좋지만 오픈소스 라이센스 때문에 사용 / 대체제로 Phaser.js 사용해도 좋음

## Web Development

- [x] jquery - 후다닥 개발할때 아주 좋음 / express + pug + jquery 사용 중
- [x] nest - NodeJs 프레임워크 / Spring Boot 와 유사 / Typescript 사용 / prisma + postgresql 조합으로 rest api 구성할때 좋음
- [x] nextjs - React 프레임워크 / shadcn + tailwindcss + nextjs 조합으로 화면 개발할 때 좋음 / backend 는 express 또는 nest 사용 중

## DB

- [x] mariaDB : mysql 오픈소스 버전
- [x] postgreSQL : maria 보단 postgresql 이 더 좋다고 함 / 둘 다 뭐 비슷함 사실 ...
- [x] oracle : 최근에는 거의 사용하지 않음 / 금융 프로젝트 할땐 자주 사용한듯

## DB Client

- [x] DBeaver : DB Client 로는 이게 젤 무난 한듯 / 대체제로 vscode 의 확장팩도 있지만 별도로 사용하는 것을 추천

## IDE

- [x] vscode : flutter / springboot / nestjs / nextjs 개발할때 사용 중 ( godot 빼고 사실상 다 이거 쓰는 듯 )
