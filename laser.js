'use strict';
// ===== Navigation
const V={cover:document.getElementById('view-cover'),duo:document.getElementById('view-duo'),
         course:document.getElementById('view-course'),summary:document.getElementById('view-summary')};
function show(name){Object.values(V).forEach(v=>v.classList.add('hidden'));V[name].classList.remove('hidden');window.scrollTo(0,0);}
document.getElementById('btnStart').onclick=()=>show('duo');
document.getElementById('goHome').onclick=()=>show('cover');

// ===== Validation simple
const REQ=['prenom','nom','classe','duree_min','tour_m'];
function val(id){return (document.getElementById(id).value||'').trim();}
function okNumber(v,min){const n=+v;return Number.isFinite(n)&&n>=min;}
function validateForm(){
  let ok=true;REQ.forEach(id=>{const el=document.getElementById(id);let good=!!val(id);if(id==='duree_min') good=okNumber(val(id),1);if(id==='tour_m') good=okNumber(val(id),10);el.style.borderColor=good?'#e5e7eb':'#ef4444';ok=ok&&good;});
  document.getElementById('goCourse').disabled=!ok;return ok;
}
REQ.forEach(id=>['input','change'].forEach(ev=>document.getElementById(id).addEventListener(ev,validateForm)));

// ===== État séance
const S={prenom:'',nom:'',classe:'',dureeMin:0,tourM:0,laps:0,frac:0,totalShootMs:0,shots:[],gTimer:null,shooting:false,shootStart:0};
function fmt(ms){const cs=Math.floor(ms/100);const m=Math.floor(cs/600),s=Math.floor((cs%600)/10),d=cs%10;return `${m<10?'0':''}${m}:${s<10?'0':''}${s}.${d}`;}
function sec(ms){return Math.round(ms/100)/10;}
function updateDistance(){const meters=Math.round((S.laps+S.frac)*S.tourM);document.getElementById('distanceOut').textContent=`Distance: ${meters} m (${S.laps} tours + ${S.frac} tour)`;}
function paintHeader(){document.getElementById('runnerTitle').textContent=`Course — ${S.prenom} ${S.nom}`;document.getElementById('target').textContent=S.dureeMin;document.getElementById('lapMeters').textContent=S.tourM;}

// ===== Entrée dans la course
document.getElementById('goCourse').onclick=()=>{
  if(!validateForm()){alert('Compléter tous les champs.');return;}
  S.prenom=val('prenom');S.nom=val('nom');S.classe=val('classe');S.dureeMin=+val('duree_min');S.tourM=+val('tour_m');
  S.laps=0;S.frac=0;S.totalShootMs=0;S.shots=[];S.gTimer=null;S.shooting=false;S.shootStart=0;document.getElementById('laps').textContent='0';
  document.getElementById('shotsTable').innerHTML='';document.getElementById('clockGeneral').textContent='00:00.0';
  paintHeader();
  document.getElementById('btnStartAll').disabled=false;
  document.getElementById('btnPauseAll').disabled=true;
  document.getElementById('btnResetAll').disabled=true;
  document.getElementById('btnStartShoot').disabled=true;
  document.querySelectorAll('#ledBtns [data-led]').forEach(b=>b.disabled=true);
  document.getElementById('endCard').classList.add('hidden');
  document.getElementById('shootIndicator').className='shoot-indicator shoot-red';
  show('course');
};

// ===== Chrono général simple
let gStart=0, gElapsed=0;
function tickGeneral(){const t=Date.now()-gStart+gElapsed;document.getElementById('clockGeneral').textContent=fmt(t);const m=Math.floor(t/60000);if(m>=S.dureeMin){stopGeneral();showEnd();}}
function startGeneral(){if(S.gTimer) return;gStart=Date.now();S.gTimer=setInterval(tickGeneral,100);document.getElementById('btnStartAll').disabled=true;document.getElementById('btnPauseAll').disabled=false;document.getElementById('btnResetAll').disabled=false;document.getElementById('btnStartShoot').disabled=false;}
function pauseGeneral(){if(!S.gTimer) return;clearInterval(S.gTimer);S.gTimer=null;gElapsed+=Date.now()-gStart;document.getElementById('btnStartAll').disabled=false;document.getElementById('btnPauseAll').disabled=true;}
function stopGeneral(){if(S.gTimer){clearInterval(S.gTimer);S.gTimer=null;}gElapsed+=Date.now()-gStart;document.getElementById('btnPauseAll').disabled=true;}
function resetGeneral(){stopGeneral();gElapsed=0;document.getElementById('clockGeneral').textContent='00:00.0';document.getElementById('btnResetAll').disabled=true;document.getElementById('btnStartShoot').disabled=true;document.getElementById('btnStartAll').disabled=false;}

