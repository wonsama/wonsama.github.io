// 설정정보
const FIXED_FROM = 999999999; // 999999999 from 부터 limit 만큼 아래로 seek 함. ( 그래서 from 을 max 수치로 두는 것이 좋음 )
const LIST_ALL_BUFFER_SIZE = 1000; // 중복방지를 위한 버퍼 (permlink와 author 정보를 담고 있음)
const FIXED_LIMIT = 1000; // max 10000, 최소 1000 정도로 잡아주도록 한다, 높을 수록 속도 저하 발생
const LOCAL_STORAGE_KEY = 'steem_ids_11';
const DEFAULT_GROUP_NAME = '기본그룹';
const LOCAL_STORAGE_DEFAULTS = {last:DEFAULT_GROUP_NAME, groups:[
    {name:DEFAULT_GROUP_NAME, accounts:['wonsama']},
    {name:'kr-dev', accounts:['wonsama, asbear, asinayo, nhj12311, code91, jeaimetu, segyepark, dorian-lee, codingman, codingart, urobotics']},
    {name:'kr-art', accounts:['leesol, ryh0505, woolgom, wony, twohs, mmcartoon-kr, tata1, carrotcake, cagecorn, kr-marketing, meitaya, dianamun, leesongyi, webtooner, solnamu']}

    ]};
    

