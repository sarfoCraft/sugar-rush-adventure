// Server-backed reward claims for Firebase users; local demo for offline guests.
(() => {
  const el = id => document.getElementById(id);
  const api = window.SugarRush;
  if (!api || !el('freeCoinClaim')) return;
  const KEY = 'sugarRushBonusV2';
  const PERIOD = 3 * 60 * 60 * 1000;
  const DAILY = [500,1000,1500,2000,3000,4000,10000];
  const utcDay = (t=Date.now()) => new Date(t).toISOString().slice(0,10);
  const weekKey = (t=Date.now()) => {
    const d=new Date(t),day=d.getUTCDay();d.setUTCDate(d.getUTCDate()-((day+6)%7));
    return utcDay(d.getTime());
  };
  let local;
  try {local=JSON.parse(localStorage.getItem(KEY)) || {}} catch {local={}}
  if (!local || typeof local !== 'object') local={};
  const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(local))}catch{}};
  let cloud=null, cloudError='', fetching=false, claiming=false, loadedAt=0;
  let syncAt=0, cloudOwner='';
  const snapshot=()=>api.getBonusSnapshot();
  const cloudMode=()=>snapshot().cloudMode && snapshot().signedIn;
  const needsLogin=()=>snapshot().cloudMode && !snapshot().signedIn;
  function timer(ms) {
    const seconds=Math.max(0,Math.ceil(ms/1000));
    return [Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(x=>String(x).padStart(2,'0')).join(':');
  }
  function localReset() {
    const now=Date.now();
    if(!Number.isFinite(local.cycleStart)||local.cycleStart>now||now-local.cycleStart>=PERIOD){local.cycleStart=now;local.claims=0;store()}
  }
  function renderLocal() {
    localReset();
    const now=Date.now(),remaining=Math.max(0,5-(local.claims||0));
    el('freeCoinStatus').textContent=`${remaining}/5 claims left · reset ${timer(local.cycleStart+PERIOD-now)}`;
    el('freeCoinClaim').disabled=!remaining;
    const today=utcDay(),yesterday=utcDay(now-86400000);
    const streak=local.dailyDate===today?(local.streak||1):local.dailyDate===yesterday?(local.streak||0)+1:1;
    el('dailyBonusStreak').textContent=`Day ${((Math.max(1,streak)-1)%7)+1} · ${local.dailyDate===today?'Already claimed':'Ready to claim'}`;
    el('dailyBonusAmount').textContent=`${DAILY[(Math.max(1,streak)-1)%7].toLocaleString()} coins`;
    el('dailyBonusClaim').disabled=local.dailyDate===today;
    const weekend=[0,6].includes(new Date().getUTCDay());
    if(local.eventWeek!==weekKey()){local.eventWeek=weekKey();local.eventBaseline=snapshot().completedLevels.length;local.eventClaimed=false;store()}
    const count=Math.max(0,snapshot().completedLevels.length-(local.eventBaseline||0));
    el('eventStatus').textContent=weekend?`${Math.min(count,3)}/3 levels · ${local.eventClaimed?'Claimed':'5,000 coins'}`:'Available Saturday–Sunday (UTC)';
    el('eventClaim').disabled=!weekend||count<3||!!local.eventClaimed;
    el('freeCoinClaim').textContent='Claim 2,500';
    el('dailyBonusClaim').textContent='Claim daily bonus';
  }
  function render() {
    const snap=snapshot();
    if (snap.uid!==cloudOwner) {cloudOwner=snap.uid;cloud=null;cloudError='';loadedAt=0;}
    el('progressLevels').textContent=snap.completedLevels.length.toLocaleString();
    el('progressStars').textContent=snap.stars.toLocaleString();
    el('progressBest').textContent=snap.bestScore.toLocaleString();
    if (needsLogin()) {
      el('freeCoinStatus').textContent='Sign in to claim secure Prisma rewards';
      el('dailyBonusStreak').textContent='Your rewards follow your Firebase account';
      el('dailyBonusAmount').textContent='Sign in required';
      el('eventStatus').textContent='Sign in to join Weekend Candy Rush';
      for(const id of ['freeCoinClaim','dailyBonusClaim','eventClaim'])el(id).disabled=true;
      return;
    }
    if (!cloudMode()) {renderLocal();return;}
    if (!cloud) {
      el('freeCoinStatus').textContent=cloudError||'Loading secure rewards from Prisma…';
      el('dailyBonusStreak').textContent=cloudError||'Checking daily bonus…';
      el('dailyBonusAmount').textContent='—';
      el('eventStatus').textContent='Checking event…';
      for(const id of ['freeCoinClaim','dailyBonusClaim','eventClaim'])el(id).disabled=true;
      return;
    }
    const now=Date.now()+syncAt;
    const remaining=cloud.free.remaining;
    el('freeCoinStatus').textContent=`${remaining}/${cloud.free.limit} claims left · reset ${timer(Date.parse(cloud.free.resetAt)-now)}`;
    el('dailyBonusStreak').textContent=cloud.daily.claimed?`Day ${cloud.daily.nextDay} · Already claimed today`:`Day ${cloud.daily.nextDay} · Ready to claim`;
    el('dailyBonusAmount').textContent=`${Number(cloud.daily.amount).toLocaleString()} coins`;
    el('eventStatus').textContent=cloud.event.active?`${cloud.event.levels}/${cloud.event.goal} different levels · ${cloud.event.claimed?'Claimed':cloud.event.amount.toLocaleString()+' coins'}`:'Weekend event starts Saturday (UTC)';
    el('freeCoinClaim').disabled=claiming||fetching||remaining<1;
    el('dailyBonusClaim').disabled=claiming||fetching||cloud.daily.claimed;
    el('eventClaim').disabled=claiming||fetching||!cloud.event.active||cloud.event.claimed||cloud.event.levels<cloud.event.goal;
    el('freeCoinClaim').textContent='Claim 2,500';
    el('dailyBonusClaim').textContent='Claim daily bonus';
    el('eventClaim').textContent='Claim event prize';
  }
  async function refresh(force=false) {
    if (!cloudMode() || fetching || claiming) return;
    if(!force && Date.now()-loadedAt<15000)return;
    fetching=true;
    const owner=snapshot().uid;
    try {
      const result=await api.getCloudRewards();
      if(owner!==snapshot().uid)return;
      cloud=result;syncAt=Date.parse(result.serverTime)-Date.now();cloudError='';loadedAt=Date.now();
    }
    catch(err){cloud=null;cloudError=`Cloud rewards unavailable: ${err.message}`;}
    finally{fetching=false;render()}
  }
  async function claim(kind) {
    if(needsLogin())return;
    if(cloudMode()) {
      if(claiming||fetching||!cloud)return;
      claiming=true;render();
      const owner=snapshot().uid;
      try {
        const result=await api.claimCloudReward(kind);
        if(owner!==snapshot().uid)return;
        cloud=result.rewards;syncAt=Date.parse(cloud.serverTime)-Date.now();loadedAt=Date.now();
        api.showMessage(`✅ ${Number(result.amount).toLocaleString()} coins added to your secure cloud wallet!`);
      } catch(err) {api.showMessage(`Reward not granted: ${err.message}`);cloud=null;}
      finally {claiming=false;render();if(!cloud)refresh(true)}
      return;
    }
    localReset();const now=Date.now();
    if(kind==='free'){
      if(local.claims>=5||!api.grantDemoBonus(2500))return;
      local.claims++;
    } else if(kind==='daily'){
      const today=utcDay();if(local.dailyDate===today)return;
      const yesterday=utcDay(now-86400000),streak=local.dailyDate===yesterday?(local.streak||0)+1:1;
      if(!api.grantDemoBonus(DAILY[(streak-1)%7]))return;
      local.streak=streak;local.dailyDate=today;
    } else if(kind==='event'){
      const count=Math.max(0,snapshot().completedLevels.length-(local.eventBaseline||0));
      if(local.eventClaimed||![0,6].includes(new Date().getUTCDay())||count<3||!api.grantDemoBonus(5000))return;
      local.eventClaimed=true;
    }
    store();render();
  }
  el('freeCoinClaim').addEventListener('click',()=>claim('free'));
  el('dailyBonusClaim').addEventListener('click',()=>claim('daily'));
  el('eventClaim').addEventListener('click',()=>claim('event'));
  window.addEventListener('sugar-rush:rewards-open',()=>refresh(true));
  window.addEventListener('sugar-rush:cloud-progress',()=>refresh(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(true)});
  render();refresh(true);
  setInterval(()=>{
    render();
    if(cloudMode() && !cloud && !fetching && !claiming && !cloudError)refresh(true);
    if(cloudMode() && cloud) {
      const now=Date.now()+syncAt;
      if(now>=Date.parse(cloud.free.resetAt) || (cloud.daily.claimed && now>=Date.parse(cloud.daily.nextAt)) || Date.now()-loadedAt>60000)refresh(true);
    }
  },1000);
})();
