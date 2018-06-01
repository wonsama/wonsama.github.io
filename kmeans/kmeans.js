let flag = false;
let WIDTH = Math.min(800,d3.select("#kmeans")[0][0].offsetWidth - 20);
let HEIGHT = Math.max(300, WIDTH * .7);
let svg = d3.select("#kmeans svg")
  .attr('width', WIDTH)
  .attr('height', HEIGHT)
  .style('padding', '10px')
  .style('background', '#223344')
  // .style('cursor', 'pointer')
  .style('-webkit-user-select', 'none')
  .style('-khtml-user-select', 'none')
  .style('-moz-user-select', 'none')
  .style('-ms-user-select', 'none')
  .style('user-select', 'none');
  // .on('click', function() {
  //   d3.event.preventDefault();
  //   step();
  // });


d3.selectAll("#kmeans button")
  .style('padding', '.5em .8em');

d3.selectAll("#kmeans label")
  .style('display', 'inline-block')
  .style('width', '15em');

let infog = svg.append('text');
var textg = svg.append('text');
let lineg = svg.append('g');
let dotg = svg.append('g');
let centerg = svg.append('g');

infog
.attr('x', '20px')
.attr('y', '20px')
.attr('fill', 'rgb(37,213,170)')
.attr("font-size", '20px')
.text('↑ 스파 → 명성')

textg
.attr('x', '20px')
.attr('y', '45px')
.attr('fill', 'white')
.attr("font-size", '20px')

d3.select("#step")
  .on('click', function() { step(); draw(); });
d3.select("#restart")
  .on('click', function() { restart(); draw(); });
d3.select("#reset")
  .on('click', function() { init(); draw(); auto();});


let groups = [], dots = [];

var circles = dotg.selectAll('circle')
    .data(dots);
  circles.enter()
    .append('circle');
  circles.exit().remove();
  circles
    .transition()
    .duration(500)
    .attr('cx', function(d) { return d.x; })
    .attr('cy', function(d) { return d.y; })

    .attr('fill', function(d) { return d.group ? d.group.color : '#ffffff'; })
    .attr('r', 10)
    .style('cursor', 'pointer');

function auto(){

  let prev = getGroupHash();
  step();step();  // 중심축을 변경하고, 그룹정보를 업데이트 해야 한다.
  let now = getGroupHash();

  if(prev!=now){
    setTimeout(auto, 500);
  }else{
    console.log('complete');
  }
}

function step() {
  d3.select("#restart").attr("disabled", null);
  if (flag) {
    moveCenter();
    draw();
  } else {
    updateGroups();
    draw();
  }
  flag = !flag;
}

let items = [];
function init() {
  d3.select("#restart").attr("disabled", "disabled");

  // var N = parseInt(d3.select('#N')[0][0].value, 10);
  var K = parseInt(d3.select('#counts')[0][0].value, 10);
  groups = [];
  for (var i = 0; i < K; i++) {
    var g = {
      dots: [],
      color: 'hsl(' + (i * 360 / K) + ',100%,50%)',
      center: {
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT
      },
      init: {
        center: {}
      }
    };
    g.init.center = {
      x: g.center.x,
      y: g.center.y
    };
    groups.push(g);
  }

  dots = [];
  flag = false;
  for (i = 0; i < items.length; i++) {
    var dot ={
      name:items[i].name,
      vesting_shares:items[i].vesting_shares,
      reputation:items[i].reputation,
      rsp:items[i].rsp,
      vsp:items[i].vsp,
      dsp:items[i].dsp,
      x: items[i].x * WIDTH,
      y: HEIGHT - items[i].y * HEIGHT,
      group: undefined
    };
    dot.init = {
      name: dot.name,
      reputation:dot.reputation,
      vesting_shares:dot.vesting_shares,
      rsp:dot.rsp,
      vsp:dot.vsp,
      dsp:dot.dsp,
      x: dot.x,
      y: dot.y,
      group: dot.group
    };
    dots.push(dot);
  }
}


function restart() {
  flag = false;
  d3.select("#restart").attr("disabled", "disabled");

  groups.forEach(function(g) {
    g.dots = [];
    g.center.x = g.init.center.x;
    g.center.y = g.init.center.y;
  });

  for (var i = 0; i < dots.length; i++) {
    var dot = dots[i];
    dots[i] = {
      x: dot.init.x,
      y: dot.init.y,
      group: undefined,
      init: dot.init
    };
  }
}

// Define the div for the tooltip
var div = d3.select("body").append("div") 
    .attr("class", "tooltip")       
    .style("opacity", 0);

