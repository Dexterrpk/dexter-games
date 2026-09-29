const PREFIX='dexter-games-';
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomCode(len=6){let s='';for(let i=0;i<len;i++)s+=ALPHABET[Math.floor(Math.random()*ALPHABET.length)];return s}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
export class P2PRoom extends EventTarget{
  constructor(){super();this.peer=null;this.conn=null;this.role='local';this.code='';this.connected=false}
  emit(type,detail={}){this.dispatchEvent(new CustomEvent(type,{detail}))}
  async load(){if(window.Peer)return window.Peer;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});return window.Peer}
  wirePeer(peer){this.peer=peer;peer.on('error',err=>this.emit('error',{message:this.readError(err)}));peer.on('disconnected',()=>this.emit('status',{message:'Conexão de sinalização interrompida.'}));peer.on('close',()=>this.disconnect(false))}
  wireConn(conn){this.conn=conn;conn.on('open',()=>{this.connected=true;this.emit('connected',{role:this.role,code:this.code});this.emit('status',{message:'Adversário conectado.'})});conn.on('data',data=>this.emit('message',{data}));conn.on('close',()=>{this.connected=false;this.conn=null;this.emit('status',{message:'Adversário desconectou.'});this.emit('disconnected',{})});conn.on('error',err=>this.emit('error',{message:this.readError(err)}))}
  readError(err){const map={'peer-unavailable':'Sala não encontrada. Confira o código.','unavailable-id':'Esse código já está em uso.','network':'Falha de rede ao conectar.','server-error':'Servidor de sinalização indisponível.'};return map[err?.type]||err?.message||'Falha na conexão P2P.'}
  async create(){await this.disconnect();const Peer=await this.load();for(let attempt=0;attempt<4;attempt++){
      const code=randomCode(),id=PREFIX+code;
      const peer=new Peer(id,{debug:0});this.wirePeer(peer);
      const result=await new Promise(resolve=>{let done=false;const finish=v=>{if(done)return;done=true;resolve(v)};peer.once('open',()=>finish({ok:true}));peer.once('error',e=>finish({ok:false,e}));setTimeout(()=>finish({ok:false,e:{type:'timeout'}}),8000)});
      if(result.ok){this.role='host';this.code=code;peer.on('connection',conn=>{if(this.conn&&this.conn.open){conn.close();return}this.wireConn(conn)});this.emit('created',{code});return code}
      peer.destroy();if(result.e?.type!=='unavailable-id')throw new Error(this.readError(result.e));await wait(120)
    }throw new Error('Não foi possível gerar uma sala agora.')
  }
  async join(rawCode){await this.disconnect();const code=String(rawCode||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length<4)throw new Error('Informe um código de sala válido.');const Peer=await this.load(),peer=new Peer(undefined,{debug:0});this.wirePeer(peer);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Tempo esgotado ao abrir conexão.')),8000);peer.once('open',()=>{clearTimeout(timer);resolve()});peer.once('error',e=>{clearTimeout(timer);reject(new Error(this.readError(e)))})});this.role='guest';this.code=code;const conn=peer.connect(PREFIX+code,{reliable:true,serialization:'json'});this.wireConn(conn);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Sala não respondeu.')),9000);conn.once('open',()=>{clearTimeout(timer);resolve(code)});conn.once('error',e=>{clearTimeout(timer);reject(new Error(this.readError(e)))})})
  }
  send(data){if(this.conn?.open){this.conn.send(data);return true}return false}
  async disconnect(emit=true){if(this.conn){try{this.conn.close()}catch{}}if(this.peer){try{this.peer.destroy()}catch{}}this.conn=null;this.peer=null;this.connected=false;this.code='';this.role='local';if(emit)this.emit('disconnected',{})}
}
export function bindRoomUI(room,{createBtn,joinBtn,input,codeEl,statusEl,onConnected,onMessage}={}){
  const status=m=>{if(statusEl)statusEl.textContent=m};
  room.addEventListener('status',e=>status(e.detail.message));
  room.addEventListener('error',e=>status(e.detail.message));
  room.addEventListener('created',e=>{if(codeEl)codeEl.textContent=e.detail.code;status('Sala criada. Aguardando adversário…')});
  room.addEventListener('connected',e=>{if(codeEl)codeEl.textContent=e.detail.code||room.code;status(e.detail.role==='host'?'Adversário conectado. Você começa.':'Conectado à sala.');onConnected?.(e.detail)});
  room.addEventListener('message',e=>onMessage?.(e.detail.data));
  createBtn?.addEventListener('click',async()=>{try{createBtn.disabled=true;await room.create()}catch(e){status(e.message)}finally{createBtn.disabled=false}});
  joinBtn?.addEventListener('click',async()=>{try{joinBtn.disabled=true;await room.join(input?.value)}catch(e){status(e.message)}finally{joinBtn.disabled=false}});
}
