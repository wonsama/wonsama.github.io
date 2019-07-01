document.addEventListener('DOMContentLoaded', function() {

    // 컴포넌트 초기화
    _init_component();
    
    // 토큰 목록정보 수신(콤보)
    _get_ls_token_infos()
        .then(res=>{
            let templates = [];
            for(let t of res){
                templates.push(`<option value="${t.symbol}" data-icon="${t.meta_icon}" class="left">${t.symbol}</option>`);
            }
            $("#sel_token").html(templates.join(''));

            // 컴포넌트 초기화
            _init_component('select');
            $("#logo,#menu").click(_open_close_tab);

            // 토큰 잔고 조회
            _reload_token_holders();
        });
    
    // 이벤트 - 정렬 순서 변경 
    $("input[name=grp_order]").change(()=>{
        let v = $("input[name=grp_order]:checked").val();
        
        // 변경된 값 기준으로 화면을 다시 그려준다
        _redraw_tables(received_data);
    });

    // 이벤트 - 토큰 선택 변경 , 홀더 목록 정보 재로딩
    $("#sel_token").change(()=>{        
        _reload_token_holders();
    })

    // 이벤트 - 체크박스 헤더부분 선택
    $("#chk_header").click(()=>{
        console.log("clicked", $("#chk_header").attr("checked"))
        if($("#chk_header").attr("checked")=="checked"){
            $(".chk_list").attr("checked", "checked");
        }else{
            $(".chk_list").attr("checked", "");
        }
        
    })
});

/////////////////////////////////////////////
/// 
/// CONST
/// 

const SELECT_BOX_CLASS = "blue-grey-text text-darken-3";

/////////////////////////////////////////////
/// 
/// GLROBAL VARIABLES
/// 
let received_data;  // 토큰 선택 후 조회한 토큰 홀더 목록 정보

/////////////////////////////////////////////
/// 
/// ETC
/// 


// 로딩 중 표기
const _show_loading = () =>{
    let templates = [];
    templates.push(`<tr><td colspan="5" class="center-align">데이터를 조회 중 입니다.</td></tr>`);
    $("#tokens_body").html(templates.join(''));
}

// 토큰 잔고 조회
const _reload_token_holders = () =>{

    let v = $("#sel_token").val();  // 토큰 홀더 선택 정보를 확인한다

    // 로딩 정보 표기 
    _show_loading();
    
    // 데이터 수신 처리 
    tokens_balances(v)
        .then(_res=>{

            // 수신한 토큰의 누락된 기본 값을 설정해 준다
            received_data = _set_default_tokens(_res);

            // 변경된 값 기준으로 화면을 다시 그려준다
            _redraw_tables(received_data);
        });
}

// 변경된 값 기준으로 화면을 다시 그려준다
const _redraw_tables = (received_data) =>{

    // 초기화 되기 이전 상태 또는 값이 없는 경우
    if(!received_data){
        return;
    }

    let grp_order = $("input[name=grp_order]:checked").val();   // 선택 정보 : B, S, BS

    // 선택정보에 따라 필터링 및 정렬
    let res = _fiter_by_selected(received_data, grp_order);

    let templates = [];
    for(let r of res){

        let t = [];
        let balance;
        if(grp_order=="B"){
            balance = (parseFloat(r.balance)).toFixed(0);
        }else if(grp_order=="S"){
            balance = (parseFloat(r.stake) + parseFloat(r.delegationsIn)).toFixed(0);
        }else if(grp_order=="BS"){
            balance = (parseFloat(r.balance) + parseFloat(r.stake) + parseFloat(r.delegationsIn)).toFixed(0);
        }

        t.push(`<tr data-balance="${r.balance}" data-stake="${r.stake}" data-delegationsIn="${r.delegationsIn}" data-delegationsOut="${r.delegationsOut}">`);
        t.push(`<td><img src='https://steemitimages.com/u/${r.account}/avatar' style='max-width:30px;max-height:30px;'></td>`)
        t.push(`<td class="valign-wrapper"><label><input type="checkbox" checked="checked" class="chk_list" /><span>${r.account}</span></label></td>`);
        t.push(`<td>${add_comma(balance)}</td>`);
        t.push(`<td>최신글</td>`);
        t.push(`<td>최신보팅</td>`);
        t.push(`</tr>`);

        templates.push(t.join(''));
    }
    if(res.length==0){
        templates.push(`<tr><td colspan="5" class="center-align">조회 된 데이터가 존재하지 않습니다.</td></tr>`);
    }
    $("#tokens_body").html(templates.join(''));
}

// 수신한 토큰의 누락된 기본 값을 설정해 준다
const _set_default_tokens = (_res) => {

    // 데이터 수신 후 전역 값으로 저장
    return _res.result.map(x=>{
        x.balance = x.balance?x.balance:"0";
        x.delegatedStake = x.delegatedStake?x.delegatedStake:"0";
        x.pendingUnstake = x.pendingUnstake?x.pendingUnstake:"0";
        x.receivedStake = x.receivedStake?x.receivedStake:"0";
        x.delegationsIn = x.delegationsIn?x.delegationsIn:"0";
        x.delegationsOut = x.delegationsOut?x.delegationsOut:"0";
        x.stake = x.stake?x.stake:"0";

        return x;
    });
}


