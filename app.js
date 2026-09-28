/* ================= DATA ================= */
const SPECIES = [
  {id:'elephant', name:'African Elephant', emoji:'🐘', season:[88,92,85,70,52,38,30,28,34,48,66,80], peak:'Dec – Mar'},
  {id:'kob',      name:'Kob Antelope',     emoji:'🦌', season:[70,72,68,62,58,55,50,52,56,60,64,68], peak:'Nov – Mar'},
  {id:'buffalo',  name:'African Buffalo',  emoji:'🐃', season:[62,60,58,55,50,44,40,42,46,52,56,60], peak:'Dec – Feb'},
  {id:'baboon',   name:'Olive Baboon',     emoji:'🐒', season:[75,75,72,70,68,66,64,64,66,70,72,74], peak:'All year'},
  {id:'warthog',  name:'Warthog',          emoji:'🐗', season:[68,66,64,60,56,52,48,50,54,58,62,66], peak:'Nov – Feb'},
  {id:'crocodile',name:'W.A. Crocodile',   emoji:'🐊', season:[80,84,78,64,50,36,30,28,34,46,62,74], peak:'Dec – Mar'},
];
const ZONES = {
  waterholes:'Waterhole Flats', samole:'Samole Loop', konkori:'Konkori Escarpment',
  brugbani:'Brugbani Plains', lovi:'Lovi Corridor', airstrip:'Airstrip Grasslands'
};
/* likelihood[species][zone] = [morning, afternoon, evening] */
const L = {
  elephant:{waterholes:[82,64,38], samole:[56,41,30], konkori:[34,28,22], brugbani:[22,18,14], lovi:[48,39,39], airstrip:[18,14,10]},
  kob:{waterholes:[45,38,30], samole:[74,58,52], konkori:[26,20,24], brugbani:[52,40,44], lovi:[30,26,28], airstrip:[68,55,60]},
  buffalo:{waterholes:[34,26,20], samole:[38,30,34], konkori:[18,14,16], brugbani:[58,44,48], lovi:[52,40,46], airstrip:[24,20,26]},
  baboon:{waterholes:[60,55,48], samole:[42,38,34], konkori:[76,62,58], brugbani:[20,16,14], lovi:[34,30,26], airstrip:[36,30,26]},
  warthog:{waterholes:[58,46,38], samole:[62,50,44], konkori:[30,24,20], brugbani:[36,28,24], lovi:[26,22,18], airstrip:[70,56,48]},
  crocodile:{waterholes:[78,72,60], samole:[8,6,6], konkori:[6,5,5], brugbani:[7,6,5], lovi:[64,58,50], airstrip:[9,7,6]},
};
const TIMES = {morning:0, afternoon:1, evening:2};

let curSpecies = 'elephant';
let curTime = 'morning';
let curZone = null;

const $ = id => document.getElementById(id);

/* ================= toast ================= */
let toastTimer;
function toast(msg){
  $('toastMsg').textContent = msg;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>$('toast').classList.remove('show'), 3200);
}

/* ================= date ================= */
const now = new Date();
$('boardDate').textContent = now.toLocaleDateString('en-GB',{weekday:'long', day:'numeric', month:'long', year:'numeric'});
const bkDate = $('bkDate');
bkDate.valueAsDate = new Date(now.getTime() + 86400000*3);

/* ================= hero board ================= */
function topSightings(time){
  const t = TIMES[time];
  const best = SPECIES.map(s=>{
    let bz=null, bv=-1;
    for(const z in L[s.id]){ if(L[s.id][z][t] > bv){bv=L[s.id][z][t]; bz=z;} }
    return {s, zone:bz, val:bv};
  }).sort((a,b)=>b.val-a.val);
  /* pick top 3 distinct zones for variety */
  const picked=[], zonesUsed=new Set();
  for(const b of best){ if(!zonesUsed.has(b.zone)){picked.push(b); zonesUsed.add(b.zone);} if(picked.length===3) break; }
  return picked;
}
function accent(v){ return v>=75 ? '#C75B2A' : v>=55 ? '#E0A32E' : '#9DB48A'; }
function renderBoard(){
  const grid = $('boardGrid');
  grid.innerHTML = '';
  topSightings('morning').forEach((b,i)=>{
    const card = document.createElement('div');
    card.className='fcast-card';
    card.style.setProperty('--card-accent', accent(b.val));
    card.innerHTML = `
      <div class="fcast-top"><span class="fcast-emoji">${b.s.emoji}</span><span class="fcast-pct">${b.val}<small>%</small></span></div>
      <div class="fcast-name">${b.s.name}</div>
      <div class="fcast-meta">Best spot: ${ZONES[b.zone]} · morning</div>
      <div class="fcast-bar"><i data-w="${b.val}"></i></div>`;
    grid.appendChild(card);
    setTimeout(()=>{ card.querySelector('.fcast-bar i').style.width = b.val+'%'; }, 300+i*150);
  });
}
renderBoard();

