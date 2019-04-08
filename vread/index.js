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
function checkParams() {
    // 주소정보를 가져온다 - 파라미터 파싱을 위함
    let params = getJsonFromUrl();
    if (params.author && params.permlink) {
        localStorage.setItem('author', params.author);
        localStorage.setItem('permlink', params.permlink);
    }
    if (params.access_token) {
        // 로그인을 하여 콜백이 넘어온 상태임 - 로컬 스토리지에 해당 정보를 저장 
        localStorage.setItem('access_token', params.access_token);
        location.href = '/vread'; // 주소창에서 토큰 정보를 지워주기 위함
    }
}

/*
 * 로그인 정보를 그려준다
 */
function drawLogin() {

    let template = [];

    // 로그인 버튼 삽입
    template.push(`<div id='btnLogin'>로그인</div>`);
    template.push(`<br>`);
    template.push(`<span class="d-block p-2 bg-warning text-dark text-center">로그인을 해야 서비스를 이용할 수 있습니다</span>`);
    $("#divLoginInfo").html(template.join(''));

    // 로그인 이벤트 등록
    $("#btnLogin").click(evt => {

        $("#lock").show();

        // 로그인을 수행한다
        location.href = api.getLoginURL();
    });
}

/*
 * 로그아웃 영역 그리기 및 이벤트 등록
 */
function drawLogoutArea(res) {
    let template = [];
    let logo = `<img width=30 height=30 src='https://steemitimages.com/u/${res.name}/avatar' />`;

    // 로그아웃 버튼 삽입
    template.push(` <div id='btnLogin'>${logo} ${res.name} 로그아웃 </div>`);
    $("#divLoginInfo").html(template.join(''));

    // 로그아웃 이벤트 등록
    $("#btnLogin").click(evt => {

        $("#lock").show();
        // 로그아웃 수행
        // TODO : 로그아웃 됨 현재 페이지에서 할것이 없음
        // STEEMIT 페이지로 이동처리 해줘야 되나 ? 일단은 동일 페이지로 ...
        api.revokeToken(function(err, res) {

            $("#lock").hide();

            if (!err) {
                // 이후 화면 갱신
                localStorage.removeItem('access_token');
                localStorage.removeItem('author');
                localStorage.removeItem('permlink');
                location.href = '/vread';
            } else {
                alert(err);
            }
        });
    });
}

/*
 * 로그아웃 정보를 그려준다
 */
