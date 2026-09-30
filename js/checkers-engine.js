import{clone}from'./game-core.js';
const DIRS=[[-1,-1],[-1,1],[1,-1],[1,1]];
const key=(r,c)=>`${r},${c}`;
const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const sideOf=p=>p?p.toLowerCase():null;
const isKing=p=>!!p&&p===p.toUpperCase();

export class BrazilianCheckers{
  constructor(snapshot=null){this.load(snapshot||this.fresh())}
  fresh(){
    const board=Array.from({length:8},()=>Array(8).fill(null));
    for(let r=0;r<3;r++)for(let c=0;c<8;c++)if((r+c)%2)board[r][c]='r';
    for(let r=5;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2)board[r][c]='w';
    return{board,turn:'w',winner:null,draw:null,ply:0,lastMove:null,repetition:{}};
  }
  load(s){
    this.state=clone(s);
    this.state.repetition=this.state.repetition||{};
    if(!Object.keys(this.state.repetition).length)this.notePosition();
    return this;
  }
  reset(){return this.load(this.fresh())}
  snapshot(){return clone(this.state)}
  board(){return this.state.board}
  count(side){return this.state.board.flat().filter(p=>sideOf(p)===side).length}
  status(){return{turn:this.state.turn,winner:this.state.winner,draw:this.state.draw,over:!!this.state.winner||!!this.state.draw}}
  positionKey(){return `${this.state.turn}|${this.state.board.map(r=>r.map(x=>x||'.').join('')).join('/')}`}
  notePosition(){
    const k=this.positionKey();
    this.state.repetition[k]=(this.state.repetition[k]||0)+1;
    if(this.state.repetition[k]>=3)this.state.draw='repetição tripla';
  }
  simpleMovesFrom(r,c){
    const board=this.state.board,p=board[r]?.[c];if(!p)return[];
    const out=[];
    if(isKing(p)){
      for(const[dr,dc]of DIRS){let rr=r+dr,cc=c+dc;while(inside(rr,cc)&&!board[rr][cc]){out.push({from:[r,c],path:[[rr,cc]],captures:[]});rr+=dr;cc+=dc}}
    }else{
      const dirs=sideOf(p)==='w'?[[-1,-1],[-1,1]]:[[1,-1],[1,1]];
      for(const[dr,dc]of dirs){const rr=r+dr,cc=c+dc;if(inside(rr,cc)&&!board[rr][cc])out.push({from:[r,c],path:[[rr,cc]],captures:[]})}
    }
    return out;
  }
  captureSequencesFrom(r,c){
    const board=this.state.board,p=board[r]?.[c];if(!p)return[];
    const out=[];
    const walk=(b,cr,cc,captured,path,caps)=>{
      const next=[];
      if(isKing(p)){
        for(const[dr,dc]of DIRS){
          let rr=cr+dr,ccc=cc+dc,enemy=null;
          while(inside(rr,ccc)){
            const cell=b[rr][ccc];
            if(!enemy){
              if(!cell){rr+=dr;ccc+=dc;continue}
              if(sideOf(cell)===sideOf(p)||captured.has(key(rr,ccc)))break;
              enemy=[rr,ccc];rr+=dr;ccc+=dc;continue;
            }
            if(cell)break;
            next.push({land:[rr,ccc],capture:enemy});
            rr+=dr;ccc+=dc;
          }
        }
      }else{
        for(const[dr,dc]of DIRS){
          const mr=cr+dr,mc=cc+dc,lr=cr+2*dr,lc=cc+2*dc;
          if(!inside(lr,lc))continue;
          const middle=b[mr]?.[mc];
          if(middle&&sideOf(middle)!==sideOf(p)&&!captured.has(key(mr,mc))&&!b[lr][lc])next.push({land:[lr,lc],capture:[mr,mc]});
        }
      }
      if(!next.length){if(caps.length)out.push({from:[r,c],path:clone(path),captures:clone(caps)});return}
      for(const n of next){
        const nb=b.map(row=>[...row]);
        nb[cr][cc]=null;nb[n.land[0]][n.land[1]]=p;
        const nc=new Set(captured);nc.add(key(n.capture[0],n.capture[1]));
        walk(nb,n.land[0],n.land[1],nc,[...path,n.land],[...caps,n.capture]);
      }
    };
    walk(board.map(row=>[...row]),r,c,new Set(),[],[]);
    return out;
  }
  legalMoves(side=this.state.turn){
    if(this.status().over||side!==this.state.turn)return[];
    const captures=[];
    for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(sideOf(this.state.board[r][c])===side)captures.push(...this.captureSequencesFrom(r,c));
    if(captures.length){const max=Math.max(...captures.map(m=>m.captures.length));return captures.filter(m=>m.captures.length===max)}
    const out=[];
    for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(sideOf(this.state.board[r][c])===side)out.push(...this.simpleMovesFrom(r,c));
    return out;
  }
  legalMovesFrom(r,c){return this.legalMoves().filter(m=>m.from[0]===r&&m.from[1]===c)}
  applyMove(move,side=this.state.turn){
    if(this.status().over)return{ok:false,reason:'A partida já terminou.'};
    if(side!==this.state.turn)return{ok:false,reason:'Não é a vez desse jogador.'};
    const legal=this.legalMoves(side);
    const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    const found=legal.find(m=>same(m.from,move?.from)&&same(m.path,move?.path));
    if(!found)return{ok:false,reason:legal.some(m=>m.captures.length)?'A captura máxima é obrigatória.':'Movimento inválido.'};
    const [fr,fc]=found.from;let p=this.state.board[fr][fc];
    const [tr,tc]=found.path.at(-1);
    this.state.board[fr][fc]=null;
    for(const[rr,cc]of found.captures)this.state.board[rr][cc]=null;
    if(!isKing(p)&&((side==='w'&&tr===0)||(side==='r'&&tr===7)))p=p.toUpperCase();
    this.state.board[tr][tc]=p;
    this.state.lastMove={from:found.from,to:[tr,tc],path:found.path,captures:found.captures};
    this.state.ply++;
    this.state.turn=side==='w'?'r':'w';
    const other=this.state.turn;
    if(this.count(other)===0||this.legalMoves(other).length===0)this.state.winner=side;
    if(!this.state.winner)this.notePosition();
    return{ok:true,capture:found.captures.length>0,promoted:isKing(p),winner:this.state.winner,draw:this.state.draw};
  }
}
