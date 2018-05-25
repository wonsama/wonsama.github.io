// 설정정보
const FIXED_FROM = 999999999; // 999999999 from 부터 limit 만큼 아래로 seek 함. ( 그래서 from 을 max 수치로 두는 것이 좋음 )
const LIST_ALL_BUFFER_SIZE = 1000; // 중복방지를 위한 버퍼 (permlink와 author 정보를 담고 있음)
const FIXED_LIMIT = 1000; // max 10000, 최소 1000 정도로 잡아주도록 한다, 높을 수록 속도 저하 발생

let accounts = [];

// 계정마다 읽기 시작하는 지점이 다르기 때문
let _ACC_FROM = (accounts, val = FIXED_FROM) => {
    let ac = [];
    for (let name of accounts) {
        ac[name] = val;
    }
    return ac;
};
// let ACC_FROM = _ACC_FROM(accounts);
let ACC_FROM = [];
let list_all = [];

// 계정 정보를 읽어들인다
let readAccountHistory = async() => {

    // 비동기로 계정 정보를 읽어들인다
    let getAccountHistoryList = [];
    for (let account of accounts) {
        let from = ACC_FROM[account];
        let limit = Math.min(ACC_FROM[account], FIXED_LIMIT);

        if (limit > 1) {
            getAccountHistoryList.push(steem.api.getAccountHistoryAsync(account, from, limit));
        }
    }

    // 비동기로 모든 정보를 읽어들인 이후 해당 정보를 순차적으로 분석한다
    await Promise.all(getAccountHistoryList).then(results => {

        // 인덱스의 변화가 없는지 감지하기 위한 이전 인덱스 값 초기화
        const PREV_ACC_FROM = _ACC_FROM(accounts, ACC_FROM[accounts]);

        let lists = [];
        let idx = 0;
        let now = 0;
        for (let result of results) {
            let author_name = accounts[now];
            let min_block = result[0][0];
            now++;

            for (let r of result) {

                idx = r[0];
                // let trx_id = r[1].trx_id;
                // let block = r[1].block;
                // let trx_in_block = r[1].trx_in_block;
                let timestamp = r[1].timestamp;

                let op = r[1].op;
                let ct = op[1];
                let tp = op[0];

                let author = ct.author;

                // 글(글+댓글) 정보 중에서 글 정보만 반환
                if (tp == 'comment') {

                    // bot은 title이 ''임에 유의, parent_author ==''인 경우가 글임
                    let isCt = (ct.title == '') ? false : true; // true : content , false : reply
                    if (isCt) {

                        let title = ct.title;
                        // let author = ct.author;
                        let permlink = ct.permlink;
                        let body = ct.body;
                        let json_metadata = ct.json_metadata ? JSON.parse(ct.json_metadata) : ''; // users, tags, image[0], 

                        // 중복방지 점검 
                        let x = list_all.filter(x => x.permlink == permlink && x.author == author);
                        if (x.length == 0 && ct.parent_author == '') {

                           let image = (json_metadata && json_metadata.image && json_metadata.image.length > 0) ? json_metadata.image[0] : '';
                           
                           // 비지 이미지 추출 추가됨
                           if(image==''){
                            // busy 같은 경우 ipfs로 이미지를 올려버림
                            // 구버전 : gateway.ipfs.io, 신버전 : ipfs.busy.org
                            let loc = body.indexOf('https://ipfs.busy.org/ipfs/');  
                            if(loc==-1){
                              loc = body.indexOf('https://gateway.ipfs.io/ipfs/');
                            }
                            if(loc==-1){
                              loc = body.indexOf('https://ipfs.io/ipfs/');
                            }
                            if(loc==-1){
                              loc = body.indexOf('https://cdn.steemitimages.com/');
                            }
                            if(loc==-1){
                              loc = body.indexOf('https://steemitimages.com/');
                            }
                            
                            if(loc>=0){
                              let locSp = Math.min(body.indexOf(')', loc+1), body.indexOf(' ', loc+1));
                              image = body.substr(loc, locSp-loc);
                            }
                           }

                            // 결과 리턴용
                            lists.push({
                                idx: idx,
                                title: title,
                                author: author,
                                permlink: permlink,
                                body: body,
                                timestamp: timestamp,
                                image:image,
                                json_metadata: json_metadata,
                            });

                            // 중복 방지용 
                            list_all.push({
                                author: author,
                                permlink: permlink
                            });

                            // 버퍼 체크 - 너무 크게 잡으면 메모리 오류 1000개 정도면 왠만하면 커버
                            if (list_all.length > LIST_ALL_BUFFER_SIZE) {
                                list_all.shift();
                            }

                            // 읽어들일 인덱스 정보를 갱신한다 
                            ACC_FROM[author] = Math.min(Number(idx) - 1, Number(ACC_FROM[author]));
                        }
                    }
                }
                // console.log(idx);
            }

            // 초기값 설정 
            // console.log('set1', idx);
            // console.log('set2', ACC_FROM[lastAuthor]);
            // console.log('set3', lastAuthor);
            if (ACC_FROM[author_name] == FIXED_FROM) {
                ACC_FROM[author_name] = min_block;
                console.log('set', min_block);
            }
        }

        // 변화 없는지 판별
        for (let acc of accounts) {
            if (PREV_ACC_FROM[acc] == ACC_FROM[acc] && ACC_FROM[acc] > FIXED_LIMIT) {
                ACC_FROM[acc] = ACC_FROM[acc] - FIXED_LIMIT;
            }
            if (PREV_ACC_FROM[acc] == ACC_FROM[acc]) {
                ACC_FROM[acc] = 0;
                return Promise.reject('end');
            }
        }

        // 시간 역순으로 정렬
        lists.sort((a, b) => getLocalTime(b.timestamp) - getLocalTime(a.timestamp));

        // 다음 스탭으로 진행
        return Promise.resolve(lists);

    }).then(results => {

        // 알맞게 화면에 출력한다
        let tempHtml = [];
        for (let item of results) {
            let template = `[created] ${getFormadate(getLocalTime(item.timestamp),'yy-mm-dd HH:MM:ss')} / @${item.author} / [title] ${item.title}`;
            let link = `https://steemit.com/${item.json_metadata.tags[0]}/@${item.author}/${item.permlink}`;
            // console.log(template);
            // console.log(link);

            // console.log( item.json_metadata );

            tempHtml.push(makeDiv(item));
        }
        $("#div_disp").append(tempHtml.join(''));

        // 이미지
        if (target_id == 'img_show') {
            $(".logo").show();
        } else {
            $(".logo").hide();
        }

        // 이벤트 등록
        // 테두리 변경처리
        $(".cardboard").unbind('click');
        $(".cardboard").click(e => {

            let target = getBubbleDivByClassName($(e.target), 'cardboard');

            $(".cardboard").removeClass('border-primary');
            target.addClass('border-primary');
        });

        // 제목 또는 이미지 클릭
        $(".move").unbind('click');
        $(".move").click(e => {
            let url = $(e.target).attr('data-link');
            window.open(url, '_blank');
        });


        // 더보기 버튼 
        makeMore();

        $("#btnSearch").prop('disabled', false);
        console.log('last read history idx : ', ACC_FROM);

        if (results.length == 0) {
            readAccountHistory();
        }


        // 결과 값이 없는 경우 자동으로 더보기 수행 ( 증인같이 글 가끔 쓰는 사람들 때문에 ...)
        // if(results.length==0 ){
        //   readAccountHistory();
        // }

    }).catch(e => {

        // 조회버튼 활성화
        $("#btnSearch").prop('disabled', false);
        
        if (e == 'end') {
          // 더이상 조회할 내용이 없는 경우임
          $("#btnMore").hide();
        } else {
          console.log(e);
        }

    });
};


