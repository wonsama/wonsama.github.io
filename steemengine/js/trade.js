// ________________________________________________________________________________
// GLOBAL VARIABLES + CONST
// ________________________________________________________________________________


// ________________________________________________________________________________
// PRIVATE FUNCTIONS
// ________________________________________________________________________________

/// URL 정보에서 파라미터 정보를 추출한다
const _get_params = ()=>{
    let url = new URL(location.href);
    let _account = url.searchParams.get("account");
    let account = _account?_account:'';

    return {
      account  
    };
}

/// 광고를 설정한다 
const _set_ad = () => {
    let len = $("img.ad").length;
    let rnd = parseInt(Math.random()*len);

    console.log(len, rnd);


    $($(`img.ad`)[rnd]).css('display', 'block');
    $("#app_holer_title").text(`로딩중 ...`);
}

/// [price] 기준으로 대상 토큰의 자리수를 반환한다 
const _get_precision = (price) =>{
    let p = price?price.split('.'):-1;
    if(p==-1){
        return 0;
    }else{
        return p.length==2?p[1].length:0;
    }
}

/// [item]에 추가 정보를 기록한다
const _add_info = (item, flag) =>{

    item.flag = flag;
    item.regtime = dateformat(new Date(item.timestamp*1000));
    item.sum = parse_float(parseFloat(item.quantity) * parseFloat(item.price), _get_precision(item.price));

    return item;
}

/// [account] 기준 토큰 매수/매도 등록 정보를 확인한다
const _get_token_tradings = (account) =>{
    let finds = [];
    finds.push( find('market', 'sellBook', {account}) );
    finds.push( find('market', 'buyBook', {account}) );
    
    return Promise.all(finds)
        .then(res=>{
            console.log('res', res);
            let sell = res[0].result.map(x=>_add_info(x, 'sell'));
            let buy = res[1].result.map(x=>_add_info(x, 'buy'));

            let all = [].concat(sell).concat(buy);
            all.sort((a,b)=>b.timestamp-a.timestamp);

            return Promise.resolve(all);
        });
}

/// 재 조회한다
const search = () =>{
    let account = $("#inp_account").val().replace('@','').trim();
    if(account==''){
        alert('계정명을 입력 바랍니다.');
        $("#inp_account").focus();
    }else{
        location.href = `./trade.html?account=${account}`;
    }
}

// ________________________________________________________________________________
// DOM LOADING COMPLETE
// ________________________________________________________________________________

document.addEventListener('DOMContentLoaded', function() {

    // 이벤트 등록
    $("#inp_account").on('keypress',function(evt){
        if(evt.keyCode==13){
            search();
        }
    });
    $("#cont_my").on('click',function(evt){
        let url = `https://www.steemzzang.com`+$(this).data('url');
        location.href=url;
    });

    // 파라미터 정보를 가져온다
    let {account} = _get_params();
    
    // 광고 정보 설정
    _set_ad();

    // 머트리얼 초기화
    M.AutoInit();
    $("#list").empty();


    // 최신 글 정보 보기
    get_discussions_by_author_before_date('wonsama')
        .then(res=>{
            let rnd = parseInt(Math.random()*3);
            $("#cont_my").data('url', res[rnd].url);
            $("#cont_my").text(`${res[rnd].title}`)
            
            $("#cont_loading").hide();
            $("#cont_my").show();
        });

    // 유효성 검증
    if(!account){
        $("#app_holer_title").text(`계정명을 입력바랍니다`);
        
        // 광고는 기본 3초간 보여준다
        setTimeout(()=>{
            $(".ad").hide();
            $("#list").append("<tr><td colspan=5 class='center'>No Data</td></tr>");
            $("#app_list").show();
        }, 100);
        return;
    }else{
        $("#inp_account").val(account);
    }

    


    // 조회 시작 
    _get_token_tradings(account)
        .then(res=>{

            $(".ad").hide();
            $("#app_list").show();

            $("#app_holer_title").text(`${account} 의 거래정보`);
            
            if(res.length==0){
                $("#list").append("<tr><td colspan=3 class='center'>No Data</td></tr>");
            }else{
                let html = [];
                for(let r of res){
                    if(r.flag=='buy'){
                        html.push(`<tr class='pink-text text-accent-3 app_toast_move' data-symbol='${r.symbol}'>`);
                    }else{
                        html.push(`<tr class='blue-text text-accent-4 app_toast_move' data-symbol='${r.symbol}'>`);
                    }
                    html.push(`<td>${r.regtime.split(' ')[0]}<br/>${r.regtime.split(' ')[1]}</td>`);
                    html.push(`<td>(${r.flag})<br/>${r.symbol}</td>`);
                    html.push(`<td>${r.price} x ${r.quantity}<br/>= ${r.sum}</td>`);
                    html.push(`</tr>`);
                }
                $("#list").append(html.join(''));

                // 클릭 시 하단 토스트
                $(".app_toast_move").click(function() {
                    let symbol = $(this).data('symbol');
                    view_in_steemengine(symbol);
                });
            }
            
        });
});

/*
 <td >2019.08.16<br/>00:19:39</td>
            <td >(sell)<br/>Eclair</td>
            <td >3.007</td>
            <td >400</td>
            <td >1202.8</td>
*/


/*

$loki: 136901
account: "glory7"
expiration: 1568474379
flag: "buy"
price: "3.007"
quantity: "400"
regtime: "2019.08.16 00:19:39"
sum: 1202.8
symbol: "SCTM"
timestamp: 1565882379
tokensLocked: "1202.80000000"
txId: "8be75f373e75cabf9eb27069000fa9aaf208540c"

*/
    

