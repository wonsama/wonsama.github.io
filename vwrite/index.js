/*
https://steemconnect.com/apps/@wonsama.quiz/edit
*/
const URL_LOCAL = 'file:///Users/wonsama/Documents/GitHub/wonsama.github.io/vwrite/index.html';
const URL_GITHUB = 'https://wonsama.github.io/vwrite/';

var api = sc2.Initialize({
  app: 'wonsama.quiz',
  callbackURL: URL_GITHUB,
  accessToken: 'access_token',
  scope: ['vote', 'comment']
});

let state = '1,2,3';
var link = api.getLoginURL(state);

console.log(link)



https://steemconnect.com/oauth2/authorize?client_id=wonsama.quiz&redirect_uri=https%3A%2F%2Fwonsama.github.io%2Fvwrite%2F&scope=vote,comment