let accounts = [];
let acc_images = [];

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

                            // 이미지 추출 변경됨
                            if (image == '') {
                                const START_WORDS = [
                                    'https://ipfs.busy.org/ipfs/',
                                    'https://gateway.ipfs.io/ipfs/',
                                    'https://ipfs.io/ipfs/',
                                    'https://cdn.steemitimages.com/',
                                    'https://steemitimages.com/',
                                    'http://ipfs.io/ipfs/'
                                ];
                                let images = getLinks(body, START_WORDS);
                                if(images.length>=1){
                                    image = images[0];
                                    // if(image.indexOf('http://')){
                                    //     console.log(image);
                                    // }
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
                                image: image,
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

        // 조회하기 버튼 활성화 
        $("#btnSearch").prop('disabled', false);
        console.log('last read history idx : ', ACC_FROM);

        if (results.length == 0) {
            readAccountHistory();
        } else {
            // 로딩하기 숨기기 
            $("#loading").hide();
        }

    }).catch(e => {

        // 조회버튼 활성화
        $("#btnSearch").prop('disabled', false);

        if (e == 'end') {
            // 더이상 조회할 내용이 없는 경우임
            $("#btnMore").hide();
        } else {
            // console.log(e);
            alert('알 수 없는 오류가 발생했습니다.\n@wonsama 에게 문의 바랍니다.\n\n' + JSON.stringify(e));
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

let getAccImage = (author) =>{
    for(let acc of acc_images){
        if(acc.name==author){
            return acc.img;
        }
    }
    return '';
}

let makeDiv = (item) => {

    let template = [];
    // let img = (item.json_metadata && item.json_metadata.image && item.json_metadata.image.length > 0) ? item.json_metadata.image[0] : '';

    let link = `https://steemit.com/${item.json_metadata.tags[0]}/@${item.author}/${item.permlink}`;

    // template.push(`<a href="#" class="card-block">`);
    template.push(`<div class="col-sm-6" >`);
    template.push(` <div class="card cardboard" >`);
    template.push(`   <div class="card-body ">`);
    // template.push(`   <span class="badge badge-dark">@${item.author}</span>`);
    // template.push(`     <span class=" d-inline-block text-truncate move" data-link='${link}' style="max-width: 300px;">${item.title}</span><br>`);
    template.push(`   <img src='${getAccImage(item.author)}' class='img-circle' width=30 height=30>`);
    template.push(`   <span class="badge badge-dark text-truncate move" data-link='${link}' style="max-width: 250px;vertical-align:middle;">${item.title}</span><br>`);
    if (item.image == '') {

        // 수정된 댓글
        if(item.body.indexOf('@@')>=0){
            // console.log()
            item.body = decodeURIComponent(item.body);
        }

        template.push(`     <div class="border border-success logo move" data-link='${link}'  style="height:100px;width:100%;text-align:left;padding:10px;">${item.body.substr(0,80)}</div>`);
    } else {
        template.push(`     <img class='logo move' src='${item.image}' data-link='${link}'>`);
    }
    // template.push(`     <p class="card-text text-right">${getFormadate(getLocalTime(item.timestamp))} @${item.author}</p>`);
    template.push(`   <span class="badge badge-light">${getFormadate(getLocalTime(item.timestamp))}</span>`);
    template.push(`   <span class="badge badge-warning">@${item.author}</span>`);
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
    $("#search_ids").val($("#search_ids").val().replace(/\@/gi, ''));

    // ,로 나눠주기 + trim 처리 후 배열 화
    accounts = $.map($("#search_ids").val().split(','), $.trim);

    // 화면 초기화 
    $("#div_disp").empty();
    $("#dispAct").empty();
    $("#dispAct").removeClass('text-danger text-info');

    // 아이디 존재여부 검사
    steem.api.getAccounts(accounts, function(err, response) {

        accounts = [];
        acc_images = [];
        for (let acc of response) {
            accounts.push(acc.name);

            let json_metadata = acc.json_metadata ? JSON.parse(acc.json_metadata) : '';
            let img = (json_metadata != '' && json_metadata.profile && json_metadata.profile.profile_image) ? json_metadata.profile.profile_image : '';
            let DEFAULT_IMG = 'https://i2.wp.com/marcabees.com/wp-content/uploads/2017/08/human-icon-png-1901.png?fit=64%2C64';

            if (img == '') {
                // `<img src='${DEFAULT_IMG}' class='img-circle' width=30 height=30>`} 
                acc_images.push( {name:acc.name, img:DEFAULT_IMG});
            } else {
                acc_images.push( {name:acc.name, img:img});
                // acc_images.push(`<img src='${img}' class='img-circle' width=30 height=30>`);
            }
        }

        if (response.length == 0) {
            // 조회 결과가 없는 경우임
            $("#dispAct").addClass('text-danger');
            $("#dispAct").text("검색 할 아이디 정보를 확인 바랍니다.");
            $("#btnSearch").prop('disabled', false);
        } else {
            $("#dispAct").addClass('text-info');

            let acc_image = [];
            for(let ai of acc_images){
                acc_image.push(`<img src='${ai.img}' class='img-circle' width=30 height=30>`);
            }
            $("#dispAct").html(`<div id='loading'>${acc_image.join('')}<br>정보를 조회 중 입니다.</div>`);
            $("#loading").show();

            // 로컬저장소 정보 업데이트
            let localst = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
            let last = $("#groupsNow").text();  // 현재 선택한 그룹정보
            for(let i=0;i<localst.groups.length;i++){
                if(localst.groups[i].name==last){
                    localst.groups[i].accounts = accounts;    // 조회한 계정 정보
                }
            }
            localst.last = last;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localst));   // 저장할 땐 문자열로 저장
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

// 찾으려는 단어들 중 가장 근접한 정보를 반환한다
let indexOfMin = (contents, words=[], startIdx=0)=>{
    let loc = -1;
    let m = {w:undefined, l:undefined}; // w : word, l : location
    for(let w of words){
        let l = contents.indexOf(w, startIdx);
        if(l!=-1){
            m = {w:w, l:m.l?Math.min(m.l, l):l};
        }
    }
    return m;
}

// 컨텐츠에서 링크 정보를 추출한다
let getLinks = (contents, START_WORDS=['http://','https://'], END_WORDS=[' ', ')', '\n', '\'', '\t'], links=[])=>{

    let m1 = indexOfMin(contents, START_WORDS);
    if(m1.w){
        let m2 = indexOfMin(contents, END_WORDS, m1.l);
        if(m2.w){
            let cut = contents.substr(m1.l, m2.l-m1.l);
            let remain = contents.substr(m2.l);
            links.push(cut);
            return getLinks(remain, START_WORDS, END_WORDS, links);
        }
    }

    return links;
}

// 로컬 스토리지에 저장된 그룹명기준 계정목록 정보를 반환한다 
let getLocalAccounts = (name)=>{
    let prevSavedValues = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    // console.log( prevSavedValues );
    for(let i=0;i<prevSavedValues.groups.length;i++){
        if(prevSavedValues.groups[i].name==name){
            return prevSavedValues.groups[i].accounts;
        }
    }
    return null;
}

// 그룹명 중복을 점검한다
let groupDupCheck = ()=>{

    let name = $("#modalGroupName").val();

    if(getLocalAccounts(name)){
        alert(`${name}은(는) 이미 존재하는 그룹명 입니다.`);
        return false;
    }
    return true;
}

// 그룹 추가 
$("#btnAdd").click(e=>{
    
    let groupsNow = $("#groupsNow").text();

    $("#modalOk").attr('data-flag', 'add');
    $("#modalTitle").text('그룹 추가');
    $("#modalOk").text('추가');
    $("#modalGroupNameLb").text('그룹명: ');
    $("#modalGroupName").prop('disabled', false);
    $("#modalGroupName").val('');

    $("#modalGroup").modal('show');
});

// 그룹 수정 
$("#btnMod").click(e=>{

    let groupsNow = $("#groupsNow").text();

    if(groupsNow==DEFAULT_GROUP_NAME){
        alert('기본그룹은 변경이 불가 합니다.');
        return;
    }


    $("#modalOk").attr('data-flag', 'mod');
    $("#modalTitle").text('그룹명 변경');
    $("#modalOk").text('변경');
    $("#modalGroupNameLb").text(`변경할 그룹명: (이전 ${groupsNow})`);
    $("#modalGroupName").prop('disabled', false);
    $("#modalGroupName").val('');

    $("#modalGroup").modal('show');
});

// 그룹 삭제 
$("#btnDel").click(e=>{

    let groupsNow = $("#groupsNow").text();

    if(groupsNow==DEFAULT_GROUP_NAME){
        alert('기본그룹은 삭제가 불가 합니다.');
        return;
    }

    $("#modalOk").attr('data-flag', 'del');
    $("#modalTitle").text('그룹 삭제');
    $("#modalOk").text('삭제');
    $("#modalGroupNameLb").text('그룹명:');
    $("#modalGroupName").prop('disabled', true);
    $("#modalGroupName").val($("#groupsNow").text());

    $("#modalGroup").modal('show');
});


// modal에서 확인 버튼 누르는 경우
$("#modalOk").click(e=>{
    let flag = $("#modalOk").attr('data-flag'); // 액션 
    let name = $("#modalGroupName").val();      // 그룹명 
    let prevSavedValues = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    
    if(flag=='add' && groupDupCheck()){

        // 변경 정보 로컬 스토리지 기록
        prevSavedValues.groups.push({name:name, accounts:getLocalAccounts(prevSavedValues.last) });  // 기본적으로 선택 정보를 넣어준다
        prevSavedValues.last = name;    // 최종 조회 정보 변경
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prevSavedValues));

        // 화면정보 변경 
        $("#groupsNow").text(name);      // 그룹 선택 정보 변경
        
        // 그룹 목록을 다시 그리고 이벤트를 재 등록한다
        redrawGroups(prevSavedValues);

        // 모달 감추기
        $("#modalGroup").modal('hide');

    }else if(flag=='del'){

        // 변경 정보 로컬 스토리지 기록
        let temp = [];
        for(let grp of prevSavedValues.groups){
            if(grp.name !=name){
                temp.push(grp);
            }
        }
        prevSavedValues.groups = temp;  // 기본적으로 선택 정보를 넣어준다
        prevSavedValues.last = DEFAULT_GROUP_NAME;    // 최종 조회 정보 변경
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prevSavedValues));

        // 화면정보 변경 
        $("#groupsNow").text(DEFAULT_GROUP_NAME);      // 그룹 선택 정보 변경

        // 그룹 목록을 다시 그리고 이벤트를 재 등록한다
        redrawGroups(prevSavedValues);

        // 모달 감추기
        $("#modalGroup").modal('hide');

    }else if(flag=='mod' && groupDupCheck()){

        // 변경 정보 로컬 스토리지 기록
        let temp = [];
        for(let grp of prevSavedValues.groups){
            if(grp.name == $("#groupsNow").text()){
                grp.name = name;
            }
        }
        prevSavedValues.last = name;    // 최종 조회 정보 변경
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prevSavedValues));

        // 화면정보 변경 
        $("#groupsNow").text(name);      // 그룹 선택 정보 변경

        // 그룹 목록을 다시 그리고 이벤트를 재 등록한다
        redrawGroups(prevSavedValues);

        // 모달 감추기
        $("#modalGroup").modal('hide');
    }
});

