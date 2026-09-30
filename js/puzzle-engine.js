import{clone,seededShuffle}from'./game-core.js';

export class PuzzleEngine{
  constructor(config={}){this.reset(config)}
  reset({size=4,preset='neon',seed=(Date.now()>>>0)}={}){
    size=Math.max(3,Math.min(6,Number(size)||4));
    const total=size*size,order=seededShuffle([...Array(total).keys()],seed);
    this.state={size,preset,seed,order,slots:Array(total).fill(null),locked:Array(total).fill(false),moves:0,startedAt:null,finishedAt:null};
    return this.snapshot();
  }
  load(snapshot){this.state=clone(snapshot);return this}
  snapshot(){return clone(this.state)}
  total(){return this.state.size*this.state.size}
  placedCount(){return this.state.locked.filter(Boolean).length}
  progress(){return Math.round(this.placedCount()/this.total()*100)}
  elapsed(now=Date.now()){
    if(!this.state.startedAt)return 0;
    return (this.state.finishedAt||now)-this.state.startedAt;
  }
  locate(pieceId){const slot=this.state.slots.indexOf(pieceId);return slot>=0?{zone:'board',slot}:{zone:'tray',slot:-1}}
  move(pieceId,targetSlot){
    pieceId=Number(pieceId);targetSlot=Number(targetSlot);
    if(!Number.isInteger(pieceId)||pieceId<0||pieceId>=this.total())return{ok:false,reason:'Peça inválida.'};
    if(!Number.isInteger(targetSlot)||targetSlot<0||targetSlot>=this.total())return{ok:false,reason:'Posição inválida.'};
    if(this.state.finishedAt)return{ok:false,reason:'Quebra-cabeça concluído.'};
    const source=this.locate(pieceId);
    if(source.zone==='board'&&this.state.locked[source.slot])return{ok:false,reason:'Essa peça já está encaixada.'};
    if(this.state.locked[targetSlot])return{ok:false,reason:'Essa posição já está correta.'};
    if(!this.state.startedAt)this.state.startedAt=Date.now();
    const displaced=this.state.slots[targetSlot];
    if(source.zone==='board'){
      this.state.slots[source.slot]=displaced;
      this.state.locked[source.slot]=displaced===source.slot;
    }
    this.state.slots[targetSlot]=pieceId;
    this.state.locked[targetSlot]=pieceId===targetSlot;
    this.state.moves++;
    if(this.placedCount()===this.total())this.state.finishedAt=Date.now();
    return{ok:true,locked:this.state.locked[targetSlot],displaced,finished:!!this.state.finishedAt,progress:this.progress()};
  }
  remove(pieceId){
    const loc=this.locate(Number(pieceId));
    if(loc.zone!=='board'||this.state.locked[loc.slot])return{ok:false};
    this.state.slots[loc.slot]=null;this.state.locked[loc.slot]=false;return{ok:true};
  }
  trayPieces(){const onBoard=new Set(this.state.slots.filter(v=>v!==null));return this.state.order.filter(id=>!onBoard.has(id))}
}
