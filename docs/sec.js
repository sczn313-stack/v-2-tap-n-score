(() => {

const $ = id => document.getElementById(id);

const HISTORY_KEY = "SCZN3_SEC_HISTORY_V1";
const MAX = 6;

function dirArrow(d){
  return {UP:"↑",DOWN:"↓",LEFT:"←",RIGHT:"→"}[d]||"";
}

function dirWord(d){
  return {UP:"UP",DOWN:"DN",LEFT:"LT",RIGHT:"RT"}[d]||"";
}

function tutorial(score, e, w){
  const dirs = [dirWord(e), dirWord(w)].filter(Boolean).join(" and ");
  if(score>=99) return "Zero confirmed — maintain hold";
  if(score>=90) return `Hold steady ${dirs}`;
  if(score>=60) return `Refine aim ${dirs}`;
  return `Shift impacts ${dirs}`;
}

function render(payload){

  $("scoreValue").textContent = Math.round(payload.score||0);

  $("corrClicksInline").textContent =
    `${payload.elevation.clicks}${dirArrow(payload.elevation.dir)} ${payload.windage.clicks}${dirArrow(payload.windage.dir)}`;

  $("sessionMeta").textContent =
    `${payload.distance||0} yds • ${payload.shots||0} hits`;

  saveHistory(payload);
  drawHistory();
}

function saveHistory(p){
  let h = JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
  h.unshift({
    score:Math.round(p.score),
    d:p.distance,
    h:p.shots,
    ec:p.elevation.clicks,
    ed:p.elevation.dir,
    wc:p.windage.clicks,
    wd:p.windage.dir,
    t:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false})
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0,MAX)));
}

function drawHistory(){
  const grid = $("historyGrid");
  const h = JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");

  let html="";

  h.forEach((x,i)=>{
    html += `
    <div class="historyCell">
      <div class="historyTop">
        <span class="historyIndex">${String(i+1).padStart(2,"0")}.</span>
        ${x.score} | ${x.d} | ${x.h}
      </div>
      <div class="historyBottom">
        ${x.ec}${dirArrow(x.ed)} ${x.wc}${dirArrow(x.wd)} &nbsp; ${x.t}
      </div>
      <div class="historyTutorial">
        ${tutorial(x.score,x.ed,x.wd)}
      </div>
    </div>`;
  });

  grid.innerHTML = html;
}

const payload = JSON.parse(localStorage.getItem("SCZN3_SEC_PAYLOAD_V1")||"{}");

if(payload && payload.score!=null){
  render(payload);
}

})();