let getBubbleDivByClassName = (node, name) => {
    if (node.hasClass(name)) {
        return node;
    } else if (node.parent().prop("tagName") != 'DIV') {
        console.log(node.prop("tagName"));
        return null;
    } else {
        return getBubbleDivByClassName(node.parent(), name);
    }
}



let makeMore = () => {

    $("#btnMore").remove();

    let template = [];
    template.push(`<button type="button" class="btn btn-outline-danger btn-sm btn-block" id='btnMore'>더 보기</button>`);

    $("#div_disp").append(template.join(''));

    // 버튼 더 읽기
    $("#btnMore").click(e => {

        // 버튼 비활성화
        $("#btnMore").prop('disabled', true);

        // 계정 목록 정보 읽어들이기 
        readAccountHistory();
    })
}


let makeDiv = (item) => {

    let template = [];
    // let img = (item.json_metadata && item.json_metadata.image && item.json_metadata.image.length > 0) ? item.json_metadata.image[0] : '';

    let link = `https://steemit.com/${item.json_metadata.tags[0]}/@${item.author}/${item.permlink}`;

    // template.push(`<a href="#" class="card-block">`);
    template.push(`<div class="col-sm-6" >`);
    template.push(` <div class="card cardboard" >`);
    template.push(`   <div class="card-body ">`);
    template.push(`     <span class=" d-inline-block text-truncate move" data-link='${link}' style="max-width: 300px;">${item.title}</span><br>`);
    if (item.image == '') {
        template.push(`     <div class="border border-success logo move" data-link='${link}'  style="height:100px;width:100%;text-align:left;padding:10px;">${item.body.substr(0,80)}</div>`);
    } else {
        template.push(`     <img class='logo move' src='${item.image}' data-link='${link}'>`);
    }
    template.push(`     <p class="card-text text-right">${getFormadate(getLocalTime(item.timestamp))} @${item.author}</p>`);
    template.push(`   </div>`);
    template.push(` </div>`);
    template.push(`</div>`);
    // template.push(`</a>`);

    return template.join('');
}


