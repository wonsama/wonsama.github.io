
// let url = 'https://steemit.com/kr/@wonsama/beta-vtrain';

/*

https://steemit.com/kr/@wonsama/beta-vtrain
https://steemit.com/food/@sunsea/chili-con-carne-mit-3-verschieden-chili-sorten-und-viel-schokolade
https://steemit.com/tasteem/@happyberrysboy/tasteem-4ca89e


viewport
https://developer.mozilla.org/en-US/docs/Mozilla/Mobile/Viewport_meta_tag

Steem Engine Block Explorer
https://steem-engine.rocks/
*/

// 머트리얼 탭 초기화 등 
M.AutoInit();

const get_image = (r) =>{
    let img = '';
    const img_none = 'http://www.trifit-za.sk/image/none.jpg';
    try{
        let t1 = r.json_metadata;
        let t2 = t1?JSON.parse(t1):undefined;
        let t3 = t2.image?t2.image[0]:undefined;
        if(t3){
            img = t3;
        }else{
            let _img = get_image_url(r.body);
            img = _img&&_img.length>0?_img[0]:'';
        }

    }catch(e){}

    return img;
}


const show_default_setting = () =>{
    let author = localStorage.getItem('author');
    let posting = localStorage.getItem('posting');
    let beni = localStorage.getItem('beni');
    let tag = localStorage.getItem('tag');

    $("#inp_author").val(author);
    $("#inp_posting").val(posting);
    $("#inp_beni").val(beni);
    $("#inp_tag").val(tag);
    // $("#inp_tag").focus();
}

const reload_new_feed = () =>{
    const tag = localStorage.getItem('tag');
    
    $("#loading").removeClass('hide');    

    // 탭 2 에 : 태그 기준 최신글 정보를 넣어준다
    steemit_discussions_by_created(tag)
    .then(res=>{

        const img_none = 'http://www.trifit-za.sk/image/none.jpg';
        const header = `<div class="row"><a class="subheader">글 목록</a></div>`;
        
        let templates = [];
        for(let r of res.result){

            let img = get_image(r)
            let temp_img = `<div class='col s4'><img src='${img}' style='max-height:80px; width:80px'></div>`;
            
            let time = `<span class='time'>${get_time(r.created)}</span>`;
            let author = `<span class='author'>@${r.author}</span>`;
            let template = `<div class="row tags" url="https://steemit.com${r.url}" >${temp_img}<p class='ellipsis1'>${r.title}</p>${time} ${author}</div>`;
            templates.push(template);
        }
        $("#disp_list").empty().append(header).append(templates);

        $("#loading").addClass('hide');

        // 탭 2의 컨텐츠 클릭 이벤트 등록처리 
        $(".tags").click(function(e){
            let url = $(this).attr('url');
            // 탭 변경 
            var instance = M.Tabs.getInstance($(".tabs"));
            instance.select('test1');

            // 조회 
            $("#inp_url").val(url);
            $("#inp_url").focus();
            setTimeout(function(){
                $("#inp_url").blur();
            },2000);
            $("#btn_content").trigger("click");
        }); 
    })
}

// 도큐먼트 로딩 완료 
$(document).ready(()=>{

    // 글 목록정보 가져오기
    const header = `<div class="row"><a class="subheader">글 목록</a></div>`;
    $("#disp_list").empty().append(header);

    // 기존 설정 정보 로딩
    show_default_setting();

    // 최신글 정보 다시 읽어들이기 
    reload_new_feed();
});

// 글 조회 버튼
$("#btn_search").click(()=>{

    let url = $("#inp_content").val().replace(/\s/gi,'');
    if(url!='' && url.indexOf('http')==0 ){
        let info = get_url_info(url);

        // 조회 아이콘 감추기
        $("#div_search_prog").removeClass("scale-out");
        $("#div_search_btn").addClass("scale-out");

        steemit_get_content(info.author, info.permlink)
        .then(x=>{
            let r = x.result;
            let img = get_image(r);

            if(img){
                $("#cont_img").attr("src", img);
            }

            // 제목, 내용 보여주기 - 내용보여주면 넘 길어서 안보여줌
            $("#cont_title").html(r.title);
            // $("#cont_body").html(r.body.substr(0,200));

            // 조회 된 내용 보여주기
            $("#area_cont").removeClass("hide");
            $("#area_reply").removeClass("hide");

            // 조회 아이콘 보여주기 
            $("#div_search_prog").addClass("scale-out");
            $("#div_search_btn").removeClass("scale-out");
        });
    }
});

$("#inp_url").keypress((e)=>{
    if(e.keyCode==13){
        $("#btn_content").trigger('click');
        return false;    
    }
});


