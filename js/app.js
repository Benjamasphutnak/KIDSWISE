// KIDWISE – app logic: child profiles, storage and every page
(function () {
  'use strict';
  var D = window.KW_DATA;
  var KEY = 'kidwise.v2';

  // ---------------- helpers ----------------
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addMonths(s, m) { var d = parse(s); d.setMonth(d.getMonth() + m); return iso(d); }
  function monthsBetween(a, b) { var x = parse(a), y = parse(b); var m = (y.getFullYear() - x.getFullYear()) * 12 + (y.getMonth() - x.getMonth()); if (y.getDate() < x.getDate()) m--; return m; }
  function exactMonths(a, b) { var m = monthsBetween(a, b); var base = parse(addMonths(a, m)); var days = (parse(b) - base) / 864e5; return m + days / 30.44; }
  var TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  function thDate(s) { var d = parse(s); return d.getDate() + ' ' + TH_MONTHS[d.getMonth()] + ' ' + String(d.getFullYear() + 543).slice(2); }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  var CHECK_BIG = '<svg width="26" height="22" viewBox="0 0 26 22" aria-hidden="true"><path d="M3 11l7 7L23 4" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHECK_SM = '<svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true"><path d="M2 7l5 5L16 2" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var BACK = '<svg width="16" height="24" viewBox="0 0 16 24" aria-hidden="true"><path d="M12 3L3 12l9 9" fill="none" stroke="#2f8fe0" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHEV = '<svg width="18" height="12" viewBox="0 0 22 14" aria-hidden="true"><path d="M2 2l9 9 9-9z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>';

  // ---------------- storage ----------------
  function seed() { return { children: [], activeId: null, data: {} }; }
  var API = 'https://kaowin-challenge.weerayoot766.workers.dev';
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ''; if (v === '') localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return ''; } }
  function api(path, body) {
    return fetch(API + path, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json(); }).catch(function () { return { ok: false, error: 'net' }; })
      .then(function (j) { if (!j.ok) throw new Error(j.error || 'net'); return j; });
  }

  // ---------------- account + cloud sync ----------------
  var ACCT = null; try { ACCT = JSON.parse(localStorage.getItem('kidwise.acct') || 'null'); } catch (e) {}
  var page = document.body.getAttribute('data-page');
  if (!ACCT || !ACCT.phone || !ACCT.token) { location.replace('login.html'); return; }
  var S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch (e) { S = seed(); }
  if (!S.children) S.children = [];
  if (!S.data) S.data = {};
  var pushTimer = 0;
  var pushInFlight = false;
  var pushQueued = false;
  function writeLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked */ } }
  function save() { S.updated = Date.now(); writeLocal(); ls('kidwise.dirty', '1'); clearTimeout(pushTimer); pushTimer = setTimeout(push, 1200); }
  function authFail() { ls('kidwise.acct', ''); location.replace('login.html'); }
  function push() {
    if (!navigator.onLine || ls('kidwise.dirty') !== '1') return Promise.resolve();
    if (pushInFlight) { pushQueued = true; return Promise.resolve(); }

    pushInFlight = true;
    var sentUpdated = S.updated || Date.now();
    var sentData = JSON.stringify(S);
    return api('/kw/save', { phone: ACCT.phone, token: ACCT.token, data: sentData, updated: sentUpdated })
      .then(function () {
        // A newer local save may have happened while this request was in flight.
        // Only clear the dirty flag when the exact version we sent is still current.
        if ((S.updated || 0) === sentUpdated) ls('kidwise.dirty', '');
      })
      .catch(function (e) {
        if (e.message === 'auth') authFail();
      })
      .then(function () {
        pushInFlight = false;
        var hasNewerLocalVersion = (S.updated || 0) !== sentUpdated;
        if (navigator.onLine && ls('kidwise.dirty') === '1' && (hasNewerLocalVersion || pushQueued)) {
          pushQueued = false;
          clearTimeout(pushTimer);
          pushTimer = setTimeout(push, 250);
        }
      });
  }
  function pull() {
    if (!navigator.onLine) return;
    if (ls('kidwise.dirty') === '1') { push(); return; }
    api('/kw/load', { phone: ACCT.phone, token: ACCT.token }).then(function (r) {
      if (r.data && (r.updated || 0) > (S.updated || 0)) {
        try { localStorage.setItem(KEY, r.data); } catch (e) {}
        if (!sessionStorage.getItem('kw-pulled')) { sessionStorage.setItem('kw-pulled', '1'); location.reload(); }
      } else sessionStorage.removeItem('kw-pulled');
    }).catch(function (e) { if (e.message === 'auth') authFail(); });
  }
  window.addEventListener('online', push);
  document.addEventListener('visibilitychange', function () { if (document.hidden) push(); else pull(); });
  setTimeout(pull, 300);
  if (!S.children.length && page !== 'profile') { location.replace('profile.html?new=1'); return; }

  function child() { return S.children.filter(function (c) { return c.id === S.activeId; })[0] || S.children[0]; }
  function cdata(c) {
    c = c || child();
    var d = S.data[c.id] || (S.data[c.id] = {});
    d.tasks = d.tasks || {}; d.miles = d.miles || {}; d.acts = d.acts || {}; d.growth = d.growth || []; d.vax = d.vax || {}; d.notes = d.notes || [];
    return d;
  }
  function ageMonths(c) { return Math.max(0, monthsBetween(c.birth, today())); }
  function ageText(c) {
    var m = ageMonths(c);
    if (m < 1) { var days = Math.max(0, Math.round((parse(today()) - parse(c.birth)) / 864e5)); return 'อายุ ' + days + ' วัน'; }
    if (m < 12) return 'อายุ ' + m + ' เดือน';
    var y = Math.floor(m / 12), r = m % 12;
    return 'อายุ ' + y + ' ปี' + (r ? ' ' + r + ' เดือน' : '');
  }
  function groupIndex(m) {
    for (var i = 0; i < D.AGE_GROUPS.length; i++) { if (m >= D.AGE_GROUPS[i].min && m < D.AGE_GROUPS[i].max) return i; }
    return D.AGE_GROUPS.length - 1;
  }
  function groupOf(c) { return D.AGE_GROUPS[groupIndex(ageMonths(c))]; }
  function avatar(c) { return c.photo || (c.gender === 'boy' ? 'assets/avatar_boy.png' : 'assets/avatar_girl.png'); }
  function genderChip(c) { return c.gender === 'boy' ? '<span class="kw-chip kw-chip-boy">ชาย</span>' : '<span class="kw-chip kw-chip-girl">หญิง</span>'; }

  // ---------------- shared UI ----------------
  var TABS = [
    { id: 'home', href: 'index.html', label: 'หน้าหลัก', img: 'assets/n_home.png', svg: '<path d="M3 11.2L12 3.5l9 7.7v9.3a1 1 0 0 1-1 1h-5.2v-6.2H9.2v6.2H4a1 1 0 0 1-1-1z" fill="#fff"/>' },
    { id: 'dev', href: 'development.html', label: 'พัฒนาการ', img: 'assets/n_chart.png', svg: '<rect x="3" y="13" width="5" height="8" rx="1.6" fill="#fff"/><rect x="9.5" y="8" width="5" height="13" rx="1.6" fill="#fff"/><rect x="16" y="3" width="5" height="18" rx="1.6" fill="#fff"/>' },
    { id: 'act', href: 'activities.html', label: 'กิจกรรม', img: 'assets/n_puzzle.png', svg: '<path d="M3.5 7.5h4.2a2.6 2.6 0 1 1 5.1 0h4.2v4.2a2.6 2.6 0 1 1 0 5.1v4.2H12.8a2.6 2.6 0 1 0-5.1 0H3.5z" fill="#fff"/>' },
    { id: 'notes', href: 'notes.html', label: 'บันทึก', img: 'assets/n_book.png', svg: '<rect x="4" y="3" width="16" height="18" rx="3" fill="#fff"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#36a843" stroke-width="2" stroke-linecap="round"/>' },
    { id: 'profile', href: 'profile.html', label: 'โปรไฟล์', img: 'assets/n_prof.png', svg: '<circle cx="12" cy="8" r="4.5" fill="#fff"/><path d="M3.5 21a8.5 7 0 0 1 17 0z" fill="#fff"/>' }
  ];
  var PAGE_TAB = { index: 'home', development: 'dev', activities: 'act', notes: 'notes', profile: 'profile' };
  function renderChrome(page) {
    var nav = $('kw-nav');
    if (nav) {
      var on = PAGE_TAB[page];
      nav.innerHTML = TABS.map(function (t) {
        return t.id === on
          ? '<a href="' + t.href + '" class="kw-tab kw-tab-on" aria-current="page"><svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">' + t.svg + '</svg>' + t.label + '</a>'
          : '<a href="' + t.href + '" class="kw-tab"><img src="' + t.img + '" alt="">' + t.label + '</a>';
      }).join('');
    }
    
    document.querySelectorAll('.kw-back').forEach(function (n) { n.innerHTML = BACK; });
  }

  // child bar used on per-child pages
  function childBar(box, onChange) {
    function draw() {
      var c = child(), g = groupOf(c);
      box.innerHTML = '<div class="kw-card" style="border-radius:26px;padding:10px 12px;display:flex;align-items:center;gap:12px">' +
        '<img src="' + esc(avatar(c)) + '" alt="" style="width:62px;height:62px;border-radius:18px;object-fit:cover;flex:none">' +
        '<div style="flex:1;min-width:0"><div style="font-family:Mitr,sans-serif;font-weight:600;font-size:21px;color:#24342f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(c.name) + '</div>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:2px"><span style="font-size:15px">' + ageText(c) + '</span>' + genderChip(c) + '</div></div>' +
        (S.children.length > 1 ? '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:none"><div style="display:flex;gap:6px">' + S.children.filter(function (k) { return k.id !== c.id; }).slice(0, 3).map(function (k) { return '<button type="button" data-id="' + k.id + '" aria-label="สลับไปดู ' + esc(k.name) + '" style="width:44px;height:44px;padding:0;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.15);background:url(' + esc(avatar(k)) + ') center/cover;cursor:pointer"></button>'; }).join('') + '</div><span class="kw-muted" style="font-size:12px">แตะเพื่อสลับ</span></div>' : '<a href="profile.html" class="kw-btn kw-btn-sm kw-btn-ghost">+ เพิ่มลูก</a>') +
        '</div>';
      box.querySelectorAll('button[data-id]').forEach(function (b) { b.addEventListener('click', function () { S.activeId = b.getAttribute('data-id'); save(); draw(); onChange && onChange(); }); });
    }
    draw();
  }

  function groupSelect(sel, value, onChange) {
    sel.innerHTML = D.AGE_GROUPS.map(function (g, i) { return '<option value="' + i + '"' + (i === value ? ' selected' : '') + '>อายุ ' + g.label + '</option>'; }).join('');
    sel.addEventListener('change', function () { onChange(+sel.value); });
  }
  function orangeSelect(id, label) {
    return '<label style="position:relative;display:block"><span class="kw-hidden">' + label + '</span>' +
      '<select id="' + id + '" class="kw-select kw-btn" style="width:100%;height:58px;font-size:23px;padding:0 50px 0 24px;text-align:center;text-align-last:center"></select>' +
      '<span style="position:absolute;right:22px;top:50%;transform:translateY(-50%);pointer-events:none;display:flex">' + CHEV + '</span></label>';
  }
  function fit(src) { return /heart|wave/.test(src) ? 'object-fit:contain;padding:10px;box-sizing:border-box;background:#f3fbef' : 'object-fit:cover'; }
  function domainChip(d) { var dm = D.DOMAINS.filter(function (x) { return x.id === d; })[0]; var cls = { body: 'kw-chip-green', brain: 'kw-chip-boy', emo: 'kw-chip-girl', lang: 'kw-chip-orange' }[d]; return '<span class="kw-chip ' + cls + '">' + dm.label + '</span>'; }

  // ---------------- vaccines ----------------
  function vaxStatus(c, v) {
    var d = cdata(c); var due = addMonths(c.birth, v.m); var age = ageMonths(c);
    if (d.vax[v.id]) return { key: 'done', label: 'ฉีดแล้ว ' + thDate(d.vax[v.id]), cls: 'kw-chip-green', due: due };
    if (v.id === 'hb2') return { key: 'cond', label: 'เฉพาะบางราย', cls: 'kw-chip-gray', due: due };
    if (v.type === 'option') return { key: 'opt', label: age >= v.m ? 'ปรึกษาแพทย์' : 'อีก ' + (v.m - age) + ' เดือน', cls: 'kw-chip-gray', due: due };
    if (age < v.m) return { key: 'up', label: 'อีก ' + (v.m - age) + ' เดือน', cls: 'kw-chip-gray', due: due };
    if (age < v.m + 3) return { key: 'due', label: 'ถึงกำหนด', cls: 'kw-chip-orange', due: due };
    return { key: 'late', label: 'เลยกำหนด', cls: 'kw-chip-red', due: due };
  }
  function vaxAlerts(c) { return D.VACCINES.filter(function (v) { var s = vaxStatus(c, v).key; return s === 'due' || s === 'late'; }); }

  // ================= PAGES =================
  // fit 390px design on narrower phones
  function fitScreen() { var w = window.innerWidth; document.body.style.zoom = w < 390 ? (w / 390).toFixed(3) : ''; }
  fitScreen(); window.addEventListener('resize', fitScreen);
  renderChrome(page);

  // ---------- หน้าหลัก ----------
  if (page === 'index') {
    var c = child(), g = groupOf(c);
    $('childPhoto').src = avatar(c);
    $('childPhoto').alt = 'รูป' + c.name;
    $('childName').textContent = c.name;
    $('childAge').innerHTML = esc(ageText(c)) + ' ' + genderChip(c);
    $('childHint').textContent = S.children.length > 1 ? 'ลูก ' + S.children.length + ' คน · แตะเพื่อสลับ' : 'แตะเพื่อดูโปรไฟล์';
    var nA = vaxAlerts(c).length; $('bellDot').textContent = nA; $('bellDot').style.display = nA ? 'flex' : 'none';
    var acts = D.ACTIVITIES[g.id];
    var start = Math.floor(parse(today()) / 864e5) % acts.length;
    var todays = [0, 1, 2].map(function (k) { return acts[(start + k) % acts.length]; });
    var d = cdata(c);
    var box = $('tasks');
    function drawTasks() {
      var done = d.tasks[today()] || [];
      box.innerHTML = '';
      todays.forEach(function (t, i) {
        var on = done.indexOf(t.id) >= 0;
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:14px;height:75px;border-bottom:' + (i < 2 ? '1.5px solid #e8eeed' : 'none');
        row.innerHTML = '<img src="' + t.img + '" alt="" style="width:72px;height:64px;border-radius:16px;' + fit(t.img) + '">' +
          '<span style="flex:1;font-size:18px;line-height:1.3;color:#2c3b37">' + esc(t.title) + '</span>' +
          '<button type="button" class="kw-check ' + (on ? 'kw-check-on' : 'kw-check-off') + '" aria-pressed="' + on + '" aria-label="' + esc(t.title) + '">' + (on ? CHECK_BIG : '') + '</button>';
        row.querySelector('button').addEventListener('click', function () {
          var list = (d.tasks[today()] || []).slice();
          var k = list.indexOf(t.id); if (k >= 0) list.splice(k, 1); else list.push(t.id);
          d.tasks[today()] = list; save(); drawTasks();
        });
        box.appendChild(row);
      });
    }
    drawTasks();
  }

  // ---------- พัฒนาการ ----------
  if (page === 'development') {
    var dc = child(); var dd = cdata(dc);
    var st = { g: groupIndex(ageMonths(dc)), tab: 0 };
    groupSelect($('ageSelect'), st.g, function (v) { st.g = v; drawDev(); });
    function drawDev() {
      var gid = D.AGE_GROUPS[st.g].id, dm = D.DOMAINS[st.tab];
      document.querySelectorAll('.age-label').forEach(function (n) { n.textContent = 'อายุ ' + D.AGE_GROUPS[st.g].label; });
      $('panelTitle').textContent = dm.title;
      $('tip').textContent = dm.tip;
      var tabs = $('tabs'); tabs.innerHTML = '';
      D.DOMAINS.forEach(function (t, i) {
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i === st.tab);
        b.className = 'kw-seg' + (i === st.tab ? ' kw-seg-on' : ''); b.textContent = t.label;
        b.addEventListener('click', function () { st.tab = i; drawDev(); }); tabs.appendChild(b);
      });
      var miles = (dd.miles[gid] = dd.miles[gid] || {}); var arr = (miles[dm.id] = miles[dm.id] || [false, false, false, false]);
      var list = $('items'); list.innerHTML = '';
      D.MILESTONES[gid][dm.id].forEach(function (label, i) {
        var on = !!arr[i];
        var row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:10px;min-height:34px';
        row.innerHTML = '<button type="button" class="kw-box ' + (on ? 'kw-box-on' : 'kw-box-off') + '" aria-pressed="' + on + '" aria-label="' + esc(label) + '">' + (on ? CHECK_SM : '') + '</button><span style="font-size:16px;line-height:1.25;color:#2c3b37">' + esc(label) + '</span>';
        row.querySelector('button').addEventListener('click', function () { arr[i] = !on; save(); drawDev(); });
        list.appendChild(row);
      });
      var acts = D.ACTIVITIES[gid].slice().sort(function (a, b) { return (a.domain === dm.id ? 0 : 1) - (b.domain === dm.id ? 0 : 1); }).slice(0, 3);
      $('recs').innerHTML = acts.map(function (a) { return '<a href="activities.html" class="kw-rec"><img src="' + a.img + '" alt="" style="' + fit(a.img) + ';padding:' + (/heart|wave/.test(a.img) ? '22px' : '0') + '"><span>' + esc(a.title) + '</span></a>'; }).join('');
    }
    drawDev();
  }

  // ---------- กิจกรรม ----------
  if (page === 'activities') {
    var body = $('body');
    body.innerHTML = '<div id="cbar"></div>' + orangeSelect('gSel', 'เลือกช่วงอายุ') + '<p class="kw-muted" id="actCount" style="margin:0 6px"></p><div id="actList" style="display:flex;flex-direction:column;gap:12px"></div>';
    var ag = groupIndex(ageMonths(child()));
    function drawActs() {
      var c = child(), d = cdata(c), gid = D.AGE_GROUPS[ag].id;
      var list = D.ACTIVITIES[gid];
      var n = list.filter(function (a) { return d.acts[a.id]; }).length;
      $('actCount').textContent = 'ทำแล้ว ' + n + ' จาก ' + list.length + ' กิจกรรม';
      $('actList').innerHTML = '';
      list.forEach(function (a) {
        var on = !!d.acts[a.id];
        var card = document.createElement('div'); card.className = 'kw-card'; card.style.cssText = 'border-radius:24px;padding:12px;display:flex;gap:12px;align-items:center';
        card.innerHTML = '<img src="' + a.img + '" alt="" style="width:84px;height:84px;border-radius:18px;flex:none;' + fit(a.img) + '">' +
          '<div style="flex:1;min-width:0"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b style="font-family:Mitr,sans-serif;font-weight:600;font-size:18px;color:#1f2d29">' + esc(a.title) + '</b>' + domainChip(a.domain) + '</div>' +
          '<p style="margin:4px 0 0;font-size:15px;line-height:1.4;color:#3b4a46">' + esc(a.how) + '</p></div>' +
          '<button type="button" class="kw-check ' + (on ? 'kw-check-on' : 'kw-check-off') + '" aria-pressed="' + on + '" aria-label="ทำแล้ว: ' + esc(a.title) + '">' + (on ? CHECK_BIG : '') + '</button>';
        card.querySelector('button').addEventListener('click', function () { if (on) delete d.acts[a.id]; else d.acts[a.id] = today(); save(); drawActs(); });
        $('actList').appendChild(card);
      });
    }
    childBar($('cbar'), function () { ag = groupIndex(ageMonths(child())); $('gSel').value = ag; drawActs(); });
    groupSelect($('gSel'), ag, function (v) { ag = v; drawActs(); });
    drawActs();
  }

  // ---------- การเจริญเติบโต ----------
  if (page === 'growth') {
    var gb = $('body');
    gb.innerHTML = '<div id="cbar"></div><section id="latest"></section>' +
      '<section class="kw-card" style="border-radius:26px;padding:14px"><div style="display:flex;gap:8px;margin-bottom:8px" id="gTabs"></div><div id="chart"></div><p class="kw-muted" style="margin:6px 4px 0">แถบสีเขียว = ช่วงปกติ (เปอร์เซ็นไทล์ 3–97) เส้นประ = ค่ากลาง ตามมาตรฐาน WHO</p></section>' +
      '<section class="kw-card" style="border-radius:26px;padding:16px"><h2 class="kw-section-title" style="margin:0 0 10px"><img src="assets/m_scale.png" alt="">บันทึกน้ำหนัก-ส่วนสูง</h2>' +
      '<form id="gForm" style="display:flex;flex-direction:column;gap:10px"><label class="kw-field">วันที่วัด<input type="date" id="gDate" required></label>' +
      '<div style="display:flex;gap:10px"><label class="kw-field" style="flex:1">น้ำหนัก (กก.)<input type="number" id="gW" step="0.1" min="1" max="60" inputmode="decimal" placeholder="เช่น 10.5"></label>' +
      '<label class="kw-field" style="flex:1">ส่วนสูง (ซม.)<input type="number" id="gH" step="0.1" min="30" max="160" inputmode="decimal" placeholder="เช่น 80"></label></div>' +
      '<p id="gErr" class="kw-muted" style="margin:0;color:#b42318" role="alert"></p><button class="kw-btn kw-btn-green" type="submit">บันทึก</button></form></section>' +
      '<section><h2 class="kw-section-title">ประวัติการวัด</h2><div id="gList" style="display:flex;flex-direction:column;gap:8px;margin-top:8px"></div></section>';
    var gm = 'w';
    function band(c, kind, m) { var t = D.GROWTH[c.gender][kind]; if (m <= t[0][0]) return t[0]; for (var i = 1; i < t.length; i++) { if (m <= t[i][0]) { var a = t[i - 1], b = t[i], f = (m - a[0]) / (b[0] - a[0]); return [m, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f]; } } return t[t.length - 1]; }
    function judge(c, kind, date, val) {
      var m = exactMonths(c.birth, date); if (m > 72) return { label: 'เกินช่วงข้อมูลอ้างอิง', cls: 'kw-chip-gray' };
      var b = band(c, kind, m);
      if (val < b[1]) return { label: kind === 'w' ? 'น้ำหนักต่ำกว่าเกณฑ์' : 'ส่วนสูงต่ำกว่าเกณฑ์', cls: 'kw-chip-red' };
      if (val > b[3]) return { label: kind === 'w' ? 'น้ำหนักเกินเกณฑ์' : 'สูงกว่าเกณฑ์', cls: 'kw-chip-orange' };
      return { label: 'ตามเกณฑ์', cls: 'kw-chip-green' };
    }
    function drawGrowth() {
      var c = child(), d = cdata(c);
      var recs = d.growth.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      var last = recs[recs.length - 1];
      function stat(kind, unit, label, img) {
        var v = last && last[kind];
        return '<div class="kw-card" style="flex:1;border-radius:24px;padding:12px;text-align:center"><img src="' + img + '" alt="" style="width:54px;height:54px;object-fit:contain"><div class="kw-muted">' + label + '</div>' +
          '<div style="font-family:Mitr,sans-serif;font-weight:600;font-size:28px;color:#1f2d29">' + (v ? v + ' <span style="font-size:16px">' + unit + '</span>' : '–') + '</div>' +
          (v ? (function (j) { return '<span class="kw-chip ' + j.cls + '">' + j.label + '</span>'; })(judge(c, kind, last.date, v)) : '<span class="kw-muted">ยังไม่มีข้อมูล</span>') + '</div>';
      }
      $('latest').innerHTML = '<div style="display:flex;gap:10px">' + stat('w', 'กก.', 'น้ำหนักล่าสุด', 'assets/m_scale.png') + stat('h', 'ซม.', 'ส่วนสูงล่าสุด', 'assets/m_chart.png') + '</div>' +
        (last ? '<p class="kw-muted" style="margin:6px 6px 0">วัดเมื่อ ' + thDate(last.date) + ' · ผลนี้เป็นการคัดกรองเบื้องต้น หากผิดเกณฑ์ควรปรึกษาแพทย์</p>' : '');
      $('gTabs').innerHTML = '<button type="button" class="kw-seg' + (gm === 'w' ? ' kw-seg-on' : '') + '" data-k="w">น้ำหนัก</button><button type="button" class="kw-seg' + (gm === 'h' ? ' kw-seg-on' : '') + '" data-k="h">ส่วนสูง</button>';
      $('gTabs').querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { gm = b.getAttribute('data-k'); drawGrowth(); }); });
      // chart
      var age = ageMonths(c); var xmax = Math.min(72, Math.max(12, Math.ceil((age + 4) / 6) * 6));
      var table = D.GROWTH[c.gender][gm];
      var pts = []; for (var m = 0; m <= xmax; m += 1) pts.push(band(c, gm, m));
      var pv = recs.filter(function (r) { return r[gm]; }).map(function (r) { return [exactMonths(c.birth, r.date), r[gm]]; }).filter(function (p) { return p[0] >= 0 && p[0] <= xmax; });
      var ys = pts.map(function (p) { return p[1]; }).concat(pts.map(function (p) { return p[3]; }), pv.map(function (p) { return p[1]; }));
      var ymin = Math.floor(Math.min.apply(null, ys)), ymax = Math.ceil(Math.max.apply(null, ys));
      var W = 334, H = 210, L = 34, B = 24, T = 8;
      function X(m) { return L + (m / xmax) * (W - L - 6); } function Y(v) { return T + (1 - (v - ymin) / (ymax - ymin)) * (H - T - B); }
      var up = pts.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[3]).toFixed(1); }).join(' ');
      var lo = pts.slice().reverse().map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' ');
      var med = pts.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[2]).toFixed(1); }).join(' ');
      var grid = ''; var step = Math.max(1, Math.round((ymax - ymin) / 4));
      for (var v = Math.ceil(ymin / step) * step; v <= ymax; v += step) grid += '<line x1="' + L + '" x2="' + W + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#e3ecea"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" font-size="11" text-anchor="end" fill="#5a6a66">' + v + '</text>';
      var xt = ''; var xs = xmax <= 24 ? 6 : 12;
      for (var mm = 0; mm <= xmax; mm += xs) xt += '<text x="' + X(mm) + '" y="' + (H - 6) + '" font-size="11" text-anchor="middle" fill="#5a6a66">' + (mm < 12 ? mm + 'ด' : (mm / 12) + 'ปี') + '</text>';
      var line = pv.length > 1 ? '<polyline points="' + pv.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' ') + '" fill="none" stroke="#f47a12" stroke-width="2.5"/>' : '';
      var dots = pv.map(function (p) { return '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="5" fill="#f47a12" stroke="#fff" stroke-width="2"/>'; }).join('');
      $('chart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="กราฟ' + (gm === 'w' ? 'น้ำหนัก' : 'ส่วนสูง') + 'ตามอายุ เทียบมาตรฐาน WHO">' + grid +
        '<polygon points="' + up + ' ' + lo + '" fill="#bfe8b0" opacity=".65"/><polyline points="' + med + '" fill="none" stroke="#36a843" stroke-width="1.5" stroke-dasharray="5 4"/>' + line + dots + xt +
        '<text x="' + (L - 6) + '" y="' + (T + 2) + '" font-size="11" text-anchor="end" fill="#5a6a66"></text></svg>' +
        (pv.length ? '' : '<p class="kw-empty" style="padding:4px">บันทึกน้ำหนักและส่วนสูงด้านล่างเพื่อดูกราฟ</p>');
      // list
      $('gList').innerHTML = recs.length ? '' : '<p class="kw-empty">ยังไม่มีการบันทึก</p>';
      recs.slice().reverse().forEach(function (r) {
        var row = document.createElement('div'); row.className = 'kw-card'; row.style.cssText = 'border-radius:20px;padding:10px 14px;display:flex;align-items:center;gap:10px';
        row.innerHTML = '<div style="flex:1"><b style="font-family:Mitr,sans-serif;font-weight:500">' + thDate(r.date) + '</b><div class="kw-muted">' + (r.w ? r.w + ' กก.' : '–') + ' · ' + (r.h ? r.h + ' ซม.' : '–') + '</div></div><button type="button" class="kw-btn kw-btn-sm kw-btn-ghost" aria-label="ลบรายการ ' + thDate(r.date) + '">ลบ</button>';
        row.querySelector('button').addEventListener('click', function () { d.growth.splice(d.growth.indexOf(r), 1); save(); drawGrowth(); });
        $('gList').appendChild(row);
      });
    }
    $('gDate').value = today(); $('gDate').max = today();
    $('gForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var c = child(), w = parseFloat($('gW').value), h = parseFloat($('gH').value), dt = $('gDate').value;
      if (!w && !h) { $('gErr').textContent = 'กรอกน้ำหนักหรือส่วนสูงอย่างน้อย 1 ค่า'; return; }
      if (dt < c.birth) { $('gErr').textContent = 'วันที่วัดต้องไม่ก่อนวันเกิด'; return; }
      $('gErr').textContent = '';
      cdata(c).growth.push({ date: dt, w: w || null, h: h || null }); save();
      $('gW').value = ''; $('gH').value = ''; drawGrowth();
    });
    childBar($('cbar'), drawGrowth);
    drawGrowth();
  }

  // ---------- โภชนาการ ----------
  if (page === 'nutrition') {
    var nb = $('body');
    nb.innerHTML = '<div id="cbar"></div>' + orangeSelect('nSel', 'เลือกช่วงอายุ') + '<div id="nOut" style="display:flex;flex-direction:column;gap:14px"></div>';
    var ng = groupIndex(ageMonths(child()));
    function drawNut() {
      var set = D.NUTRITION_SETS[D.NUTRITION_BY_GROUP[D.AGE_GROUPS[ng].id]];
      var li = function (arr, color) { return '<ul class="kw-list">' + arr.map(function (t) { return '<li><span class="kw-dot" style="background:' + color + '"></span><span>' + esc(t) + '</span></li>'; }).join('') + '</ul>'; };
      var menu = set.menu ? '<section class="kw-card" style="border-radius:26px;padding:16px"><h2 class="kw-section-title" style="margin:0 0 10px"><img src="assets/m_bowl.png" alt="">ตัวอย่างเมนู 1 วัน</h2>' +
        Object.keys(set.menu).map(function (k) { return '<div style="display:flex;gap:12px;padding:9px 0;border-bottom:1.5px solid #e8eeed"><span class="kw-chip kw-chip-orange" style="flex:none;min-width:58px;justify-content:center">' + k + '</span><span style="font-size:16px;line-height:1.4">' + esc(set.menu[k]) + '</span></div>'; }).join('') + '</section>' : '';
      $('nOut').innerHTML =
        '<section style="border-radius:28px;padding:16px;display:flex;gap:12px;align-items:center;background:linear-gradient(160deg,#fff5e3,#fddcb7);border:3px solid rgba(255,255,255,.9);box-shadow:inset 0 3px 0 rgba(255,255,255,.8),0 10px 20px rgba(200,130,40,.18)">' +
        '<img src="assets/m_bowl.png" alt="" style="width:86px;height:86px;object-fit:contain;flex:none"><div><h2 style="margin:0;font-family:Mitr,sans-serif;font-weight:600;font-size:22px;color:#a24b00">' + esc(set.title) + '</h2><p style="margin:4px 0 0;font-size:16px;line-height:1.45">' + esc(set.milk) + '</p></div></section>' +
        '<section class="kw-card" style="border-radius:26px;padding:16px"><h2 class="kw-section-title" style="margin:0 0 10px"><img src="assets/bulb.png" alt="">คำแนะนำ</h2>' + li(set.tips, '#36a843') + '</section>' + menu +
        '<section class="kw-card" style="border-radius:26px;padding:16px"><h2 class="kw-section-title" style="margin:0 0 10px;color:#b42318"><img src="assets/m_shield.png" alt="">ควรหลีกเลี่ยง</h2>' + li(set.avoid, '#e5484d') + '</section>' +
        '<p class="kw-muted" style="margin:0 6px">ข้อมูลทั่วไปตามแนวทางโภชนาการเด็ก หากลูกมีโรคประจำตัวหรือแพ้อาหาร ควรปรึกษาแพทย์หรือนักโภชนาการ</p>';
    }
    childBar($('cbar'), function () { ng = groupIndex(ageMonths(child())); $('nSel').value = ng; drawNut(); });
    groupSelect($('nSel'), ng, function (v) { ng = v; drawNut(); });
    drawNut();
  }

  // ---------- สุขภาพและวัคซีน ----------
  if (page === 'health') {
    var hb = $('body');
    hb.innerHTML = '<div id="cbar"></div><section id="hNext"></section><section id="hDspm"></section>' +
      '<section><h2 class="kw-section-title"><img src="assets/m_shield.png" alt="">ตารางวัคซีน</h2><p class="kw-muted" style="margin:4px 6px 10px">แตะ "ฉีดแล้ว" เพื่อบันทึก · อ้างอิงวัคซีนพื้นฐานกระทรวงสาธารณสุข ปี 2569</p><div id="hList" style="display:flex;flex-direction:column;gap:12px"></div></section>' +
      '<a href="knowledge.html#fever" class="kw-card" style="border-radius:24px;padding:14px;display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit"><img src="assets/bulb.png" alt="" style="width:46px;height:46px;object-fit:contain"><span style="flex:1;font-size:16px;line-height:1.4"><b style="font-family:Mitr,sans-serif;font-weight:600">ลูกมีไข้ เมื่อไหร่ต้องพบแพทย์</b><br><span class="kw-muted">อ่านในคลังความรู้</span></span></a>' +
      '<p class="kw-muted" style="margin:0 6px">ตรวจสอบกับสมุดบันทึกสุขภาพแม่และเด็ก (สมุดสีชมพู) และนัดของแพทย์เสมอ วัคซีน "เสริม" เป็นวัคซีนทางเลือกที่มีค่าใช้จ่าย</p>';
    function drawHealth() {
      var c = child(), d = cdata(c), age = ageMonths(c);
      var alerts = vaxAlerts(c);
      var nextUp = D.VACCINES.filter(function (v) { return v.type === 'free' && v.id !== 'hb2' && !d.vax[v.id] && v.m > age; })[0];
      $('hNext').innerHTML = '<div style="border-radius:28px;padding:16px;display:flex;gap:12px;align-items:center;background:' + (alerts.length ? 'linear-gradient(160deg,#fff1e4,#ffd9b8)' : 'linear-gradient(160deg,#eefbe8,#cdeeb4)') + ';border:3px solid rgba(255,255,255,.9);box-shadow:inset 0 3px 0 rgba(255,255,255,.8),0 10px 20px rgba(80,120,60,.15)">' +
        '<img src="assets/m_shield.png" alt="" style="width:78px;height:78px;object-fit:contain;flex:none"><div>' +
        (alerts.length ? '<h2 style="margin:0;font-family:Mitr,sans-serif;font-weight:600;font-size:20px;line-height:1.3;color:#a24b00">ถึงกำหนดหรือยังไม่ได้บันทึก ' + alerts.length + ' รายการ</h2><p style="margin:4px 0 8px;font-size:15px;line-height:1.4">เทียบกับสมุดสีชมพู แล้วติ๊กรายการที่ฉีดแล้ว</p><button type="button" id="hAll" class="kw-btn kw-btn-sm kw-btn-ghost">ฉีดครบตามนัดแล้ว ติ๊กทั้งหมด</button>'
          : '<h2 style="margin:0;font-family:Mitr,sans-serif;font-weight:600;font-size:21px;color:#22702c">วัคซีนเป็นปัจจุบัน</h2><p style="margin:4px 0 0;font-size:15px;line-height:1.4">' + (nextUp ? 'ครั้งถัดไป: ' + esc(nextUp.name) + '<br>ประมาณ ' + thDate(addMonths(c.birth, nextUp.m)) : 'ไม่มีวัคซีนพื้นฐานที่ค้างอยู่') + '</p>') + '</div></div>';
      if ($('hAll')) $('hAll').addEventListener('click', function () { alerts.forEach(function (v) { d.vax[v.id] = addMonths(c.birth, v.m); }); save(); drawHealth(); });
      var nextD = D.DSPM_AGES.filter(function (m) { return m >= age; })[0];
      $('hDspm').innerHTML = '<div class="kw-card" style="border-radius:24px;padding:14px;display:flex;gap:12px;align-items:center"><img src="assets/m_chart.png" alt="" style="width:50px;height:50px;object-fit:contain;flex:none"><div style="font-size:15px;line-height:1.45"><b style="font-family:Mitr,sans-serif;font-weight:600;font-size:17px">ตรวจคัดกรองพัฒนาการ (DSPM)</b><br>ที่อายุ 9, 18, 30, 42 และ 60 เดือน' + (nextD != null ? ' · ครั้งถัดไป ' + (nextD === age ? 'เดือนนี้' : 'อายุ ' + nextD + ' เดือน') : '') + '</div></div>';
      var byAge = {}; D.VACCINES.forEach(function (v) { (byAge[v.m] = byAge[v.m] || []).push(v); });
      var html = '';
      Object.keys(byAge).map(Number).sort(function (a, b) { return a - b; }).forEach(function (m) {
        var lbl = m === 0 ? 'แรกเกิด' : m < 12 ? m + ' เดือน' : (m % 12 ? (m / 12).toFixed(1).replace('.0', '') + ' ปี' : (m / 12) + ' ปี');
        html += '<div class="kw-card" style="border-radius:24px;padding:12px 14px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span class="kw-chip kw-chip-green" style="font-family:Mitr,sans-serif;font-size:15px">' + lbl + '</span><span class="kw-muted">' + thDate(addMonths(c.birth, m)) + '</span></div>' +
          byAge[m].map(function (v) {
            var s = vaxStatus(c, v); var done = s.key === 'done';
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1.5px solid #eef3f2"><div style="flex:1;min-width:0"><div style="font-size:15px;line-height:1.35;color:#1f2d29">' + esc(v.name) + (v.type === 'option' ? ' <span class="kw-chip kw-chip-boy" style="font-size:12px;padding:1px 8px">เสริม</span>' : '') + '</div>' +
              (v.note ? '<div class="kw-muted" style="font-size:13px">' + esc(v.note) + '</div>' : '') + '<span class="kw-chip ' + s.cls + '" style="font-size:12px;margin-top:4px">' + s.label + '</span></div>' +
              '<button type="button" data-v="' + v.id + '" class="kw-check ' + (done ? 'kw-check-on' : 'kw-check-off') + '" aria-pressed="' + done + '" aria-label="ฉีดแล้ว: ' + esc(v.name) + '">' + (done ? CHECK_BIG : '') + '</button></div>';
          }).join('') + '</div>';
      });
      $('hList').innerHTML = html;
      $('hList').querySelectorAll('button[data-v]').forEach(function (b) {
        b.addEventListener('click', function () { var id = b.getAttribute('data-v'); if (d.vax[id]) delete d.vax[id]; else d.vax[id] = today(); save(); drawHealth(); });
      });
    }
    childBar($('cbar'), drawHealth);
    drawHealth();
  }

  // ---------- คลังความรู้ ----------
  if (page === 'knowledge') {
    var kb = $('body');
    kb.innerHTML = D.KNOWLEDGE.map(function (k) {
      return '<details class="kw-card kw-acc" id="' + k.id + '"' + (location.hash === '#' + k.id ? ' open' : '') + '><summary><img src="' + k.img + '" alt="" style="width:56px;height:56px;object-fit:contain;flex:none;border-radius:14px"><span style="flex:1"><b style="font-family:Mitr,sans-serif;font-weight:600;font-size:18px;color:#1f2d29;display:block;line-height:1.3">' + esc(k.title) + '</b><span class="kw-chip kw-chip-gray" style="font-size:12px;margin-top:4px">' + esc(k.tag) + '</span></span>' + CHEV.replace(/#fff/g, '#36a843') + '</summary>' +
        '<div style="padding:0 16px 16px"><ul class="kw-list">' + k.body.map(function (t) { return '<li><span class="kw-dot"></span><span>' + esc(t) + '</span></li>'; }).join('') + '</ul></div></details>';
    }).join('') + '<p class="kw-muted" style="margin:0 6px">ข้อมูลทั่วไปเพื่อการดูแลเบื้องต้น ไม่ใช้แทนคำแนะนำของแพทย์</p>';
  }

  // ---------- บันทึก ----------
  if (page === 'notes') {
    var CATS = ['ความทรงจำ', 'พัฒนาการ', 'สุขภาพ', 'การกิน', 'อื่น ๆ'];
    var ob = $('body');
    ob.innerHTML = '<div id="cbar"></div><section class="kw-card" style="border-radius:26px;padding:16px"><h2 class="kw-section-title" style="margin:0 0 10px"><img src="assets/n_book.png" alt="">เขียนบันทึกใหม่</h2>' +
      '<form id="nForm" style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:10px"><label class="kw-field" style="flex:1">วันที่<input type="date" id="nDate" required></label>' +
      '<label class="kw-field" style="flex:1">หมวด<select id="nCat">' + CATS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="kw-field">เรื่องราววันนี้<textarea id="nText" maxlength="1000" placeholder="เช่น วันนี้น้องเดินได้ 5 ก้าว"></textarea></label>' +
      '<p id="nErr" class="kw-muted" style="margin:0;color:#b42318" role="alert"></p><button class="kw-btn kw-btn-green" type="submit">บันทึก</button></form></section>' +
      '<section><h2 class="kw-section-title">บันทึกทั้งหมด</h2><div id="nList" style="display:flex;flex-direction:column;gap:10px;margin-top:8px"></div></section>';
    var CAT_CLS = { 'ความทรงจำ': 'kw-chip-girl', 'พัฒนาการ': 'kw-chip-green', 'สุขภาพ': 'kw-chip-red', 'การกิน': 'kw-chip-orange', 'อื่น ๆ': 'kw-chip-gray' };
    function drawNotes() {
      var d = cdata(); var list = d.notes.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var box = $('nList'); box.innerHTML = list.length ? '' : '<p class="kw-empty">ยังไม่มีบันทึก เริ่มเขียนเรื่องราวแรกของน้องได้เลย</p>';
      list.forEach(function (n) {
        var card = document.createElement('article'); card.className = 'kw-card'; card.style.cssText = 'border-radius:22px;padding:12px 14px';
        card.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><span class="kw-chip ' + (CAT_CLS[n.cat] || 'kw-chip-gray') + '">' + esc(n.cat) + '</span><span class="kw-muted" style="flex:1">' + thDate(n.date) + '</span><button type="button" class="kw-btn kw-btn-sm kw-btn-ghost" aria-label="ลบบันทึก">ลบ</button></div><p style="margin:8px 0 0;font-size:16px;line-height:1.5;white-space:pre-wrap">' + esc(n.text) + '</p>';
        var del = card.querySelector('button');
        del.addEventListener('click', function () {
          if (del.getAttribute('data-confirm')) { d.notes.splice(d.notes.indexOf(n), 1); save(); drawNotes(); }
          else { del.setAttribute('data-confirm', '1'); del.textContent = 'ยืนยันลบ'; del.style.color = '#b42318'; }
        });
        box.appendChild(card);
      });
    }
    $('nDate').value = today(); $('nDate').max = today();
    $('nForm').addEventListener('submit', function (e) {
      e.preventDefault(); var t = $('nText').value.trim();
      if (!t) { $('nErr').textContent = 'เขียนเรื่องราวก่อนบันทึก'; return; }
      $('nErr').textContent = '';
      cdata().notes.push({ id: uid(), date: $('nDate').value, cat: $('nCat').value, text: t }); save();
      $('nText').value = ''; drawNotes();
    });
    childBar($('cbar'), drawNotes);
    drawNotes();
  }

  // ---------- โปรไฟล์ลูก ----------
  if (page === 'profile') {
    var pb = $('body'); var editing = null; var photoData = null;
    pb.innerHTML = '<div id="pList" style="display:flex;flex-direction:column;gap:12px"></div><button type="button" id="pAdd" class="kw-btn kw-btn-green">+ เพิ่มโปรไฟล์ลูก</button>' +
      '<section id="pFormWrap" class="kw-card kw-hidden" style="border-radius:26px;padding:16px"><h2 class="kw-section-title" style="margin:0 0 12px" id="pFormTitle">เพิ่มโปรไฟล์ลูก</h2>' +
      '<form id="pForm" style="display:flex;flex-direction:column;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:14px"><img id="pPrev" src="assets/avatar_girl.png" alt="" style="width:84px;height:84px;border-radius:22px;object-fit:cover"><label class="kw-btn kw-btn-sm kw-btn-ghost" style="cursor:pointer">เลือกรูป<input type="file" id="pPhoto" accept="image/*" style="position:absolute;width:1px;height:1px;opacity:0"></label><button type="button" id="pNoPhoto" class="kw-btn kw-btn-sm kw-btn-ghost">ใช้รูปการ์ตูน</button></div>' +
      '<label class="kw-field">ชื่อเล่น<input type="text" id="pName" maxlength="30" required placeholder="เช่น น้องข้าวหอม"></label>' +
      '<fieldset style="border:none;padding:0;margin:0"><legend style="font-size:16px;margin-bottom:6px">เพศ</legend><div class="kw-radio"><label><input type="radio" name="pG" value="boy">ชาย</label><label><input type="radio" name="pG" value="girl" checked>หญิง</label></div></fieldset>' +
      '<label class="kw-field">วันเกิด<input type="date" id="pBirth" required></label>' +
      '<p id="pErr" class="kw-muted" style="margin:0;color:#b42318" role="alert"></p>' +
      '<div style="display:flex;gap:10px"><button type="button" id="pCancel" class="kw-btn kw-btn-ghost" style="flex:1">ยกเลิก</button><button type="submit" class="kw-btn kw-btn-green" style="flex:1">บันทึก</button></div></form></section>' +
      '<p class="kw-muted" style="margin:0 6px">ข้อมูลเก็บในบัญชีของคุณ เปิดจากเครื่องไหนก็เห็นเหมือนกัน ใช้ได้ตั้งแต่แรกเกิดถึง 6 ปี</p>';
    function previewSrc() { var g = (document.querySelector('input[name=pG]:checked') || {}).value; return photoData || (g === 'boy' ? 'assets/avatar_boy.png' : 'assets/avatar_girl.png'); }
    function openForm(c) {
      editing = c || null; photoData = c && c.photo ? c.photo : null;
      $('pFormTitle').textContent = c ? 'แก้ไขโปรไฟล์' : 'เพิ่มโปรไฟล์ลูก';
      $('pName').value = c ? c.name : ''; $('pBirth').value = c ? c.birth : '';
      $('pBirth').max = today(); $('pBirth').min = addMonths(today(), -84);
      document.querySelectorAll('input[name=pG]').forEach(function (r) { r.checked = r.value === (c ? c.gender : 'girl'); });
      $('pPrev').src = previewSrc(); $('pErr').textContent = '';
      $('pFormWrap').classList.remove('kw-hidden'); $('pAdd').classList.add('kw-hidden');
      $('pCancel').style.display = S.children.length ? '' : 'none';
      $('pFormTitle').textContent = c ? 'แก้ไขโปรไฟล์' : (S.children.length ? 'เพิ่มโปรไฟล์ลูก' : 'เริ่มต้น: เพิ่มโปรไฟล์ลูกคนแรก');
      $('pName').focus();
    }
    function closeForm() { if (!S.children.length) return; $('pFormWrap').classList.add('kw-hidden'); $('pAdd').classList.remove('kw-hidden'); }
    function drawProfiles() {
      var box = $('pList'); box.innerHTML = '';
      S.children.forEach(function (c) {
        var on = c.id === S.activeId; var g = groupOf(c);
        var card = document.createElement('article'); card.className = 'kw-card';
        card.style.cssText = 'border-radius:26px;padding:12px;' + (on ? 'border-color:#6fd166;box-shadow:inset 0 3px 0 #fff,0 0 0 3px #6fd166,0 12px 26px rgba(70,150,150,.2)' : '');
        card.innerHTML = '<div style="display:flex;gap:12px;align-items:center"><img src="' + esc(avatar(c)) + '" alt="" style="width:86px;height:86px;border-radius:22px;object-fit:cover;flex:none">' +
          '<div style="flex:1;min-width:0"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b style="font-family:Mitr,sans-serif;font-weight:600;font-size:22px;color:#24342f">' + esc(c.name) + '</b>' + genderChip(c) + '</div>' +
          '<div style="font-size:15px;margin-top:2px">' + ageText(c) + '</div><div class="kw-muted">ช่วงวัย ' + g.label + ' · เกิด ' + thDate(c.birth) + '</div></div></div>' +
          '<div style="display:flex;gap:8px;margin-top:10px">' + (on ? '<span class="kw-chip kw-chip-green" style="flex:1;justify-content:center;height:40px;border-radius:20px;font-family:Mitr,sans-serif">กำลังดูโปรไฟล์นี้</span>' : '<button type="button" data-a="use" class="kw-btn kw-btn-sm kw-btn-green" style="flex:1">ดูโปรไฟล์นี้</button>') +
          '<button type="button" data-a="edit" class="kw-btn kw-btn-sm kw-btn-ghost">แก้ไข</button>' + (S.children.length > 1 ? '<button type="button" data-a="del" class="kw-btn kw-btn-sm kw-btn-ghost">ลบ</button>' : '') + '</div>';
        card.querySelectorAll('button').forEach(function (b) {
          b.addEventListener('click', function () {
            var a = b.getAttribute('data-a');
            if (a === 'use') { S.activeId = c.id; save(); drawProfiles(); }
            if (a === 'edit') openForm(c);
            if (a === 'del') {
              if (!b.getAttribute('data-confirm')) { b.setAttribute('data-confirm', '1'); b.textContent = 'ยืนยันลบ'; b.style.color = '#b42318'; return; }
              S.children = S.children.filter(function (k) { return k.id !== c.id; }); delete S.data[c.id];
              if (S.activeId === c.id) S.activeId = S.children[0].id; save(); drawProfiles();
            }
          });
        });
        box.appendChild(card);
      });
    }
    $('pAdd').addEventListener('click', function () { openForm(null); });
    $('pCancel').addEventListener('click', closeForm);
    $('pNoPhoto').addEventListener('click', function () { photoData = null; $('pPrev').src = previewSrc(); });
    document.querySelectorAll('input[name=pG]').forEach(function (r) { r.addEventListener('change', function () { $('pPrev').src = previewSrc(); }); });
    $('pPhoto').addEventListener('change', function () {
      var f = this.files && this.files[0]; if (!f) return;
      var img = new Image(); var url = URL.createObjectURL(f);
      img.onload = function () {
        var s = 240, cv = document.createElement('canvas'); cv.width = s; cv.height = s;
        var k = Math.min(img.width, img.height); cv.getContext('2d').drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, s, s);
        photoData = cv.toDataURL('image/jpeg', 0.85); $('pPrev').src = photoData; URL.revokeObjectURL(url);
      };
      img.src = url;
    });
    $('pForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('pName').value.trim(), birth = $('pBirth').value, gender = (document.querySelector('input[name=pG]:checked') || {}).value;
      if (!name) { $('pErr').textContent = 'กรอกชื่อเล่นของลูก'; return; }
      if (!birth) { $('pErr').textContent = 'เลือกวันเกิด'; return; }
      if (birth > today()) { $('pErr').textContent = 'วันเกิดต้องไม่เกินวันนี้'; return; }
      if (editing) { editing.name = name; editing.birth = birth; editing.gender = gender; editing.photo = photoData; }
      else { var nc = { id: 'c' + uid(), name: name, gender: gender, birth: birth, photo: photoData }; S.children.push(nc); S.activeId = nc.id; }
      save(); closeForm(); drawProfiles();
    });
    drawProfiles();
    if (!S.children.length) openForm(null);
    // บัญชีผู้ใช้
    var acc = document.createElement('section'); acc.className = 'kw-card'; acc.style.cssText = 'border-radius:26px;padding:14px';
    var ph = ACCT.phone.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');
    acc.innerHTML = '<div style="display:flex;align-items:center;gap:10px"><img src="assets/n_prof.png" alt="" style="width:44px;height:44px;object-fit:contain"><div style="flex:1"><b style="font-family:Mitr,sans-serif;font-weight:600;font-size:17px">บัญชีของฉัน</b><div class="kw-muted">เบอร์ ' + ph + ' · ข้อมูลซิงก์ทุกเครื่อง</div></div></div>' +
      '<div style="display:flex;gap:8px;margin-top:10px"><button type="button" id="aPin" class="kw-btn kw-btn-sm kw-btn-ghost" style="flex:1">เปลี่ยนรหัส</button><button type="button" id="aOut" class="kw-btn kw-btn-sm kw-btn-ghost" style="flex:1">ออกจากระบบ</button></div>' +
      '<form id="aPinF" class="kw-hidden" style="display:flex;flex-direction:column;gap:10px;margin-top:12px"><div style="display:flex;gap:10px"><label class="kw-field" style="flex:1">รหัสเดิม<input type="password" id="aOld" inputmode="numeric" maxlength="4" pattern="\\d{4}" autocomplete="current-password" required></label><label class="kw-field" style="flex:1">รหัสใหม่ 4 หลัก<input type="password" id="aNew" inputmode="numeric" maxlength="4" pattern="\\d{4}" autocomplete="new-password" required></label></div><p id="aMsg" class="kw-muted" style="margin:0" role="status"></p><button type="submit" class="kw-btn kw-btn-sm kw-btn-green">บันทึกรหัสใหม่</button></form>';
    $('pList').parentNode.insertBefore(acc, $('pList'));
    $('aPin').addEventListener('click', function () { $('aPinF').classList.toggle('kw-hidden'); });
    $('aPinF').addEventListener('submit', function (e) {
      e.preventDefault(); var o = $('aOld').value, n = $('aNew').value;
      if (!/^\d{4}$/.test(n)) { $('aMsg').textContent = 'รหัสใหม่ต้องเป็นตัวเลข 4 หลัก'; return; }
      api('/kw/pin', { phone: ACCT.phone, token: ACCT.token, old: o, pin: n }).then(function () { $('aMsg').textContent = 'เปลี่ยนรหัสแล้ว'; $('aOld').value = ''; $('aNew').value = ''; })
        .catch(function (er) { $('aMsg').textContent = er.message === 'pin' ? 'รหัสเดิมไม่ถูกต้อง' : er.message === 'auth' ? 'กรุณาเข้าสู่ระบบใหม่' : 'ต้องต่ออินเทอร์เน็ต'; });
    });
    $('aOut').addEventListener('click', function () {
      var b = $('aOut');
      if (!navigator.onLine && ls('kidwise.dirty') === '1') { b.textContent = 'ต่อเน็ตก่อน ข้อมูลยังไม่ซิงก์'; return; }
      if (!b.getAttribute('data-confirm')) { b.setAttribute('data-confirm', '1'); b.textContent = 'ยืนยันออก'; b.style.color = '#b42318'; return; }
      push().then(function () { return api('/kw/logout', { phone: ACCT.phone, token: ACCT.token }).catch(function () {}); }).then(function () {
        ls('kidwise.acct', ''); ls('kidwise.dirty', ''); try { localStorage.removeItem(KEY); } catch (e) {} location.replace('login.html');
      });
    });
  }
  // ================= ติดตั้งแอป (PWA) =================
  var deferredPrompt = null;
  var isStandalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var canSW = 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  if (canSW) navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (registration) { if (registration && registration.update) registration.update().catch(function () {}); }).catch(function () {});
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; });
  window.addEventListener('appinstalled', function () { deferredPrompt = null; hideInstall(); });
  function hideInstall() { document.querySelectorAll('[data-install], [data-install-card]').forEach(function (n) { n.style.display = 'none'; }); }
  function closeModal() { var m = $('kwModal'); if (m) m.remove(); }
  function showHelp() {
    closeModal();
    var steps;
    if (location.protocol === 'file:') {
      steps = '<p style="margin:0;font-size:16px;line-height:1.5">ตอนนี้เปิดจากไฟล์ในเครื่อง จึงติดตั้งไม่ได้ ให้นำแอปขึ้น GitHub Pages ก่อน แล้วเปิดลิงก์ <b>https://…github.io/…</b> บนมือถือ จากนั้นกดปุ่มนี้อีกครั้ง</p>';
    } else if (isIOS) {
      steps = '<ol><li>เปิดหน้านี้ด้วย <b>Safari</b></li><li>แตะปุ่ม <b>แชร์</b> (สี่เหลี่ยมมีลูกศรชี้ขึ้น) ด้านล่างจอ</li><li>เลื่อนลงแล้วแตะ <b>เพิ่มไปยังหน้าจอโฮม</b></li><li>แตะ <b>เพิ่ม</b> ไอคอน KIDWISE จะอยู่บนหน้าจอโฮม</li></ol>';
    } else {
      steps = '<ol><li>เปิดหน้านี้ด้วย <b>Chrome</b></li><li>แตะเมนู <b>⋮</b> มุมขวาบน</li><li>เลือก <b>ติดตั้งแอป</b> หรือ <b>เพิ่มลงในหน้าจอหลัก</b></li><li>แตะ <b>ติดตั้ง</b></li></ol>';
    }
    var bg = document.createElement('div'); bg.className = 'kw-modal-bg'; bg.id = 'kwModal';
    bg.innerHTML = '<div class="kw-modal" role="dialog" aria-modal="true" aria-labelledby="kwModalT"><div style="display:flex;gap:12px;align-items:center;margin-bottom:6px"><img src="icons/icon-192.png" alt="" style="width:56px;height:56px;border-radius:14px"><h2 id="kwModalT">ติดตั้ง KIDWISE ลงหน้าจอโฮม</h2></div>' + steps +
      '<button type="button" class="kw-btn kw-btn-green" style="width:100%" id="kwModalOk">เข้าใจแล้ว</button></div>';
    bg.addEventListener('click', function (e) { if (e.target === bg) closeModal(); });
    document.body.appendChild(bg);
    $('kwModalOk').addEventListener('click', closeModal);
    $('kwModalOk').focus();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  function onInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (r) { if (r.outcome === 'accepted') hideInstall(); deferredPrompt = null; });
    } else showHelp();
  }
  if (page === 'profile') {
    var card = document.createElement('section'); card.setAttribute('data-install-card', '');
    card.className = 'kw-card'; card.style.cssText = 'border-radius:26px;padding:14px;display:flex;gap:12px;align-items:center';
    card.innerHTML = '<img src="icons/icon-192.png" alt="" style="width:62px;height:62px;border-radius:16px;flex:none"><div style="flex:1"><b style="font-family:Mitr,sans-serif;font-weight:600;font-size:18px">ติดตั้งแอปลงหน้าจอโฮม</b><div class="kw-muted">เปิดได้เหมือนแอปทั่วไป ใช้ได้แม้ไม่มีเน็ต</div></div><button type="button" data-install class="kw-install">ติดตั้ง</button>';
    $('body').insertBefore(card, $('body').firstChild);
  }
  document.querySelectorAll('[data-install]').forEach(function (b) { b.addEventListener('click', onInstall); });
  if (isStandalone) hideInstall();
  // ================= ตัวนับผู้ใช้ (เซิร์ฟเวอร์เดียวกับ KAOWIN) =================
  // ส่งแค่รหัสเครื่องแบบสุ่ม วันที่ ประเภทเครื่อง และสถานะติดตั้ง วันละครั้ง — ไม่ส่งชื่อหรือข้อมูลของลูก
  var APP_VER = 'v1';
  if (!ls('kidwise-since')) ls('kidwise-since', today());
  function devId() {
    var d = ls('kidwise-did');
    if (!d) { d = ((window.crypto && crypto.randomUUID && crypto.randomUUID().replace(/-/g, '')) || (Math.random().toString(36).slice(2) + Date.now().toString(36))).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20); ls('kidwise-did', d); }
    return d;
  }
  function ping() {
    try {
      if (!navigator.onLine || location.protocol === 'file:') return;
      var id = devId(); if (id.length < 12) return;
      var day = today(), inst = isStandalone ? 1 : 0, k = day + ':' + inst;
      if (ls('kidwise-ping') === k) return;
      var ua = navigator.userAgent;
      var os = isIOS ? 'ios' : /Android/i.test(ua) ? 'android' : /Windows|Macintosh|Linux|CrOS/.test(ua) ? 'desktop' : 'other';
      var since = ls('kidwise-since'); if (!(since && since <= day)) since = day;
      api('/ping', { app: 'kidwise', did: id, inst: inst, os: os, mode: '', since: since }).then(function () { ls('kidwise-ping', k); }).catch(function () {});
    } catch (e) {}
  }
  setTimeout(ping, 1500);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) ping(); });

  // ---- สถิติผู้ใช้ (เจ้าของแอป): แตะ "KIDWISE v1" ในหน้าโปรไฟล์ 5 ครั้ง แล้วใส่รหัสเดียวกับ KAOWIN ----
  function sheet(title, html) {
    closeModal();
    var bg = document.createElement('div'); bg.className = 'kw-modal-bg'; bg.id = 'kwModal';
    bg.innerHTML = '<div class="kw-modal" role="dialog" aria-modal="true" aria-labelledby="kwModalT" style="max-height:88vh;overflow:auto"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><h2 id="kwModalT" style="flex:1;margin:0">' + title + '</h2><button type="button" class="kw-btn kw-btn-sm kw-btn-ghost" id="kwModalX" aria-label="ปิด">ปิด</button></div><div id="kwSheetB">' + html + '</div></div>';
    bg.addEventListener('click', function (e) { if (e.target === bg) closeModal(); });
    document.body.appendChild(bg); $('kwModalX').addEventListener('click', closeModal);
    return $('kwSheetB');
  }
  function keyForm(mode, msg) {
    var b = sheet(mode === 'set' ? 'ตั้งรหัสดูสถิติ' : 'ใส่รหัสดูสถิติ',
      (msg ? '<p class="kw-chip kw-chip-orange" style="display:block;border-radius:12px;padding:8px 12px;margin:0 0 10px">' + esc(msg) + '</p>' : '') +
      '<p class="kw-muted" style="margin:0 0 10px">ใช้รหัสเดียวกับแอป KAOWIN</p><form id="kwKeyF" style="display:flex;flex-direction:column;gap:10px">' +
      '<label class="kw-field">รหัส<input type="password" id="kwK1" autocomplete="off" minlength="4" required></label>' +
      (mode === 'set' ? '<label class="kw-field">ใส่รหัสอีกครั้ง<input type="password" id="kwK2" autocomplete="off" minlength="4" required></label>' : '') +
      '<button class="kw-btn kw-btn-green" type="submit">' + (mode === 'set' ? 'ตั้งรหัสและดูสถิติ' : 'ดูสถิติ') + '</button></form>');
    $('kwK1').focus();
    $('kwKeyF').addEventListener('submit', function (e) {
      e.preventDefault(); var k = $('kwK1').value.trim();
      if (mode === 'set') {
        if (k !== $('kwK2').value.trim()) return keyForm('set', 'รหัส 2 ช่องไม่ตรงกัน');
        api('/admin/setkey', { key: k }).then(function () { ls('kaowin.admin', k); showStats(); })
          .catch(function (er) { keyForm(er.message === 'admin' ? 'ask' : 'set', er.message === 'short' ? 'รหัสสั้นไป ใส่อย่างน้อย 4 ตัว' : er.message === 'admin' ? 'มีรหัสอยู่แล้ว ใส่รหัสเดียวกับ KAOWIN' : 'เชื่อมต่อไม่ได้ ต้องต่ออินเทอร์เน็ต'); });
      } else { ls('kaowin.admin', k); showStats(); }
    });
  }
  function showStats() {
    var key = ls('kaowin.admin');
    var b = sheet('สถิติผู้ใช้ KIDWISE', '<p class="kw-empty">กำลังโหลด…</p>');
    api('/admin/stats', { admin: key, app: 'kidwise' }).then(function (r) {
      if (r.app !== 'kidwise') { b.innerHTML = '<p class="kw-chip kw-chip-red" style="display:block;border-radius:12px;padding:10px 12px;line-height:1.5">เซิร์ฟเวอร์ยังไม่รู้จัก KIDWISE: เพิ่ม "kidwise" ในบรรทัด const APPS ของ Worker แล้วกด Deploy ก่อน</p>'; return; }
      ls('kidwise-owner', '1'); ownerFab();
      var t = r.tot, D = Object.keys(r.days).map(function (k) { return [k, r.days[k]]; });
      var mx = Math.max.apply(null, [1].concat(D.map(function (x) { return x[1].act; })));
      function tile(n, l, sub, color) { return '<div class="kw-card" style="border-radius:20px;padding:12px 6px;text-align:center"><b style="display:block;font-family:Mitr,sans-serif;font-weight:600;font-size:30px;line-height:1.1;color:' + color + '">' + n + '</b><span style="font-size:14px">' + l + '</span>' + (sub ? '<span class="kw-muted" style="display:block;font-size:12px">' + sub + '</span>' : '') + '</div>'; }
      function dd(d) { var p = d.split('-'); return (+p[2]) + '/' + (+p[1]); }
      var OS = { ios: 'iPhone/iPad', android: 'Android', desktop: 'คอม', other: 'อื่น ๆ' };
      b.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">' +
        tile(t.installed, 'ติดตั้งแอป', 'วันนี้ +' + t.instToday + ' · 7 วัน +' + t.inst7, '#22702c') +
        tile(t.newToday, 'คนใหม่วันนี้', '7 วัน ' + t.new7, '#e2650b') +
        tile(t.dau, 'ใช้งานวันนี้', '', '#1e5f9e') +
        tile(t.devices, 'เครื่องทั้งหมด', '', '#1f2d29') + tile(t.wau, 'ใช้งาน 7 วัน', '', '#1f2d29') + tile(t.mau, 'ใช้งาน 30 วัน', '', '#1f2d29') + '</div>' +
        '<h3 style="margin:16px 0 6px;font-family:Mitr,sans-serif;font-weight:600;font-size:18px">14 วันล่าสุด</h3>' +
        '<div style="display:grid;grid-template-columns:44px 1fr 40px 44px;gap:5px 6px;align-items:center;font-size:14px"><b>วันที่</b><b>ใช้งาน</b><b>ใหม่</b><b>ติดตั้ง</b>' +
        D.map(function (x) { var v = x[1]; return '<span>' + dd(x[0]) + '</span><span style="display:flex;align-items:center;gap:6px"><i style="display:block;height:10px;border-radius:5px;background:#36a843;width:' + Math.max(2, v.act / mx * 100) + '%"></i>' + v.act + '</span><span>' + (v.nw || '') + '</span><span>' + (v.inst || '') + '</span>'; }).join('') + '</div>' +
        '<p class="kw-muted" style="margin-top:12px">ระบบ: ' + (Object.keys(r.os).map(function (k) { return (OS[k] || k) + ' ' + r.os[k]; }).join(' · ') || '-') + '</p>' +
        '<p class="kw-muted" style="margin:6px 0 0;font-size:12px">นับเครื่องละครั้งต่อวัน ไม่เก็บชื่อหรือข้อมูลของลูก</p>' +
        '<h3 style="margin:18px 0 6px;font-family:Mitr,sans-serif;font-weight:600;font-size:18px">รีเซ็ตรหัสให้ผู้ใช้ที่ลืมรหัส</h3><form id="kwRst" style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;gap:8px"><label class="kw-field" style="flex:3">เบอร์โทร<input id="kwRP" inputmode="tel" maxlength="12" required></label><label class="kw-field" style="flex:2">รหัสใหม่<input id="kwRN" inputmode="numeric" maxlength="4" pattern="\\d{4}" required></label></div><p id="kwRM" class="kw-muted" style="margin:0" role="status"></p><button class="kw-btn kw-btn-sm kw-btn-ghost" type="submit">รีเซ็ตรหัส</button></form>';
      $('kwRst').addEventListener('submit', function (ev) {
        ev.preventDefault();
        api('/kw/admin/reset', { admin: ls('kaowin.admin'), phone: $('kwRP').value.replace(/\D/g, ''), pin: $('kwRN').value })
          .then(function () { $('kwRM').textContent = 'รีเซ็ตแล้ว แจ้งรหัสใหม่ให้ผู้ใช้ได้เลย'; })
          .catch(function (er) { $('kwRM').textContent = er.message === 'nouser' ? 'ไม่พบเบอร์นี้' : er.message === 'pin' ? 'รหัสใหม่ต้องเป็นตัวเลข 4 หลัก' : 'ทำไม่สำเร็จ'; });
      });
    }).catch(function (e) {
      if (e.message === 'nokey') return keyForm('set');
      if (e.message === 'admin') { var had = !!key; ls('kaowin.admin', ''); return keyForm('ask', had ? 'รหัสไม่ถูกต้อง ลองใหม่' : ''); }
      b.innerHTML = '<p class="kw-empty">เชื่อมต่อไม่ได้ ต้องต่ออินเทอร์เน็ต</p>';
    });
  }
  function ownerFab() {
    if (ls('kidwise-owner') !== '1' || $('kwStatFab')) return;
    var f = document.createElement('button'); f.type = 'button'; f.id = 'kwStatFab'; f.className = 'kw-btn kw-btn-sm';
    f.style.cssText = 'position:fixed;z-index:40;right:max(16px, calc(50% - 179px));bottom:132px';
    f.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="12" width="4.5" height="9" rx="1.5" fill="#fff"/><rect x="9.75" y="7" width="4.5" height="14" rx="1.5" fill="#fff"/><rect x="16.5" y="3" width="4.5" height="18" rx="1.5" fill="#fff"/></svg>สถิติผู้ใช้';
    f.addEventListener('click', showStats); document.body.appendChild(f);
  }
  if (page === 'index' || page === 'profile') ownerFab();
  if (page === 'profile') {
    var ver = document.createElement('p'); ver.className = 'kw-muted'; ver.style.cssText = 'margin:0 6px;text-align:center;user-select:none';
    ver.innerHTML = 'KIDWISE <span id="kwVer" style="cursor:pointer;padding:6px">' + APP_VER + '</span><br><span style="font-size:12px">ข้อมูลลูกเก็บในบัญชีของคุณ ผู้อื่นเปิดดูไม่ได้ · ตัวนับผู้ใช้ส่งแค่รหัสเครื่องแบบสุ่ม วันที่ และประเภทเครื่อง</span>';
    $('body').appendChild(ver);
    var taps = 0, tm = 0;
    $('kwVer').addEventListener('click', function () { clearTimeout(tm); tm = setTimeout(function () { taps = 0; }, 1500); if (++taps >= 5) { taps = 0; showStats(); } });
  }
})();
