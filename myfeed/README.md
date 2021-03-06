# myfeed 란 ?

<table>
 <tr>
  <td>
   <img src='https://github.com/wonsama/wonsama.github.io/blob/master/myfeed/1.png?raw=true'>
  </td>
    <td>
   <img src='https://github.com/wonsama/wonsama.github.io/blob/master/myfeed/2.png?raw=true'>
  </td>
    <td>
   <img src='https://github.com/wonsama/wonsama.github.io/blob/master/myfeed/3.png?raw=true'>
  </td>  <td>
   <img src='https://github.com/wonsama/wonsama.github.io/blob/master/myfeed/4.png?raw=true'>
  </td>
  <td>
   
  </td>
 </tr>
</table>
 

steemjs 를 활용하여 steemit에서 작성된 글 중, 내가 원하는 계정의 최신 글 목록 정보를 확인할 수 있는 프로그램 입니다. [created by wonsama](https://steemit.com/@wonsama)


# myfeed 사용방법 ( with steemit )

### TEST LINK

https://wonsama.github.io/myfeed

### 1. 조회 
1. 아이디 입력
1. 여러명인 경우 ,로 구분
1. [조회] 버튼을 누름

### 2. 더보기 
1. 검색 결과가 나온 후 맨 아래쪽 [더보기] 버튼을 누르면 이전글 확인 가능
1. [더보기] 를 했는데 버튼이 사라지면 더이상 글이 없는 경우임 

### 3. 이미지 감추기
1. SHOW IMAGE / HIDE IMAGE 를 누르면 됨
1. 선택 정보에 따라 이미지를 보여주거나 감춰줌

### 4. 그룹 생성/삭제, 그룹명 변경
1. 각각 버튼을 눌러 동작 가능
1. '기본그룹'은 삭제/변경 불가

# 참조

1. 없는 아이디의 경우 조회 전 확인 후 제거
1. 로컬저장소를 이용하여 한번 조회한 아이디는 계속 기억 (PC또는 폰 바꾸면 다름에 유의)
1. @넣으면 조회 전 자동으로 제거
1. 검색 결과가 없는 경우 자동으로 재 조회( 조회시 1000 TRX(거래)만큼 조회 )
1. 대표 이미지가 없는 경우 본문의 내용중 일부(80)를 발췌하여 보여주도록 함

# 유의사항 

* 처음 쓴글의 정보를 가지고 처리 됨에 유의바랍니다.
  * 첫번째 쓴 글에 이미지가 없으면 이후 글이 수정되어도 이미지가 보이지 않음
  * 일단 글을 쓰면 목록에 보여짐 (이후 삭제된 경우에도, 물론 클릭하면 not found)

* 조회 데이터가 없는 경우 지속적으로 조회를 수행 합니다.
  * 더보기 버튼이 사라진 경우가 더이상 볼 것이 없다는 뜻임

* 날짜 단위로 조회되는 것이아니라 거래(transaction) 단위(1000개) 로 조회되는 것입니다.
  * 거래가 많은데 글쓰기 없는 clayop 님 같은 분은 더보기를 많이 해야 보여질 수 있음
  * 이런 경우 1명만 검색바랍니다. ( 자동으로 데이터가 나올때까지 조회 됩니다. )
  * 더 보기시 재조회 된 내용만 날짜기준 정렬 됨에 유의 바랍니다.

# 피드백

* 버그 또는 건의사항이 있는 경우 [스팀잇 댓글](https://steemit.com/@wonsama) 또는 [github-issue](https://github.com/wonsama/wonsama.github.io/issues) 남겨주시면 감사하겠습니다.

# 변경이력 

## 2018.05.28 ver 1.1

* '제목,시간,작가' 벳지 스타일로 변경
* 하단 그룹을 하나로 합쳐줌. ( 조회결과 내용을 더 많이 보기 위함. )
* 그룹 기능 추가됨
  * 그룹 조회 : 조회 시 해당 그룹에 자동으로 유저 정보가 추가됨
  * 그룹 추가 : 빈 그룹 정보가 추가됨
  * 그룹 삭제 : 현재 선택된 그룹 정보가 삭제됨 ( 기본그룹은 삭제불가 )

## 2018.05.24 ver 1.0

* 최초 작성