document.getElementById('btnStartAll').onclick=startGeneral;
document.getElementById('btnPauseAll').onclick=pauseGeneral;
document.getElementById('btnResetAll').onclick=resetGeneral;

// ===== Tir : chrono caché + feu rouge/vert
function startShoot(){ if(S.shooting) return; S.shooting=true; S.shootStart=Date.now();
  document.querySelectorAll('#ledBtns [data-led]').forEach(b=>b.disabled=false);
  document.getElementById('btnStartShoot').disabled=true;
  document.getElementById('shootIndicator').className='shoot-indicator shoot-green';
}
function validateShoot(leds){ if(!S.shooting) return; const ms=Date.now()-S.shootStart; S.totalShootMs+=ms;
  S.shots.push({n:S.shots.length+1, leds, ms}); renderShots(); S.shooting=false; S.shootStart=0;
  document.querySelectorAll('#ledBtns [data-led]').forEach(b=>b.disabled=true);
  document.getElementById('btnStartShoot').disabled=false;
  document.getElementById('shootIndicator').className='shoot-indicator shoot-red';
}
function renderShots(){ const tb=document.getElementById('shotsTable'); tb.innerHTML='';
  S.shots.forEach(s=>{ const tr=document.createElement('tr');
    tr.innerHTML=`<td>${s.n}</td><td>${s.leds}</td><td>${sec(s.ms)}</td><td><button class="b-red">Retirer</button></td>`;
    tr.querySelector('button').onclick=()=>{ S.totalShootMs-=s.ms; S.shots=S.shots.filter(x=>x.n!==s.n).map((x,i)=>({n:i+1,leds:x.leds,ms:x.ms})); renderShots(); };
    tb.appendChild(tr);
  });
}
document.getElementById('btnStartShoot').onclick=startShoot;
document.querySelectorAll('#ledBtns [data-led]').forEach(b=> b.addEventListener('click',()=> validateShoot(+b.dataset.led)));

// ===== Tours & fin
document.getElementById('lapPlus').onclick=()=>{S.laps++;document.getElementById('laps').textContent=S.laps;updateDistance();};
document.getElementById('lapMinus').onclick=()=>{S.laps=Math.max(0,S.laps-1);document.getElementById('laps').textContent=S.laps;updateDistance();};
function showEnd(){document.getElementById('endCard').classList.remove('hidden');updateDistance();}
document.querySelectorAll('#endCard [data-frac]').forEach(b=> b.addEventListener('click',()=>{S.frac=+b.dataset.frac;updateDistance();}));

// ===== QR (sans vitesse, avec compteurs 0..5 et tps pas de tir)
function ledCounts(){const c=[0,0,0,0,0,0];S.shots.forEach(s=>{c[s.leds]++;});return c;}
document.getElementById('finish').onclick=()=>{
  const dist=Math.round((S.laps+S.frac)*S.tourM); const c=ledCounts();
  const payload=[{nom:S.nom,prenom:S.prenom,classe:S.classe,distance:dist,
    tps_pas_de_tir: Math.round(S.totalShootMs/100)/10,
    nb_led_0:c[0],nb_led_1:c[1],nb_led_2:c[2],nb_led_3:c[3],nb_led_4:c[4],nb_led_5:c[5]}];
  const text=JSON.stringify(payload);
  show('summary'); document.getElementById('qrText').textContent=text;
  const qrHost=document.getElementById('qr'); qrHost.innerHTML=''; new QRCode(qrHost,{text:text,width:256,height:256});
};