/* ================= species chips ================= */
const chipsEl = $('speciesChips');
SPECIES.forEach(s=>{
  const b = document.createElement('button');
  b.className = 'sp-chip' + (s.id===curSpecies?' active':'');
  b.innerHTML = `<span>${s.emoji}</span> ${s.name}`;
  b.onclick = ()=>{
    curSpecies = s.id;
    chipsEl.querySelectorAll('.sp-chip').forEach(c=>c.classList.remove('active'));
    b.classList.add('active');
    paintMap();
  };
  chipsEl.appendChild(b);
});

/* ================= time toggle ================= */
$('timeToggle').querySelectorAll('.time-btn').forEach(b=>{
  b.onclick = ()=>{
    curTime = b.dataset.time;
    $('timeToggle').querySelectorAll('.time-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    paintMap();
  };
});

/* ================= map ================= */
function bucketColor(v){
  if(v>=75) return {fill:'#C75B2A', hot:true};
  if(v>=55) return {fill:'#E0A32E', hot:false};
  if(v>=30) return {fill:'#E7C878', hot:false};
  return {fill:'#E4E0C8', hot:false};
}
function paintMap(){
  const t = TIMES[curTime];
  const sp = SPECIES.find(s=>s.id===curSpecies);
  let bz=null, bv=-1;
  document.querySelectorAll('#parkMap .zone').forEach(g=>{
    const z = g.dataset.zone;
    const v = L[curSpecies][z][t];
    if(v>bv){bv=v;bz=z;}
    const {fill,hot} = bucketColor(v);
    g.querySelector('path').style.fill = fill;
    g.querySelector('.z-pct').textContent = v + '%';
    g.classList.toggle('hot', hot);
  });
  $('bestBet').innerHTML = `${sp.emoji} Best bet for the <b>${sp.name}</b> this ${curTime}: <b>${ZONES[bz]} — ${bv}%</b>`;
  if(curZone) renderZonePanel(curZone);
}
function renderZonePanel(zone){
  curZone = zone;
  document.querySelectorAll('#parkMap .zone').forEach(g=>g.classList.toggle('selected', g.dataset.zone===zone));
  const t = TIMES[curTime];
  $('zpKicker').textContent = 'Zone forecast · ' + curTime;
  $('zpName').textContent = ZONES[zone];
  $('zpSub').textContent = 'Likelihood of sighting each species in this zone, based on recent guide logs and seasonal patterns.';
  const rows = SPECIES.map(s=>({s, v:L[s.id][zone][t]})).sort((a,b)=>b.v-a.v);
  const maxV = rows[0].v;
  $('zpRows').innerHTML = rows.map(r=>`
    <div class="zp-row ${r.v===maxV?'top':''}">
      <span style="font-size:1.15rem">${r.s.emoji}</span>
      <div>
        <div class="zp-label"><span>${r.s.name}</span></div>
        <div class="zp-bar"><i style="width:0"></i></div>
      </div>
      <span class="zp-val">${r.v}%</span>
    </div>`).join('');
  requestAnimationFrame(()=>{
    $('zpRows').querySelectorAll('.zp-row').forEach((row,i)=>{
      setTimeout(()=>{ row.querySelector('.zp-bar i').style.width = rows[i].v+'%'; }, 60);
    });
  });
}
document.querySelectorAll('#parkMap .zone').forEach(g=>{
  g.addEventListener('click', ()=>renderZonePanel(g.dataset.zone));
  g.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();renderZonePanel(g.dataset.zone);} });
});
paintMap();
renderZonePanel('waterholes');

/* ================= seasonal calendar ================= */
function seasonColor(v){
  if(v>=75) return '#C75B2A';
  if(v>=60) return '#E0A32E';
  if(v>=45) return '#E7C878';
  return 'rgba(246,239,224,.12)';
}
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
$('seasonRows').innerHTML = SPECIES.map(s=>`
  <div class="season-row">
    <span class="season-name">${s.emoji} <span class="sn-text">${s.name}</span></span>
    ${s.season.map((v,i)=>`<span class="season-cell" style="background:${seasonColor(v)}" title="${MONTHS[i]}: ${v}% typical odds"></span>`).join('')}
    <span class="season-peak">${s.peak}</span>
  </div>`).join('');

