const $ = (id) => document.getElementById(id);
// บัญชีรุ่นทดลอง: เก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ใช่ระบบยืนยันตัวตนออนไลน์
const AUTH_KEY = "kidswise_local_account_v1";
let authMode = "login";
const authScreen = $("authScreen");
const mainApp = $("mainApp");
function setAuthMode(mode){authMode=mode;$("showLogin").classList.toggle("selected",mode==="login");$("showRegister").classList.toggle("selected",mode==="register");$("authSubmit").textContent=mode==="login"?"เข้าสู่ระบบ":"สมัครสมาชิก";$("authHint").textContent=mode==="login"?"เข้าสู่ระบบด้วยเบอร์โทรศัพท์และรหัส 4 หลัก":"สร้างบัญชีด้วยเบอร์โทรศัพท์และตั้งรหัส 4 หลัก";$("authPin").value=""}
async function hashPin(pin){const bytes=new TextEncoder().encode(pin);const digest=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("")}
function openApp(phone){authScreen.hidden=true;mainApp.hidden=false;$("accountLabel").textContent=phone}
function initAuth(){const account=JSON.parse(localStorage.getItem(AUTH_KEY)||"null");if(sessionStorage.getItem("kidswise_session")==="active"&&account){openApp(account.phone)}else{authScreen.hidden=false;mainApp.hidden=true}$("showLogin").addEventListener("click",()=>setAuthMode("login"));$("showRegister").addEventListener("click",()=>setAuthMode("register"));$("authForm").addEventListener("submit",async e=>{e.preventDefault();const phone=$("authPhone").value.replace(/\D/g,"");const pin=$("authPin").value;if(!/^0[0-9]{9}$/.test(phone)){toast("กรุณากรอกเบอร์โทรศัพท์ 10 หลัก");return}if(!/^[0-9]{4}$/.test(pin)){toast("รหัสผ่านต้องเป็นตัวเลข 4 หลัก");return}const saved=JSON.parse(localStorage.getItem(AUTH_KEY)||"null");const pinHash=await hashPin(pin);if(authMode==="register"){if(saved){toast("เบราว์เซอร์นี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ");setAuthMode("login");return}localStorage.setItem(AUTH_KEY,JSON.stringify({phone,pinHash,failed:0,lockedUntil:0}));sessionStorage.setItem("kidswise_session","active");openApp(phone);toast("สมัครสมาชิกเรียบร้อย 💚")}else{if(!saved||saved.phone!==phone){toast("ไม่พบบัญชีนี้ในเบราว์เซอร์เครื่องนี้");return}if(saved.lockedUntil>Date.now()){toast("บัญชีถูกพักชั่วคราว กรุณาลองใหม่ภายหลัง");return}if(saved.pinHash!==pinHash){saved.failed=(saved.failed||0)+1;if(saved.failed>=5){saved.failed=0;saved.lockedUntil=Date.now()+5*60*1000}localStorage.setItem(AUTH_KEY,JSON.stringify(saved));toast(saved.lockedUntil>Date.now()?"ใส่รหัสผิดหลายครั้ง พักการเข้าสู่ระบบ 5 นาที":"เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง");return}saved.failed=0;saved.lockedUntil=0;localStorage.setItem(AUTH_KEY,JSON.stringify(saved));sessionStorage.setItem("kidswise_session","active");openApp(phone);toast("เข้าสู่ระบบสำเร็จ 💚")}});$("logoutBtn").addEventListener("click",()=>{sessionStorage.removeItem("kidswise_session");mainApp.hidden=true;authScreen.hidden=false;setAuthMode("login");toast("ออกจากระบบแล้ว")})}

