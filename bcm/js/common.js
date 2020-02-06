const URL_STEEM             = 'https://api.steemit.com';
const URL_STEEM_ENGINE 		  = 'https://api.steem-engine.com/';
const URL_STEEM_ENGINE_RPC 	= 'https://api.steem-engine.com/rpc/';
const BLOCKCHAIN_API 	      = 'blockchain';
const CONTRACTAPI 		      = 'contracts';
const MAX_RETRY             = 10;
const MIN_STAKE_VALUE       = 10;


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
    return send_rpc('findOne', params, `${URL_STEEM_ENGINE_RPC}/${CONTRACTAPI}` );
}

const _find = function (contract, table, query, limit = 1000, offset = 0, indexes = []){
    let params ={
        contract,
        table,
        query,
        limit,
        offset,
        indexes
  }
    return send_rpc('find', params, `${URL_STEEM_ENGINE_RPC}/${CONTRACTAPI}` );
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
    return send_rpc('find', params, `${URL_STEEM_ENGINE_RPC}/${CONTRACTAPI}` );
}

const _token_holders = function (symbol, limit = 1000, offset = 0, indexes = []){
  return _find('tokens', 'balances', {symbol}, limit, offset, indexes );
}

/// 모든 토큰 홀더의 정보를 가져온다
const token_holders_all = async (symbol, limit=1000) =>{

  let offset = 0;
  let retry = 1;
  let results = [];

  while(true){
    let res = (await _token_holders(symbol, limit, offset)).result; // 추후 네트워크 오류등에 대한 처리는 필요할 듯
    results = results.concat(res);  // 결과를 추가한다
    offset+=limit;
    console.log(`token_holders_all : try ${retry}`)

    // 작업 종료
    if(res.length<limit){
      break;
    }

    // MAX 수치 이상 RETRY 는 금지
    retry++;
    if(retry>MAX_RETRY){
      console.log(`token_holders_all overflow max retry : [${MAX_RETRY}]`);
      break;
    }
  }

  return results;
}

const get_all_account_history = async (account, cmd='', limit=10000, read_once=false) =>{

  let results = [];
  let start_at = -1;

  while(true){
    let result = await steem.api.getAccountHistoryAsync(account, start_at, limit);
    let _start = result[0][0];
    let _end = result[result.length-1][0];
    console.log(`get_all_account_history : loading remains (${_start}), loaded from : ${_end}`);

    if(cmd!=''){
      let filtered = result.filter(([idx,trx])=>{
        let [_cmd, _op] = trx.op;
        // 임대받은 정보만 추출 
        return _cmd==cmd;
      });
      results = results.concat(filtered);
    }else{
      results = results.concat(result); 
    }
    let idx = result[0][0];
    if(idx<10){
      break;
    }
    start_at = result[0][0] - 1;
    if(start_at<limit){
      limit = start_at;
    }

    // 무조건 1번만 읽어들이기 : 테스트용
    if(read_once){
      break;  
    }
    
  }

  // 최신이 뒤로 가도록 설정, 추후 덮어 쓰기를 위함
  results.sort((a,b)=>{
    return a[0] - b[0];
  })

  return results;
}