/* ================= booking ================= */
$('slotChips').querySelectorAll('.slot-chip').forEach(c=>{
  c.onclick=()=>{
    $('slotChips').querySelectorAll('.slot-chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
  };
});
$('bkBtn').onclick = ()=> toast('Demo only — in production this reserves your walk with the park office.');

/* ================= guide logging ================= */
let logSpecies = 'elephant', logCount = 3;
const lsEl = $('logSpecies');
SPECIES.forEach(s=>{
  const b=document.createElement('button');
  b.className='sp-btn'+(s.id===logSpecies?' active':'');
  b.innerHTML=`<span class="e">${s.emoji}</span><span class="n">${s.name.split(' ').pop()}</span>`;
  b.onclick=()=>{
    logSpecies=s.id;
    lsEl.querySelectorAll('.sp-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
  };
  lsEl.appendChild(b);
});
const zoneSel=$('logZone');
Object.entries(ZONES).forEach(([k,v])=>{
  const o=document.createElement('option'); o.value=k; o.textContent=v; zoneSel.appendChild(o);
});
zoneSel.value='samole';
$('countMinus').onclick=()=>{ if(logCount>1){logCount--; $('countVal').textContent=logCount;} };
$('countPlus').onclick=()=>{ if(logCount<99){logCount++; $('countVal').textContent=logCount;} };

const GUIDE_NAMES=['Guide K. Mahama','Ranger A. Ziblim','Guide E. Nakpaa','Ranger S. Adongo','Guide M. Issahaku'];
const seedFeed=[
  {sp:'elephant', zone:'waterholes', n:4, time:'06:48', guide:'Guide K. Mahama'},
  {sp:'kob', zone:'samole', n:12, time:'07:15', guide:'Ranger A. Ziblim'},
  {sp:'baboon', zone:'konkori', n:9, time:'07:32', guide:'Guide E. Nakpaa'},
  {sp:'crocodile', zone:'waterholes', n:2, time:'08:04', guide:'Ranger S. Adongo'},
  {sp:'warthog', zone:'airstrip', n:5, time:'08:21', guide:'Guide M. Issahaku'},
];
function feedItem({sp,zone,n,time,guide}, fresh=false){
  const s=SPECIES.find(x=>x.id===sp);
  const d=document.createElement('div');
  d.className='feed-item';
  d.innerHTML=`
    <span class="fe">${s.emoji}</span>
    <span class="ft"><b>${n} × ${s.name}</b><span>${ZONES[zone]} · ${guide}</span>
    ${fresh?'<span class="delay-badge">visible to visitors after 2h delay</span>':''}</span>
    <span class="fm">${time}</span>`;
  return d;
}
const feedEl=$('feed');
seedFeed.slice().reverse().forEach(f=>feedEl.appendChild(feedItem(f)));
$('logBtn').onclick=()=>{
  const t=new Date();
  const time=String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');
  feedEl.prepend(feedItem({sp:logSpecies, zone:zoneSel.value, n:logCount, time, guide:'You (demo guide)'}, true));
  toast('Sighting logged! Tomorrow\'s forecast just got a little smarter.');
};

/* ================= passport ================= */
const passportStamps=[
  {sp:'elephant', short:'Elephant', got:true, date:'14 Sep'},
  {sp:'kob', short:'Kob', got:true, date:'14 Sep'},
  {sp:'baboon', short:'Baboon', got:true, date:'15 Sep'},
  {sp:'warthog', short:'Warthog', got:true, date:'15 Sep'},
  {sp:'crocodile', short:'Crocodile', got:true, date:'16 Sep'},
  {sp:'buffalo', short:'Buffalo', got:false},
  {short:'Roan', emoji:'🫎', got:false},
  {short:'Hornbill', emoji:'🦅', got:false},
];
$('stamps').innerHTML = passportStamps.map((st,i)=>{
  const s = st.sp ? SPECIES.find(x=>x.id===st.sp) : st;
  const rot = [-5,4,-3,6,-6,3,-4,5][i];
  return `<div class="stamp ${st.got?'got':''}" style="--rot:${rot}deg">
    <span class="se">${s.emoji}</span>
    <span class="sn">${st.short}</span>
    ${st.got?`<span class="sd">${st.date}</span>`:'<span class="sd" style="opacity:.5">not yet</span>'}
  </div>`;
}).join('');
$('shareBtn').onclick=()=>toast('Demo only — in production this shares your passport card to WhatsApp, Instagram or X.');

/* ================= scroll behaviour ================= */
const nav=$('nav');
addEventListener('scroll', ()=>nav.classList.toggle('scrolled', scrollY>40), {passive:true});

const io=new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      if(e.target.querySelector && e.target.querySelector('#ppBar')) $('ppBar').style.width='62.5%';
      io.unobserve(e.target);
    }
  });
},{threshold:.15});
document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));
