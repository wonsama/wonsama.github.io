// krop_black.js
$("#memo_send").click(e=>{

  // 후원
  let memo = encodeURIComponent($("#memo").val());
  let msgUrl = `https://steemconnect.com/sign/transfer?to=wonsama&amount=0.001%20SBD&memo=${memo}`;

  var win = window.open(msgUrl, '_blank');
  win.focus();

});

const BLACK_AUTHORS = ["abusatir","adney","aliwali","ansimar","ansony","apuvai152","aqu1","balia","baridin","blackpace","bydan","charlie16","chul7","coolxxx","coped","danur","dayana2000","desid6922yakusa","diamondcase","duendeath","emanderson","fariz","fitriani56","fjmb86","gantianbrooh","gentecomun","gledy81","godatsteem","ha-neul","herys","horlaryhiwhorlar","hritikroshan","innercicle","iqbalel","jose23","leejj44","mariemedicen","messwir","mhd-balia29","miloudett","miralnevs","miyardi","miyardie","muhammadibra","munib22","nachica","nadirjenis","noumanhafeez","nurulalbarnura","oni-bug","sandyprasasty","santrimie","shortsegments","soo123","soohyun","sook2018","stanlykim","trasgu","vicmuse","watch21","winasofyani","yahuzahope","yeolae99"];

// 본문에서 이미지 텍스트를 제거한다
// source : 본문
let removeImageText = (source) =>{
  const IMG_SUBFIX = ['.jpg','.jpeg','.gif','.png','.JPG','.JPEG','.GIF','.PNG'];
  let texts = source.split(' ');
  let images = texts.filter(
    x=>{
      for(let subfix of IMG_SUBFIX){
        if(x.includes(subfix)){
          return false;
        }
      }
      return true;
    }
  );
  return images.join(' ');
}


// 시간을 연산한다 
// h : 시간 
Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

// created 정보를 Date로 변환
// created : 생성시간 
let getLocalTime = (created)=>{
    created = created.replace("T", " ")
    var t = new Date(created).addHours(9);
    return t;
}

// 출력용 시간 정보처리
// t : 시간정보
let getFormadate = (t)=>{


  // return t.toLocaleTimeString('en-US', { hour12: false }).substr(0, 8);
  return t.toLocaleDateString('ko-KR').substr(2).replace(/-/gi, "/") + " " + t.toLocaleTimeString('en-US', { hour12: false }).substr(0, 8);
}

// 한글 여부를 판단한다
// s : 입력 문자열
let isHangul = (s) => {
    const pattern = /[\u3131-\u314e|\u314f-\u3163|\uac00-\ud7a3]/g;
    return pattern.test(s);
}

const getTags = (json_metadata) =>{
	let tags = [];
  try{
      json_metadata = JSON.parse(json_metadata);
      return json_metadata.tags;
  }catch(e){}
  return tags;
}

