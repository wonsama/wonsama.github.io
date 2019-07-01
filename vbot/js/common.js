////////////////////////////////////////
/// 
/// INFO 
/// 

/*
    TITLE : 
        보팅봇 도우미 
    
    DESCRIPTION : 
        N/A
    
    CREATED AT : 
        2019.06.26
*/

////////////////////////////////////////
/// 
/// CONST 
/// 

const URL_STEEM             = 'https://api.steemit.com';
const URL_STEEM_ENGINE 		= 'https://api.steem-engine.com/';
const URL_STEEM_ENGINE_RPC 	= 'https://api.steem-engine.com/rpc/';

const BLOCKCHAIN_API 	= 'blockchain';
const CONTRACTAPI 		= 'contracts';

////////////////////////////////////////
/// 
/// POST 
/// 

/*
* POST 전송처리를 수행한다
* @param url 정보
* @param data 전송 데이터
*/
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

/*
* RPC20 통신 규격
* @param method 메소드
* @param params 파라미터 정보 
* @param id 전송 아이디 
*/
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

/*
* RPC20 통신을 수행한다
* @param method 메소드
* @param params 파라미터 정보 
* @param url 전송 URL
*/
let send_rpc = async function (method, params, url, id=1){
	return postData(url, rpc20(method,params,id));
}

////////////////////////////////////////
/// 
/// STEEM-ENGINE
/// 

/*
* 단건 조회
* @param contract 계약정보
* @param table 테이블 
* @param query 쿼리
*/
let findOne = async function (contract, table, query){
    let params ={
        contract,
        table,
        query
	}
    return send_rpc('findOne', params, URL_STEEM_ENGINE_RPC + CONTRACTAPI );
}

/*
* 다건 조회
* @param contract 계약정보
* @param table 테이블 
* @param query 쿼리
* @param limit 조회 최대 수치
* @param offset 조회 시작 위치
* @param indexes 인덱스키 
*/
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

/*
* 토큰 잔고를 확인한다
* @param symbol 토큰 심볼
*/
let tokens_balances = async function (symbol, limit = 1000, offset = 0, indexes = []){
	return find('tokens', 'balances', {'symbol':symbol}, limit, offset, indexes );
}

/*
* 토큰 정보 확인
* @param symbol 토큰 심볼
*/
let tokens_tokens = function (symbol, limit = 1000, offset = 0, indexes = []){
    if(symbol){
        return findOne('tokens', 'tokens', {'symbol':symbol});
    }else{
        return find('tokens', 'tokens', {});
    }
}

////////////////////////////////////////
/// 
/// STEEM-RPC20
/// 

/*
* 계정 정보를 가져온다
* @param accounts 단건인경우(String), 다건인경우(Array) 형태로 계정명 정보(@제외)를 넣어주면 된다
*/
let get_accounts = async function (accounts){

    if(!accounts){
        return Promise.reject('accounts is empty');
    }else if(!Array.isArray(accounts)){
        accounts = [accounts];
    }
    
    return send_rpc('condenser_api.get_accounts', [accounts], URL_STEEM );
}

////////////////////////////////////////
/// 
/// UTL
/// 
/// 
/// 

/*
* 숫자에 콤마를 붙여준다(3)
* @param number 입력 값 
*/
let add_comma = (number) => {
    let _num = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let nums = _num.split('.');
    if(nums.length==2){
        nums[1]=nums[1].replace(/\,/gi, '');    // 소숫점 아래로 , 찍히는거 제거
        return nums.join('.');
    }
    return nums;
}
