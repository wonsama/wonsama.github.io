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

////////////////////////////////////////
/// 
/// UTL
/// 
/// 
/// 


function numbeComma(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

let add_comma = (number) => {
    let _num = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let nums = _num.split('.');
    if(nums.length==2){
        nums[1]=nums[1].replace(/\,/gi, '');    // 소숫점 아래로 , 찍히는거 제거
        return nums.join('.');
    }
    return nums;
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
