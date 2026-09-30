import{clone,seededShuffle}from'./game-core.js';

export class DominoEngine{
  constructor(snapshot=null){snapshot?this.load(snapshot):this.reset()}
  createDeck(seed){
    const tiles=[];let id=0;
    for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)tiles.push({id:`t${id++}`,a,b});
    return seededShuffle(tiles,seed);
  }
  reset(seed=(Date.now()^Math.floor(Math.random()*1e9))>>>0){
    const deck=this.createDeck(seed),hands=[deck.splice(0,7),deck.splice(0,7)];
    const opening=this.findOpening(hands),tile=hands[opening.player].splice(opening.index,1)[0];
    this.state={seed,hands,stock:deck,chain:[{...tile}],turn:1-opening.player,passes:0,winner:null,reason:null,startedBy:opening.player,lastAction:{type:'opening',player:opening.player,tileId:tile.id}};
    return this.snapshot();
  }
  load(snapshot){this.state=clone(snapshot);return this}
  snapshot(){return clone(this.state)}
  findOpening(hands){
    let best=null;
    hands.forEach((hand,player)=>hand.forEach((tile,index)=>{
      const double=tile.a===tile.b,score=(double?100:0)+tile.a+tile.b;
      if(!best||score>best.score)best={player,index,score};
    }));
    return best;
  }
  ends(){const c=this.state.chain;return c.length?[c[0].a,c.at(-1).b]:[null,null]}
  pipSum(player){return this.state.hands[player].reduce((s,t)=>s+t.a+t.b,0)}
  sidesFor(tile){
    const[left,right]=this.ends(),out=[];
    if(left==null)return['R'];
    if(tile.a===left||tile.b===left)out.push('L');
    if(tile.a===right||tile.b===right)out.push('R');
    return out;
  }
  orient(tile,side){
    const[left,right]=this.ends();let{a,b}=tile;
    if(side==='L'){
      if(b===left)return{...tile,a,b};
      if(a===left)return{...tile,a:b,b:a};
    }else{
      if(a===right)return{...tile,a,b};
      if(b===right)return{...tile,a:b,b:a};
    }
    return null;
  }
  hasPlay(player){return this.state.hands[player].some(t=>this.sidesFor(t).length)}
  playableTiles(player){return this.state.hands[player].filter(t=>this.sidesFor(t).length).map(t=>t.id)}
  status(){return{turn:this.state.turn,winner:this.state.winner,reason:this.state.reason,over:this.state.winner!==null}}
  play(player,tileId,side){
    if(this.status().over)return{ok:false,reason:'A partida já terminou.'};
    if(player!==this.state.turn)return{ok:false,reason:'Não é a vez desse jogador.'};
    const hand=this.state.hands[player],index=hand.findIndex(t=>t.id===tileId);
    if(index<0)return{ok:false,reason:'Essa peça não pertence à sua mão.'};
    const tile=hand[index],sides=this.sidesFor(tile);
    if(!sides.includes(side))return{ok:false,reason:'Essa peça não encaixa nessa ponta.'};
    const placed=this.orient(tile,side);hand.splice(index,1);
    if(side==='L')this.state.chain.unshift(placed);else this.state.chain.push(placed);
    this.state.passes=0;
    this.state.lastAction={type:'play',player,tileId,side};
    if(hand.length===0){this.state.winner=player;this.state.reason='mão vazia';return{ok:true,won:true}}
    this.state.turn=1-player;
    return{ok:true,capture:false};
  }
  draw(player){
    if(this.status().over)return{ok:false,reason:'A partida já terminou.'};
    if(player!==this.state.turn)return{ok:false,reason:'Não é a vez desse jogador.'};
    if(this.hasPlay(player))return{ok:false,reason:'Você possui uma peça jogável.'};
    let drawn=0;
    while(this.state.stock.length&&!this.hasPlay(player)){
      this.state.hands[player].push(this.state.stock.pop());drawn++;
    }
    this.state.passes=0;
    this.state.lastAction={type:'draw',player,count:drawn};
    if(this.hasPlay(player))return{ok:true,drawn,canPlay:true};
    return this.pass(player,true,{drawn});
  }
  pass(player,automatic=false,extra={}){
    if(this.status().over)return{ok:false,reason:'A partida já terminou.'};
    if(player!==this.state.turn)return{ok:false,reason:'Não é a vez desse jogador.'};
    if(this.hasPlay(player))return{ok:false,reason:'Você possui uma peça jogável.'};
    if(this.state.stock.length&&!automatic)return{ok:false,reason:'Ainda há peças no monte. Compre antes de passar.'};
    this.state.passes++;
    this.state.lastAction={type:'pass',player,automatic,...extra};
    if(this.state.passes>=2&&this.state.stock.length===0){
      const a=this.pipSum(0),b=this.pipSum(1);
      this.state.winner=a===b?'draw':a<b?0:1;
      this.state.reason='partida fechada';
      return{ok:true,blocked:true,winner:this.state.winner};
    }
    this.state.turn=1-player;
    return{ok:true,passed:true};
  }
  applyIntent(intent,player){
    if(intent?.type==='play')return this.play(player,intent.tileId,intent.side);
    if(intent?.type==='draw')return this.draw(player);
    if(intent?.type==='pass')return this.pass(player);
    return{ok:false,reason:'Ação desconhecida.'};
  }
  publicState(player){
    const other=1-player;
    return{
      seed:this.state.seed,
      chain:clone(this.state.chain),
      hand:clone(this.state.hands[player]),
      player,
      counts:[this.state.hands[0].length,this.state.hands[1].length],
      opponentCount:this.state.hands[other].length,
      stockCount:this.state.stock.length,
      turn:this.state.turn,
      passes:this.state.passes,
      winner:this.state.winner,
      reason:this.state.reason,
      lastAction:clone(this.state.lastAction),
      playable:this.state.turn===player?this.playableTiles(player):[]
    };
  }
}
