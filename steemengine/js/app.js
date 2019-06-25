let dataset;    // 수신한 데이터 정보 
let my_symbol;  // 선택한 심볼
let excepts;

const _get_nbsp = (count) => {
    const NBSP = '&nbsp;';
    let buffer = [];
    for(let i=0;i<count;i++){
        buffer.push(NBSP);
    }
    return buffer.join('');
}

document.addEventListener('DOMContentLoaded', function() {
    
    $(".data-find").click(function(){
        let no = $(this).data("no");
        
        // 한글이라 사이즈를 좀 수동으로 맞춰야 됨
        if(no==1){
            let html = '<i class="material-icons">account_balance_wallet</i>'+_get_nbsp(4)+'잔고</a>';
            $("#search_text").html(_get_nbsp(20)+html+_get_nbsp(20));
        }else if(no==2){
            let html = '<i class="material-icons">lock</i>'+_get_nbsp(4)+'스테이킹</a>';
            $("#search_text").html(_get_nbsp(18)+html+_get_nbsp(18));
        }else if(no==3){
            let html = '<i class="material-icons">landscape</i>'+_get_nbsp(4)+'잔고+스테이킹</a>';
            $("#search_text").html(_get_nbsp(13)+html+_get_nbsp(13));
        }

        // 선택 값 설정 
        $("#search_text").data("no", no);

        // 화면 갱신 
        refresh_screen(no);
    });

    $("input[name=sort_icon]").change(function(){
        refresh_screen();
    });

    // 버튼 - 제외계정 추가 
    $("#user_remove").click(function(){
        // 입력창에 존재하는 계정 정보를 확인한다 
        let user_excepts = $("#user_excepts").val();
        user_excepts = user_excepts.replace(/[\s\@]/gi,'');

        // 입력값 없음 - 초기화 된 경우
        if(user_excepts==""){
            alert("초기화 되었습니다.");
            set_excepts("");

            // 화면 갱신
            let no = $("#search_text").data("no");
            refresh_screen(no);
            return;
        }

        // 입력값 존재 - 존재하는 계정 정보만 확인 후 예외 계정에 추가한다 
        let finds = user_excepts.split(',');
        if(finds.length>0){
            get_accounts(finds).then(res=>{
                let users = [];
                let _r = res.result;
                for(let r of _r){
                    users.push(r.name);
                }
                set_excepts(users.join(' , '));
                if(users.length>0){
                    alert(`${my_symbol} 토큰의 예외 계정 정보(${users.length} 건)가 저장되었습니다.`);
                }

                // 화면 갱신
                let no = $("#search_text").data("no");
                refresh_screen(no);
            });
        }
    });

    // 버튼 - 토큰 추기 
    $("#token_add").click(function(){
        let symbol = $("#token_item").val().replace(/\s/gi, '');
        symbol=symbol.toUpperCase();
        if(symbol!=""){

            // 기등록 여부 확인
            let is_same = false;
            let _tokens = JSON.parse(localStorage.getItem('tokens'));
            for(let t of _tokens){
                if(symbol==t.symbol){
                    is_same=true;
                }
            }
            if(is_same){
                alert(`${symbol} 는 이미 등록된 토큰 입니다.`);
                return;
            }

            // 등록 확인
            if(confirm(`${symbol} 을 추가하시겠습니까 ?`)){

                // 비동기 처리
                tokens_tokens(symbol)
                .then(item=>{
                    let r = item.result;
                    if(r==null){
                        alert(`존재하지 않는 토큰 입니다.`);
                        return;
                    }
                    let issuer = r.issuer;  // 발행자
                    let symbol = r.symbol;  // 심볼
                    let name = r.name;      // 토큰명

                    let j = JSON.parse(r.metadata);
                    let url = j.url;        // 주소
                    url = !url?'':url;
                    let icon = j.icon;      // 아이콘 
                    icon = !icon?`https://steemitimages.com/u/${issuer}/avatar`:icon;  
                    let desc = j.desc;      // 부가설명
                    desc = !desc?'':desc;

                    // 값 추가 및 저장
                    _tokens.push({issuer, symbol, name, url, icon, desc});
                    localStorage.setItem('tokens', JSON.stringify(_tokens));
                    
                    // 입력 값 초기화
                    $("#token_item").val("");

                    // 토큰 목록정보 갱신
                    redraw_tokens();
                    alert(`${symbol} 이 추가되었습니다.`);
                });
            }
        }
    });

    // 화면 초기화
    init(res => {    
        // 값 설정 
        dataset = res.result;

        // 제외계정 목록정보 값 설정
        get_execpts();

        // 화면 갱신 
        refresh_screen(1);
    });

    // 토큰 정보
    // localStorage.setItem('tokens', 'red');
    // let tokens = localStorage.getItem('tokens');
});

function set_excepts(excepts_info){

    // 값을 설정한다 
    localStorage.setItem(`${my_symbol}-excepts`, excepts_info);

    // 값을 다시 불러들인다
    get_execpts();
}

