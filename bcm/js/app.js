$(function(){
  
});

var moveMall = function(){
  window.open("https://bcmmall.com/", "_blank");
}

var moveSteemEngine = function(){
  window.open("https://next.steem-engine.com/exchange/BCM", "_blank");
}

var showTemplateDialog = function() {
  var dialog = document.getElementById('my-dialog');

  if (dialog) {
    dialog.show();
  } else {
    ons.createElement('dialog.html', { append: true })
      .then(function(dialog) {
        dialog.show();
      });
  }
};

var hideDialog = function(id) {
  document
    .getElementById(id)
    .hide();
};

function movePost(){
  let author = $("#toast_button").data("author");
  let permlink = $("#toast_button").data("permlink");

  window.open(`https://steemit.com/@${author}/${permlink}`, "_blank");
}

var currId = 0;
function showToast(author, permlink){

  $("#toast_text").html(`move ${author}'s post ?<br/>https://steemit.com/@${author}/${permlink}`);
  $("#toast_button").data("author", author);
  $("#toast_button").data("permlink", permlink);
  document.querySelector('ons-toast').show();
}

const get_history_list = (item) =>{

  let temp = [];

  temp.push(`<ons-list-item onclick="showToast('${item.author}', '${item.permlink}')">`);
  temp.push(`<div class="left">`);
  temp.push(`<img class="list-item__thumbnail" src="https://steemitimages.com/u/${item.author}/avatar">`);
  temp.push(`</div>`);
  temp.push(`<div class="center">`);
  temp.push(`<span class="list-item__title">@${item.author} (${parseFloat((item.weight/100).toFixed(2))}%)`);
  if(item.is_holder){
    temp.push(`&nbsp;<ons-icon icon="fa-star" class='icon-steemit'></ons-icon>`);
  }
  temp.push(`</span>`);
  temp.push(`<span class="list-item__subtitle">${item.permlink}</span>`);
  temp.push(`<span class="list-item__subtitle">${item.timestamp_kr}</span>`);
  temp.push(`</div>`);
  temp.push(`</ons-list-item>  `);

  return temp.join('');
}

const get_airdrop_list = (item) =>{

  let temp = [];

  temp.push(`<ons-list-item expandable>`);
  temp.push(`<div class="left">`);
  temp.push(`<img class="list-item__thumbnail" src="https://steemitimages.com/u/${item.account}/avatar">`);
  temp.push(`</div>`);
  temp.push(`<div class="center">`);
  temp.push(`<span class="list-item__title">@${item.account}</span><span class="list-item__subtitle">${item.daily} BCM</span>`);
  temp.push(`</div>`);
  temp.push(`<div class="expandable-content">`);
  temp.push(`<ons-list modifier="inset">`);
  temp.push(`<ons-list-item modifier="longdivider">`);
  temp.push(`<div class="left"><ons-icon icon="fa-arrows-alt-h" style='color:red'></ons-icon></div>`);
  temp.push(`<div class="right">Delegation SP : ${add_comma(parseFloat(parseFloat(item.sp).toFixed(0)))}</div>`);
  temp.push(`</ons-list-item>`);
  temp.push(`<ons-list-item modifier="longdivider">`);
  temp.push(`<div class="left"><ons-icon icon="fa-bitcoin" style='color:green'></ons-icon></div>`);
  temp.push(`<div class="right">Stake BCM : ${add_comma(parseFloat(parseFloat(item.stake).toFixed(0)))}</div>`);
  temp.push(`</ons-list-item>`);
  temp.push(`<ons-list-item modifier="longdivider">`);
  temp.push(`<div class="left"><ons-icon icon="fa-bitcoin" style='color:silver'></ons-icon></div>`);
  temp.push(`<div class="right">Balance BCM : ${parseFloat(parseFloat(item.balance).toFixed(4))}</div>`);
  temp.push(`</ons-list-item>`);
  temp.push(`</ons-list>`);
  temp.push(`</div>`);
  temp.push(`</ons-list-item>`);

  return temp.join('');
}

get_all_deligations('bcm', 'BCM')
  .then(res=>{
    // console.log(res);
    let template = [];

    // airdrop
    for(let r of res.deligations){
      template.push(get_airdrop_list(r));
    }
    $("#list_airdrop").append(template.join(''));
    $("#list_airdrop_text").text('클릭하면 상세정보를 볼 수 있습니다');

    // history
    template = [];
    for(let r of res.votes){
      template.push(get_history_list(r));
    }
    $("#list_history").append(template.join(''));
    $("#list_history_text").text('최근 홀더기준 200개 보팅 이력 정보를 보여줍니다.');

    document.querySelector('ons-tabbar').setActiveTab(0);
  })