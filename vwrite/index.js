/*
https://steemconnect.com/apps/@wonsama.quiz/edit
*/
const URL_JW = 'http://jwsnt.co.kr/vwrite/';
const URL_GITHUB = 'https://wonsama.github.io/vwrite/';

/*
* 로컬 스토리지에 저장된 토큰 정보
*/
const access_token = localStorage.getItem('access_token');

/*
* API를 토큰 정보를 가지고서 초기화 한다
*/
const api = sc2.Initialize({
  app: 'wonsama.quiz',
  callbackURL: URL_JW,
  accessToken: access_token,
  scope: ['comment']
});

/*
* 주소 정보를 파싱하여 파라미터 정보를 반환한다
*/
function getJsonFromUrl() {
  var query = location.search.substr(1);
  var result = {};
  query.split("&").forEach(function(part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}

/*
* 주소정보를 파싱한 이후 화면을 다시 리다이렉트 처리
*/ 
function checkParams(){
	// 주소정보를 가져온다 - 파라미터 파싱을 위함
	let params = getJsonFromUrl();
	if(params.access_token){
		// 로그인을 하여 콜백이 넘어온 상태임 - 로컬 스토리지에 해당 토큰 정보를 저장 
		localStorage.setItem('access_token', params.access_token);
		location.href = '/vwrite';	// 주소창에서 토큰 정보를 지워주기 위함
	}
}

/*
* 로그인 정보를 그려준다
*/
function drawLogin(){

	let template = [];

	// 로그인 버튼 삽입
	template.push(`<div id='btnLogin'>로그인</div>`);
	template.push(`<br>`);
	template.push(`<span class="d-block p-2 bg-warning text-dark text-center">로그인을 해야 서비스를 이용할 수 있습니다</span>`);
	$("#divLoginInfo").html( template.join('') );

	// 로그인 이벤트 등록
	$("#btnLogin").click(evt=>{

		$("#lock").show();

		// 로그인을 수행한다
		location.href = api.getLoginURL();
	});
}

/*
* 로그아웃 영역 그리기 및 이벤트 등록
*/
function drawLogoutArea(res){
	let template = [];
	let logo = `<img width=30 height=30 src='https://steemitimages.com/u/${res.name}/avatar' />`;

	// 로그아웃 버튼 삽입
	template.push(` <div id='btnLogin'>${logo} ${res.name} 로그아웃 </div>`);
	$("#divLoginInfo").html( template.join('') );

	// 로그아웃 이벤트 등록
	$("#btnLogin").click(evt=>{

		$("#lock").show();
		// 로그아웃 수행
		api.revokeToken(function (err, res) {

			$("#lock").hide();

			if(!err){
				localStorage.removeItem('access_token');
				// 이후 화면 갱신
				localStorage.removeItem('access_token');
				location.href = '/vwrite';
			}else{
				alert(err);
			}
		});
	});	
}

/*
* 유효성 검증 및 글쓰기
*/
function writeComment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata){

	let myString = $("#txtDesc").val();

	// 제목, 내용 미기입 유효성 검증
	if($.trim(title)==''){
		alert('제목을 입력 바랍니다.');
		return;
	}
	if($.trim(myString)==''){
		alert('내용을 입력 바랍니다');
		return;
	}

	// 글쓰기
	$("#lock").show();
	api.comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, function (err, res) {
	  $("#lock").hide();

	  if(!err){
	  	// 결과 수신 후 링크 정보를 화면에 추가한다
	  	let link = `https://steemit.com/${parentPermlink}/@${author}/${permlink}`;
	  	$("#divWrite").append(`<div><a href='${link}'>[ 작성된 글 보기 ]</a> 을(를) 눌러 결과를 확인하세요.</div>`);
	  }else{
	  	alert(err);
	  }
	});
}

