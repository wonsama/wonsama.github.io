// 설정정보
/*
    see : 

    https://developers.steem.io/apidefinitions/
    https://github.com/steemit/steem-js/tree/master/doc/
*/

const url = new URL(window.location.href).searchParams;
const watch_tag = url.get('tag')?url.get('tag'):'kr';

const CONFIG = {
    CONTENT_RELOAD_SEC : 10,    // 최소 10 (초) 이상으로 설정하는 것을 권장
    CONTENT_READ_COUNT : 20,    // 한번 로딩시 읽어들일 숫자, 최소 10 이상 권장 
    CONTENT_TRUNC_LEN : 0,    // 0 으로 설정하면 body 정보를 다 가져옴
    CONTENT_BUFFER : 30,      // 화면상에 보관할 컨텐츠 갯수 (CONTENT_READ_COUNT) 보다는 커야 됨
    BODY_LEN : 300,
    WATCH_TAG : watch_tag,           // 읽어들일 tag 정보 
};

let lastloaded = 0;

let query = {
    "tag":CONFIG.WATCH_TAG, 
    "limit": CONFIG.CONTENT_READ_COUNT, 
    "truncate_body": CONFIG.CONTENT_TRUNC_LEN
};

let total_vesting_shares=0;
let total_vesting_fund_steem=0;

// 기본 설정정보 로딩
steem.api.getDynamicGlobalPropertiesAsync().then(result=>{
    total_vesting_shares = result.total_vesting_shares;
    total_vesting_fund_steem = result.total_vesting_fund_steem;

    loadCreatedContents();
});

