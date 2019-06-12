
let instances;
document.addEventListener('DOMContentLoaded', function() {
    // let elems = document.querySelectorAll('.fixed-action-btn');
    // let options = {
    //     direction : "top",
    //     hoverEnabled : false,
    //     toolbarEnabled : false
    // };
    // instances = M.FloatingActionButton.init(elems, options);
    // $('.sidenav').sidenav();

    $("input[name=sort_icon]").change(function(){
        refresh_screen();
    });

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

        // 화면 갱신 
        refresh_screen();
    });

    // 토큰 정보
    // localStorage.setItem('tokens', 'red');
    // let tokens = localStorage.getItem('tokens');
});
// $("#app_floating").click(function(){
//     let item = instances[0];
//     if(item.isOpen){
//         item.close();
//     }else{
//         item.open();
//     }
// });

let dataset;
let my_symbol;

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
            
            console.log(_tokens.length)
            let _filtered = _tokens.filter(x=>x.symbol!=symbol);
            console.log(symbol, _filtered.length)
            localStorage.setItem('tokens',JSON.stringify(_filtered));
            alert("삭제되었습니다.");

            // 토큰 목록정보 갱신
            redraw_tokens();
        }
    });
}

function refresh_screen(){

    let checked = $('input[name=sort_icon]').is(':checked');
    $("body").data("type", checked?"stake":"balance");

    let type = $("body").data("type");  // balance or stake

    // 정렬
    dataset.sort((a, b) => parseFloat(b[type]) - parseFloat(a[type]));


    $("#app_list").empty();
    let temp = [];
    let idx = 1;
    for (let r of dataset) {
        let balance = parseFloat(r[type]);
        if (balance > 0) {
            temp.push(`<li class="collection-item avatar app_toast_move" account='${r.account}'>`);
            temp.push(`<img src="https://steemitimages.com/u/${r.account}/avatar" alt="" class="circle">`);
            temp.push(`<span class="title">${r.account}</span>`);
            temp.push(`<p>${add_comma(balance)}<br>`);
            if (idx == 1) {
                temp.push(`<span class="new badge red" data-badge-caption="st">${idx}</span>`);
            } else if (idx == 2) {
                temp.push(`<span class="new badge red" data-badge-caption="nd">${idx}</span>`);
            } else if (idx == 3) {
                temp.push(`<span class="new badge red" data-badge-caption="rd">${idx}</span>`);
            } else {
                temp.push(`<span class="new badge blue" data-badge-caption="th">${idx}</span>`);
            }
            temp.push(`</li>`);

            idx++;
        }
    }

    $("#app_holer_title").text(`${my_symbol}(${idx-1})`);
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