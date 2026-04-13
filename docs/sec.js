(() => {

const $ = id => document.getElementById(id);
const HISTORY_KEY="SCZN3_SEC_HISTORY_V1";
const MAX=6;

function dirArrow(d){return {UP:"↑",DOWN:"↓",LEFT:"←",RIGHT:"→"}[d]||""}
function dirWord(d){return {UP:"UP",DOWN:"DN",LEFT:"LT",RIGHT:"RT"}[d]||""}

function tutorial(score,e,w){
  const d=[dirWord(e),dirWord(w)].filter(Boolean).join(" and ");
  if(score>=99) return "Zero confirmed — maintain hold";
  if(score>=90) return `Hold steady ${d}`;
  if(score>=60) return `Refine aim ${d}`;
  return `Shift impacts ${d}`;
}

function render(p){

  $("scoreValue").textContent=Math.round(p.score||0);

  $("corrClicksInline").textContent=
    `${p.elevation.clicks}${dirArrow(p.elevation.dir)} ${p.windage.clicks}${dirArrow(p.windage.dir)}`;

  $("sessionMeta").textContent=
    `${p.distance||0} yds • ${p.shots||0} hits`;

  // ✅ THUMBNAIL LOAD
  const imgData = localStorage.getItem("SCZN3_TARGET_IMG_DATAURL_V1");
  if(imgData){
    $("thumbImg").src = imgData;
    $("thumbWrap").classList.remove("hidden");
  }

  saveHistory(p);
  drawHistory();
}

function saveHistory(p){
  let h=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
  h.unshift({
    s:Math.round(p.score),
    d:p.distance,
    h:p.shots,
    ec:p.elevation.clicks,
    ed:p.elevation.dir,
    wc:p.windage.clicks,
    wd:p.windage.dir,
    t:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false})
  });
  localStorage.setItem(HISTORY_KEY,JSON.stringify(h.slice(0,MAX)));
}

function drawHistory(){
  const h=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
  let html="";

  h.forEach((x,i)=>{
    html+=`
    <div class="historyCell">
      <div><span class="historyIndex">${String(i+1).padStart(2,"0")}.</span> ${x.s} | ${x.d} | ${x.h}</div>
      <div>${x.ec}${dirArrow(x.ed)} ${x.wc}${dirArrow(x.wd)} ${x.t}</div>
      <div>${tutorial(x.s,x.ed,x.wd)}</div>
    </div>`;
  });

  $("historyGrid").innerHTML=html;
}

const payload=JSON.parse(localStorage.getItem("SCZN3_SEC_PAYLOAD_V1")||"{}");

if(payload.score!=null){
  render(payload);
}

})();
