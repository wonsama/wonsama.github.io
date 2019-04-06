
let instances;
document.addEventListener('DOMContentLoaded', function() {
    let elems = document.querySelectorAll('.fixed-action-btn');
    let options = {
        direction : "top",
        hoverEnabled : false,
        toolbarEnabled : false
    };
    instances = M.FloatingActionButton.init(elems, options);
});
$("#app_floating").click(function(){
    let item = instances[0];
    if(item.isOpen){
        item.close();
    }else{
        item.open();
    }
});

let my_symbol;
/*
 * 진입점
 * @param cb 성공 시 콜백 
 */
async function init(cb) {



    // URL 파라미터에서 symbol 정보를 가져온다 없음 JJM 이 기본값 
    var url = new URL(location.href);
    var symbol = url.searchParams.get("symbol");
    symbol = symbol ? symbol : url.searchParams.get("SYMBOL");
    symbol = symbol ? symbol : 'JJM';
    my_symbol = symbol;

    $("#app_holer_title").text(`Loading ...`);
    M.AutoInit();

    // 토큰 홀더 목록 정보를 가져온다 
    token_holders(symbol)
        .then(cb)
        .catch(e => alert(e.toString()));
}
init((res) => {
    $("#app_list").empty();
    let temp = [];
    let output = res.result;
    output.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));

    let idx = 1;
    for (let r of output) {
        let balance = parseInt(r.balance);
        if (balance > 0) {
            temp.push(`<li class="collection-item avatar app_toast_move" account='${r.account}'>`);
            temp.push(`<img src="https://steemitimages.com/u/${r.account}/avatar" alt="" class="circle">`);
            temp.push(`<span class="title">${r.account}</span>`);
            temp.push(`<p>${add_comma(balance)}<br>`);
            if (idx == 1) {
                temp.push(`<span class="new badge red" data-badge-caption="st">${idx}</span>`);
            } else if (idx == 2) {
                temp.push(`<span class="new badge red" data-badge-caption="nd">${idx}</span>`);
            } else if (idx == 3) {
                temp.push(`<span class="new badge red" data-badge-caption="rd">${idx}</span>`);
            } else {
                temp.push(`<span class="new badge blue" data-badge-caption="th">${idx}</span>`);
            }
            temp.push(`</li>`);

            idx++;
        }
    }

    $("#app_holer_title").text(`${my_symbol}(${idx-1})`);
    $("#app_list").html(temp.join(''));
    $(".app_toast_move").click(function() {
        let account = $(this).attr('account');
        view_in_steemit(account);
    });

    M.AutoInit();



});