var parseDate = d3.time.format("%d-%b-%y").parse;
var formatTime = d3.time.format("%e %B");

function draw() {
  var circles = dotg.selectAll('circle')
    .data(dots);
  circles.enter()
    .append('circle');
  circles.exit().remove();
  circles
    .transition()
    .duration(500)
    .attr('cx', function(d) { return d.x; })
    .attr('cy', function(d) { return d.y; })

    .attr('fill', function(d) { return d.group ? d.group.color : '#ffffff'; })
    .attr('r', 10)
    .style('cursor', 'pointer');

  // 동그라미에 
  circles
    .on('click', function(d) {
      div.transition()    
        .duration(200)    
        .style("opacity", .9);    
      div.html(`${d.name}<br/>명성 : ${d.reputation} / 스파 : ${d.vesting_shares} (ori : ${Math.floor(d.vsp)}, received : ${Math.floor(d.rsp)}, delegate : ${Math.floor(d.dsp)}) `)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseover", function(d) {   
      textg.transition()    
        .duration(200)    
        .style("opacity", .9).text(`${d.name} [ 명성 : ${d.reputation} / 스파 : ${d.vesting_shares} (ori : ${Math.floor(d.vsp)}, received : ${Math.floor(d.rsp)}, delegate : ${Math.floor(d.dsp)}) ]`);
      // div.transition()    
      //   .duration(200)    
      //   .style("opacity", .9);    
      // div.html(`${d.name}<br/>명성 : ${d.reputation} / 스파 : ${d.vesting_shares} (ori : ${Math.floor(d.vsp)}, received : ${Math.floor(d.rsp)}, delegate : ${Math.floor(d.dsp)}) `)
      //   .style("left", (d3.event.pageX) + "px")
      //   .style("top", (d3.event.pageY - 28) + "px");
    })          
    .on("mouseout", function(d) {   
      textg.transition()
      .duration(500)    
      .style("opacity", 0); 
    });
    

  if (dots[0].group) {
    var l = lineg.selectAll('line')
      .data(dots);
    var updateLine = function(lines) {
      lines
        .attr('x1', function(d) { return d.x; })
        .attr('y1', function(d) { return d.y; })
        .attr('x2', function(d) { return d.group.center.x; })
        .attr('y2', function(d) { return d.group.center.y; })
        .attr('stroke', function(d) { return d.group.color; })
        ;
    };
    updateLine(l.enter().append('line'));
    updateLine(l.transition().duration(500));
    l.exit().remove();
  } else {
    lineg.selectAll('line').remove();
  }

  var c = centerg.selectAll('path')
    .data(groups);
  var updateCenters = function(centers) {
    centers
      .attr('transform', function(d) { return "translate(" + d.center.x + "," + d.center.y + ") rotate(45)";})
      .attr('fill', function(d,i) { return d.color; })
      .attr('stroke', '#aabbcc');
  };
  c.exit().remove();
  updateCenters(c.enter()
    .append('path')
    .attr('d', d3.svg.symbol().type('cross'))
    .attr('stroke', '#aabbcc'));
  updateCenters(c
    .transition()
    .duration(500));}

function moveCenter() {
  groups.forEach(function(group, i) {
    if (group.dots.length == 0) return;

    // get center of gravity
    var x = 0, y = 0;
    group.dots.forEach(function(dot) {
      x += dot.x;
      y += dot.y;
    });

    group.center = {
      x: x / group.dots.length,
      y: y / group.dots.length
    };
  });
  
}

function updateGroups() {
  groups.forEach(function(g) { g.dots = []; });
  dots.forEach(function(dot) {
    // find the nearest group
    var min = Infinity;
    var group;
    groups.forEach(function(g) {
      var d = Math.pow(g.center.x - dot.x, 2) + Math.pow(g.center.y - dot.y, 2);
      if (d < min) {
        min = d;
        group = g;
      }
    });

    // update group
    group.dots.push(dot);
    dot.group = group;
  });
}

// 그룹의 변동이 있는지 여부를 확인하기 위함
function getGroupHash(){
  let m = [];
  for(let c of groups){
    m.push(c.center);
  }
  return JSON.stringify(m).hashCode();
}

// 문자열 값을 32bit Integer 값으로 변경(해슁)
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

let getFollowers = async (account, startFollower=null, followType=null, limit=999)=>{
  
  let output = [];
  while(true){
    let results = await steem.api.getFollowersAsync(account, startFollower, followType, limit);
    let filtered = results.filter(x=>x.following==account&&x.what&&x.what.length>=1&&x.what[0]=='blog');
    output = output.concat(filtered);
    
    if(results.length!=limit){
      break;
    }
    startFollower = results[results.length-1].follower + '_'; // _를 더해 주는 것은 중복 대상을 피하기 위함
  }
  return output.map(x=>x.follower);
}

