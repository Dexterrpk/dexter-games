const AudioCtx=window.AudioContext||window.webkitAudioContext;
let ctx=null,muted=localStorage.getItem('dexter-games-muted')==='1';
function getCtx(){if(!ctx&&AudioCtx)ctx=new AudioCtx();if(ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx}
function tone(freq=440,duration=.08,type='sine',gain=.035,slide=0){if(muted)return;const c=getCtx();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),c.currentTime+duration);g.gain.setValueAtTime(0.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(gain,c.currentTime+.01);g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+duration);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+duration+.02)}
function chord(notes,duration=.18,gain=.025){notes.forEach((n,i)=>setTimeout(()=>tone(n,duration,'sine',gain,30),i*28))}
export const sfx={
 tap(){tone(520,.045,'triangle',.018,40)},
 move(){tone(320,.07,'triangle',.025,80)},
 capture(){tone(190,.11,'square',.022,-70)},
 error(){tone(145,.14,'sawtooth',.02,-25)},
 notify(){chord([520,660],.09,.018)},
 win(){chord([392,523,659,784],.24,.03)},
 reset(){chord([350,290],.09,.018)},
 tick(){tone(720,.03,'sine',.012,10)}
};
export function isMuted(){return muted}
export function setMuted(v){muted=!!v;localStorage.setItem('dexter-games-muted',muted?'1':'0');if(!muted)getCtx();return muted}
export function toggleMuted(){return setMuted(!muted)}
export function wireSoundButton(btn){if(!btn)return;const paint=()=>{btn.textContent=muted?'🔇':'🔊';btn.setAttribute('aria-label',muted?'Ativar som':'Desativar som')};paint();btn.addEventListener('click',()=>{toggleMuted();paint();if(!muted)sfx.notify()})}
export function toast(message){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=message;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),1800)}
