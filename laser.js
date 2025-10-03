'use strict';
const V={cover:document.getElementById('view-cover'),duo:document.getElementById('view-duo'),
         course:document.getElementById('view-course'),summary:document.getElementById('view-summary')};
function show(name){Object.values(V).forEach(v=>v.classList.add('hidden'));V[name].classList.remove('hidden');}
document.getElementById('btnStart').onclick=()=>show('duo');

const S={prenom:'',nom:'',classe:'',sexe:'',dureeMin:0,tourM:0,laps:0,frac:0,totalShootMs:0,shots:[],shooting:false,shootStart:0};

document.getElementById('goCourse').onclick=()=>{
  S.prenom=document.getElementById('prenom').value;
  S.nom=document.getElementById('nom').value;
  S.classe=document.getElementById('classe').value;
  S.sexe=document.getElementById('sexe').value;
  S.dureeMin=+document.getElementById('duree_min').value;
  S.tourM=+document.getElementById('tour_m').value;
  document.getElementById('runnerTitle').textContent=`Course — ${S.prenom} ${S.nom}`;
  show('course');
};

let gStart=0,gElapsed=0,gTimer=null;
function fmt(ms){const cs=Math.floor(ms/100);const m=Math.floor(cs/600),s=Math.floor((cs%600)/10),d=cs%10;return `${m<10?'0':''}${m}:${s<10?'0':''}${s}.${d}`;}
function tickGeneral(){const t=Date.now()-gStart+gElapsed;document.getElementById('clockGeneral').textContent=fmt(t);}
function startGeneral(){if(gTimer) return;gStart=Date.now();gTimer=setInterval(tickGeneral,100);}
function pauseGeneral(){if(!gTimer)return;clearInterval(gTimer);gTimer=null;gElapsed+=Date.now()-gStart;}
function resetGeneral(){if(gTimer){clearInterval(gTimer);gTimer=null;}gElapsed=0;document.getElementById('clockGeneral').textContent='00:00.0';}
document.getElementById('btnStartAll').onclick=startGeneral;
document.getElementById('btnPauseAll').onclick=pauseGeneral;
document.getElementById('btnResetAll').onclick=resetGeneral;

document.getElementById('lapPlus').onclick=()=>{S.laps++;document.getElementById('laps').textContent=S.laps;};
document.getElementById('lapMinus').onclick=()=>{S.laps=Math.max(0,S.laps-1);document.getElementById('laps').textContent=S.laps;};

function startShoot(){if(S.shooting)return;S.shooting=true;S.shootStart=Date.now();
 document.querySelectorAll('#ledBtns [data-led]').forEach(b=>b.disabled=false);
 document.getElementById('btnStartShoot').disabled=true;
 document.getElementById('shootIndicator').className='shoot-indicator shoot-green';
}
function validateShoot(leds){if(!S.shooting)return;const ms=Date.now()-S.shootStart;S.totalShootMs+=ms;
 S.shots.push({n:S.shots.length+1,leds,ms});renderShots();S.shooting=false;S.shootStart=0;
 document.querySelectorAll('#ledBtns [data-led]').forEach(b=>b.disabled=true);
 document.getElementById('btnStartShoot').disabled=false;
 document.getElementById('shootIndicator').className='shoot-indicator shoot-red';
}
function renderShots(){const tb=document.getElementById('shotsTable');tb.innerHTML='';
 S.shots.forEach(s=>{const tr=document.createElement('tr');
 tr.innerHTML=`<td>${s.n}</td><td>${s.leds}</td><td>${(s.ms/1000).toFixed(1)}</td><td><button>Retirer</button></td>`;
 tr.querySelector('button').onclick=()=>{S.totalShootMs-=s.ms;S.shots=S.shots.filter(x=>x.n!==s.n).map((x,i)=>({n:i+1,leds:x.leds,ms:x.ms}));renderShots();};
 tb.appendChild(tr);});}
document.getElementById('btnStartShoot').onclick=startShoot;
document.querySelectorAll('#ledBtns [data-led]').forEach(b=>b.addEventListener('click',()=>validateShoot(+b.dataset.led)));

function ledCounts(){const c=[0,0,0,0,0,0];S.shots.forEach(s=>{c[s.leds]++;});return c;}
document.getElementById('finish').onclick=()=>{
 const dist=Math.round((S.laps+S.frac)*S.tourM);const c=ledCounts();
 const payload=[{nom:S.nom,prenom:S.prenom,classe:S.classe,sexe:S.sexe,distance:dist,tps_pas_de_tir:(S.totalShootMs/1000).toFixed(1),
  nb_led_0:c[0],nb_led_1:c[1],nb_led_2:c[2],nb_led_3:c[3],nb_led_4:c[4],nb_led_5:c[5]}];
 const text=JSON.stringify(payload);show('summary');
 document.getElementById('qrText').textContent=text;const qrHost=document.getElementById('qr');qrHost.innerHTML='';
 new QRCode(qrHost,{text:text,width:256,height:256});
};