// 버튼 조회하기
$("#btnSearch").click(e => {

    $("#btnSearch").prop('disabled', true);
    $("#img_show").trigger('click');

    // 계정 @제거 
    $("#search_ids").val( $("#search_ids").val().replace(/\@/gi, '') );

    // ,로 나눠주기 + trim 처리 후 배열 화
    accounts = $.map($("#search_ids").val().split(','), $.trim);

    // 화면 초기화 
    $("#div_disp").empty();
    $("#dispAct").empty();
    $("#dispAct").removeClass('text-danger text-info');

    steem.api.getAccounts(accounts, function(err, response){

      accounts = [];
      for(let acc of response){
        accounts.push(acc.name);  
      }
      
      if(response.length==0){
        // 조회 결과가 없는 경우임
        $("#dispAct").addClass('text-danger');
        $("#dispAct").text("검색 할 아이디 정보를 확인 바랍니다.");
        $("#btnSearch").prop('disabled', false);
      }else{
        $("#dispAct").addClass('text-info');
        $("#dispAct").text( accounts.join(', ') + "님의 정보를 조회 합니다." );
      }
      
      if (Array.isArray(accounts) && accounts.length > 0 && accounts[0] != '') {
          // 읽어들일 정보를 계정 정보 기반으로 초기화 한다
          ACC_FROM = _ACC_FROM(accounts);
          list_all = [];
          
          // 계정 목록 정보 읽어들이기 
          readAccountHistory();
      } else {
          alert('계정 목록 정보를 올바르게 입력 바랍니다.');
          $("#btnSearch").prop('disabled', false);
      }

    });

    
});


// 라디오 버튼
let target_id = 'img_show';
$('input[type=radio][name=imgOption]').change(e => {

    const IMG_SHOW = 'btn-primary';
    const IMG_HIDE = 'btn-secondary';
    target_id = $(e.target).parent().attr('id');

    $(".btn-img").removeClass(`${IMG_SHOW} ${IMG_HIDE}`);

    if (target_id == 'img_show') {
        $("#img_show").addClass(`${IMG_SHOW}`);
        $("#img_hide").addClass(`${IMG_HIDE}`);
        $(".logo").show();
    } else {
        $("#img_show").addClass(`${IMG_HIDE}`);
        $("#img_hide").addClass(`${IMG_SHOW}`);
        $(".logo").hide();
    }

});

// 출력용 시간 정보처리
// t : 시간정보
let getFormadate = (t) => {
    return t.toLocaleDateString('ko-KR').substr(2).replace(/-/gi, "-") + " " + t.toLocaleTimeString('en-US', { hour12: false }).substr(0, 8);
}

// 2018-05-23T09:52:27 형태로 받은(UTC TIME) 값을 Local Date 개체로 변환한다
// timestamp : 시간정보(UTC)
let getLocalTime = (timestamp, addHours = 9) => {
    timestamp = timestamp.replace("T", " ")
    var t = new Date(timestamp);
    t.setTime(t.getTime() + (addHours * 60 * 60 * 1000));
    return t;
}