const KEY = "kidswise_demo_v1";
const state = JSON.parse(localStorage.getItem(KEY) || '{"name":"","birth":"","growth":[],"checked":[]}');
const milestones = {
 "0-3":[["ร่างกาย","ขยับแขนขาและตอบสนองต่อการสัมผัส"],["ร่างกาย","เริ่มยกศีรษะได้เมื่ออยู่ในท่าคว่ำโดยมีผู้ดูแล"],["สติปัญญา","มองตามใบหน้าหรือวัตถุที่เคลื่อนไหว"],["อารมณ์และสังคม","สงบลงเมื่อได้รับการปลอบโยน"],["ภาษา","สะดุ้งหรือหันตอบสนองต่อเสียง"]],
 "4-6":[["ร่างกาย","เอื้อมมือคว้าของเล่นและนำมือเข้าปาก"],["ร่างกาย","พลิกตัวหรือพยายามเปลี่ยนท่าทาง"],["สติปัญญา","สำรวจสิ่งของด้วยการมองและสัมผัส"],["อารมณ์และสังคม","ยิ้มและหัวเราะโต้ตอบกับคนคุ้นเคย"],["ภาษา","ส่งเสียงอ้อแอ้และโต้ตอบเมื่อพูดด้วย"]],
 "7-9":[["ร่างกาย","นั่งได้มั่นคงขึ้นตามพัฒนาการ"],["ร่างกาย","ใช้มือหยิบจับและส่งของระหว่างมือ"],["สติปัญญา","ค้นหาสิ่งของที่มองเห็นว่าถูกซ่อนไว้บางส่วน"],["อารมณ์และสังคม","แสดงความสนใจต่อคนคุ้นเคย"],["ภาษา","หันเมื่อเรียกชื่อหรือได้ยินเสียงคุ้นเคย"]],
 "10-12":[["ร่างกาย","เคลื่อนที่เพื่อสำรวจสิ่งรอบตัว"],["ร่างกาย","ใช้นิ้วหยิบอาหารชิ้นเล็กที่เหมาะสม"],["สติปัญญา","เลียนแบบท่าทางง่าย ๆ"],["อารมณ์และสังคม","เล่นโต้ตอบกับผู้ดูแล"],["ภาษา","ใช้ท่าทางหรือเสียงเพื่อสื่อความต้องการ"]],
 "1-2":[["ร่างกาย","เดินและสำรวจพื้นที่อย่างระมัดระวัง"],["ร่างกาย","เริ่มใช้ช้อนหรือแก้วตามความสามารถ"],["สติปัญญา","ทำตามคำสั่งง่าย ๆ ที่คุ้นเคย"],["อารมณ์และสังคม","แสดงความต้องการและความรู้สึก"],["ภาษา","เริ่มใช้คำพูดเพื่อสื่อสาร"]],
 "2-3":[["ร่างกาย","วิ่งหรือปีนป่ายในพื้นที่ปลอดภัย"],["สติปัญญา","จับคู่หรือจัดกลุ่มสิ่งของง่าย ๆ"],["อารมณ์และสังคม","เริ่มเล่นใกล้หรือเล่นร่วมกับเด็กคนอื่น"],["ภาษา","พูดเป็นวลีหรือประโยคสั้น ๆ"],["ภาษา","ทำตามคำสั่งที่มี 2 ขั้นตอนในสถานการณ์คุ้นเคย"]],
 "3-4":[["ร่างกาย","กระโดดหรือทรงตัวในกิจกรรมเล่น"],["สติปัญญา","จดจำและจับคู่รูปทรงหรือสี"],["อารมณ์และสังคม","รอคอยและผลัดกันเล่นโดยมีผู้ช่วย"],["ภาษา","เล่าเรื่องสั้น ๆ จากประสบการณ์"],["ภาษา","ถามและตอบคำถามง่าย ๆ"]],
 "4-5":[["ร่างกาย","ใช้มือทำงานประณีต เช่น วาดหรือตัดตามวัย"],["สติปัญญา","นับจำนวนหรือเรียงลำดับง่าย ๆ"],["อารมณ์และสังคม","เข้าใจและพูดถึงความรู้สึกของตนเอง"],["ภาษา","เล่าเรื่องให้ผู้อื่นเข้าใจได้มากขึ้น"],["สติปัญญา","ทำกิจกรรมต่อเนื่องตามคำแนะนำ"]],
 "5-6":[["ร่างกาย","ทำกิจกรรมเคลื่อนไหวและประสานมือกับตา"],["สติปัญญา","แก้ปัญหาง่าย ๆ และอธิบายวิธีคิด"],["อารมณ์และสังคม","เล่นตามกติกาง่าย ๆ และทำงานร่วมกับผู้อื่น"],["ภาษา","สนทนาและเล่าเหตุการณ์เป็นลำดับ"],["สติปัญญา","เตรียมความพร้อมด้านการเรียนรู้ผ่านการเล่น"]]
};
const activities = [
 {e:"🪇",t:"เขย่าแล้วฟัง",a:"language",d:"เขย่าของเล่นที่ปลอดภัยเบา ๆ แล้วชวนลูกฟังและมองตาม",age:"เหมาะกับวัยทารกเมื่อมีผู้ดูแลใกล้ชิด"},
 {e:"🪞",t:"มองหน้าในกระจก",a:"social",d:"ชวนลูกมองภาพสะท้อน พูดคุย ยิ้ม และเรียกชื่ออวัยวะ",age:"ปรับตามวัยของเด็ก"},
 {e:"🧱",t:"ต่อบล็อก",a:"brain",d:"ชวนวางซ้อน เรียง หรือสร้างรูปทรงจากบล็อกชิ้นใหญ่",age:"เลือกขนาดที่ไม่เสี่ยงสำลัก"},
 {e:"⚽",t:"กลิ้งบอลหากัน",a:"body",d:"นั่งหันหน้าเข้าหากันแล้วกลิ้งบอลนุ่ม ๆ ไปมา",age:"มีผู้ใหญ่ดูแลและใช้พื้นที่ปลอดภัย"},
 {e:"📚",t:"อ่านภาพเล่าเรื่อง",a:"language",d:"ชี้ภาพ ตั้งคำถาม และรอให้ลูกตอบด้วยเสียงหรือคำพูด",age:"เลือกหนังสือเหมาะกับวัย"},
 {e:"🎨",t:"ศิลปะสีสัน",a:"brain",d:"วาดภาพหรือระบายสีด้วยอุปกรณ์ที่ไม่เป็นพิษและเหมาะกับวัย",age:"ดูแลใกล้ชิดตลอดกิจกรรม"},
 {e:"🤝",t:"ผลัดกันเล่น",a:"social",d:"เล่นส่งของหรือเกมง่าย ๆ เพื่อฝึกการรอคอยและการโต้ตอบ",age:"ปรับกติกาตามวัย"},
 {e:"🦶",t:"เดินตามเส้นทาง",a:"body",d:"สร้างเส้นทางง่าย ๆ บนพื้นไม่ลื่นให้ลูกเดินหรือก้าวข้าม",age:"เหมาะกับเด็กที่เดินได้และมีผู้ดูแล"}
];
function persist(){localStorage.setItem(KEY,JSON.stringify(state))}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2300)}
function ageText(date){if(!date)return "เพิ่มวันเกิดเพื่อดูช่วงวัยของลูก";const d=new Date(date+"T00:00:00");if(Number.isNaN(d.getTime())||d>new Date())return "กรุณาตรวจสอบวันเกิด";const now=new Date();let m=(now.getFullYear()-d.getFullYear())*12+now.getMonth()-d.getMonth();if(now.getDate()<d.getDate())m--;if(m<0)return "กรุณาตรวจสอบวันเกิด";return m<24?`อายุประมาณ ${m} เดือน`:`อายุประมาณ ${Math.floor(m/12)} ปี ${m%12} เดือน`}
function loadProfile(){ $("childName").value=state.name||"";$("birthDate").value=state.birth||"";$("ageText").textContent=ageText(state.birth)}
function saveProfile(){state.name=$("childName").value.trim();state.birth=$("birthDate").value;persist();loadProfile();toast("บันทึกโปรไฟล์แล้ว 💚")}
function renderMilestones(){const list=milestones[$("ageStage").value]||[];$("milestoneList").innerHTML=list.map((x,i)=>`<label class="milestone-item"><input type="checkbox" data-milestone="${i}"><span><b>${x[0]} — ${x[1]}</b><small>ทำเครื่องหมายเมื่อสังเกตเห็นพฤติกรรมนี้</small></span></label>`).join("");}
function renderActivities(){const f=$("activityArea").value;const list=activities.filter(x=>f==="all"||x.a===f);$("activityList").innerHTML=list.map(x=>`<article class="activity-card"><div class="activity-emoji">${x.e}</div><b>${x.t}</b><p>${x.d}</p><small>${x.age}</small></article>`).join("")}
function renderGrowth(){const records=state.growth||[];$("growthRecords").innerHTML=records.length?records.slice().reverse().map(r=>`<div class="record"><span><b>${r.date}</b><br>น้ำหนัก ${r.weight||"—"} กก. · ส่วนสูง ${r.height||"—"} ซม.</span><strong>รอบศีรษะ ${r.head||"—"} ซม.</strong></div>`).join(""):'<p class="muted">ยังไม่มีข้อมูล ลองบันทึกข้อมูลการเติบโตครั้งแรก</p>'}
function showTab(id){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===id));window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.go)));
$("saveProfile").addEventListener("click",saveProfile);$("editChild").addEventListener("click",()=>{showTab("home");$("childName").focus()});
$("birthDate").addEventListener("change",()=>{$("ageText").textContent=ageText($("birthDate").value)});
$("ageStage").addEventListener("change",renderMilestones);$("activityArea").addEventListener("change",renderActivities);
$("growthForm").addEventListener("submit",e=>{e.preventDefault();const r={date:$("measureDate").value,weight:$("weight").value,height:$("height").value,head:$("head").value};if(!r.date||(!r.weight&&!r.height&&!r.head)){toast("กรุณากรอกวันที่และข้อมูลอย่างน้อย 1 รายการ");return}state.growth.push(r);persist();renderGrowth();e.target.reset();$("measureDate").value=new Date().toISOString().slice(0,10);toast("บันทึกการเติบโตแล้ว")});
$("exportData").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kidswise-my-data.json";a.click();URL.revokeObjectURL(a.href)});
$("clearData").addEventListener("click",()=>{if(confirm("ต้องการลบข้อมูล KIDSWISE ที่บันทึกไว้ในเบราว์เซอร์นี้หรือไม่?")){localStorage.removeItem(KEY);location.reload()}});
$("notifyBtn").addEventListener("click",()=>toast("ระบบแจ้งเตือนจะเปิดให้ใช้ในเวอร์ชันถัดไป"));
$("todayDate").textContent=new Intl.DateTimeFormat("th-TH",{dateStyle:"medium"}).format(new Date());
$("measureDate").value=new Date().toISOString().slice(0,10);
loadProfile();renderMilestones();renderActivities();renderGrowth();initAuth();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