/*
* 글쓰기 영역 그리기 및 이벤트 등록
*/
function drawWriteArea(res){
	let template = [];

	// 제목
	template.push(`<div class="input-group mb-3">`);
	template.push(`	<div class="input-group-prepend">`);
	template.push(`		<span class="input-group-text" id="basic-addon1">제목</span>`);
	template.push(`	</div>`);
	template.push(`	<input type="text" id='txtTitle' class="form-control" placeholder="제목을 입력 바랍니다." aria-label="Title" aria-describedby="basic-addon1">`);
	template.push(`</div>`);

	// 내용
	template.push(`<div class="input-group">`);
	template.push(`	<div class="input-group-prepend">`);
	template.push(`		<span class="input-group-text">내용</span>`);
	template.push(`	</div>`);
	template.push(`	<textarea rows="10" id='txtDesc'class="form-control" aria-label="Description"></textarea>`);
	template.push(`</div>`);

	// 버튼
	template.push(`<br>`);
	template.push(`<div class='text-right'><button id='btnWrite' type="button" class="btn btn-secondary">글쓰기</button></div>`);
	template.push(`<br>`);
	
	// 미리보기 
	template.push(`<span class="badge badge-pill badge-primary"> 미리보기 </span>`);
	template.push(`<div id="divPreview" class='preview'></div>`); // markdown 미리보기 영역 
	$("#divWrite").html(template.join(''));

	$("#divPreview").css('border', '1px solid black');
	$("#divPreview").css('width', '100%');
	$("#divPreview").css('padding', '10px');
	$("#divPreview").css('word-wrap', 'break-word');

	// 마크다운 미리보기 이벤트 등록
	let converter = new showdown.Converter();
	$("#txtDesc").keyup(evt=>{
		let preview  = converter.makeHtml( $("#txtDesc").val() );
		$("#divPreview").html(preview);
		$("img").css('max-width','100%');
	});

	// 글쓰기 버튼 이벤트 등록
	$("#btnWrite").click(evt=>{
		let myString = $("#txtDesc").val();
  	let myPassword = res.name;
  	let encrypted = CryptoJS.AES.encrypt(myString, myPassword);
  	
  	let parentAuthor = '';
  	let parentPermlink = 'voteview';	// category 일반적으로 tag의 첫번째 것을 추출하여 넣어줌
  	let author = res.name;
  	let permlink = `voteview-${res.name}-${new Date().getTime()}`
  	let title = $("#txtTitle").val();
  	let jsonMetadata = JSON.stringify({
			"tags": ['voteview'], /* 일단 기본적으로 태그는 1개만 사용하도록, 사용자 입력 받지 않게 처리 */
			"app":"voteview/0.1", /* 추후 app 버전에 따라 파싱등을 분기 처리할 필요도 있을까나 ?*/
			"format":"markdown"
  	});
  	
  	template = [];
  	let goRead = `https://wonsama.github.com/vread/?author=${author}&permlink=${permlink}`;
  	let goWrite = `https://wonsama.github.com/vwrite/`;
  	template.push(`# 보팅을 하면 글이 보입니다.\n`);
  	template.push(`<hr>`);
  	template.push( encrypted.toString() );
  	template.push(`<hr>\n\n`);
  	template.push(`# 위 글은 암호화 되었습니다.\n`);
  	template.push(`* 보팅을 하신 이후 [글보러 가기](${goRead})\n`);
  	template.push(`* 암호화 된 글을 쓰고 싶으시면 [글쓰러 가기](${goWrite})\n\n`);
  	template.push(`> [참조] 스팀잇에서는 보팅해도 안보입니다. [글보러 가기](${goRead}) 를 누르세요\n`);
  	template.push(`> [voteview 메뉴얼 바로가기](https://steemit.com/kr/@wonsama/voteview-nono)`);
  	template.push(`> created by @wonsama`);
  	
  	let body = template.join('');

  	// 유효성 검증 및 글쓰기
 		writeComment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata); 	
	});
}

/*
* 로그아웃 정보를 그려준다
*/
function drawLogout() {

	// 로그인 정보 가져오기
	$("#lock").show();
	api.me(function (err, res) {

		$("#lock").hide();
	  if(!err){

	  	// 로그아웃 영역 그리기 및 이벤트 등록
			drawLogoutArea(res);

			// 글쓰기 영역 그리기 및 이벤트 등록
			drawWriteArea(res);

	  }else{

	  	// 로그인 실패 시 처리
	  	alert(err);	
	  }
	});
}

function initScreen() {

	$("#lock").hide();

	// 주소정보를 파싱한 이후 화면을 다시 리다이렉트 처리
	checkParams();

	// 로컬스토리지 정보를 가져온다	
	if(access_token){		
		// 로그인 된 상태 
		drawLogout();
	}else{
		// 로그아웃 된 상태
		drawLogin();	
	}
}

function initApp() {
	// 로컬스토리지 기준 화면을 초기화 한다
	initScreen();
}


// 진입점
(() =>{
	// 앱을 초기화 한다
	initApp();
})();



// http://jwsnt.co.kr/vwrite/?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYXBwIiwicHJveHkiOiJ3b25zYW1hLnF1aXoiLCJ1c2VyIjoid29uc2FtYSIsInNjb3BlIjpbInZvdGUiLCJjb21tZW50Il0sImlhdCI6MTUzMDI1MTU1MywiZXhwIjoxNTMwODU2MzUzfQ.QjUp_bowSM2BKgJ9KoLqpM168_EfEmSi5bRuJbvxJ3Y&expires_in=604800&state=1%2C2%2C3&username=wonsama