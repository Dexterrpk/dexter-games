export const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

export function formatClock(ms=0){
  const total=Math.max(0,Math.floor(ms/1000));
  const m=Math.floor(total/60),s=total%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function createSeededRandom(seed=Date.now()){
  let x=(Number(seed)||1)>>>0;
  return()=>{
    x+=0x6D2B79F5;
    let t=x;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return((t^(t>>>14))>>>0)/4294967296;
  };
}

export function seededShuffle(input,seed){
  const out=[...input],rnd=createSeededRandom(seed);
  for(let i=out.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

export function persistentStore(key){
  return{
    save(value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}},
    load(){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch{return null}},
    clear(){try{localStorage.removeItem(key)}catch{}}
  };
}

export class AuthoritativeChannel extends EventTarget{
  constructor(room,{snapshotFor,applySnapshot,handleIntent,playerForRole}={}){
    super();
    this.room=room;
    this.snapshotFor=snapshotFor;
    this.applySnapshot=applySnapshot;
    this.handleIntent=handleIntent;
    this.playerForRole=playerForRole||((role)=>role==='host'?0:role==='guest'?1:null);
    this.version=0;
    this.pending=false;
    this.clientSeq=0;
    room.addEventListener('connected',()=>{
      this.pending=false;
      if(room.role==='host')this.pushSnapshot();
      else room.send({type:'dg:sync-request'});
      this.emit('connection',{connected:true});
    });
    room.addEventListener('disconnected',()=>{
      this.pending=false;
      this.emit('connection',{connected:false});
    });
    room.addEventListener('message',e=>this.onMessage(e.detail.data));
  }
  emit(type,detail={}){this.dispatchEvent(new CustomEvent(type,{detail}))}
  localPlayer(){return this.playerForRole(this.room.role)}
  canControl(player){return !this.room.connected?false:this.localPlayer()===player}
  setVersion(value=0){this.version=Number(value)||0}
  pushSnapshot(){
    if(this.room.role!=='host'||!this.room.connected||!this.snapshotFor)return false;
    this.room.send({type:'dg:snapshot',version:this.version,state:this.snapshotFor(1)});
    return true;
  }
  commit(reason='state'){
    if(this.room.role!=='host')return false;
    this.version++;
    this.pending=false;
    this.pushSnapshot();
    this.emit('change',{version:this.version,reason});
    return true;
  }
  async applyAsHost(intent,player,seq=null){
    if(this.room.role!=='host')return{ok:false,reason:'not-host'};
    let result;
    try{result=await this.handleIntent?.(intent,player)}catch(error){result={ok:false,reason:error?.message||'Jogada inválida.'}}
    if(result===true)result={ok:true};
    if(!result?.ok){
      const reason=result?.reason||'Jogada inválida.';
      if(player===1&&this.room.connected)this.room.send({type:'dg:reject',seq,reason,version:this.version});
      this.emit('reject',{reason,intent,player});
      return{ok:false,reason};
    }
    this.version++;
    this.pending=false;
    this.pushSnapshot();
    if(player===1&&this.room.connected)this.room.send({type:'dg:ack',seq,version:this.version});
    this.emit('accepted',{intent,player,version:this.version,result});
    this.emit('change',{version:this.version,reason:'intent'});
    return result;
  }
  submit(intent){
    if(!this.room.connected)return{ok:false,reason:'Adversário desconectado.'};
    const player=this.localPlayer();
    if(player==null)return{ok:false,reason:'Jogador não atribuído.'};
    if(this.room.role==='host')return this.applyAsHost(intent,player);
    if(this.pending)return{ok:false,reason:'Aguarde a confirmação da jogada.'};
    const seq=++this.clientSeq;
    this.pending=true;
    this.room.send({type:'dg:intent',seq,baseVersion:this.version,intent});
    this.emit('pending',{intent,seq});
    return{ok:true,pending:true};
  }
  onMessage(data){
    if(!data||typeof data!=='object')return;
    if(this.room.role==='host'){
      if(data.type==='dg:sync-request'){this.pushSnapshot();return}
      if(data.type==='dg:intent'){
        if(Number.isFinite(data.baseVersion)&&data.baseVersion!==this.version){
          this.room.send({type:'dg:reject',seq:data.seq,reason:'Estado desatualizado. Sincronizando…',version:this.version});
          this.pushSnapshot();
          return;
        }
        this.applyAsHost(data.intent,1,data.seq);
      }
      return;
    }
    if(this.room.role!=='guest')return;
    if(data.type==='dg:snapshot'){
      if(Number(data.version)<this.version)return;
      this.version=Number(data.version)||0;
      this.pending=false;
      try{this.applySnapshot?.(data.state)}catch(error){this.emit('error',{message:error?.message||'Falha ao sincronizar partida.'});return}
      this.emit('snapshot',{version:this.version,state:data.state});
      this.emit('change',{version:this.version,reason:'snapshot'});
    }else if(data.type==='dg:reject'){
      this.pending=false;
      if(Number.isFinite(data.version))this.version=data.version;
      this.emit('reject',{reason:data.reason||'Jogada recusada.'});
    }else if(data.type==='dg:ack'){
      if(Number.isFinite(data.version))this.version=data.version;
    }
  }
}

export function fixedBoardResize(element,logicalWidth=1000,logicalHeight=1000){
  if(!element)return()=>{};
  const apply=()=>{
    const rect=element.getBoundingClientRect();
    element.style.setProperty('--board-scale',String(Math.min(rect.width/logicalWidth,rect.height/logicalHeight)||1));
  };
  const ro=new ResizeObserver(apply);ro.observe(element);apply();
  return()=>ro.disconnect();
}
