$(function(){
  
});


var moveSteemEngine = function(){
  window.open("https://next.steem-engine.com/exchange/LGT", "_blank");
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

  if(!permlink){
    window.open(`https://steemit.com/@${author}`, "_blank");  
  }else{
    window.open(`https://steemit.com/@${author}/${permlink}`, "_blank");
  }
}

function showToast(author, permlink){
  if(!permlink){
    $("#toast_text").html(`move ${author}'s blog ?`);
  }else{
    $("#toast_text").html(`move ${author}'s post ?`);
  }
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
  // if(item.is_holder){
  //   temp.push(`&nbsp;<ons-icon icon="fa-star" class='icon-steemit'></ons-icon>`);
  // }
  temp.push(`</span>`);
  temp.push(`<span class="list-item__subtitle">${item.permlink}</span>`);
  temp.push(`<span class="list-item__subtitle">${item.timestamp_kr}</span>`);
  temp.push(`</div>`);
  temp.push(`</ons-list-item>  `);

  return temp.join('');
}

const get_percent_list = (item) =>{

  let temp = [];

  temp.push(`<ons-list-item onclick="showToast('${item.account}')">`);
  temp.push(`<div class="left">`);
  temp.push(`<img class="list-item__thumbnail" src="https://steemitimages.com/u/${item.account}/avatar">`);
  temp.push(`</div>`);
  temp.push(`<div class="center">`);
  temp.push(`<span class="list-item__title">@${item.account} (${item.vp}%)</span>`);
  temp.push(`<span class="list-item__subtitle">STAKES ${item.stake} LGT</span>`);
  temp.push(`</div>`);
  temp.push(`</ons-list-item>  `);

  return temp.join('');
}

const get_airdrop_list = (item) =>{

  let temp = [];

  if(parseFloat(item.daily)==0 && parseFloat(item.daily_steem)==0){
    return '';
  }

  temp.push(`<ons-list-item expandable>`);
  temp.push(`<div class="left">`);
  temp.push(`<img class="list-item__thumbnail" src="https://steemitimages.com/u/${item.account}/avatar">`);
  temp.push(`</div>`);
  temp.push(`<div class="center">`);
  temp.push(`<span class="list-item__title">@${item.account}</span><span class="list-item__subtitle">${item.daily} LGT / ${item.daily_steem} STEEM</span>`);
  temp.push(`</div>`);
  temp.push(`<div class="expandable-content">`);
  temp.push(`<ons-list modifier="inset">`);

  // temp.push(`<ons-list-item modifier="longdivider">`);
  // temp.push(`<div class="left"><ons-icon icon="fa-arrows-alt-h" style='color:red'></ons-icon></div>`);
  // temp.push(`<div class="right">Delegation SP : ${add_comma(parseFloat(parseFloat(item.sp).toFixed(0)))}</div>`);
  // temp.push(`</ons-list-item>`);

  temp.push(`<ons-list-item modifier="longdivider">`);
  temp.push(`<div class="left"><ons-icon icon="fa-bitcoin" style='color:green'></ons-icon></div>`);
  temp.push(`<div class="right">Stake LGT : ${add_comma(parseFloat(parseFloat(item.stake).toFixed(0)))}</div>`);
  temp.push(`</ons-list-item>`);
  
  temp.push(`<ons-list-item modifier="longdivider">`);
  temp.push(`<div class="left"><ons-icon icon="fa-bitcoin" style='color:silver'></ons-icon></div>`);
  temp.push(`<div class="right">Balance LGT : ${parseFloat(parseFloat(item.balance).toFixed(3))}</div>`);
  temp.push(`</ons-list-item>`);
  
  temp.push(`<ons-list-item modifier="longdivider">`);
  temp.push(`<div class="left"><ons-icon icon="fa-bitcoin" style='color:green'></ons-icon></div>`);
  temp.push(`<div class="right">Deligated SP : ${add_comma(parseFloat(parseFloat(item.sp).toFixed(0)))}</div>`);
  temp.push(`</ons-list-item>`);

  temp.push(`</ons-list>`);
  temp.push(`</div>`);
  temp.push(`</ons-list-item>`);

  return temp.join('');
}

const get_lgt_info = (item) =>{

  let temp = [];

  temp.push(`<ons-list-item>`);
  temp.push(`<div class="left">`);
  temp.push(`<ons-icon icon="fa-water" class='list-item__icon'></ons-icon>`);
  temp.push(`</div>`);
  temp.push(`<div class="center">`);
  temp.push(`<span class="list-item__title">STEEM POWER</span>`);
  temp.push(`<span class="list-item__subtitle">${add_comma(item.sp)} SP</span>`);
  temp.push(`</div>`);
  temp.push(`</ons-list-item>`);
  temp.push(`<ons-list-item>`);
  temp.push(`<div class="left">`);
  temp.push(`<ons-icon icon="fa-battery-three-quarters" class='list-item__icon'></ons-icon>`);
  temp.push(`</div>`);
  temp.push(`<div class="center">`);
  temp.push(`<span class="list-item__title">VOTING MANA</span>`);
  temp.push(`<span class="list-item__subtitle">${item.vp} %</span>`);
  temp.push(`</div>`);
  temp.push(`</ons-list-item>`);
  temp.push(`<ons-list-item>`);
  temp.push(`<div class="left">`);
  temp.push(`<ons-icon icon="fa-dollar-sign" class='list-item__icon'></ons-icon>`);
  temp.push(`</div>`);
  temp.push(`<div class="center">`);
  temp.push(`<span class="list-item__title">AT: MANA ${item.vp} % WEIGHT 100 %</span>`);
  temp.push(`<span class="list-item__subtitle">PRICE : ${item.exp_dollar} $</span>`);
  temp.push(`<span class="list-item__subtitle">( STEEM PRICE SBD : ${item.steem_price_sbd} $ ) </span>`);
  temp.push(`</div>`);
  temp.push(`</ons-list-item>`);

  return temp.join('');
}

get_vp_with_price('gotogether')
  .then(res=>{
    $("#lgt_info").empty();
    $("#lgt_info").html(get_lgt_info(res));
  })

if(true){
  get_all_deligations('gotogether', 'LGT')
    .then(res=>{
      console.log(res);
      let template = [];

      // airdrop
      for(let r of res.deligations){
        template.push(get_airdrop_list(r));
      }
      $("#list_airdrop_items").html(template.join(''));
      $("#list_airdrop_text").text('클릭하면 상세정보를 볼 수 있습니다');

      // percent
      template = [];
      for(let r of res.exp){
        template.push(get_percent_list(r));
      }
      $("#list_percent_items").html(template.join(''));
      $("#list_percent_text").text('보팅 시점의(과거) 정보와는 차이가 있을 수 있습니다.');

      // history
      template = [];
      for(let r of res.votes){
        template.push(get_history_list(r));
      }
      $("#list_history_items").html(template.join(''));
      $("#list_history_text").text('홀더기준 최근 100개의 보팅 이력 정보를 보여줍니다.');

      document.querySelector('ons-tabbar').setActiveTab(0);
    })  
}
