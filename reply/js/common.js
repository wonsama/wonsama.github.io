//////////////////////////////////////
/// 
/// const 
/// 

const STEEMIT_API_URL = 'https://api.steemit.com';

const METHOD_GET_CONTENT = 'condenser_api.get_content';
const METHOD_GET_DISCUSSIONS_BY_CREATED = 'condenser_api.get_discussions_by_created';

//////////////////////////////////////
/// 
/// private
/// 


const _rpc20 = (method, params, id)=>{
	let json = {};
	json.jsonrpc = '2.0';
	json.method = method;
	if(params){
		json.params = params;	
	}
	json.id = id;

	return json;
}

const _post_data = (url = ``, data = {}) => {
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

const _send_rpc = (method, params, url=STEEMIT_API_URL, id=1) => {
	return _post_data(url, _rpc20(method,params,id));
}

const _pad2 = (num) =>{
    return num.toString().padStart(2, '0');
}

//////////////////////////////////////
/// 
/// public
/// 



const get_time = (created) =>{
    let d = new Date(`${created}`+'.000Z');
    
    let _yyyy = d.getFullYear();
    let yy = _pad2(_yyyy.toString().substr(2,2));
    
    let mm = _pad2(d.getMonth() + 1); 
    let dd = _pad2(d.getDate());
    let HH = _pad2(d.getHours());  // 24H
    let MM = _pad2(d.getMinutes());
    let ss = _pad2(d.getSeconds());

    return `${yy}-${mm}-${dd} ${HH}:${MM}:${ss}`;
}

const get_image_url = (body) =>{
    // 한글은 지원하지 않음에 유의 w+ 로 되어 있기 때문
    return body.match(new RegExp(`((?:http|https)?:\/\/.*\.(?:png|jpg|jpeg))`, 'g'));   // image url extract
}

const get_url_info = (url)=>{

    if(!url){
        return {err:'url is empty'};
    }
    
    const p = url.split('/').reverse();
    if(url.indexOf('http')!=0 || p.length<2 ){
        return {err:`input url [ ${url} ] is not valid url.`};
    }

    let permlink = p[0];
    permlink = permlink.split('?')[0];  // 파티코는 permlink 에 레퍼럴을 포함하기 때문임
    const author = p[1].replace(/\@/gi,'');

    
    return {author, permlink};
}

const steemit_discussions_by_created = (tag, limit=20, truncate_body=0)=>{
    return _send_rpc(METHOD_GET_DISCUSSIONS_BY_CREATED, [{tag:tag, limit:limit, truncate_body:truncate_body}]);
}

const steemit_get_content = (author, permlink) => {
    return _send_rpc(METHOD_GET_CONTENT, [author, permlink]);
}
