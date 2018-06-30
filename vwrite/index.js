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
  callbackURL: URL_GITHUB,
  accessToken: access_token,
  scope: ['comment', 'vote']
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
	$("#divLoginInfo").html( template.join('') );

	// 로그인 이벤트 등록
	$("#btnLogin").click(evt=>{

		$("#loaderBg").show();

		// 로그인을 수행한다
		location.href = api.getLoginURL();
	});
}

/*
* 로그아웃 정보를 그려준다
*/
function drawLogout() {

	let template = [];

	// 로그인 정보 가져오기
	$("#loaderBg").show();
	api.me(function (err, res) {

		$("#loaderBg").hide();
	  if(!err){

	  	let logo = `<img width=30 height=30 src='https://steemitimages.com/u/${res.name}/avatar' />`;

			// 로그아웃 버튼 삽입
			template.push(` <div id='btnLogin'>${logo} ${res.name} 로그아웃 </div>`);
			$("#divLoginInfo").html( template.join('') );

			// 로그아웃 이벤트 등록
			$("#btnLogin").click(evt=>{

				$("#loaderBg").show();
				// 로그아웃 수행
				api.revokeToken(function (err, res) {

					$("#loaderBg").hide();

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

			// 글쓰기 공간 삽입
			template = [];
			template.push(`<label for='txtTitle'>제목 : </label>`);
			template.push(`<input type='text' id='txtTitle' class='title'></input><br/><br/>`);
			template.push(`<label for='txtDesc'>내용 : </label><br/>`);
			template.push(`<textarea rows="10" cols="50" id="txtDesc" class='desc'></textarea><br/><br/>`);
			template.push(`<div id="btnWrite">글쓰기</div>`);
			$("#divWrite").html(template.join(''));

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
		    	template.push(`> [참조] 스팀잇에서는 보팅해도 안보입니다. [글보러 가기](${goRead}) 를 눌러주세요\n`);
		    	template.push(`> created by @wonsama`);
		    	
		    	let body = template.join('');

		    	// 제목, 내용 미기입 유효성 검증
		    	if($.trim(title)==''){
		    		alert('제목을 입력 바랍니다.');
		    		return;
		    	}
		    	if($.trim(myString)==''){
		    		alert('내용을 입력 바랍니다');
		    		return;
		    	}
		    	

		    	$("#loaderBg").show();
		    	api.comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, function (err, res) {
					  $("#loaderBg").hide();

					  if(!err){
					  	let link = `https://steemit.com/${parentPermlink}/@${author}/${permlink}`;
					  	$("#divWrite").append(`<div><a href='${link}'>${link}</a> 에서 결과를 보실 수 있습니다.</div>`);
					  }else{
					  	alert(err);
					  }
					});
				});

	  }else{

	  	// 로그인 실패 시 처리
	  	alert(err);	
	  }
	});
}

function initScreen() {

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