// 그룹 목록을 다시 그리고 이벤트를 재 등록한다
let redrawGroups = (prevSavedValues) =>{

    $("#groups").empty();

    // 그룹선택 콤보를 드로잉 한다
    for(let prev of prevSavedValues.groups){
        $("#groups").append(`<a class="dropdown-item mygroup" href="#">${prev.name}</a>`);    
    }

    // 이벤트 등록 - 버튼 : 그룹 변경
    $(".mygroup").unbind('click');
    $(".mygroup").click(e=>{
        let nowItemText = $(e.target).text();
        if($("#groupsNow").text()!=nowItemText){
            // 선택 정보가 변경된 경우 목록 정보를 재 로드 한다 
            $("#groupsNow").text(nowItemText);
            $("#search_ids").val( getLocalAccounts(nowItemText).join(', ') );    
        }
    });
}

// 즉시 실행함수 - 초기화 영역
(()=>{
    // 이전 조회정보 초기화
    let prevSavedValues = localStorage.getItem(LOCAL_STORAGE_KEY);
    if(!prevSavedValues){
        // 기본값 설정 : 저장시 string , 꺼내 쓸 땐 json
        prevSavedValues = JSON.stringify(LOCAL_STORAGE_DEFAULTS);
        localStorage.setItem(LOCAL_STORAGE_KEY, prevSavedValues);
    }
    prevSavedValues = JSON.parse(prevSavedValues);
    $("#search_ids").val(getLocalAccounts(prevSavedValues.last).join(', '));
    
    // 그룹 목록을 다시 그리고 이벤트를 재 등록한다
    redrawGroups(prevSavedValues);

    // 그룹선택 버튼을 초기화
    $("#groupsNow").text(prevSavedValues.last);
    
    
})();