const removeMd = (md, options) => {
  options = options || {};
  options.listUnicodeChar = options.hasOwnProperty('listUnicodeChar') ? options.listUnicodeChar : false;
  options.stripListLeaders = options.hasOwnProperty('stripListLeaders') ? options.stripListLeaders : true;
  options.gfm = options.hasOwnProperty('gfm') ? options.gfm : true;
  options.useImgAltText = options.hasOwnProperty('useImgAltText') ? options.useImgAltText : true;

  var output = md || '';

  // Remove horizontal rules (stripListHeaders conflict with this rule, which is why it has been moved to the top)
  output = output.replace(/^(-\s*?|\*\s*?|_\s*?){3,}\s*$/gm, '');

  try {
    if (options.stripListLeaders) {
      if (options.listUnicodeChar)
        output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, options.listUnicodeChar + ' $1');
      else
        output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, '$1');
    }
    if (options.gfm) {
      output = output
        // Header
        .replace(/\n={2,}/g, '\n')
        // Fenced codeblocks
        .replace(/~{3}.*\n/g, '')
        // Strikethrough
        .replace(/~~/g, '')
        // Fenced codeblocks
        .replace(/`{3}.*\n/g, '');
    }
    output = output
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove setext-style headers
      .replace(/^[=\-]{2,}\s*$/g, '')
      // Remove footnotes?
      .replace(/\[\^.+?\](\: .*?$)?/g, '')
      .replace(/\s{0,2}\[.*?\]: .*?$/g, '')
      // Remove images
      .replace(/\!\[(.*?)\][\[\(].*?[\]\)]/g, options.useImgAltText ? '$1' : '')
      // Remove inline links
      .replace(/\[(.*?)\][\[\(].*?[\]\)]/g, '$1')
      // Remove blockquotes
      .replace(/^\s{0,3}>\s?/g, '')
      // Remove reference-style links?
      .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, '')
      // Remove atx-style headers
      .replace(/^(\n)?\s{0,}#{1,6}\s+| {0,}(\n)?\s{0,}#{0,} {0,}(\n)?\s{0,}$/gm, '$1$2$3')
      // Remove emphasis (repeat the line to remove double emphasis)
      .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, '$2')
      .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, '$2')
      // Remove code blocks
      .replace(/(`{3,})(.*?)\1/gm, '$2')
      // Remove inline code
      .replace(/`(.+?)`/g, '$1')
      // Replace two or more newlines with exactly two? Not entirely sure this belongs here...
      .replace(/\n{2,}/g, '\n\n');
  } catch(e) {
    console.error(e);
    return md;
  }
  return output;
};


// 찾으려는 단어들 중 가장 근접한 정보를 반환한다
const indexOfMin = (contents, words=[], startIdx=0)=>{
    let loc = -1;
    let m = {w:undefined, l:undefined}; // w : word, l : location
    for(let w of words){
        let l = contents.indexOf(w, startIdx);
        if(l!=-1){
            m = {w:w, l:m.l?Math.min(m.l, l):l};
        }
    }
    return m;
}

// 컨텐츠에서 링크 정보를 추출한다
const getLinks = (contents, START_WORDS=['http://','https://'], END_WORDS=[' ', ')', '\n', '\'', '\t'], links=[])=>{

    let m1 = indexOfMin(contents, START_WORDS);
    if(m1.w){
        let m2 = indexOfMin(contents, END_WORDS, m1.l);
        if(m2.w){
            let cut = contents.substr(m1.l, m2.l-m1.l);
            let remain = contents.substr(m2.l);
            links.push(cut);
            return getLinks(remain, START_WORDS, END_WORDS, links);
        }
    }

    return links;
}

// 프로필 이미지 정보를 가져온다
const getImageProfile = (json_metadata) =>{
	let profile_image = undefined;
  try{
      json_metadata = JSON.parse(json_metadata);
      profile_image = json_metadata.profile?json_metadata.profile.profile_image:undefined;
  }catch(e){}
  return profile_image;
}



// body 또는 json_metadata 에서 이미지 링크 정보를 추출한다
const getImageLink = (body, json_metadata)=>{


	const IMAGE_PREFIX = 'https://steemitimages.com/640x480/';	// max_width : 400, max_height : 200

	const START_WORDS = [
	    'https://ipfs.busy.org/ipfs/',
	    'https://gateway.ipfs.io/ipfs/',
	    'https://ipfs.io/ipfs/',
	    'https://cdn.steemitimages.com/',
	    'https://steemitimages.com/',
	    'http://ipfs.io/ipfs/'
	];

	// 기본적으로 json_metadata의 image 정보에서 추출, 값이 설정 안된 경우에만 본문에서 추출
	try{
		json_metadata = JSON.parse(json_metadata);
	}catch(e){}
	let image = json_metadata&&json_metadata.image?json_metadata.image:undefined;
	
	// json_metadata 에서 추출
	if(image&&image.length>=1){
		return IMAGE_PREFIX + image[0];
	}else{

		// body 에서 추출
		let images = getLinks(body, START_WORDS);	

		if(images && images.length>=1){
			return IMAGE_PREFIX + images[0];
		}
		return undefined;	
	}

}




