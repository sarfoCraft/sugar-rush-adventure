// Sugar Rush free rewards: browser-only preview. Production must validate on server.
(() => {
  const $bonus = id => document.getElementById(id);
  const KEY = "sugarRushBonusV2";
  const PERIOD = 3 * 60 * 60 * 1000;
  const DAILY = [500,1000,1500,2000,3000,4000,10000];
  const utcDay = (ms=Date.now()) => new Date(ms).toISOString().slice(0,10);
  const weekKey = (ms=Date.now()) => {
    const d=new Date(ms);const day=d.getUTCDay();d.setUTCDate(d.getUTCDate() - ((day+6)%7));return utcDay(d.getTime());
  };
  let data;
  try {data=JSON.parse(localStorage.getItem(KEY))||{}} catch {data={}}
  if (!data || typeof data!=="object") data={};
  function store(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}}
  const api = window.SugarRush;
  if (!api || typeof api.getBonusSnapshot !== "function" || typeof api.grantDemoBonus !== "function") return;
  const snapshot = () => api.getBonusSnapshot();
  function coins(n){return api.grantDemoBonus(n)}
  function resetCycle(){
    const now=Date.now();
    if(!Number.isFinite(data.cycleStart)||data.cycleStart>now||now-data.cycleStart>=PERIOD){
      data.cycleStart=now;data.claims=0;store();
    }
  }
  function eventProgress(){
    return snapshot().completedLevels.length;
  }
  function render(){
    if(!$bonus("freeCoinClaim"))return;
    resetCycle();
    const cloudMode = snapshot().cloudMode;
    const remaining=Math.max(0,5-(data.claims||0));
    const seconds=Math.max(0,Math.ceil((data.cycleStart+PERIOD-Date.now())/1000));
    const hh=String(Math.floor(seconds/3600)).padStart(2,"0"),mm=String(Math.floor(seconds%3600/60)).padStart(2,"0"),ss=String(seconds%60).padStart(2,"0");
    $bonus("freeCoinStatus").textContent=`${remaining}/5 claims left · reset ${hh}:${mm}:${ss}`;
    $bonus("freeCoinClaim").disabled=!remaining || cloudMode;
    if (cloudMode) $bonus("freeCoinStatus").textContent = "Cloud mode: secure rewards need backend setup";
    const today=utcDay();
    const yesterday=utcDay(Date.now()-86400000);
    const streak=data.dailyDate===today?(data.streak||1):data.dailyDate===yesterday?(data.streak||0)+1:1;
    const reward=DAILY[(Math.max(1,streak)-1)%7];
    $bonus("dailyBonusStreak").textContent=`Day ${((Math.max(1,streak)-1)%7)+1} · ${data.dailyDate===today?"Already claimed":"Ready to claim"}`;
    $bonus("dailyBonusAmount").textContent=`${reward.toLocaleString()} coins`;
    $bonus("dailyBonusClaim").disabled=data.dailyDate===today || cloudMode;
    const weekend=[0,6].includes(new Date().getUTCDay());
    if(data.eventWeek!==weekKey()){data.eventWeek=weekKey();data.eventBaseline=eventProgress();data.eventClaimed=false;store()}
    const count=Math.max(0,eventProgress()-(data.eventBaseline||0));
    $bonus("eventStatus").textContent=weekend?`${Math.min(count,3)}/3 levels · ${data.eventClaimed?"Claimed":"5,000 coins"}`:"Available Saturday–Sunday (UTC)";
    $bonus("eventClaim").disabled=!weekend||count<3||!!data.eventClaimed||cloudMode;
    $bonus("progressLevels").textContent=eventProgress().toLocaleString();
    $bonus("progressStars").textContent=snapshot().stars.toLocaleString();
    $bonus("progressBest").textContent=snapshot().bestScore.toLocaleString();
  }
  $bonus("freeCoinClaim")?.addEventListener("click",()=>{resetCycle();if(data.claims>=5 || !coins(2500))return;data.claims++;store();render()});
  $bonus("dailyBonusClaim")?.addEventListener("click",()=>{const today=utcDay();if(data.dailyDate===today)return;const yesterday=utcDay(Date.now()-86400000);const streak=data.dailyDate===yesterday?(data.streak||0)+1:1;if(!coins(DAILY[(streak-1)%7]))return;data.streak=streak;data.dailyDate=today;store();render()});
  $bonus("eventClaim")?.addEventListener("click",()=>{if(data.eventClaimed||![0,6].includes(new Date().getUTCDay())||eventProgress()-(data.eventBaseline||0)<3)return;if(!coins(5000))return;data.eventClaimed=true;store();render()});
  render();setInterval(render,1000);
})();
