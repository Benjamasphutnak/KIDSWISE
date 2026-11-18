/* KIDWISE — learning worlds, portfolio and feelings */
(function () {
  'use strict';
  var A = window.KW_APP;
  if (!A) return;
  var page = document.body.getAttribute('data-page');
  function $(id) { return document.getElementById(id); }
  function esc(value) { return A.escape(value); }
  function setToday(id) { if ($(id)) { $(id).value = A.today(); $(id).max = A.today(); } }

  if (page === 'learning') {
    $('world-body').innerHTML =
      '<div id="cbar"></div><section class="kw-world-hero learn-hero"><div><span class="kw-world-kicker">LEARN AT YOUR OWN PACE</span><h2>ห้องเรียนของหนู 🌈</h2><p>เลือกภารกิจให้เหมาะกับวัย เรียนรู้ทีละนิดผ่านการลงมือทำ</p></div><span class="kw-world-hero-icon">📚</span></section>' +
      '<section class="kw-card kw-world-age"><div><small>ช่วงวัยปัจจุบัน</small><b id="learnAge"></b></div><span id="learnDone" class="kw-world-pill">0 / 4 ภารกิจวันนี้</span></section>' +
      '<div class="kw-world-tabs" id="learnTabs" role="group" aria-label="เลือกหมวดการเรียนรู้"></div><div id="learnCards" class="kw-world-grid"></div>' +
      '<section class="kw-world-shortcuts"><h3>อยากเรียนต่อไหม?</h3><div><a href="games.html">🎮 เกมฝึกสมอง</a><a href="storybook.html">📖 นิทาน 3D</a><a href="numbers.html">🔢 ฝึกตัวเลข</a><a href="thai.html">ก–ฮ ฝึกภาษาไทย</a></div></section>' +
      '<p class="kw-world-note">ภารกิจเป็นกิจกรรมชวนเรียนรู้ ไม่ใช่ข้อสอบหรือการวัดระดับมาตรฐาน ผู้ปกครองปรับตามความสนใจและความพร้อมของเด็กได้</p>';
    var subjects = [{id:'all',label:'ทั้งหมด'},{id:'language',label:'ภาษา'},{id:'math',label:'คณิต'},{id:'science',label:'สำรวจโลก'},{id:'life',label:'ทักษะชีวิต'}];
    var sets = [
      {min:0,max:12,label:'วัยทารก 0–1 ปี',tasks:[
        {id:'l01',subject:'language',title:'เสียงคุ้นเคยของหนู',how:'อุ้มลูกในท่าที่สบาย พูดชื่อคนหรือสิ่งของใกล้ตัวด้วยน้ำเสียงอ่อนโยน แล้วเว้นจังหวะให้ลูกส่งเสียงตอบ',ask:'วันนี้ลูกตอบสนองต่อเสียงหรือใบหน้าคุ้นเคยอย่างไร?',icon:'💬'},
        {id:'l02',subject:'science',title:'มองตามของเล่น',how:'ให้ผู้ใหญ่ถือของเล่นสีตัดกันในระยะที่เหมาะสม แล้วค่อย ๆ เคลื่อนช้า ๆ ซ้าย–ขวา โดยไม่ส่องแสงเข้าตา',ask:'ลูกสนใจมองตามของเล่นหรือไม่?',icon:'🌈'},
        {id:'l03',subject:'math',title:'มาก–น้อยผ่านเสียงและจังหวะ',how:'ร้องเพลงหรือปรบมือเบา ๆ เป็นจังหวะสั้นและยาว สลับหยุดเพื่อให้ลูกสังเกตความแตกต่าง',ask:'ลูกมีท่าทีอย่างไรเมื่อจังหวะเปลี่ยน?',icon:'🎵'},
        {id:'l04',subject:'life',title:'เวลาจ๊ะเอ๋แสนอบอุ่น',how:'เล่นจ๊ะเอ๋ด้วยผ้าบางที่ผู้ใหญ่ถือเอง ห้ามคลุมหน้าเด็ก และหยุดทันทีเมื่อลูกไม่สบายใจ',ask:'ลูกยิ้ม มองหา หรือส่งเสียงตอบอย่างไร?',icon:'😊'}
      ]},
      {min:12,max:36,label:'วัยเตาะแตะ 1–3 ปี',tasks:[
        {id:'l11',subject:'language',title:'ชี้แล้วพูดชื่อสิ่งของ',how:'ชวนลูกชี้ของใกล้ตัว เช่น แก้ว ลูกบอล หรือแมว แล้วพูดชื่อชัด ๆ รอให้ลูกลองออกเสียงโดยไม่เร่ง',ask:'วันนี้ลูกสนใจคำหรือสิ่งของอะไร?',icon:'🗣️'},
        {id:'l12',subject:'math',title:'แยกสีและนับ 1–5',how:'ใช้ของเล่นชิ้นใหญ่ที่ปลอดภัย แยกเป็นกองตามสี แล้วนับพร้อมกันทีละชิ้น โดยมีผู้ใหญ่ดูแลตลอดเวลา',ask:'ลูกลองแยกสีหรือนับได้อย่างไร?',icon:'🔴'},
        {id:'l13',subject:'science',title:'นักสำรวจพื้นผิว',how:'ให้ลูกสัมผัสผ้านุ่ม กระดาษ และของใช้ชิ้นใหญ่ที่ปลอดภัย พร้อมบรรยายคำว่า นุ่ม แข็ง เรียบ โดยเฝ้าดูใกล้ชิด',ask:'ลูกชอบพื้นผิวแบบไหน?',icon:'🧸'},
        {id:'l14',subject:'life',title:'ล้างมือไปพร้อมเพลง',how:'ผู้ใหญ่สาธิตการล้างมือทีละขั้น ชวนลูกถูมือพร้อมร้องเพลงสั้น ๆ และช่วยล้างให้สะอาด',ask:'ขั้นตอนไหนที่ลูกทำตามได้บ้าง?',icon:'🫧'}
      ]},
      {min:36,max:72,label:'วัยก่อนเรียน 3–6 ปี',tasks:[
        {id:'l21',subject:'language',title:'เรียงภาพแล้วเล่าเรื่อง',how:'เลือกภาพ 3 ภาพ ชวนเด็กเรียงต้นเรื่อง–กลางเรื่อง–ตอนจบ แล้วเล่าด้วยคำของตัวเอง',ask:'เรื่องของหนูเริ่มต้นและจบอย่างไร?',icon:'📖'},
        {id:'l22',subject:'math',title:'จับคู่จำนวนกับตัวเลข',how:'วางของเล่น 1–10 ชิ้น ให้เด็กนับและจับคู่กับบัตรตัวเลข ปรับจำนวนตามความพร้อม',ask:'เด็กนับได้ถึงเท่าไรโดยไม่รีบ?',icon:'🔢'},
        {id:'l23',subject:'science',title:'อะไรลอย อะไรจม?',how:'ผู้ใหญ่เตรียมอ่างน้ำตื้นและของชิ้นใหญ่ที่ปลอดภัย ให้เด็กคาดเดาก่อนทดลอง ห้ามปล่อยเด็กเล่นน้ำลำพัง',ask:'ก่อนทดลอง หนูเดาว่าชิ้นไหนจะลอย?',icon:'💧'},
        {id:'l24',subject:'life',title:'ผลัดกันเล่นและรอคอย',how:'เล่นเกมผลัดกันวางบล็อกคนละชิ้น ฝึกพูดว่า ถึงตาหนูแล้ว และขอบคุณเมื่อเพื่อนเล่นด้วย',ask:'ตอนรอคอย หนูรู้สึกอย่างไร?',icon:'🤝'}
      ]},
      {min:72,max:96,label:'วัยประถมต้น 6–8 ปี',tasks:[
        {id:'l31',subject:'language',title:'อ่านสั้น ๆ แล้วเล่าใจความ',how:'เลือกเรื่องที่เด็กสนใจ 1 ย่อหน้า ชวนหาว่าใครทำอะไร ที่ไหน และเกิดอะไรขึ้น',ask:'เรื่องนี้มีใจความสำคัญว่าอะไร?',icon:'📚'},
        {id:'l32',subject:'math',title:'โจทย์บวก–ลบในชีวิตจริง',how:'ใช้ของเล่นหรือวัตถุแทนโจทย์ เช่น มี 8 ชิ้น ให้ไป 3 ชิ้น เหลือเท่าไร ชวนเด็กอธิบายวิธีคิด',ask:'หนูคิดคำตอบได้อย่างไร?',icon:'➕'},
        {id:'l33',subject:'science',title:'สังเกตเมล็ดงอก',how:'ผู้ใหญ่ช่วยเตรียมเมล็ดและภาชนะปลูก ให้เด็กวาดหรือเขียนสิ่งที่เปลี่ยนแปลงวันละครั้ง',ask:'วันนี้ต้นอ่อนเปลี่ยนไปจากเมื่อวานอย่างไร?',icon:'🌱'},
        {id:'l34',subject:'life',title:'วางแผนเวลา 1 วัน',how:'ชวนเด็กทำตารางง่าย ๆ สำหรับเวลาเรียน เล่น กิน และพักผ่อน โดยให้เด็กเลือกกิจกรรมที่ชอบด้วย',ask:'กิจกรรมไหนที่หนูอยากจัดเวลาให้มากขึ้น?',icon:'⏰'}
      ]},
      {min:96,max:120,label:'วัยประถม 8–10 ปี',tasks:[
        {id:'l41',subject:'language',title:'สรุปเรื่องด้วยคำของตัวเอง',how:'อ่านเรื่องสั้นหรือบทความที่เหมาะกับวัย แล้วเขียนสรุป 3–5 ประโยคโดยไม่คัดลอกทั้งย่อหน้า',ask:'หนูอยากให้คนอ่านจำเรื่องไหนมากที่สุด?',icon:'✍️'},
        {id:'l42',subject:'math',title:'คูณด้วยการจัดกลุ่ม',how:'ใช้สิ่งของ 3 กลุ่ม กลุ่มละ 4 ชิ้น ให้เด็กเขียนเป็น 4 + 4 + 4 และเชื่อมโยงเป็น 3 × 4',ask:'มีทั้งหมดกี่ชิ้น และรู้ได้อย่างไร?',icon:'🧮'},
        {id:'l43',subject:'science',title:'เครื่องบินกระดาษนักทดลอง',how:'พับเครื่องบินกระดาษแบบง่าย ทดลองบินจากจุดเดิม 2–3 ครั้ง แล้วบันทึกระยะโดยมีผู้ใหญ่ดูแลพื้นที่',ask:'การพับหรือการขว้างแบบใดทำให้บินได้ไกลขึ้น?',icon:'🛩️'},
        {id:'l44',subject:'life',title:'นักวางแผนงบจำลอง',how:'กำหนดเงินสมมติ 100 บาท ให้เด็กวางแผนซื้อของ 2–3 ชิ้นและคำนวณเงินคงเหลือ',ask:'หนูเลือกอะไร และเหลือเงินเท่าไร?',icon:'💰'}
      ]}
    ];
    var filter = 'all';
    function currentSet() {
      var m = A.ageMonths(A.child());
      for (var i = 0; i < sets.length; i++) if (m >= sets[i].min && m < sets[i].max) return sets[i];
      return sets[sets.length - 1];
    }
    function draw() {
      var c = A.child(), d = A.data(c), set = currentSet();
      var done = (d.learningHistory || []).filter(function (x) { return x.date === A.today(); });
      var count = done.filter(function (x) { return set.tasks.some(function (t) { return t.id === x.taskId; }); }).length;
      $('learnAge').textContent = set.label + ' · ' + A.ageText(c);
      $('learnDone').textContent = Math.min(set.tasks.length, count) + ' / ' + set.tasks.length + ' ภารกิจวันนี้';
      $('learnTabs').innerHTML = subjects.map(function (x) { return '<button type="button" class="kw-world-tab ' + (filter === x.id ? 'is-on' : '') + '" data-filter="' + x.id + '">' + x.label + '</button>'; }).join('');
      var tasks = set.tasks.filter(function (t) { return filter === 'all' || t.subject === filter; });
      $('learnCards').innerHTML = tasks.map(function (t) {
        var complete = done.some(function (x) { return x.taskId === t.id; });
        var sub = subjects.filter(function (x) { return x.id === t.subject; })[0];
        return '<article class="kw-world-card ' + (complete ? 'is-complete' : '') + '"><div class="kw-world-card-top"><span class="kw-world-card-icon">' + t.icon + '</span><span class="kw-world-pill">' + sub.label + '</span></div><h3>' + esc(t.title) + '</h3><p>' + esc(t.how) + '</p><div class="kw-world-question"><b>ชวนคุย</b><span>' + esc(t.ask) + '</span></div><button type="button" class="kw-world-action" data-task="' + t.id + '" ' + (complete ? 'disabled' : '') + '>' + (complete ? '✓ บันทึกแล้ววันนี้' : 'บันทึกว่าลองทำแล้ว') + '</button></article>';
      }).join('') || '<p class="kw-empty">ยังไม่มีกิจกรรมในหมวดนี้</p>';
      $('learnCards').querySelectorAll('button[data-task]').forEach(function (b) {
        b.addEventListener('click', function () {
          var task = set.tasks.filter(function (t) { return t.id === b.getAttribute('data-task'); })[0];
          if (!task) return;
          d.learningHistory.unshift({id:A.uid(),taskId:task.id,title:task.title,subject:task.subject,subjectLabel:(subjects.filter(function (x) { return x.id === task.subject; })[0] || {}).label || 'เรียนรู้',date:A.today(),at:new Date().toISOString()});
          if (d.learningHistory.length > 240) d.learningHistory.length = 240;
          A.save(); draw();
        });
      });
      $('learnTabs').querySelectorAll('button[data-filter]').forEach(function (b) {
        b.addEventListener('click', function () { filter = b.getAttribute('data-filter'); draw(); });
      });
    }
    A.childBar($('cbar'), draw);
    draw();
  }

  if (page === 'portfolio') {
    $('world-body').innerHTML = '<div id="cbar"></div><section class="kw-world-hero portfolio-hero"><div><span class="kw-world-kicker">MY LITTLE CREATIONS</span><h2>สมุดผลงานของหนู 🎨</h2><p>เก็บเรื่องราวเล็ก ๆ และสิ่งที่หนูภูมิใจในทุกวัน</p></div><span class="kw-world-hero-icon">🏆</span></section>' +
      '<section class="kw-card kw-world-form-card"><h3>เพิ่มผลงานใหม่</h3><form id="portForm" class="kw-world-form"><label class="kw-field">ชื่อผลงาน<input id="portTitle" maxlength="80" required placeholder="เช่น ภาพวาดบ้านในฝัน"></label><div class="kw-world-form-row"><label class="kw-field">ประเภท<select id="portType"><option>ภาพวาด</option><option>งานประดิษฐ์</option><option>งานเขียน</option><option>ผลงานการเรียน</option><option>กิจกรรม</option><option>อื่น ๆ</option></select></label><label class="kw-field">วันที่<input id="portDate" type="date" required></label></div><label class="kw-field">เล่าเรื่องผลงาน<textarea id="portText" maxlength="800" placeholder="วันนี้หนูทำอะไร ภูมิใจตรงไหน หรืออยากเล่าอะไรเกี่ยวกับผลงานนี้"></textarea></label><label class="kw-field">รูปผลงาน (ไม่บังคับ)<input id="portPhoto" type="file" accept="image/*"></label><p class="kw-muted">รูปจะถูกย่อขนาดก่อนบันทึก และเก็บในโปรไฟล์ลูกที่เลือกไว้</p><p id="portErr" class="kw-world-error" role="alert"></p><button class="kw-world-action" type="submit">บันทึกลงสมุดผลงาน</button></form></section><section><h3 class="kw-section-title">ผลงานที่ผ่านมา</h3><div id="portList" class="kw-world-list"></div></section>';
    function compressPhoto(file) {
      return new Promise(function (resolve, reject) {
        if (!file) { resolve(''); return; }
        if (file.type.indexOf('image/') !== 0 || file.size > 6000000) { reject(new Error('กรุณาเลือกรูปภาพขนาดไม่เกิน 6 MB')); return; }
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () {
          try {
            var scale = Math.min(1, 720 / Math.max(img.width, img.height)), canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            var data = canvas.toDataURL('image/jpeg', 0.58); URL.revokeObjectURL(url); resolve(data);
          } catch (e) { URL.revokeObjectURL(url); reject(new Error('อ่านรูปภาพไม่สำเร็จ ลองเลือกรูปอื่น')); }
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('เปิดรูปภาพไม่สำเร็จ')); };
        img.src = url;
      });
    }
    function drawPortfolio() {
      var d = A.data(), list = (d.portfolio || []).slice().sort(function (x,y) { return String(y.at || y.date).localeCompare(String(x.at || x.date)); });
      $('portList').innerHTML = list.length ? '' : '<p class="kw-empty">ยังไม่มีผลงาน ลองบันทึกผลงานชิ้นแรกของหนูได้เลย 💛</p>';
      list.forEach(function (x) {
        var card = document.createElement('article'); card.className = 'kw-world-card';
        card.innerHTML = (x.photo ? '<img class="kw-portfolio-photo" src="' + x.photo + '" alt="ผลงาน ' + esc(x.title) + '">' : '') +
          '<div class="kw-world-card-top"><span class="kw-world-pill">' + esc(x.type) + '</span><small class="kw-muted">' + esc(x.date) + '</small></div><h3>' + esc(x.title) + '</h3><p>' + esc(x.text || 'เก็บไว้เป็นความทรงจำของหนู') + '</p><button type="button" class="kw-world-delete" data-del="' + x.id + '">ลบรายการ</button>';
        $('portList').appendChild(card);
        card.querySelector('button[data-del]').addEventListener('click', function () {
          if (this.getAttribute('data-confirm') === 'yes') { var idx = d.portfolio.indexOf(x); if (idx >= 0) d.portfolio.splice(idx,1); A.save(); drawPortfolio(); }
          else { this.setAttribute('data-confirm','yes'); this.textContent = 'แตะอีกครั้งเพื่อยืนยันลบ'; }
        });
      });
    }
    setToday('portDate');
    $('portForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = $('portTitle').value.trim(), file = $('portPhoto').files[0];
      if (!title) { $('portErr').textContent = 'ใส่ชื่อผลงานก่อนนะ'; return; }
      $('portErr').textContent = '';
      var submit = $('portForm').querySelector('button[type="submit"]'); submit.disabled = true; submit.textContent = 'กำลังบันทึก...';
      compressPhoto(file).then(function (photo) {
        var d = A.data();
        if (photo && d.portfolio.filter(function (x) { return !!x.photo; }).length >= 12) throw new Error('เก็บรูปผลงานได้ไม่เกิน 12 รูปต่อโปรไฟล์ เพื่อควบคุมขนาดข้อมูลซิงก์');
        d.portfolio.unshift({id:A.uid(),title:title,type:$('portType').value,date:$('portDate').value,text:$('portText').value.trim(),photo:photo,at:new Date().toISOString()});
        if (d.portfolio.length > 80) d.portfolio.length = 80;
        A.save(); $('portTitle').value = ''; $('portText').value = ''; $('portPhoto').value = ''; drawPortfolio();
      }).catch(function (err) { $('portErr').textContent = err.message || 'บันทึกไม่สำเร็จ'; })
        .then(function () { submit.disabled = false; submit.textContent = 'บันทึกลงสมุดผลงาน'; });
    });
    A.childBar($('cbar'), drawPortfolio);
    drawPortfolio();
  }

  if (page === 'feelings') {
    $('world-body').innerHTML = '<div id="cbar"></div><section class="kw-world-hero feelings-hero"><div><span class="kw-world-kicker">MY FEELINGS MATTER</span><h2>วันนี้หัวใจเป็นอย่างไร? 💗</h2><p>ทุกความรู้สึกสำคัญเสมอ ค่อย ๆ เล่าให้คนที่ไว้ใจฟังนะ</p></div><span class="kw-world-hero-icon">💗</span></section><section class="kw-card kw-world-form-card"><h3>เลือกความรู้สึกของวันนี้</h3><div id="moodChoices" class="kw-mood-grid"></div><label class="kw-field" style="margin-top:14px">อยากเล่าอะไรเพิ่มเติมไหม?<textarea id="moodNote" maxlength="500" placeholder="เช่น วันนี้หนูมีความสุขเพราะได้เล่นกับเพื่อน"></textarea></label><p id="moodTip" class="kw-world-note">เลือกอารมณ์ที่ใกล้เคียงกับความรู้สึกของหนูได้เลย</p><p id="moodErr" class="kw-world-error" role="alert"></p><button id="saveMood" class="kw-world-action" type="button">บันทึกความรู้สึกวันนี้</button></section><section><h3 class="kw-section-title">บันทึกที่ผ่านมา</h3><div id="moodList" class="kw-world-list"></div></section><p class="kw-world-note">สำหรับเด็กเล็ก ผู้ปกครองอาจบันทึกจากสิ่งที่สังเกตและชวนพูดคุยอย่างอ่อนโยน ไม่ใช้บันทึกนี้เพื่อตัดสินหรือตีตราเด็ก</p>';
    var moods = [
      {id:'happy',label:'มีความสุข',emoji:'😄',tip:'ชวนเล่าว่าอะไรทำให้วันนี้มีความสุข และอยากทำสิ่งนั้นอีกไหม'},
      {id:'calm',label:'สบายใจ',emoji:'😌',tip:'ชวนสังเกตว่าตอนสบายใจ ร่างกายรู้สึกผ่อนคลายอย่างไร'},
      {id:'sad',label:'เศร้า',emoji:'😢',tip:'รับฟังและอยู่ข้าง ๆ ก่อน ไม่ต้องรีบหาคำตอบหรือบอกให้หยุดเศร้า'},
      {id:'angry',label:'โกรธ',emoji:'😠',tip:'ช่วยให้เด็กได้พักและสงบก่อน แล้วค่อยชวนเล่าว่าเกิดอะไรขึ้น'},
      {id:'worried',label:'กังวล',emoji:'😟',tip:'ถามว่าอยากให้ผู้ใหญ่ที่ไว้ใจช่วยตรงไหน และย้ำว่าไม่ต้องรับมือคนเดียว'}
    ];
    var selectedMood = '';
    function drawFeelings() {
      var d = A.data(), existing = (d.feelings || []).filter(function (x) { return x.date === A.today(); })[0];
      selectedMood = existing ? existing.mood : '';
      $('moodNote').value = existing ? existing.note || '' : '';
      $('moodChoices').innerHTML = moods.map(function (m) { return '<button type="button" class="kw-mood-choice ' + (selectedMood === m.id ? 'is-on' : '') + '" data-mood="' + m.id + '"><span>' + m.emoji + '</span><b>' + m.label + '</b></button>'; }).join('');
      $('moodTip').textContent = (moods.filter(function (m) { return m.id === selectedMood; })[0] || {tip:'เลือกอารมณ์ที่ใกล้เคียงกับความรู้สึกของหนูได้เลย'}).tip;
      $('moodChoices').querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          selectedMood = b.getAttribute('data-mood');
          $('moodChoices').querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-mood') === selectedMood); });
          $('moodTip').textContent = (moods.filter(function (m) { return m.id === selectedMood; })[0] || {}).tip || '';
        });
      });
      var list = (d.feelings || []).slice().sort(function(x,y){return y.date.localeCompare(x.date);}).slice(0,14);
      $('moodList').innerHTML = list.length ? list.map(function (x) {
        var m = moods.filter(function (z) { return z.id === x.mood; })[0] || {emoji:'💛',label:x.moodLabel||'บันทึกแล้ว'};
        return '<article class="kw-world-record"><span class="kw-world-record-emoji">' + m.emoji + '</span><div><b>' + m.label + ' · ' + esc(x.date) + '</b><p>' + esc(x.note || 'วันนี้บันทึกความรู้สึกไว้แล้ว') + '</p></div></article>';
      }).join('') : '<p class="kw-empty">ยังไม่มีบันทึก ลองเลือกความรู้สึกของวันนี้นะ</p>';
    }
    $('saveMood').addEventListener('click', function () {
      if (!selectedMood) { $('moodErr').textContent = 'เลือกความรู้สึกก่อนบันทึกนะ'; return; }
      var d = A.data(), item = (d.feelings || []).filter(function (x) { return x.date === A.today(); })[0], mood = moods.filter(function (x) { return x.id === selectedMood; })[0];
      if (item) { item.mood = mood.id; item.moodLabel = mood.label; item.note = $('moodNote').value.trim(); item.at = new Date().toISOString(); }
      else { d.feelings.unshift({id:A.uid(),date:A.today(),mood:mood.id,moodLabel:mood.label,note:$('moodNote').value.trim(),at:new Date().toISOString()}); }
      if (d.feelings.length > 180) d.feelings.length = 180;
      $('moodErr').textContent = ''; $('moodTip').textContent = 'บันทึกแล้ว 💚 ขอบคุณที่แบ่งปันความรู้สึกนะ';
      A.save(); drawFeelings();
    });
    A.childBar($('cbar'), drawFeelings);
    drawFeelings();
  }
})();