// 선택정보에 따라 필터링 및 정렬
const _fiter_by_selected = (res, grp_order) => {

    // 필터 : 0 이하는 목록에서 제외, 정렬 : 내림차순 -> 추후 옵션 추가 필요가 있다면 오름차순도 고려
    if(grp_order=="B"){
        res = res.filter(x=>parseInt(x.balance)>0);
        res.sort((a,b)=>parseFloat(b.balance)-parseFloat(a.balance));
    }else if(grp_order=="S"){
        res = res.filter(x=>parseInt(x.stake)>0);
        res.sort((a,b)=>parseFloat(b.stake)-parseFloat(a.stake));
    }else if(grp_order=="BS"){
        res = res.filter(x=>parseInt(x.balance)+parseInt(x.stake)>0);
        res.sort((a,b)=>parseFloat(b.balance)-parseFloat(a.balance)+parseFloat(b.stake)-parseFloat(a.stake));
    }
    return res;
}

/////////////////////////////////////////////
/// 
/// INIT COMPONENT
/// 

// 컴포넌트를 초기화 시켜준다
// type 미 입력시 모든 항목을 초기화
const _init_component = (type) =>{
    
    if(!type || type=='select'){
        var elems = document.querySelectorAll("select");
        var instances = M.FormSelect.init(elems, {}); // 기본 옵션으로 처리
    }
    if(!type || type=='tooltip'){
        var elems = document.querySelectorAll('.tooltipped');
        var instances = M.Tooltip.init(elems, {});  // 기본 옵션으로 처리
    }
    if(!type || type=='tap'){
        var elems = document.querySelectorAll('.tap-target');
        var instances = M.TapTarget.init(elems, {});
    }

    // select 박스 색상 적용
    $("div.select-wrapper").find("li>span").addClass(SELECT_BOX_CLASS);
}

// 탭 토글 처리 
const _open_close_tab = (sec=4) => {
    var instance = M.TapTarget.getInstance(document.querySelector('.tap-target'));

    if(instance.isOpen){
        instance.close();
    }else{
        instance.open();
    }
}

/////////////////////////////////////////////
/// 
/// LOCAL STORAGE
/// 

// 로컬스토리지 - 저장된 토큰 목록명 정보를 반환한다 / 없으면 기본값 반환 및 저장 
const _get_ls_token_names = ()=>{
    const DEFAULT_TOKEN_NAMES = ['AIT','RORS', 'SCT', 'JJM', 'SCTM', 'WHAN'];
    let ls_token_names = JSON.parse(localStorage.getItem('tokens'));
    if(ls_token_names==null){
        localStorage.setItem('tokens', JSON.stringify(DEFAULT_TOKEN_NAMES) );
    }
    return JSON.parse(localStorage.getItem('tokens'));
}

// 로컬스토리지 - 로컬에 저장된 토큰 상세 정보를 가져온다. 없으면 STEEM-ENGINE에서 가져와 저장
const _get_ls_token_infos = async ()=>{

    let ls_token_names = _get_ls_token_names();
    let ls_token_infos = JSON.parse(localStorage.getItem('token_infos'));

    // {issuer, symbol, name, url, icon, desc}
    // 정보를 다시 읽어들어야 되는지 여부를 판별한다
    let is_reload_needs = false;
    if(ls_token_infos==null || ls_token_names.length!=ls_token_infos.length){
        is_reload_needs = true;
    }else{
        for(let ti of ls_token_infos){        
            if(!ls_token_names.includes(ti.symbol)){
                is_reload_needs = true;
            }
        }
    }

    if(is_reload_needs){
        let list_read = [];
        for(let n of ls_token_names){
            list_read.push(tokens_tokens(n));
        }

        // 기초 데이터 수신 처리
        await Promise.all(list_read)
        .then(res=>{
            let ls_save = [];
            
            res = res.map(r=>{
                delete r.result.$loki;
                let meta = JSON.parse(r.result.metadata);
                let meta_url = meta.url?meta.url:'';
                let meta_icon = meta.icon?meta.icon:'';
                let meta_desc = meta.desc?meta.desc:'';
                r.result.meta_url = meta_url;
                r.result.meta_icon = meta_icon;
                r.result.meta_desc = meta_desc;
                ls_save.push(r.result);
                return r;
            });

            localStorage.setItem('token_infos', JSON.stringify(ls_save));
        });
    }

    return Promise.resolve(JSON.parse(localStorage.getItem('token_infos')));
}

/////////////////////////////////////////////
/// 
/// STEEM ENGINE
/// 



/*

tokens_tokens()

$loki: 1
circulatingSupply: "3963000.00000000"
issuer: "null"
maxSupply: 9007199254740991
metadata: "{"url":"https://steem-engine.com","icon":"https://s3.amazonaws.com/steem-engine/images/icon_steem-engine_gradient.svg","desc":"ENG is the native token for the Steem Engine platform"}"
name: "Steem Engine Token"
precision: 8
supply: 4000000
symbol: "ENG"
*/