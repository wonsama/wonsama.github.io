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

    $(`img.ad:nth-child(${rnd+1})`).show();
    $("#app_holer_title").text(`Loading ...`);
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

// ________________________________________________________________________________
// DOM LOADING COMPLETE
// ________________________________________________________________________________

document.addEventListener('DOMContentLoaded', function() {

    // 파라미터 정보를 가져온다
    let {account} = _get_params();
    
    // 광고 정보 설정
    _set_ad();

    // 머트리얼 초기화
    M.AutoInit();

    _get_token_tradings(account)
        .then(res=>{

            $(".ad").hide();
            $("#app_list").show();

            $("#app_holer_title").text(`${account}의 토큰 거래정보`);
            $("#list").empty();
            if(res.length==0){
                $("#list").append("<tr><td colspan=5 class='center'>No Data</td></tr>");    
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
                    html.push(`<td>${r.price}</td>`);
                    html.push(`<td>${r.quantity}</td>`);
                    html.push(`<td>${r.sum}</td>`);
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
    

