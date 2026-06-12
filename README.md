<<<<<<< Updated upstream
# H4cker.Farm
Idle clicker game hacker — mine bits, compre hardware, invada sistemas. Um arquivo HTML, zero dependências.
=======
# h4ck.farm

Idle clicker game com estética hacker dos anos 90. Um arquivo HTML, zero dependências, roda direto no navegador.

## Como jogar

Clique no terminal para minerar **bits**. Use bits para comprar geradores que produzem automaticamente. Evolua o setup, desbloqueie upgrades e avance por 4 locais diferentes.

## Mecânicas

**Geradores** — compre em quantidade (x1, x10, MAX):
- `script.sh` → CPU usada → GPU de mineração → Farm de SSD → Servidor → Rack → Botnet → Datacenter → Computador quântico

**Terminal interativo** — durante eventos de invasão, *digite os comandos exibidos* para multiplicar os ganhos. Erros de digitação penalizam.

**Upgrades** — mais de 50 upgrades desbloqueáveis: multiplicadores de clique, multiplicadores por gerador, crítico, % do bps por clique.

**Eventos** — invasões periódicas com timer e multiplicador de produção. Pacotes de dados dourados aparecem aleatoriamente para bônus instantâneos. Popups de adware para fechar (ou não).

**Duelos** — a IA de defesa te desafia no jogo da velha. Vença para ganhar bits e conquistas.

**Missões** — 12 missões progressivas com recompensas em bits ou buffs temporários.

**Localidades** — 4 bases com upgrades exclusivos e multiplicador global crescente:
1. Seu quarto (×1)
2. Escritório (×4)
3. NASA — sala de controle (×20)
4. Casa Branca — sala de crise (×100)

**Ranks** — 10 títulos de `n00b` até `deus do mainframe` conforme bits minerados.

**Conquistas** — 27 conquistas rastreando cliques, geradores, bits totais, duelos e missões.

**Sala visual** — SVG animado que cresce conforme o progresso: monitores, rack de servidores, rig de GPU, gato no rack, orbe quântico e mais.

## Tecnologia

- HTML + CSS + JS vanilla, sem build, sem framework
- Fonte CRT: VT323 + Share Tech Mono (Google Fonts)
- Save automático via `localStorage`
- Efeito CRT com scanlines e vinheta

## Rodar

```
# abrir direto no navegador
start index.html
```

Ou servir local para evitar restrições de CORS em alguns navegadores:

```bash
npx serve .
# ou
python -m http.server
```
>>>>>>> Stashed changes
