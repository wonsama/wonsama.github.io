const URL_STEEM             = 'https://api.steemit.com';
const URL_STEEM_ENGINE 		= 'https://api.steem-engine.com/';
const URL_STEEM_ENGINE_RPC 	= 'https://api.steem-engine.com/rpc/';
const BLOCKCHAIN_API 	= 'blockchain';
const CONTRACTAPI 		= 'contracts';


////////////////////////////////////////
/// 
/// POST 
/// 

let postData = (url = ``, data = {}) => {
  // Default options are marked with *
    return fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
            // "Content-Type": "application/x-www-form-urlencoded",
        },
        // redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    .then(response => response.json()); // parses JSON response into native Javascript objects 
}

////////////////////////////////////////
/// 
/// RPC20
/// 

let rpc20 = (method, params, id)=>{
	let json = {};
	json.jsonrpc = '2.0';
	json.method = method;
	if(params){
		json.params = params;	
	}
	json.id = id;

	return json;
}

let send_rpc = async function (method, params, url, id=1){
	return postData(url, rpc20(method,params,id));
}

////////////////////////////////////////
/// 
/// STEEM-ENGINE
/// 

let findOne = async function (contract, table, query){
    let params ={
        contract,
        table,
        query
	}
    return send_rpc('findOne', params, URL_STEEM_ENGINE_RPC + CONTRACTAPI );
}

let find = async function (contract, table, query, limit = 1000, offset = 0, indexes = []){
    let params ={
        contract,
        table,
        query,
        limit,
        offset,
        indexes
	}
    return send_rpc('find', params, URL_STEEM_ENGINE_RPC + CONTRACTAPI );
}

let tokens_balances = async function (symbol, limit = 1000, offset = 0, indexes = []){
	return find('tokens', 'balances', {'symbol':symbol}, limit, offset, indexes );
}

let tokens_tokens = function (symbol, limit = 1000, offset = 0, indexes = []){
    return findOne('tokens', 'tokens', {'symbol':symbol});
}

////////////////////////////////////////
/// 
/// STEEM-RPC20
/// 

let get_accounts = async function (accounts){

    if(!accounts){
        return Promise.reject('accounts is empty');
    }else if(!Array.isArray(accounts)){
        accounts = [accounts];
    }
    
    return send_rpc('condenser_api.get_accounts', [accounts], URL_STEEM );
}

/*
* 대상 계정의 date 이전일 기준 최신글 정보를 N개(기본 10개) 추출 
* date sample : 2019-06-23T04:19:57 
*/
const get_discussions_by_author_before_date = (author, date, limit=10, permlink="") =>{
    const params = [
        author,
        permlink,
        date,
        limit
    ];

    return send_rpc('condenser_api.get_discussions_by_author_before_date', params, URL_STEEM )
    .then(res=>{
        // 날짜 기준으로 필터링 : date 기준으로 필터링이 되지 않음 -_-;
        res = res.result.filter(x=>{
            return new Date(`${x.created}.000Z`).getTime() > new Date(`${date}.000Z`).getTime();
        });

        // 날짜 역순으로 정렬
        res.sort((a,b)=>new Date(`${b.created}.000Z`).getTime() - new Date(`${a.created}.000Z`).getTime());
        return Promise.resolve(res);
    });
}

////////////////////////////////////////
/// 
/// UTL
/// 
/// 
/// 


/// 입력 날짜[date]를 포맷[format]에 맞게 변형한다
function dateformat(date, format='yyyy.mm.dd HH:MM:ss'){
    // yyyy.mm.dd HH:MM:ss
    const yyyy = date.getFullYear();
    const yy = yyyy.toString().substr(2);
    const mm = date.getMonth() + 1;
    const dd = date.getDate();

    const HH = date.getHours(); // 0 ~ 24
    const MM = date.getMinutes();
    const ss = date.getSeconds();

    const APM = HH>12?'PM':'AM';
    const HH12 = HH>12?HH-12:HH;

    let fmt = [
        // {key : 'yyyy', value:yyyy},
        // {key : 'yy', value:yy},
        {key : 'mm', value:padnum(mm)},
        {key : 'dd', value:padnum(dd)},
        // {key : 'HH', value:HH},
        {key : 'MM', value:padnum(MM)},
        {key : 'ss', value:padnum(ss)},
        {key : 'APM', value:APM},
    ];

    // 연도
    if(format.indexOf('yyyy')>=0){
        format = format.replace('yyyy', padnum(yyyy,4));
    }else if(format.indexOf('yy')>=0){
        format = format.replace('yy', padnum(yy));
    }

    // 시간 
    if(format.indexOf('HH12')>=0){
        format = format.replace('HH12', padnum(HH12));
    }else if(format.indexOf('HH')>=0){
        format = format.replace('HH', padnum(HH));
    }

    // 나머지 
    for(let f of fmt){
        format = format.replace(f.key, f.value);
    }

    return format;
}

/// 숫자를 패딩처리 해준다
const padnum = (num, len=2)=>{
    if(num.toString().length<len){
        let gap = num.toString().length<len;
        let buf = [];
        for(let i=0;i<gap;i++){
            buf.push('0');
        }
        buf.push(num.toString());
        return buf.join('');
    }
    return num;
}

// 부동소숫점 오류를 방지하기 위해 decimal 커팅처리
// 숫자 - 문자 - 숫자 화
const parse_float = (number,decimal=3) =>{
    // 입력값이 숫자 또는 숫자 형태의 문자열 이어야 됨.
    if(isNaN(number)){
        throw new Error(`${number} is not number.`);
    }
    return parseFloat( parseFloat(number).toFixed(decimal) );
}

function numberComma(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

let add_comma = (number) => {
    let flag = '';
    if(number<0){
        flag = "-";
        number = number * -1;
    }

    let _num = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let nums = _num.split('.');
    if(nums.length==2){
        nums[1]=nums[1].replace(/\,/gi, '');    // 소숫점 아래로 , 찍히는거 제거
        return nums.join('.');
    }
    return flag + nums;
}
let view_in_steemit = (account) => {

    M.Toast.dismissAll();
    
    let toastHTML = `<span>move to<br>@${account}'s blog ?</span><button class="btn-flat toast-action app_move_steemit" account='${account}'>move steemit</button>`;
    M.toast({html: toastHTML});

    $(".app_move_steemit").click(function(){
        let account = $(this).attr('account');
        console.log('account', account)
        window.open(`https://steemit.com/@${account}`,'_blank');
    });
}

let view_in_steemengine = (symbol) => {

    symbol = symbol.toUpperCase();

    M.Toast.dismissAll();
    
    let toastHTML = `<span>move to<br>S/E ${symbol} ?</span><button class="btn-flat toast-action app_move_se" symbol='${symbol}'>move S/E</button>`;
    M.toast({html: toastHTML});

    $(".app_move_se").click(function(){
        let symbol = $(this).attr('symbol');
        console.log('symbol', symbol)
        window.open(`https://steem-engine.com/?p=market&t=${symbol}`,'_blank');
    });
}