export class MatchSeries{
  constructor(room,{element,reset,outcome,labels=['Jogador 1','Jogador 2'],delay=3500}={}){
    this.room=room;this.element=element;this.reset=reset;this.outcome=outcome;this.labels=labels;this.delay=delay;
    this.scores={a:0,b:0,draws:0};this.ended=false;this.timer=null;
    room.addEventListener('created',()=>{this.clearTimer();this.scores={a:0,b:0,draws:0};this.ended=false;this.paint()});
    room.addEventListener('connected',()=>{if(room.role==='host')this.publish()});
    room.addEventListener('message',e=>{const d=e.detail.data;if(d?.type==='dg:series'&&d.scores){this.scores={a:Number(d.scores.a)||0,b:Number(d.scores.b)||0,draws:Number(d.scores.draws)||0};this.paint()}});
    this.paint();
  }
  clearTimer(){clearTimeout(this.timer);this.timer=null}
  paint(){if(this.element)this.element.textContent=`Série · ${this.labels[0]} ${this.scores.a} — ${this.scores.b} ${this.labels[1]} · Empates ${this.scores.draws}`}
  publish(){if(this.room.role==='host'&&this.room.connected)this.room.send({type:'dg:series',scores:this.scores})}
  observe(){
    const result=this.outcome?.();
    if(!result){this.ended=false;return}
    if(this.ended||this.room.role!=='host'||!this.room.connected)return;
    this.ended=true;
    if(result==='draw')this.scores.draws++;else if(result==='a')this.scores.a++;else this.scores.b++;
    this.paint();this.publish();
    this.clearTimer();
    this.timer=setTimeout(()=>{if(this.room.role==='host'&&this.room.connected&&this.ended)this.reset?.(true)},this.delay);
  }
}
