# Dexter Games

Hub de jogos web mobile-first com estética dark/neon, publicado como site estático e sem cadastro obrigatório.

## Desenvolvimento

**Desenvolvido e mantido por NeriInfotech.**

## Jogos

- **Cubo Mágico 3×3** — 3D, gestos por linha/coluna/camada, embaralhar, desfazer e solver.
- **Xadrez** — regras via `chess.js`, histórico de lances, promoção completa, modo local e PvP.
- **Damas Brasileiras 64** — dama voadora, captura para frente/trás, captura obrigatória e lei da maioria.
- **Dominó dupla-seis 1×1** — peças com pontos, compra/passe, mesa de tamanho fixo, privacidade da mão e PvP.
- **Quebra-cabeça** — 3×3 a 6×6, temas internos, foto local, drag/touch, cronômetro e Puzzle Race PvP.

## Arquitetura de jogo

A interface não aplica jogadas diretamente. Ela envia uma intenção para o motor de regras. O motor valida a jogada, altera o estado e só então a tela é redesenhada.

```text
UI -> intenção -> motor de regras -> novo estado -> renderer
```

No PvP compartilhado, o host é autoritativo: o convidado envia intenções e recebe snapshots versionados. Isso impede que um dispositivo controle os dois lados e reduz dessincronização.

No dominó, o snapshot enviado ao convidado contém somente a própria mão, contagens do adversário/monte e o estado público da mesa.

## PvP online

As salas usam WebRTC com PeerJS. O jogador que cria a sala recebe um código curto e precisa manter a página aberta. O segundo jogador entra pelo código. Não há banco de dados nem conta obrigatória.

> A sinalização usa o serviço público do PeerJS. É adequada para partidas casuais e não substitui uma infraestrutura competitiva dedicada com servidor, conta e anti-cheat.

## Damas Brasileiras

O motor segue as regras centrais da variante brasileira de 64 casas: peças comuns capturam para frente e para trás, damas percorrem diagonais livres e, quando existem sequências de captura diferentes, é obrigatória uma das sequências que capture o maior número de peças. Também há empate por repetição tripla da mesma posição com o mesmo jogador a mover.

## PWA e offline

O service worker armazena as páginas e módulos locais. Dependências carregadas pelo jsDelivr, como `chess.js`, também são armazenadas depois do primeiro carregamento bem-sucedido.

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
├── puzzle.html
├── cube-worker.js
├── manifest.webmanifest
├── sw.js
├── netlify.toml
├── assets/
│   └── base.css
└── js/
    ├── audio.js
    ├── branding.js
    ├── peer-room.js
    ├── game-core.js
    ├── checkers-engine.js
    ├── domino-engine.js
    └── puzzle-engine.js
```