// 버튼 : 본문 글 조회 
$("#btn_content").click(()=>{
    let url = $("#inp_url").val();
    let info = get_url_info(url);

    $("#loading").removeClass('hide');

    if(!info.err){
        steemit_get_content(info.author, info.permlink).then(x=>{

            $("#loading").addClass('hide');

            let r = x.result;
            let img = get_image(r);
            let temp_img = `<div class='col s4'><img src='${img}' style='max-height:80px; width:80px'></div>`;
            
            let time = `<span class='time'>${get_time(r.created)}</span>`;
            let author = `<span class='author'>@${r.author}</span>`;
            let template = `<div class="row" id="cont_now" author="${info.author}" permlink="${info.permlink}">${temp_img}<p class='ellipsis1'>${r.title}</p>${time} ${author}</div>`;

            // 존재 하지 않는 글
            if(r.id==0){
                time = '';
                author = '';
                template = `<div class="row" id="cont_now" author="" permlink="">${temp_img}존재하지 않는 글 입니다.</div>`;
            }else{


                const EXT_IMG = ['.jpg', '.jpeg', '.png', '.gif', 'steemitimages.com'];
                const _is_inc = (str) => {
                    for(let img of EXT_IMG){
                        if(str.indexOf(img)>=0){
                            return true;
                        }
                    }
                    return false;
                }
                const SHOW_LEN = 100;
                let buff = [];
                let idx = 0;
                let bodies = r.body.split('\n');
                while(idx<bodies.length){
                    let str = bodies[idx];
                    if(str.replace(/\s/gi, '').length>0&&!_is_inc(str)){
                        buff.push(str);
                        if(buff.join('').length>SHOW_LEN){
                            break;
                        }
                    }
                    idx++;
                }

                let text = buff.join('').replace(/(<([^>]+)>)/ig,'');    // remove tag
                let body = `<div class='col s12'><span class='orange-text text-darken-4 ellipsis3'>${text}</span></div>`;
                template += `<div class="row">${body}</div>`
            }

            $("#disp_content").empty()
            .append(template);

            // 현재 글 클릭
            $("#cont_now").click(()=>{
                let a = $("#cont_now").attr("author");
                let p = $("#cont_now").attr("permlink");
                if(a!='' && p!=''){
                    window.open(`https://steemit.com/@${a}/${p}`);
                }
            });
        })
    }else{
        $("#loading").addClass('hide');
    }
})

$("#btn_reset").click(()=>{
    const DEFAULT_TAG_NAME = "kr";

    $("#inp_author").val( '' );
    $("#inp_posting").val( '' );
    $("#inp_beni").val( '' );
    $("#inp_tag").val( DEFAULT_TAG_NAME );

    localStorage.clear();
    localStorage.setItem('author', '');
    localStorage.setItem('posting', '');
    localStorage.setItem('beni', '');
    localStorage.setItem('tag', $("#inp_tag").val());

    show_modal('확인', `초기화 되었습니다.`);
});

const is_empty = (source) => !source || source.replace(/\s/gi, '')==''?true:false;


const show_modal = (title='', message='', type='normal', buttons=[{text:'닫기'}], cb) =>{

    // 색상설정
    let my_color = '';
    if(type=='normal'){
        const REMOVE_CLASSES = [
            'red-text','text-accent-3',
        ];
        my_color = 'red-text text-accent-3';
        $("#modal_title").addClass(my_color);
        // $("#modal_message").addClass(my_color);
    }

    // 제목 내용
    $("#modal_title").text(title);
    $("#modal_message").text(message);

    // 버튼 설정 
    $("#modal_buttons").empty();
    let btemps = [];
    for(let b of buttons){
        let btemp = `<a href="#!" class="modal-close waves-effect waves-green btn-flat w-modal " val='${b.val}'>${b.text}</a>`;
        btemps.push(btemp);
    }
    $("#modal_buttons").append(btemps.join(''));
    $(".w-modal").click((e)=>{
        let val = $(e.target).attr('val');
        if(cb && val){
            cb(val);
        }
    });

    // SHOW MODAL 
    var instance = M.Modal.getInstance($("#modal1"));
    instance.open();   
}

const empty_checker = (arr) => {
    for(let a of arr){
        if(is_empty(a.v)){
            show_modal('오류', `${a.k}는 필수 입력 항목 입니다.`);
            return false;
        }
    }
    return true;
}

