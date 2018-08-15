var rotationsTime = 8;
var wheelSpinTime = 6;
var ballSpinTime = 5;

let winningNum;
let mixNum = (max, start=1)=>{
  let nums = [];

  // init
  for(let i=start;i<=max;i++){
    nums.push(i); 
  }

  // shuffle
  for(let i=0;i<nums.length;i++){
    let num = nums.shift();
    let rnd = Math.floor(Math.random()*nums.length) + 1;
    nums.splice(rnd,0,num);
  }

  return nums;
}


$("#res").hide();
function finishSpin(winningNum){
  $("#result").html(`축하드립니다, ${winningNum} 번이 당첨되었습니다.`);
  $("#resultBig").html(`당첨 ${winningNum} 번`);
  $("#res").show();

  let idx = 0;
  setInterval(()=>{
    idx++;
    idx = idx%2;
    if(idx==0){
      $("#resultBig").css('color', 'red');  
    }else{
      $("#resultBig").css('color', 'yellow');
    }
    
  }, 100);

}

let numOddEven = (nums, isOdd=true)=>{
  let out = [];
  for(let i=1;i<nums.length;i++){
    if(i%2==(isOdd?1:0)){
      out.push(nums[i]);
    }
  }
  return out;
}

let getUrlValues = (url, isLast=false) => {

  let q = url.split('?');
  if(isLast){
    let p = q[0];
    let s = p.split('/');
    s = s.filter(x=>x!='');
    return s[s.length-1].replace(/\%/gi,'');
  }

  if(!q || q.length!=2){
    console.error('not support');
    return null;
  }

  let kvs = q[1].split('&');
  let out = {};
  for(let kv of kvs){
    let p = kv.split('=');
    out[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
  }
  return out;
}

// console.log('location.href', location.href)
const DEFAULT_MAX = 36;
let param = getUrlValues(location.href);
let numorder = mixNum(param==null?DEFAULT_MAX:param.num);
numorder.splice(0,0,0);
// numorder.push(0);
let numred = numOddEven(numorder,true);
let numblack = numOddEven(numorder,false);
var numgreen = [0];
var numbg = $(".pieContainer");
var ballbg = $(".ball");
var btnSpin = $("#btnSpin");
var toppart = $("#toppart");
var pfx = $.keyframe.getVendorPrefix();
var transform = pfx + "transform";
var rinner = $("#rcircle");
var numberLoc = [];
$.keyframe.debug = true;

createWheel();
function createWheel() {
  var temparc = 360 / numorder.length;
  for (var i = 0; i < numorder.length; i++) {
    numberLoc[numorder[i]] = [];
    numberLoc[numorder[i]][0] = i * temparc;
    numberLoc[numorder[i]][1] = i * temparc + temparc;

    newSlice = document.createElement("div");
    $(newSlice).addClass("hold");
    newHold = document.createElement("div");
    $(newHold).addClass("pie");
    newNumber = document.createElement("div");
    $(newNumber).addClass("num");

    newNumber.innerHTML = numorder[i].toString().split('').join('<br>');
    $(newSlice).attr("id", "rSlice" + i);
    $(newSlice).css(
      "transform",
      "rotate(" + numberLoc[numorder[i]][0] + "deg)"
    );

    $(newHold).css("transform", `rotate(${(340/(numorder.length+1)).toFixed(2)}deg)`);
    $(newHold).css("-webkit-transform", `rotate(${(340/(numorder.length+1)).toFixed(2)}deg)`);

    
    if ($.inArray(numorder[i], numred) > -1) {
      $(newHold).addClass("redbg");
    } else if ($.inArray(numorder[i], numblack) > -1) {
      $(newHold).addClass("greybg");
    }else if ($.inArray(numorder[i], numgreen) > -1) {
      $(newHold).addClass("greenbg");
    } 

    $(newNumber).appendTo(newSlice);
    $(newHold).appendTo(newSlice);
    $(newSlice).appendTo(rinner);
  }
  //console.log(numberLoc);
}

btnSpin.click(function() {
  if ($("input").val() == "") {
    var rndNum = Math.floor(Math.random() * numorder.length + 0);
  } else {
    var rndNum = $("input").val();
  }

  $("#btnSpin").hide();
  $("#result").html(`잠시만 기다려주세요, 추첨 중 입니다.`);

  winningNum = rndNum;
  spinTo(winningNum);
});

$("#btnb").click(function() {
  $(".spinner").css("font-size", "+=.3em");
});
$("#btns").click(function() {
  $(".spinner").css("font-size", "-=.3em");
});

function resetAni() {
  animationPlayState = "animation-play-state";
  playStateRunning = "running";

  $(ballbg)
    .css(pfx + animationPlayState, playStateRunning)
    .css(pfx + "animation", "none");

  $(numbg)
    .css(pfx + animationPlayState, playStateRunning)
    .css(pfx + "animation", "none");
  $(toppart)
    .css(pfx + animationPlayState, playStateRunning)
    .css(pfx + "animation", "none");

  $("#rotate2").html("");
  $("#rotate").html("");
}

function spinTo(num) {
  //get location
  var temp = numberLoc[num][0] + 4;

  //randomize
  var rndSpace = Math.floor(Math.random() * 360 + 1);

  resetAni();
  setTimeout(function() {
    bgrotateTo(rndSpace);
    ballrotateTo(rndSpace + temp);
  }, 500);
}

function ballrotateTo(deg) {
  var temptime = rotationsTime + 's';
  var dest = -360 * ballSpinTime - (360 - deg);
  $.keyframe.define({
    name: "rotate2",
    from: {
      transform: "rotate(0deg)"
    },
    to: {
      transform: "rotate(" + dest + "deg)"
    }
  });

  $(ballbg).playKeyframe({
    name: "rotate2", // name of the keyframe you want to bind to the selected element
    duration: temptime, // [optional, default: 0, in ms] how long you want it to last in milliseconds
    timingFunction: "ease-in-out", // [optional, default: ease] specifies the speed curve of the animation
    complete: function() {
      finishSpin(winningNum);
    } //[optional]  Function fired after the animation is complete. If repeat is infinite, the function will be fired every time the animation is restarted.
  });
}

function bgrotateTo(deg) {
  var dest = 360 * wheelSpinTime + deg;
  var temptime = (rotationsTime * 1000 - 1000) / 1000 + 's';

  $.keyframe.define({
    name: "rotate",
    from: {
      transform: "rotate(0deg)"
    },
    to: {
      transform: "rotate(" + dest + "deg)"
    }
  });

  $(numbg).playKeyframe({
    name: "rotate", // name of the keyframe you want to bind to the selected element
    duration: temptime, // [optional, default: 0, in ms] how long you want it to last in milliseconds
    timingFunction: "ease-in-out", // [optional, default: ease] specifies the speed curve of the animation
    complete: function() {} //[optional]  Function fired after the animation is complete. If repeat is infinite, the function will be fired every time the animation is restarted.
  });

  $(toppart).playKeyframe({
    name: "rotate", // name of the keyframe you want to bind to the selected element
    duration: temptime, // [optional, default: 0, in ms] how long you want it to last in milliseconds
    timingFunction: "ease-in-out", // [optional, default: ease] specifies the speed curve of the animation
    complete: function() {} //[optional]  Function fired after the animation is complete. If repeat is infinite, the function will be fired every time the animation is restarted.
  });
}