function get_execpts(){
    // 제외계정 목록정보 값 설정
    let _excepts = localStorage.getItem(`${my_symbol}-excepts`);
    excepts = !_excepts||_excepts==null||_excepts==''?'':_excepts;
    $("#user_excepts").val(_excepts);
}



/*
 * 진입점
 * @param cb 성공 시 콜백 
 */
async function init(cb) {

    // URL 파라미터에서 symbol 정보를 가져온다 없음 JJM 이 기본값 
    var url = new URL(location.href);
    var symbol = url.searchParams.get("symbol");
    symbol = symbol ? symbol : url.searchParams.get("SYMBOL");
    symbol = symbol ? symbol : 'WHAN';
    my_symbol = symbol;

    $("#app_holer_title").text(`Loading ...`);
    M.AutoInit();

    // 토큰 목록 정보를 다시 그려준다
    redraw_tokens();

    // 토큰 홀더 목록 정보를 가져온다
    tokens_tokens(symbol)
    .then(res=>{

        let r = res.result;

        // symbol : 심볼
        let issuer = r.issuer;  // 발행자 
        let name = r.name;      // 토큰명

        let j = JSON.parse(r.metadata);
        let url = j.url;        // 주소 
        let icon = j.icon;      // 아이콘 
        let desc = j.desc;      // 부가설명 

        $("#tk_icon").attr("src", icon);
        $("#tk_name").html(`${symbol} (${name})`);

        if(desc){
            $("#tk_symbol").html(`발행자 : ${issuer}<br/>설명 : ${desc}`);    
        }else{
            $("#tk_symbol").html(`발행자 : ${issuer}`);    
        }
        
        // 토큰 잔고 정보를 조회한다
        return tokens_balances(symbol);
    })
    .then(cb)
    .catch(e => alert(e.toString()));
}

async function redraw_tokens(){
    // 기본 토큰 목록 정보를 가져온다
    let tokens = localStorage.getItem('tokens');
    if(!tokens || JSON.parse(tokens).length==0){    // 파싱오류 나면 버그임
        // 기본 토큰 정보를 로딩한다
        let defaults_tokes = ['SCT','AAA','JJM'];

        let token_list = [];
        for(let t of defaults_tokes){
            token_list.push(tokens_tokens(t));
        }

        let infos = [];
        let items = await Promise.all(token_list);
        for(let item of items){
            let r = item.result;
            let issuer = r.issuer;  // 발행자
            let symbol = r.symbol;  // 심볼
            let name = r.name;      // 토큰명

            let j = JSON.parse(r.metadata);
            let url = j.url;        // 주소
            url = !url?'':url;
            let icon = j.icon;      // 아이콘 
            icon = !icon?`https://steemitimages.com/u/${issuer}/avatar`:icon;  
            let desc = j.desc;      // 부가설명
            desc = !desc?'':desc;

            // 정보 저장
            infos.push({issuer, symbol, name, url, icon, desc});
        }
        localStorage.setItem('tokens',JSON.stringify(infos));
    }

    // 화면에 토큰 목록을 그려준다
    tokens = JSON.parse(localStorage.getItem('tokens'));

    let token_templates = [];
    $("#token_list").empty();
    for(let t of tokens){
        token_templates.push(`<li class="collection-item avatar">`);
        token_templates.push(`<img src="${t.icon}" alt="" class="circle item-move" data-symbol="${t.symbol}">`);
        token_templates.push(`<span class="title item-move" data-symbol="${t.symbol}">${t.symbol}</span>`);
        token_templates.push(`<p class="item-move" data-symbol="${t.symbol}" style="text-overflow: ellipsis; width: 120px;overflow: hidden;white-space: nowrap;" >${t.name}</p>`);
        token_templates.push(`<a href="#!" class="secondary-content item-delete" data-symbol="${t.symbol}"><i class="material-icons">delete</i></a>`);
        token_templates.push(`</li>`);
    }
    $("#token_list").html(token_templates.join(''));

    // 이동 이벤트 등록
    $(".item-move").click(function(){
        let symbol = $(this).data("symbol");
        location.href = `./index.html?symbol=${symbol}`;
    });
    $(".item-delete").click(function(){
        let symbol = $(this).data("symbol");
        let _tokens = JSON.parse(localStorage.getItem('tokens'));

        if(_tokens.length==1){
            alert("최소 1개가 존재해야 됩니다.");
            return;
        }
        if(confirm(`${symbol} 을 삭제하시겠습니까 ?`)){
            
            let _filtered = _tokens.filter(x=>x.symbol!=symbol);
            localStorage.setItem('tokens',JSON.stringify(_filtered));
            alert("삭제되었습니다.");

            // 토큰 목록정보 갱신
            redraw_tokens();
        }
    });
}