const check_info = () => {
    let author = $("#inp_author").val().replace(/\s/gi, '');    // 3자 이상, 16자 이하, 영어로 시작(PASS), 계정 존재여부 파악(PASS)
    let posting = $("#inp_posting").val().replace(/\s/gi, '');  // 5로 시작 , 길이 51
    let beni = $("#inp_beni").val().replace(/\s/gi, '');
    let tag = $("#inp_tag").val().replace(/\s/gi, '');

    // 유효성 검증 - 빈 값
    if(!empty_checker([
        {k:'계정명', v:author},
        {k:'포스팅키', v:posting},
        {k:'베니피셔리(수익자 계정)', v:beni},
        {k:'태그', v:tag},
    ])){
        return undefined;
    }
    
    // 유효성 검증 - 계정명 
    if(author.length<3 || author.length>16){
        // show_modal('오류', '계정명을 확인 바랍니다', 'normal', [{val:'1', text:'닫기'}], function(a){console.log(a)} );
        show_modal('오류', '계정명을 확인 바랍니다');
        return undefined;
    }

    // 유효성 검증 - 포스팅키
    if(posting.length!=51 || posting.indexOf('5')!=0){
        // show_modal('오류', '계정명을 확인 바랍니다', 'normal', [{val:'1', text:'닫기'}], function(a){console.log(a)} );
        show_modal('오류', '포스팅키를 확인 바랍니다');
        return undefined;
    }

    // 유효성 검증 - 베니 계정명 
    if(beni.length<3 || beni.length>16){
        // show_modal('오류', '계정명을 확인 바랍니다', 'normal', [{val:'1', text:'닫기'}], function(a){console.log(a)} );
        show_modal('오류', '베니피셔리(수익자 계정)을 확인 바랍니다');
        return undefined;
    }

    return {author, posting, beni, tag}
}

$("#btn_save").click(()=>{
    
    let info = check_info();

    if(info){
        let {author, posting, beni, tag} = info;

        // 저장 
        localStorage.setItem('author', author);
        localStorage.setItem('posting', posting);
        localStorage.setItem('beni', beni);
        localStorage.setItem('tag', tag);
        reload_new_feed();


        show_modal('확인', `저장되었습니다.`);    
    }
});

$("#btn_about").click(()=>{
    // var elems = document.querySelectorAll('.sidenav');
    var instance = M.Sidenav.getInstance($("#slide-out"));
    instance.open();
})

$("#btn_go_home").click(()=>{
    window.open(`https://steemit.com/@wonsama`);
})

$("#write_reply").click(()=>{
    let body = $("#disp_reply").val();
    let info = check_info();
    let p_author = $("#cont_now").attr("author");
    let p_permlink = $("#cont_now").attr("permlink");

    if(info && p_author && p_permlink && body.replace(/\s/gi,'' )!=''){
        let {author, posting, beni, tag} = info;

        
        let timestamp = new Date().getTime();

        let jsonMetadata = {
            tags: ['beni-reply'],
            app: 'steemit/0.1',
            format: 'markdown'
        };

        $("#loading").removeClass('hide');

        // 글쓰기 작업 수행
        steem.broadcast.commentAsync(
                posting, // wif
                p_author, // parentAuthor
                p_permlink, // parentPermlink
                author, // author
                `${author}-${timestamp}`, // permlink
                '', // title
                body, // body
                JSON.stringify(jsonMetadata) // jsonMetadata
        )
        // 베니피셔리 설정
        .then(x=>{

            // 베니피셔리 설정 
            const beneficiaries = [{ account: 'wonsama', weight: 1000 },{ account: beni, weight: 9000 }]; // 10000 = 100%
            const extensions = [
                [0, {
                    beneficiaries: beneficiaries
                }]
            ];
            return steem.broadcast.commentOptionsAsync(
                posting, /* wif */
                author, /* author */
                `${author}-${timestamp}`, /* permlink */
                '1000000.000 SBD', /* maxAcceptedPayout */
                10000, /* percentSteemDollars */
                true, /* allowVotes */
                true, /* allowCurationRewards */
                extensions
            );

        })
        .then(x=>{
            // 베니피셔리 설정 후 종료 
            // return Promise.resolve(`end with beneficiaries`);
            $("#loading").addClass('hide');

            show_modal('확인', `댓글이 작성되었습니다.`);
        });
    }
});

$(".tab").click(function(e){
    let idx = $(this).attr('idx');
    if(idx==1){
        $("#fab").removeClass('hide');
    }else{
        $("#fab").addClass('hide');
    }
});

$("#fab_menu").click(e=>{
    // var instance = M.FloatingActionButton.getInstance($("#fab"));
    // if(instance.isOpen){
    //     instance.close();
    // }else{
    //     instance.open();
    // }
    reload_new_feed();
});

// $("#fab_reload").click(e=>{
//     reload_new_feed();
//     var instance = M.FloatingActionButton.getInstance($("#fab"));
//     instance.close();
// });