function drawLogout() {

    let template = [];

    // 로그인 정보 가져오기
    $("#lock").show();
    api.me(function(err, res) {


        if (!err) {

            // 로그아웃 영역 그리기 및 이벤트 등록
            drawLogoutArea(res);

            // 글 정보 읽기
            let author = localStorage.getItem('author');
            let permlink = localStorage.getItem('permlink');
            if (!author || !permlink) {
                // 로그아웃 해서 작가, 펌링크 정보가 없는 경우임
                $("#lock").hide();
                return;
            }
            steem.api.getContent(author, permlink, function(err, result) {

                $("#lock").hide();
                if (!err) {

                    // 보팅여부 검색
                    // percent / reputation / rshares / time / voter / weight
                    let active_votes = result.active_votes;
                    let isFound = false;
                    for (let av of active_votes) {
                        // 보팅이력이 있고, 보팅취소(percent!=0)가 아닌경우

                        if (av.voter == res.name) {
                            // console.log(av);
                            if (av.percent != 0) {
                                isFound = true;
                                break;
                            }
                        }
                    }

                    // 보팅을 했음
                    template = [];
                    let prevLink = `https://steemit.com${result.url}`;

                    // console.log(result);

                    // 제목
										template.push(`<div class="input-group mb-3">`);
										template.push(`	<div class="input-group-prepend">`);
										template.push(`		<span class="input-group-text" id="basic-addon1">제목</span>`);
										template.push(`	</div>`);
										template.push(`	<input type="text" id='txtTitle' class="form-control" aria-label="Title" aria-describedby="basic-addon1" value='${result.title}'>`);
										template.push(`</div>`);

                    if (isFound) {
                        let dectext = result.body.split("<hr>");
                        template.push(`<div class="input-group">`);
												template.push(`	<div class="input-group-prepend">`);
												template.push(`		<span class="input-group-text">내용</span>`);
												template.push(`	</div>`);

                        if (!dectext && dectext.length != 3) {
													template.push(`<div class="form-control with-scroll">오류가 발생했습니다.(원본 글 수정 추정됨)</div>`);
													template.push(`</div>`);
                        }else{
                        	let decripted = CryptoJS.AES.decrypt(dectext[1], author);
	                        let decShow = decripted.toString(CryptoJS.enc.Utf8);
	                        let converter = new showdown.Converter();
	                        let preview  = converter.makeHtml( decShow );
													template.push(`<div class="form-control with-scroll">${preview}</div>`);
													template.push(`</div>`);
                        }
                    } else {
                        // 내용 - TODO : 보팅을 하지 않음
												template.push(`<div class="form-control with-scroll">보팅 후 다시 확인 바랍니다.</div>`);
												template.push(`</div>`);
                    }
                    template.push(`<br>`);
                    template.push(`<div class='text-right'>`);
                    let writeUrl = 'https://wonsama.github.io/vwrite/';
					template.push(`<a href='${writeUrl}' target='_blank' class="btn btn-primary">암호 글 쓰기</a>`);
                    template.push(`&nbsp;&nbsp;`);
                    template.push(`<a href='${prevLink}' target='_blank' class="btn btn-secondary">원본 글 보기</a>`);
                    template.push(`</div>`);
                    template.push("<hr>");
                    $("#divResult").html(template.join(''));
                } else {
                    alert(err);
                }

            });

        } else {
            // 재 로그인 하도록 유도함 / 기존 값 정보는 제거
            localStorage.removeItem('access_token');
            localStorage.removeItem('author');
            localStorage.removeItem('permlink');

            // 로그아웃 된 상태
            drawLogin();
        }
    });
}

function getInfoFromLink(link) {

    // https:// 부분은 cut
    // 이후 구성 [ 도메인 - 태그 - 저자 - 펌링크 ]
    let infos = link.substr(8).split('/');

    if (!infos || infos.length != 4) {

        let msg = [];
        msg.push(`입력받은 ${link} 는 올바른 주소 형식이 아닙니다.`);
        msg.push('sample link : https://steemit.com/kr/@wonsama/kr-dev-krob');

        return {
            data: {
                domain: '',
                category: '',
                author: '',
                permlink: ''
            },
            ok: false,
            cd: 999,
            msg: msg.join('\n')
        }
    }

    return {
        data: {
            domain: infos[0],
            category: infos[1],
            author: infos[2].substr(1),
            permlink: infos[3]
        },
        ok: true,
        cd: 0,
        /* 0 : 정상, 양수 : 비정상, 추후 코드별 분기(로컬라이징, 코드메시지) 필요 */
        msg: 'success'
    }
}

function initScreen() {

    $("#lock").hide();

    // 주소정보를 파싱한 이후 화면을 다시 리다이렉트 처리
    checkParams();

    // 로컬스토리지 정보를 가져온다	
    if (access_token) {
        // 로그인 된 상태 
        drawLogout();
    } else {
        // 로그아웃 된 상태
        drawLogin();
    }
}

function initApp() {
    // 로컬스토리지 기준 화면을 초기화 한다
    initScreen();
}


// 진입점
(() => {
    // 앱을 초기화 한다
    initApp();
})();



// http://jwsnt.co.kr/vwrite/?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYXBwIiwicHJveHkiOiJ3b25zYW1hLnF1aXoiLCJ1c2VyIjoid29uc2FtYSIsInNjb3BlIjpbInZvdGUiLCJjb21tZW50Il0sImlhdCI6MTUzMDI1MTU1MywiZXhwIjoxNTMwODU2MzUzfQ.QjUp_bowSM2BKgJ9KoLqpM168_EfEmSi5bRuJbvxJ3Y&expires_in=604800&state=1%2C2%2C3&username=wonsama