function refresh_screen(type=1/* 1: 잔고, 2 : 스테이킹, 3 : 잔고 + 스테이킹 */){

    // 제외 계정 표시 제한 ( 표시할 데이터만 필터링 하여 보여준다 )
    _dataset = dataset.filter(x=>!excepts.includes(x.account));
    console.log('excepts', excepts)
    console.log('_dataset', _dataset)

    // @들어간 계정 제외 ( @sctm.winners 같은거 )
    _dataset = _dataset.filter(x=>x.account.indexOf('@')!=0);

    // 일괄 적으로 값 설정
    _dataset = _dataset.map(x=>{
        if(!x.balance){
            x.balance = "0";
        }
        if(!x.stake){
            x.stake = "0";
        }
        if(!x.delegatedStake){
            x.delegatedStake = "0";
        }
        if(!x.delegationsIn){
            x.delegationsIn = "0";
        }
        if(!x.delegationsOut){
            x.delegationsOut = "0";
        }
        if(!x.pendingUnstake){
            x.pendingUnstake = "0";
        }
        return x;
    });
    

    // 정렬
    if(type==1){
        // 1: 잔고
        _dataset.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
    }else if(type==2){
        // 2: 스테이킹
        _dataset.sort((a, b) => parseFloat(b.stake) - parseFloat(a.stake) + parseFloat(b.delegationsIn) - parseFloat(a.delegationsIn));
    }else if(type==3){
        // 3: 잔고 + 스테이킹
        _dataset.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance) + parseFloat(b.stake) - parseFloat(a.stake)  + parseFloat(b.delegationsIn) - parseFloat(a.delegationsIn));
    }

    $("#app_list").empty();
    let temp = [];
    let idx = 1;

    let sum = 0;
    // 합계 계산
    for (let r of _dataset) {
        let balance;
        if(type==1){ // 벨런스 
            balance = parseFloat(r.balance);
        }else if(type==2){ // 스테이크 
            balance = parseFloat(r.stake)+parseFloat(r.delegationsIn)-parseFloat(r.delegationsOut);
        }else if(type==3){ // 벨런스 + 스테이크 
            balance = parseFloat(r.balance)+parseFloat(r.stake)+parseFloat(r.delegationsIn)-parseFloat(r.delegationsOut);
        }
        if(balance>0){
            sum = parseFloat(sum) + parseFloat(balance);
        }
    }

    // 화면 표시
    for (let r of _dataset) {

        // stake : 스테이킹 
        // delegationsIn : 받은거 
        // delegationsOut : 준거 

        // 실제 내꺼 : stake + delegationsOut
        // 남의 꺼 : delegationsIn


        let balance;
        if(type==1){
            balance = parseFloat(r.balance);
        }else if(type==2){
            balance = parseFloat(r.stake)+parseFloat(r.delegationsIn);
        }else if(type==3){
            balance = parseFloat(r.balance)+parseFloat(r.stake)+parseFloat(r.delegationsIn);
        }

        // console.log(type, r.account, balance, r.balance, r.stake, r.delegationsIn, r.delegationsOut);


        let _gap = parseFloat(r.delegationsIn)-parseFloat(r.delegationsOut);

        let gap_show = ''
        if(parseInt(_gap)>0){
            gap_show = `<span class="pink-text text-darken-3"> +${_gap}</span>`;
        }else if(parseInt(_gap)<0){
            gap_show = `<span class="blue-text text-darken-4"> ${_gap}</span>`;
        }
        // console.log(add_comma(balance), balance, _gap)


        if (balance > 0) {
            temp.push(`<li class="collection-item avatar app_toast_move" account='${r.account}'>`);
            temp.push(`<img src="https://steemitimages.com/u/${r.account}/avatar" alt="" class="circle">`);
            temp.push(`<span class="title">${r.account}</span>`);
            if (idx == 1) {
                temp.push(`<span  class="new badge amber accent-4  white-text text-accent-4" data-badge-caption="st">${idx}</span>`);
            } else if (idx == 2) {
                temp.push(`<span class="new badge grey lighten-1 white-text text-darken-2" data-badge-caption="nd">${idx}</span>`);
            } else if (idx == 3) {
                temp.push(`<span class="new badge brown lighten-1 white-text text-darken-2" data-badge-caption="rd">${idx}</span>`);
            } else {
                temp.push(`<span class="new badge teal lighten-5 black-text text-darken-2" data-badge-caption="th">${idx}</span>`);
            }
            temp.push(`<p>${add_comma(balance)} (${(parseFloat(balance/sum)*100).toFixed(2)} %) ${gap_show}<br>`);
            // temp.push(`<p>${balance} (${(parseFloat(balance/sum)*100).toFixed(2)} %) ${gap_show}<br>`);
            // console.log(type, r.account, balance, r.balance, r.stake, r.delegationsIn, r.delegationsOut);

            
            temp.push(`</li>`);

            idx++;
        }
    }

    let SUFFIX = {
        1 : "BAL",
        2 : "STK",
        3 : "BAL+STK"
    };

    $("#app_holer_title").text(`${my_symbol}(${idx-1}):${SUFFIX[type]}`);
    $("#app_list").html(temp.join(''));
    $(".app_toast_move").click(function() {
        let account = $(this).attr('account');
        view_in_steemit(account);
    });

    M.AutoInit();
}


/*

$loki: 34950
account: "null"
balance: "713625.351"
delegatedStake: "0"
pendingUnstake: "0"
receivedStake: "0"
stake: "0"
symbol: "SCT"


*/