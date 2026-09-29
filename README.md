# Dexter Games

Hub de jogos web mobile-first com estética dark/neon, publicado como site estático.

## Jogos

- **Cubo Mágico 3×3** — 3D, gestos por linha/coluna/camada, embaralhar, desfazer e solver real.
- **Xadrez** — regras legais via chess.js, modo local e PvP online.
- **Dama** — capturas obrigatórias, múltiplas capturas, promoção para dama, local e PvP online.
- **Dominó** — dupla-seis, 1×1, compra/passe, local e PvP online casual.

## PvP online

As salas usam WebRTC com PeerJS. O jogador que cria a sala recebe um código curto e precisa manter a página aberta. O segundo jogador entra pelo código. Não há banco de dados nem conta obrigatória.

> A camada P2P usa o serviço público de sinalização do PeerJS. É adequada para partidas casuais, mas não implementa anti-cheat nem infraestrutura competitiva dedicada.

## Áudio

Os efeitos sonoros são gerados com Web Audio API, sem arquivos pesados: clique, movimento, captura, erro, vitória e notificações. O som pode ser desligado a qualquer momento.

## Publicação

O projeto não exige build.

- Publicar o repositório no Netlify.
- Diretório de publicação: `.`
- HTTPS é necessário para WebRTC funcionar corretamente fora de localhost.

## Estrutura

```text
/
├── index.html
├── cube.html
├── chess.html
├── checkers.html
├── domino.html
├── cube-worker.js
├── manifest.webmanifest
├── sw.js
├── netlify.toml
├── assets/
│   └── base.css
└── js/
    ├── audio.js
    └── peer-room.js
```