let loadCreatedContents = () => {
    
    let loadContents = [];

    steem.api.getDiscussionsByCreatedAsync(query)
    .then(results=>{

        loadContents = results;

        let authors = [];
        for(let result of results){
            authors.push(result.author);
        }

        // 계정 목록 정보를 읽어들인다
        return steem.api.getAccountsAsync(authors);
    })
    .catch(e=>{
        console.log('fail step 1 : ', e);
        setTimeout(loadCreatedContents, CONFIG.CONTENT_RELOAD_SEC*1000);
    }).then(results=>{
        
        let DEFAULT_TITLE_IMAGE = 'http://ideabag.net/wp-content/uploads/2018/03/Image-not-found.jpg';
        let DEFAULT_PROFILE_IMAGE = 'https://cdn.onlinewebfonts.com/svg/img_5573.png';

        let idx = 0;
        let htmlTemplate = [];

        // 후원
        let amount = `1.000%20SBD`;
        let amountShow = amount.replace('%20',' ');
        let memo = encodeURIComponent(`@wonsama의 개발을 응원합니다.`);
        let msgUrl = `https://steemconnect.com/sign/transfer?to=wonsama&amount=${amount}&memo=${memo}`;

        htmlTemplate.push(`<table class='mytb'>`);
        htmlTemplate.push(`<tr><td>`);
        htmlTemplate.push(`<hr>`);
        htmlTemplate.push(`Steemit KR Live [ refresh at : ${getFormadate(new Date)} ]`);
        htmlTemplate.push(`created by <a href='https://steemit.com/@wonsama' target='_blank'>wonsama</a> / <a href='${msgUrl}' target='_blank'>1 SBD 후원하기</a>`);
        htmlTemplate.push(`<hr>`);
        htmlTemplate.push(`</td></tr>`);
        htmlTemplate.push(`</table'>`);

        for(let result of results){

            let template = [];

            let profile_image = getImageProfile(result.json_metadata);

            let reputation = steem.formatter.reputation(result.reputation); // reputation
            let vesting_shares = Number(result.vesting_shares.split(' ')[0]); // vest
            let received_vesting_shares = Number(result.received_vesting_shares.split(' ')[0]); // vest
            let delegated_vesting_shares = Number(result.delegated_vesting_shares.split(' ')[0]); // vest

            vesting_shares = vesting_shares + received_vesting_shares - delegated_vesting_shares;
            vesting_shares = steem.formatter.vestToSteem(vesting_shares, total_vesting_shares, total_vesting_fund_steem);
            vesting_shares = Math.round(vesting_shares);
            
            let contents = loadContents[idx];
            let links = `https://steemit.com/${contents.category}/@${contents.author}/${contents.permlink}`;
            let image = getImageLink(contents.body, contents.json_metadata);
            let title = contents.title;
            let author = contents.author;
            let body = removeImageText(removeMd(contents.body.replace(/(<([^>]+)>)/ig,"")));
            body = body.replace('title_image', '');
            let body_cut = body.substr(0,CONFIG.BODY_LEN);
            let tags = getTags(contents.json_metadata);

            // console.log(contents.created)

            htmlTemplate.push(`<table class='mytb'>`);
            htmlTemplate.push(`<tr >`);
            if(image){
                htmlTemplate.push(`    <td rowspan='2' width=200><img src='${image}' class='logo'/></td>`);
            }else{
                htmlTemplate.push(`    <td rowspan='2' width=200><img src='${DEFAULT_TITLE_IMAGE}' class='logo'/></td>`);
            }
            htmlTemplate.push(`    <td class='space' rowspan='2' width=10></td>`);
            
            if(vesting_shares>15){
                htmlTemplate.push(`    <td class='header'>`);
            }else{
                htmlTemplate.push(`    <td class='header_15'>`);
            }
            

            if(profile_image){
                htmlTemplate.push(`<img src='${profile_image}' class='circle' onerror="this.src='${DEFAULT_PROFILE_IMAGE}'"/>`);
            }else{
                htmlTemplate.push(`<img src='${DEFAULT_PROFILE_IMAGE}' class='circle' /> `);
            }
            htmlTemplate.push(`<span class='text-dark' style='padding-left:10px;'><a href='https://steemit.com/@${author}' target='_blank'>@${author}</a>(${reputation}) [${vesting_shares}]</span> `);

            htmlTemplate.push(`<span class='text-secondary' style='padding-left:10px;'>${getFormadate(getLocalTime(contents.created))} </span> `);
            
            if(BLACK_AUTHORS.includes(contents.author)){
                 htmlTemplate.push(`<span class="badge badge-pill badge-danger">블랙리스트</span> `);
            }


            if(!isHangul(body)&&!isHangul(title)&&!tags.includes('steemhunt')){
                 htmlTemplate.push(`<span class="badge badge-pill badge-danger">한글미포함</span> `);
            }
            
            for(let tag of tags){
                if( tag.indexOf('kr')==0){
                    htmlTemplate.push(`<span class="badge badge-pill badge-primary">${tag}</span> `);
                }
                // 모니터링 대상 - 특수 태그
                else if( ['jjangjjangman'].includes(tag)){
                    htmlTemplate.push(`<span class="badge badge-pill badge-warning">${tag}</span> `);
                }else{
                    htmlTemplate.push(`<span class="badge badge-pill badge-secondary">${tag}</span> `);
                }
                
            }

            htmlTemplate.push(`    </td>`);
            htmlTemplate.push(`</tr>`);
            htmlTemplate.push(`<tr>`);
            htmlTemplate.push(`    <td><span class='text-primary'><a href='${links}' target='_blank'>${title}</a></span><br>`);
            htmlTemplate.push(`    <span class='text-dark'>${body_cut}</td>`);
            htmlTemplate.push(`</tr>`);
            htmlTemplate.push(`</table>`);


            // 인덱스 업데이트
            idx++;
        }

        // redraw contents
        $("#info").empty();
        $("#info").append(htmlTemplate.join(''));
        
        // promise
        Promise.resolve('success');

    }).catch(e=>{
        console.log('fail step 2 : ', e);
        setTimeout(loadCreatedContents, CONFIG.CONTENT_RELOAD_SEC*1000);
    }).then(x=>{
        setTimeout(loadCreatedContents, CONFIG.CONTENT_RELOAD_SEC*1000);
    });
}