let runInit = (name) => {

  const SP = d3.select("#sp")[0][0].value;

  let total_vesting_shares = 0;
  let total_vesting_fund_steem = 0;


  textg.text(`1/4 : ${author} 정보 조회 시작`);

  // 전역 설정 정보를 가져온다
  steem.api.getDynamicGlobalPropertiesAsync().then(result=>{

    textg.text(`2/4 : 전역 설정정보 로딩 완료`);

    total_vesting_shares = result.total_vesting_shares;
    total_vesting_fund_steem = result.total_vesting_fund_steem;

    // 팔로워 정보를 가져온다 
    return getFollowers(name);
  }).then(results=>{
    textg.text(`3/4 : ${author} 총 ${results.length} 명의 팔로우 정보가 조회 되었습니다.`);

    // 해당 계정의 정보를 가져온다 
    // if(results.length>10000){
    //   results = results.slice(0,8200);  
    // }
    
    return steem.api.getAccountsAsync(results); // 10000명이 넘으면 일단 10000명만
  }).then(results=>{

    // textg.text(`4/5 : ${author} 의 팔로워 개별 정보를 조회 완료 했습니다.`);

    let min_reputation = Infinity;
    let max_reputation = 0;
    let min_vesting_shares = Infinity;
    let max_vesting_shares = 0;
    let bans = d3.select("#bans")[0][0].value;
    bans=bans?bans.split(',').map(x=>x.trim()):[];

    for(let result of results){
      let reputation = steem.formatter.reputation(result.reputation); // reputation
      let vesting_shares = Number(result.vesting_shares.split(' ')[0]); // vest
      let received_vesting_shares = Number(result.received_vesting_shares.split(' ')[0]); // vest
      let delegated_vesting_shares = Number(result.delegated_vesting_shares.split(' ')[0]); // vest

      vesting_shares = vesting_shares + received_vesting_shares - delegated_vesting_shares;
      vesting_shares = steem.formatter.vestToSteem(vesting_shares, total_vesting_shares, total_vesting_fund_steem);
      vesting_shares = Math.round(vesting_shares);

      if(reputation>0 && !bans.includes(result.name) && vesting_shares>SP){
          min_reputation = Math.min(min_reputation, reputation);
          max_reputation = Math.max(max_reputation, reputation);

          min_vesting_shares = Math.min(min_vesting_shares, vesting_shares);
          max_vesting_shares = Math.max(max_vesting_shares, vesting_shares);
      }
    }

    // 아이템 정보 초기화
    items = [];
    for(let result of results){
      let reputation = steem.formatter.reputation(result.reputation); // reputation
      let vesting_shares = Number(result.vesting_shares.split(' ')[0]); // vest
      let received_vesting_shares = Number(result.received_vesting_shares.split(' ')[0]); // vest
      let delegated_vesting_shares = Number(result.delegated_vesting_shares.split(' ')[0]); // vest

      let vsp = steem.formatter.vestToSteem(vesting_shares, total_vesting_shares, total_vesting_fund_steem);
      let rsp = steem.formatter.vestToSteem(received_vesting_shares, total_vesting_shares, total_vesting_fund_steem);
      let dsp = steem.formatter.vestToSteem(delegated_vesting_shares, total_vesting_shares, total_vesting_fund_steem);

      vesting_shares = vesting_shares + received_vesting_shares - delegated_vesting_shares;
      vesting_shares = steem.formatter.vestToSteem(vesting_shares, total_vesting_shares, total_vesting_fund_steem);
      vesting_shares = Math.round(vesting_shares);

      if(reputation>0 && !bans.includes(result.name) && vesting_shares>SP){
          items.push({  
            name:result.name,
            reputation:reputation, 
            vesting_shares:vesting_shares,
            vsp:vsp,
            rsp:rsp,
            dsp:dsp,
            x:reputation/max_reputation, 
            y:vesting_shares/max_vesting_shares
          });          
      }
    }

    // 드로잉
    init(); 
    draw();
    auto();
    textg.text(`4/4 : 작업이 완료 되었습니다.` );
  }).catch(e=>{
    alert(e);
  });
}

// 그리기 버튼
let author = ''
d3.select("#start").on('click', function() {  
  author = d3.select('#author')[0][0].value;
  // textg.text(`조회 시작`);
  runInit( author ); 
});