const get_all_deligations = async (account, token='', cmd='delegate_vesting_shares', limit=10000) => {

  console.log(`get_all_deligations : start`);

  // 전역 설정 정보 확보 
  console.log(`getDynamicGlobalPropertiesAsync : start`);
  let dgp = await steem.api.getDynamicGlobalPropertiesAsync();  // total_vesting_shares
  console.log(`getDynamicGlobalPropertiesAsync : end`);

  let total_vesting_shares = dgp.total_vesting_shares.split(' ')[0];  // VESTS
  let total_vesting_fund_steem = dgp.total_vesting_fund_steem.split(' ')[0];  // STEEM
  
  // 계정 이력 전체 정보를 조회한다
  console.log(`get_all_account_history : start`);
  let received = await get_all_account_history(account, '', limit);
  console.log(`get_all_account_history : end`);
  
  let res = received.filter(([idx,trx])=>{
    let [cmd, op] = trx.op;
    // 임대받은 정보만 추출 
    return cmd=='delegate_vesting_shares' && op.delegatee==account;
  })

  // 임대 받은 정보
  let delegator_obj = {};
  for(let [idx,trx] of res){
    let [cmd, op] = trx.op;
    let timestamp = Date.parse(`${trx.timestamp}Z`);
    // let timestamp_kr = dateformat(new Date(timestamp), 'yyyy-mm-dd HH:MM:ss');
    let timestamp_kr = time('yyyy-mm-dd HH:MM:ss', timestamp);

    // 임대 받은 정보를 최신 시간 정보 기준으로 덮어 쓴다. 0 VESTS 이면 임대를 회수 했다는 뜻
    delegator_obj[op.delegator] = {
      account:op.delegator,
      vesting_shares:op.vesting_shares,
      trx_id:trx.trx_id,
      timestamp,
      timestamp_kr,
    };
  }

  // 토큰 정보를 추가한다
  let tholders = [];
  let total_stake_bcm = 0;
  if(token!=''){
    console.log(`token_holders_all : start`);
    let holders = await token_holders_all(token.toUpperCase());
    total_stake_bcm = holders.reduce((acc,curr)=>{
      return acc + parseFloat(curr.stake);
    }, 0);
    total_stake_bcm = parseFloat(total_stake_bcm.toFixed(4));
    console.log(`token_holders_all : end`);

    for(let c of holders){
      var vp = parseFloat((Math.min( ( (c.stake * 100 ) / total_stake_bcm ) * 9 , 100)).toFixed(2));
      delegator_obj[c.account] = delegator_obj[c.account] || {};
      delegator_obj[c.account] = {...delegator_obj[c.account], account:c.account, balance:c.balance, stake:c.stake, vp}
    }
    tholders = holders.map(x=>x.account);
  }

  // 스파 정보를 추가한다
  let output = [];
  for(let [k,v] of Object.entries(delegator_obj)){
    let vs = v.vesting_shares?v.vesting_shares.split(' ')[0]:0;

    let sp = steem.formatter.vestToSteem(vs, total_vesting_shares, total_vesting_fund_steem);
    let stake = parseFloat(v.stake||0);
    let daily = sp+stake>0?(((sp/3) + stake)*0.18) / 365:0;
    daily = parseFloat(daily.toFixed(4));

    output.push({
      account:v.account,
      vesting_shares:v.vesting_shares||'',
      trx_id:v.trx_id||'',
      timestamp:v.timestamp||'',
      timestamp_kr:v.timestamp_kr||'',
      sp,
      balance:v.balance||0,
      stake,
      daily,
      vp:v.vp||0,
    });
  }

  // 최근 정보가 맨 위로 나오도록 함
  output.sort((a,b)=>b.daily-a.daily);
  console.log(`get_all_deligations : end`);
  
  // 예상 보팅 파워 정보
  let exp = output.filter(x=>x.vp>1);
  exp.sort((a,b)=>b.vp-a.vp);

  // 보팅 이력정보 추가
  let votes = received.map(x=>x);  // map 을 통해 복사 처리, 이후 앞쪽 N개를 잘라줌
  votes.reverse();
  votes = votes.filter(([idx,trx])=>trx.op[0]=='vote'&&trx.op[1].voter=='bcm');
  votes = votes.filter(([idx,trx])=>tholders.includes(trx.op[1].author));
  votes = votes.splice(0,100);  // spice 는 return & remain 값이 다름에 유의

  votes = votes.map(([rdx,trx], idx)=>{
    return {
      is_holder:tholders.includes(trx.op[1].author),
      author:trx.op[1].author,
      permlink:trx.op[1].permlink,
      weight:trx.op[1].weight,
      trx_id:trx.trx_id,
      timestamp_kr:time('yyyy-mm-dd HH:MM:ss', `${trx.timestamp}Z`),
      rnk : `${idx+1}/${votes.length}`
    };
  });

  return {
    deligations:output,
    total_stake_bcm,
    exp,
    votes,
  };
}

////////////////////////////////////////
/// 
/// UTL
/// 

const time = (format='yyyy-mm-dd HH:MM:ss', date=new Date()) => {
    // 날짜 형태로 변형
    date = _to_date(date);

    const yyyy = date.getFullYear().toString();
    const yy = yyyy.substr(2);
    const mm = pad_zero(date.getMonth() +1);
    const dd = pad_zero(date.getDate());

    const HH = date.getHours();
    const MM = pad_zero(date.getMinutes());
    const ss = pad_zero(date.getSeconds());
    const mi = pad_zero(date.getMilliseconds(),3);
    const fmt = {yyyy,yy,mm,dd,HH:pad_zero(HH), hh:pad_zero(HH>12?HH-12:HH), MM, ss, mi};

    for(let [k,v] of Object.entries(fmt) ){
      format = format.replace(k,v);
    }

    return format;
}

const _to_date = (source) =>{
  // date type
  if(source && typeof source.getMilliseconds == 'function'){
    return source;
  }

  // milliseconds
  const _MILI_0 = 946684800000;
  if(!isNaN(source) && source>_MILI_0 ){
    let d = new Date();
    d.setTime(source);
    return d;
  }

  // yyyymmdd, yymmdd, 2020-01-15T07:22:36 (19) => 2020-01-15T07:22:36.000Z
  if(isNaN(Number(source))){
    if(source.toString().length==8){
      source = apply_numformat(source, '####-##-##');
    }else if(source.toString().length==6){
      // 20을 붙여준다
      source = apply_numformat(source, `${_DEFAULT_PREFIX_YEAR}##-##-##`);
    }else if(source.toString().length==19){
      source = `${source}.000Z`;
    }
  }

  // parse date
  let parsed = Date.parse(source);
  if(!isNaN(parsed)){
    let d = new Date();
    d.setTime(parsed);
    return d;
  }

} // _to_date
  
const pad_zero = (source, len=2) => source.toString().padStart(len, '0');

const is_not_number = (source) => isNaN(parseFloat(source));

const apply_numformat = (source, fmt='####-##-##') =>{

  let _source = source.toString().split('');
  let _fmt = fmt.split('');
  let idx = 0;
  let output = [];

  for(let f of _fmt){
    if(f=='#'){
      output.push( _source[idx] );
      idx++;
    }else{
      output.push(f);
    }
  }

  return output.join('');
}

/// 입력값에 컴마를 붙여 준다
const add_comma = (source) => {
  // 숫자가 아닌 경우
  if(is_not_number(source)){
    return source;
  }

  let nums = source.toString().split('.');
  let prefix = nums[0].replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
  return nums.length==1?prefix:`${prefix}.${nums[1]}`;
}