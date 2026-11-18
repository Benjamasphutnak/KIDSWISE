/* KIDWISE – mini games for ages 0–6 */
(function () {
'use strict';
function $(id){return document.getElementById(id);}
function read(k,d){try{return JSON.parse(localStorage.getItem(k)||'null')||d;}catch(e){return d;}}
function shuffle(a){var x=a.slice();for(var i=x.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=x[i];x[i]=x[j];x[j]=t;}return x;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
var stored=read('kidwise.v2',{children:[],activeId:null});
var child=(stored.children||[]).filter(function(c){return c.id===stored.activeId;})[0]||(stored.children||[])[0]||null;
var childId=child?child.id:'guest',age=0;
if(child&&child.birth){var b=new Date(child.birth+'T00:00:00'),n=new Date();age=Math.max(0,(n.getFullYear()-b.getFullYear())*12+n.getMonth()-b.getMonth()-(n.getDate()<b.getDate()?1:0));}
var statKey='kidwise.games.v1',allStats=read(statKey,{}),stats=allStats[childId]||{stars:0,plays:0};
var active='',memory=null,quiz=null,flipTimer=null;
var names={picture:'แตะดูภาพ',memory:'จับคู่ภาพ',count:'นับผลไม้',letters:'ตามหาพยัญชนะ',colors:'สนุกกับสีสัน'};
function updateStars(){$('starsTotal').textContent=stats.stars;$('stageStars').textContent=stats.stars;}
function saveStar(){stats.stars++;stats.plays++;allStats[childId]=stats;try{localStorage.setItem(statKey,JSON.stringify(allStats));}catch(e){}updateStars();}
function speak(t){if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window))return;try{window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang='th-TH';u.rate=.82;window.speechSynthesis.speak(u);}catch(e){}}
if(child){$('childName').textContent=child.name||'นักผจญภัยตัวน้อย';$('childAvatar').textContent=child.gender==='girl'?'👧':child.gender==='boy'?'👦':'🧒';$('childAge').textContent=(age<12?'อายุ '+age+' เดือน':'อายุ '+Math.floor(age/12)+' ปี'+(age%12?' '+age%12+' เดือน':''))+' • มาเล่นและเรียนรู้กันนะ';}
updateStars();
function home(){if(flipTimer)clearTimeout(flipTimer);active='';$('childCard').hidden=false;$('gameGrid').hidden=false;$('gameStage').hidden=true;}
function open(id){active=id;$('childCard').hidden=true;$('gameGrid').hidden=true;$('gameStage').hidden=false;$('stageTitle').textContent=names[id];start(id);}
function restart(){if(!active)return;if(flipTimer)clearTimeout(flipTimer);start(active);}
function start(id){if(flipTimer){clearTimeout(flipTimer);flipTimer=null;}if(id==='picture')startPicture();if(id==='memory')startMemory();if(id==='count'||id==='letters'||id==='colors')startQuiz(id);}

// 1) Baby-friendly picture discovery with optional spoken labels.
var animals=[{e:'🐻',n:'หมี'},{e:'🐰',n:'กระต่าย'},{e:'🐥',n:'ลูกเจี๊ยบ'},{e:'🐘',n:'ช้าง'},{e:'🐱',n:'แมว'},{e:'🐶',n:'สุนัข'}];
function startPicture(){$('gameContent').innerHTML='<p class="game-instruction">แตะภาพเพื่อดูชื่อและฟังเสียงเรียกชื่อสัตว์นะ</p><div class="picture-grid">'+animals.map(function(a,i){return '<button type="button" class="picture-card" data-action="picture" data-index="'+i+'"><b>'+a.e+'</b><span>แตะดูภาพ</span></button>';}).join('')+'</div><p class="game-feedback" id="pictureFeedback">ลองแตะภาพที่หนูชอบได้เลย 💛</p><p class="game-instruction">ชวนลูกพูดชื่อสัตว์ หรือทำเสียงสัตว์ตามกันได้เลย</p>';}
function pictureTap(i){var a=animals[i];if(!a)return;document.querySelectorAll('.picture-card').forEach(function(x){x.classList.remove('active');x.querySelector('span').textContent='แตะดูภาพ';});var c=document.querySelector('.picture-card[data-index="'+i+'"]');if(c){c.classList.add('active');c.querySelector('span').textContent=a.n;}$('pictureFeedback').textContent='นี่คือ '+a.n+' นะ! ลองพูดตามกันดู 🥰';speak(a.n);}

// 2) Memory match: 3 pairs for younger children, 4 for older children.
var icons=['🐶','🐱','🐰','🐻','🐼','🦊','🐸','🐵'];
function startMemory(){var pairs=age<36?3:4,chosen=icons.slice(0,pairs);memory={cards:shuffle(chosen.concat(chosen)).map(function(e){return {e:e,open:false,done:false};}),flipped:[],matched:0,pairs:pairs,turns:0,lock:false};drawMemory();}
function drawMemory(){var s=memory;$('gameContent').innerHTML='<p class="game-instruction">เปิดการ์ดครั้งละ 2 ใบ แล้วหาภาพที่เหมือนกันนะ</p><div class="game-progress"><span style="width:'+(s.matched/s.pairs*100)+'%"></span></div><p class="game-instruction">จับคู่ได้ <b>'+s.matched+'</b> / '+s.pairs+' คู่ · เปิดไป '+s.turns+' ครั้ง</p><div class="memory-grid">'+s.cards.map(function(c,i){return '<button type="button" class="memory-card'+(c.open?' revealed':'')+(c.done?' matched':'')+'" data-action="memory" data-index="'+i+'" aria-label="การ์ดใบที่ '+(i+1)+'"><span class="memory-back">?</span><span class="memory-front">'+c.e+'</span></button>';}).join('')+'</div><p class="game-feedback">'+(s.matched===s.pairs?'เก่งมาก! จับคู่ครบแล้ว รับดาว 1 ดวง ⭐':'ค่อย ๆ ดูภาพ ไม่ต้องรีบนะ 🌼')+'</p>';}
function memoryTap(i){var s=memory,c=s&&s.cards[i];if(!s||s.lock||!c||c.open||c.done)return;c.open=true;s.flipped.push(i);if(s.flipped.length===2){s.turns++;var a=s.cards[s.flipped[0]],b=s.cards[s.flipped[1]];if(a.e===b.e){a.done=b.done=true;s.matched++;s.flipped=[];drawMemory();if(s.matched===s.pairs)saveStar();}else{s.lock=true;drawMemory();flipTimer=setTimeout(function(){s.cards[s.flipped[0]].open=false;s.cards[s.flipped[1]].open=false;s.flipped=[];s.lock=false;drawMemory();},850);}}else drawMemory();}

// 3–5) Five-question quizzes: count fruit, find the first Thai consonant, and match colours.
var fruits=['🍎','🍌','🍊','🍓','🍇','🍐','🍉'];
var letters=[{w:'ไก่',e:'🐔',l:'ก'},{w:'ไข่',e:'🥚',l:'ข'},{w:'ควาย',e:'🐃',l:'ค'},{w:'งู',e:'🐍',l:'ง'},{w:'จาน',e:'🍽️',l:'จ'},{w:'ช้าง',e:'🐘',l:'ช'},{w:'ม้า',e:'🐴',l:'ม'},{w:'ปลา',e:'🐟',l:'ป'},{w:'เสือ',e:'🐯',l:'ส'},{w:'หมี',e:'🐻',l:'ห'}];
var colors=[{n:'สีแดง',c:'#f35c65'},{n:'สีเหลือง',c:'#f7c948'},{n:'สีน้ำเงิน',c:'#4b91e8'},{n:'สีเขียว',c:'#50b879'},{n:'สีส้ม',c:'#f29343'},{n:'สีม่วง',c:'#9b78d2'}];
function makeQuestion(type){
if(type==='count'){var max=age<48?5:10,num=1+Math.floor(Math.random()*max),wrong=shuffle([1,2,3,4,5,6,7,8,9,10].filter(function(x){return x!==num;})).slice(0,2);return {answer:num,fruit:pick(fruits),options:shuffle([num].concat(wrong))};}
if(type==='letters'){var t=pick(letters),w=shuffle(letters.filter(function(x){return x.l!==t.l;})).slice(0,3).map(function(x){return x.l;});return {answer:t.l,target:t,options:shuffle([t.l].concat(w))};}
var col=pick(colors),others=shuffle(colors.filter(function(x){return x.n!==col.n;})).slice(0,3);return {answer:col.n,target:col,options:shuffle([col].concat(others))};
}
function startQuiz(type){quiz={type:type,round:1,total:5,score:0,q:makeQuestion(type),locked:false,feedback:''};drawQuiz();}
function drawQuiz(){
var s=quiz,html='<p class="game-instruction">'+(s.type==='count'?'มาช่วยกันนับผลไม้ แล้วเลือกตัวเลขที่ถูกต้อง':s.type==='letters'?'คำนี้ขึ้นต้นด้วยพยัญชนะตัวไหนเอ่ย?':'มองหาสีที่เหมือนกับตัวอย่าง แล้วแตะคำตอบเลย')+'</p><div class="game-progress"><span style="width:'+((s.round-1)/s.total*100)+'%"></span></div><p class="game-instruction">ข้อที่ <b>'+s.round+'</b> / '+s.total+' · ตอบถูก <b>'+s.score+'</b> ข้อ</p>';
if(s.type==='count'){html+='<div class="count-fruits">'+new Array(s.q.answer).fill(s.q.fruit).join(' ')+'</div><div class="answer-grid" style="margin-top:14px">'+s.q.options.map(function(n){return '<button type="button" class="answer-btn" data-action="answer" data-answer="'+n+'"'+(s.locked?' disabled':'')+'>'+n+'</button>';}).join('')+'</div>';}
else if(s.type==='letters'){html+='<div class="letter-clue"><span class="letter-clue-emoji">'+s.q.target.e+'</span><b>'+s.q.target.w+'</b></div><div class="letter-options" style="margin-top:14px">'+s.q.options.map(function(l){return '<button type="button" class="answer-btn" data-action="answer" data-answer="'+l+'"'+(s.locked?' disabled':'')+'>'+l+'</button>';}).join('')+'</div>';}
else{html+='<div class="color-target"><span class="game-instruction">ตัวอย่างสี</span><span class="color-target-swatch" style="background:'+s.q.target.c+'"></span></div><div class="color-options" style="margin-top:14px">'+s.q.options.map(function(c){return '<button type="button" class="color-option" data-action="answer" data-answer="'+c.n+'"'+(s.locked?' disabled':'')+'><i class="color-dot" style="background:'+c.c+'"></i>'+c.n+'</button>';}).join('')+'</div>';}
html+='<p class="game-feedback">'+(s.feedback||'ลองเลือกคำตอบที่คิดว่าถูกดูนะ 😊')+'</p>';if(s.locked)html+='<div style="text-align:center"><button type="button" class="game-next" data-action="next">'+(s.round===s.total?'ดูผลการเล่น 🎉':'ข้อต่อไป ➜')+'</button></div>';$('gameContent').innerHTML=html;
}
function answer(value){var s=quiz;if(!s||s.locked)return;if(String(value)===String(s.q.answer)){s.score++;s.locked=true;s.feedback='ถูกต้อง เก่งมากเลย! 🌟';if(s.type==='count')speak(String(value));if(s.type==='letters')speak(value);}else{s.feedback='ยังไม่ใช่น้า ลองดูอีกครั้งได้เลย 💛';}drawQuiz();}
function finish(){var s=quiz;if(s.score>=3)saveStar();$('gameContent').innerHTML='<div class="game-result"><div class="game-result-emoji">'+(s.score>=3?'🏆':'🌈')+'</div><h3>'+(s.score>=3?'ยอดเยี่ยมไปเลย!':'เก่งมากที่พยายาม!')+'</h3><p>ตอบถูก '+s.score+' จาก '+s.total+' ข้อ'+(s.score>=3?' · ได้รับดาว 1 ดวง ⭐':' · ลองเล่นอีกครั้งเพื่อเก็บดาวนะ')+'</p><button type="button" class="game-next" data-action="restart">เล่นอีกครั้ง ↻</button></div>';}
function next(){if(quiz.round>=quiz.total)return finish();quiz.round++;quiz.q=makeQuestion(quiz.type);quiz.locked=false;quiz.feedback='';drawQuiz();}

$('gameGrid').addEventListener('click',function(e){var c=e.target.closest('[data-game]');if(c)open(c.getAttribute('data-game'));});
$('gameStage').addEventListener('click',function(e){var b=e.target.closest('button[data-action]');if(!b)return;var a=b.getAttribute('data-action');if(a==='back')return home();if(a==='restart')return restart();if(a==='picture')return pictureTap(Number(b.getAttribute('data-index')));if(a==='memory')return memoryTap(Number(b.getAttribute('data-index')));if(a==='answer')return answer(b.getAttribute('data-answer'));if(a==='next')return next();});
document.querySelectorAll('.game-card').forEach(function(c){var id=c.getAttribute('data-game');if((id==='count'&&age<36)||(id==='letters'&&age<48)){var tag=c.querySelector('.game-age');if(tag)tag.textContent='เล่นร่วมกับผู้ใหญ่ได้';}});
})();