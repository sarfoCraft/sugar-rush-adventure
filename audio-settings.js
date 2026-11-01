/* v3 music and effects controller. Settings are stored per browser; never shared with the backend. */
(() => {
  "use strict";
  const KEY="sugarRushAudioSettingsV3";
  const $=id=>document.getElementById(id);
  const clamp=x=>Math.max(0,Math.min(100,Math.round(Number(x)||0)));
  let settings={music:true,sfx:true,musicVolume:35,sfxVolume:65};
  try {const saved=JSON.parse(localStorage.getItem(KEY)||"null");if(saved && typeof saved==="object")settings={...settings,...saved};} catch{}
  settings.music=!!settings.music;settings.sfx=!!settings.sfx;
  settings.musicVolume=clamp(settings.musicVolume);settings.sfxVolume=clamp(settings.sfxVolume);
  const music=new Audio("Audio/game music.mp3");music.loop=true;music.preload="none";
  const pop=new Audio("Audio/Pop.mp3"), tap=new Audio("Audio/Button Tap.mp3");
  pop.preload="none";tap.preload="none";
  let userInteracted=false;
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}};
  const updateMusic=()=>{
    music.volume=settings.music?settings.musicVolume/100:0;
    if(!userInteracted||!settings.music||settings.musicVolume===0||document.hidden){music.pause();return;}
    if(music.paused)music.play().catch(()=>{});
  };
  const sfx=(source,gain=1)=>{
    if(!settings.sfx||settings.sfxVolume===0)return;
    try {const sound=source.cloneNode();sound.volume=Math.min(1,settings.sfxVolume/100*gain);sound.play().catch(()=>{});}catch{}
  };
  const sync=()=>{
    $("musicEnabled").checked=settings.music;
    $("sfxEnabled").checked=settings.sfx;
    $("musicVolume").value=String(settings.musicVolume);
    $("sfxVolume").value=String(settings.sfxVolume);
    $("musicVolumeLabel").value=`${settings.musicVolume}%`;
    $("sfxVolumeLabel").value=`${settings.sfxVolume}%`;
    $("musicVolume").disabled=!settings.music;
    $("sfxVolume").disabled=!settings.sfx;
  };
  const update=()=>{persist();sync();updateMusic()};
  $("musicEnabled")?.addEventListener("change",e=>{settings.music=e.target.checked;userInteracted=true;update()});
  $("sfxEnabled")?.addEventListener("change",e=>{settings.sfx=e.target.checked;update();sfx(tap,.6)});
  $("musicVolume")?.addEventListener("input",e=>{settings.musicVolume=clamp(e.target.value);userInteracted=true;update()});
  $("sfxVolume")?.addEventListener("input",e=>{settings.sfxVolume=clamp(e.target.value);update()});
  document.querySelectorAll(".audio-preset").forEach(button=>button.addEventListener("click",()=>{
    const type=button.dataset.sound;
    if(type==="music")settings.musicVolume=clamp(button.dataset.value);
    else settings.sfxVolume=clamp(button.dataset.value);
    userInteracted=true;update();sfx(tap,.55);
  }));
  $("soundPreviewBtn")?.addEventListener("click",()=>{userInteracted=true;updateMusic();sfx(pop,1)});
  document.addEventListener("pointerdown",()=>{userInteracted=true;updateMusic()},{passive:true});
  document.addEventListener("keydown",()=>{userInteracted=true;updateMusic()});
  document.addEventListener("click",event=>{if(event.target.closest("button,[role='button']"))sfx(tap,.55)});
  window.playPopSound=()=>sfx(pop,1);
  document.addEventListener("visibilitychange",updateMusic);
  window.addEventListener("pagehide",()=>music.pause());
  window.addEventListener("storage",e=>{if(e.key!==KEY||!e.newValue)return;
    try{const next=JSON.parse(e.newValue);settings={...settings,...next};sync();updateMusic()}catch{}
  });
  sync();
})();
