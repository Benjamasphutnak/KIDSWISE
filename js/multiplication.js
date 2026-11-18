(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var selectedTable=1,quizNumber=0,quizScore=0,quizAnswered=false,quizQuestion=null,quizTable=1;
var synth=('speechSynthesis'in window)?window.speechSynthesis:null;
var ones=['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
function thaiNumber(n){
 n=Math.max(0,Math.floor(Number(n)||0));if(n===0)return 'ศูนย์';
 var out='';if(n>=100){var h=Math.floor(n/100);out+=ones[h]+'ร้อย';n%=100;}
 if(n>=20){var t=Math.floor(n/10);out+=(t===2?'ยี่สิบ':ones[t]+'สิบ');n%=10;if(n)out+=(n===1?'เอ็ด':ones[n]);}
 else if(n>=10){out+='สิบ';n-=10;if(n)out+=(n===1?'เอ็ด':ones[n]);}
 else if(n){out+=(out&&n===1?'เอ็ด':ones[n]);}return out;
}
function stopSpeech(){if(synth)synth.cancel();$('mulStop').disabled=true;}
function speak(text){
 if(!synth||!('SpeechSynthesisUtterance'in window)){$('mulSpeechStatus').textContent='อุปกรณ์นี้ยังไม่รองรับเสียงอ่าน ลองเปิดบน Safari หรือ Chrome ที่รองรับเสียงภาษาไทยนะ';return;}
 stopSpeech();var u=new SpeechSynthesisUtterance(text);u.lang='th-TH';u.rate=.82;u.pitch=1.08;u.volume=1;
 var voices=synth.getVoices().filter(function(v){return /^th(-|_|$)/i.test(v.lang)});if(voices.length)u.voice=voices[0];
 u.onend=function(){$('mulStop').disabled=true;$('mulSpeechStatus').textContent='ท่องครบแล้ว เก่งมาก! ⭐'};
 u.onerror=function(){$('mulStop').disabled=true;$('mulSpeechStatus').textContent='เสียงอ่านขัดข้อง ลองกดฟังอีกครั้งนะ'};
 $('mulStop').disabled=false;$('mulSpeechStatus').textContent='กำลังอ่านสูตรคูณแม่ '+selectedTable+' …';synth.speak(u);
}
function formulaText(table,multiplier){return 'แม่ '+table+' '+thaiNumber(table)+' คูณ '+thaiNumber(multiplier)+' เท่ากับ '+thaiNumber(table*multiplier);}
function renderTable(){
 $('mulCurrent').textContent='แม่ '+selectedTable;$('mulTableTitle').textContent='📘 สูตรคูณแม่ '+selectedTable;
 $('mulPreview').textContent=selectedTable+' × 1 = '+selectedTable;$('mulQuizTable').textContent=selectedTable;
 var picker='';for(var t=1;t<=24;t++)picker+='<button type="button" class="mul-table-choice '+(t===selectedTable?'is-selected':'')+'" data-table="'+t+'" aria-pressed="'+(t===selectedTable)+'">แม่ '+t+'</button>';
 $('mulPicker').innerHTML=picker;
 Array.prototype.forEach.call($('mulPicker').querySelectorAll('[data-table]'),function(b){b.addEventListener('click',function(){selectTable(Number(b.dataset.table));});});
 var rows='';for(var i=1;i<=12;i++)rows+='<button type="button" class="mul-row" data-multiplier="'+i+'" aria-label="'+formulaText(selectedTable,i)+'"><span>'+selectedTable+'</span><span>×</span><span>'+i+'</span><b>=</b><strong>'+(selectedTable*i)+'</strong></button>';
 $('mulTable').innerHTML=rows;
 Array.prototype.forEach.call($('mulTable').querySelectorAll('[data-multiplier]'),function(b){b.addEventListener('click',function(){speak(formulaText(selectedTable,Number(b.dataset.multiplier)));});});
}
function resetQuiz(){quizNumber=0;quizScore=0;quizAnswered=false;quizQuestion=null;quizTable=selectedTable;$('mulQuizIntro').hidden=false;$('mulQuizPlay').hidden=true;$('mulQuizDone').hidden=true;$('mulQuizTable').textContent=selectedTable;}
function selectVideoGroup(group){
 var isHigh=Number(group)>=24;
 var videoId=isHigh?'Z9rgNIP0bIQ':'9pFyjY8ZXMw';
 var title=isHigh?'ท่องสูตรคูณแม่ 13–25':'ท่องสูตรคูณแม่ 1–12 พร้อมตารางสูตรคูณ';
 var note=isHigh?'คลิปนี้ครอบคลุมแม่ 13–25 รวมแม่ 13–24 ที่กำลังฝึก':'คลิปนี้ใช้ฝึกท่องแม่ 1–12';
 var frame=$('mulYoutube');
 if(frame){
  var nextSrc='https://www.youtube-nocookie.com/embed/'+videoId+'?rel=0';
  if(frame.src!==nextSrc)frame.src=nextSrc;
 }
 $('mulVideoTitle').textContent=title;
 $('mulVideoNote').textContent=note;
 $('mulVideoOpen').href='https://www.youtube.com/watch?v='+videoId;
 $('mulVideoOpen').setAttribute('aria-label','เปิด '+title+' ใน YouTube');
 Array.prototype.forEach.call(document.querySelectorAll('[data-video-group]'),function(b){
  var active=Number(b.dataset.videoGroup)===(isHigh?24:12);
  b.classList.toggle('is-active',active);
  b.setAttribute('aria-pressed',active?'true':'false');
 });
}
function selectTable(n){
 stopSpeech();
 selectedTable=Math.max(1,Math.min(24,n));
 renderTable();resetQuiz();selectVideoGroup(selectedTable<=12?12:24);
 $('mulSpeechStatus').textContent='เลือกสูตรคูณแม่ '+selectedTable+' แล้ว กดฟังหรือเริ่มแบบทดสอบได้เลย';
}
function listenTable(){var lines=[];for(var i=1;i<=12;i++)lines.push(formulaText(selectedTable,i));speak(lines.join(' … '));}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),tmp=a[i];a[i]=a[j];a[j]=tmp;}return a;}
function newQuestion(){
 quizNumber++;quizAnswered=false;var f=Math.floor(Math.random()*12)+1,ans=quizTable*f,opts=[ans];
 while(opts.length<4){var v=Math.random()<.65?ans+(Math.floor(Math.random()*9)-4)*quizTable:Math.floor(Math.random()*288)+1;if(v>0&&v<=288&&opts.indexOf(v)<0)opts.push(v);}
 quizQuestion={factor:f,answer:ans};opts=shuffle(opts);
 $('mulQuizProgress').textContent='ข้อ '+quizNumber+' / 10';$('mulQuizScore').textContent='คะแนน '+quizScore;$('mulQuizProgressBar').style.width=(quizNumber*10)+'%';
 $('mulQuestion').textContent=quizTable+' × '+f+' = ?';$('mulFeedback').textContent='เลือกคำตอบที่ถูกต้องนะ';$('mulQuizNext').disabled=true;$('mulQuizNext').textContent=quizNumber===10?'ดูคะแนนของฉัน':'ข้อต่อไป ›';
 $('mulAnswers').innerHTML=opts.map(function(v){return '<button type="button" class="mul-answer" data-answer="'+v+'">'+v+'</button>';}).join('');
 Array.prototype.forEach.call($('mulAnswers').querySelectorAll('[data-answer]'),function(b){b.addEventListener('click',function(){answerQuestion(Number(b.dataset.answer));});});
}
function startQuiz(){stopSpeech();quizTable=selectedTable;quizNumber=0;quizScore=0;$('mulQuizIntro').hidden=true;$('mulQuizDone').hidden=true;$('mulQuizPlay').hidden=false;newQuestion();}
function answerQuestion(value){
 if(quizAnswered)return;quizAnswered=true;var correct=value===quizQuestion.answer;if(correct)quizScore++;
 Array.prototype.forEach.call($('mulAnswers').querySelectorAll('button'),function(b){b.disabled=true;var v=Number(b.dataset.answer);if(v===quizQuestion.answer)b.classList.add('is-correct');else if(v===value&&!correct)b.classList.add('is-wrong');});
 $('mulQuizScore').textContent='คะแนน '+quizScore;$('mulFeedback').textContent=correct?'🎉 ถูกต้อง เก่งมาก! '+quizTable+' × '+quizQuestion.factor+' = '+quizQuestion.answer:'เกือบแล้วนะ คำตอบที่ถูกคือ '+quizQuestion.answer+' ลองจำไว้อีกนิดนะ';$('mulQuizNext').disabled=false;
}
function finishQuiz(){
 $('mulQuizPlay').hidden=true;$('mulQuizDone').hidden=false;$('mulFinalScore').textContent='ได้ '+quizScore+' คะแนน จาก 10 คะแนน';
 $('mulFinalMessage').textContent=quizScore===10?'ยอดเยี่ยมมาก! แม่นสูตรคูณสุด ๆ 🏆':quizScore>=7?'เก่งมากแล้ว ฝึกอีกนิดจะคล่องขึ้นแน่นอน 🌟':quizScore>=4?'ทำได้ดีเลย ลองทบทวนสูตรคูณแล้วมาเล่นอีกนะ 💪':'ไม่เป็นไรนะ ลองอ่านตารางอีกครั้งแล้วกลับมาฝึกใหม่ได้เลย 💚';
 document.dispatchEvent(new CustomEvent('kidwise:gamecompleted',{detail:{game:'multiplication',title:'สนามประลองสูตรคูณแม่ '+quizTable,score:quizScore,total:10,stars:quizScore>=9?3:quizScore>=7?2:quizScore>=5?1:0}}));
}
function nextQuestion(){if(!quizAnswered)return;if(quizNumber>=10){finishQuiz();return;}newQuestion();}
$('mulListen').addEventListener('click',listenTable);$('mulStop').addEventListener('click',function(){stopSpeech();$('mulSpeechStatus').textContent='หยุดเสียงแล้ว';});
$('mulQuizStart').addEventListener('click',startQuiz);$('mulQuizNext').addEventListener('click',nextQuestion);$('mulQuizAgain').addEventListener('click',startQuiz);
renderTable();resetQuiz();
Array.prototype.forEach.call(document.querySelectorAll('[data-video-group]'),function(b){b.addEventListener('click',function(){selectVideoGroup(Number(b.dataset.videoGroup));});});
selectVideoGroup(12);
})();