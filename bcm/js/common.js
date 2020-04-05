const URL_STEEM             = 'https://api.steemit.com';
const URL_STEEM_ENGINE 		  = 'https://api.steem-engine.com/';
const URL_STEEM_ENGINE_RPC 	= 'https://api.steem-engine.com/rpc/';
const BLOCKCHAIN_API 	      = 'blockchain';
const CONTRACTAPI 		      = 'contracts';
const MAX_RETRY             = 10;
const MIN_STAKE_VALUE       = 10;
const FULL_VOTE_SIZE        = 10;
const URL_STEEM_ENGINE_SCOT = 'https://scot-api.steem-engine.com';

////////////////////////////////////////
/// 
/// POST 
/// 

let send_data_post = (url = ``, data = {}, is_parse_json=true) => {
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
    .then(response => is_parse_json?response.json():response); // parses JSON response into native Javascript objects 
}

let send_data_get = (url = ``, is_parse_json=true) => {
  // Default options are marked with *
    return fetch(url, {
        method: "GET", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        // headers: {
            // "Content-Type": "application/json",
            // "Content-Type": "application/x-www-form-urlencoded",
        // },
        // redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        // body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    .then(response => is_parse_json?response.json():response); // parses JSON response into native Javascript objects 
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
	return send_data_post(url, rpc20(method,params,id));
}

////////////////////////////////////////
/// 
/// SCOT
///

// 대상 토큰의 보팅 퍼센트를 반환한다 0~100 사이의 수
const _get_scot_vp = (token) =>{
  const __MILLISEC = 1000;
  const __CHARGE_PER_SEC = 60 * 60 * 24 * 5;  // 432000, 1초당 충전되는 수치, *5는 하루 20% 1/5을 의미함

  let vp = token.voting_power; // 10000 is max
  let now = new Date().getTime();
  let prev = new Date(token.last_vote_time+'Z').getTime();
  let gap = parseFloat((now - prev) / 1000);
  let calc = parseFloat(10000 * gap / __CHARGE_PER_SEC);

  return parseFloat((Math.min(10000, vp+calc) / 100).toFixed(2));
}

const get_scot_vp = (author, token) => {
  return get_scot_user(author).then(res=>_get_scot_vp(res[token.toUpperCase()]));
}

// 계정 토큰 잔고 정보를 보여준다 
const get_scot_user = (author) => {
  return send_data_get(`${URL_STEEM_ENGINE_SCOT}/@${author}?v=${new Date().getTime()}`)
}

////////////////////////////////////////////////////////////
//
// public function (공개 함수)
//


////////////////////////////////////////
/// 
/// STEEM
/// 

// 해당 계정의 보팅 파워를 계산해 준다
const get_vp = (authors)=>{

  const __MAX_VOTING_POWER = 10000;
  const __CHARGE_PER_SEC = 60 * 60 * 24 * 5;  // 432000, 1초당 충전되는 수치, *5는 하루 20% 1/5을 의미함

  const __parse = (r) => {

    let account = r.name;
    let last = r.voting_power; //최근 투표일 기준 보팅파워 , 10000 is max
    let gap = (new Date().getTime() - new Date(r.last_vote_time + "Z").getTime())/1000; // 최종 보팅한 이후 흐른 시간, 초
    let vp = Math.min(__MAX_VOTING_POWER, parseInt(last +  ( gap / __CHARGE_PER_SEC ) * __MAX_VOTING_POWER)); // 시간차를 적용한 현재 보팅파워 10000 is max

    console.log(r)

    return {
      account, last, gap, vp, 
      vesting_shares:parseFloat(r.vesting_shares.split(' ')[0]),  // 내꺼 
      received_vesting_shares:parseFloat(r.received_vesting_shares.split(' ')[0]),  // 임대 받은거 
      delegated_vesting_shares:parseFloat(r.delegated_vesting_shares.split(' ')[0]),  // 임대 해준거
    };
  }

  if(authors && !Array.isArray(authors)){
    authors = [authors];
  }
  const is_one = authors.length==1?true:false;

  return send_rpc('condenser_api.get_accounts',[authors],URL_STEEM)
    .then(res=>{
      if(is_one){
        return Promise.resolve(res.result.map(r=>__parse(r))[0]);
      }else{
        return Promise.resolve(res.result.map(r=>__parse(r)));  
      }
  });
}

const get_vp_with_price = (author) =>{
  return Promise.all([
    get_vp(author),
    steem.api.getRewardFundAsync('post'),
    steem.api.getCurrentMedianHistoryPriceAsync(),
    steem.api.getDynamicGlobalPropertiesAsync(),
  ]).then(res=>{
    let _vp = res[0];  // vp.vp
    let rf = res[1];  // rf.reward_balance, rf.recent_claims
    let cmhp = res[2];
    let dgp = res[3];

    let reward_balance = parseFloat(rf.reward_balance.split(' ')[0]);
    let recent_claims = parseInt(rf.recent_claims);
    let base = parseFloat(cmhp.base.split(' ')[0]);   // SBD
    let quote = parseFloat(cmhp.quote.split(' ')[0]); // STEEM
    let total_vesting_fund_steem = parseFloat(dgp.total_vesting_fund_steem.split(' ')[0]);
    let total_vesting_shares = parseFloat(dgp.total_vesting_shares.split(' ')[0]);

    let m = total_vesting_fund_steem / total_vesting_shares;
    let p = reward_balance / recent_claims;
    let l = base / quote; // steem price
    let e = parseInt(steem.formatter.vestToSteem(
      _vp.vesting_shares+_vp.received_vesting_shares-_vp.delegated_vesting_shares, 
      total_vesting_shares, total_vesting_fund_steem)); // steempower
    let t = _vp.vp / 100; // votingpower
    let a = 100; // voteweight
    let n = e / m;
    let r = parseInt(100 * t * (100 * a) / 1e4);
    r = parseInt((r + 49) / 50);
    let i = parseInt(n * r * 100);
    let o = ((i + 2e12) * (i + 2e12) - 4e24) / (i + 8e12) * p * l;

    return Promise.resolve({
      sp:e,
      vp:t,
      steem_price_sbd:parseFloat(l.toFixed(2)),
      exp_dollar:parseFloat(o.toFixed(4)),
    });
  })
}

////////////////////////////////////////
/// 
/// STEEM-ENGINE
/// 

let findOne = function (contract, table, query){
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
      var vp = parseFloat((Math.min( ( (c.stake * 100 ) / total_stake_bcm ) * FULL_VOTE_SIZE , 100)).toFixed(2));
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
    // let daily = sp+stake>0?(((sp/3) + stake)*0.18) / 365:0;
    let daily = sp+stake>0?((stake)*0.1) / 365:0;
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