const URL_STEEM_ENGINE 		= 'https://api.steem-engine.com/';
const URL_STEEM_ENGINE_RPC 	= 'https://api.steem-engine.com/rpc/';
const BLOCKCHAIN_API 	= 'blockchain';
const CONTRACTAPI 		= 'contracts';

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

let send_rpc = async function (method, params, url, id=1){
	return postData(url, rpc20(method,params,id));
}

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

let token_holders = async function (symbol, limit = 1000, offset = 0, indexes = []){
	return find('tokens', 'balances', {'symbol':symbol}, limit, offset, indexes );
}

////////////////////////////////////////
/// 
/// UTL
/// 

let add_comma = (number) =>new Intl.NumberFormat('ko-KR', { maximumSignificantDigits: 3 }).format(number);

