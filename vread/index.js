/*
https://steemconnect.com/apps/@wonsama.quiz/edit
*/
const URL_JW = 'http://jwsnt.co.kr/vread/';
const URL_GITHUB = 'https://wonsama.github.io/vread/';

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
		location.href = '/vread';	// 주소창에서 토큰 정보를 지워주기 위함
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
						location.href = '/vread';
					}else{
						alert(err);
					}
				});
			});

			// 글쓰기 공간 삽입
			template = [];
			template.push(`<label for='txtTitle'>글 주소 : </label>`);
			template.push(`<input type='text' id='txtLink' class='title'></input><br/><br/>`);
			template.push(`<span>ex)<br>https://steemit.com/voteview/@wonsama/voteview-wonsama-1530261005453</span><br/><br/>`);
			template.push(`<div id="btnRead">조회</div>`);
			$("#divWrite").html(template.join(''));

			// 조회 버튼 이벤트 등록
			$("#btnRead").click(evt=>{

				let myLink = getInfoFromLink( $("#txtLink").val() );
				if(!myLink.ok){
					alert('위 예시를 참조하여 올바른 주소를 입력바랍니다.');
					return;
				}

				$("#loaderBg").show();
				let author = myLink.data.author;
				let permlink = myLink.data.permlink;
				steem.api.getContent(author, permlink, function(err, result) {
				  
					$("#loaderBg").hide();
				  if(!err){

				  	console.log(result)

				  	// 보팅여부 검색
				  	let active_votes = result.active_votes;
				  	let isFound = false;
				  	for(let av of active_votes){
				  		if(av.voter==res.name){
				  			isFound = true;
				  			break;
				  		}
				  	}

				  	// 보팅을 했음 
				  	if(isFound){

				  		let decripted = CryptoJS.AES.decrypt(result.body, author);
				  		template = [];
				  		template.push("<br>");
				  		template.push("<span>결과 : </span><br><br>");
				  		template.push( decripted.toString(CryptoJS.enc.Utf8) );

				  		$("#divResult").html( template.join('') );
				  	}else{
				  		// 보팅을 하지않음
				  		alert('당신은 보팅을 하지 않았습니다.');
				  	}


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

function getInfoFromLink (link) {

	// https:// 부분은 cut
  // 이후 구성 [ 도메인 - 태그 - 저자 - 펌링크 ]
  let infos = link.substr(8).split('/');

  if(!infos || infos.length!=4){

  	let msg = [];
  	msg.push(`입력받은 ${link} 는 올바른 주소 형식이 아닙니다.`);
  	msg.push('sample link : https://steemit.com/kr/@wonsama/kr-dev-krob');

  	return {
  		data:{
  			domain: '',
		  	category: '',
		  	author: '',
		  	permlink: ''
  		},
  		ok:false,
  		cd:999,
	  	msg:msg.join('\n')
	  }
  }

  return {
  	data:{
  		domain: infos[0],
	  	category: infos[1],
	  	author: infos[2].substr(1),
	  	permlink: infos[3]
  	},
  	ok:true,
  	cd:0, /* 0 : 정상, 양수 : 비정상, 추후 코드별 분기(로컬라이징, 코드메시지) 필요 */
	  msg:'success'
  }
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