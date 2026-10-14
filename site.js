// =========================================================
// FUNCIONAMENTO DO SITE
// O conteúdo (textos, trabalhos, produtos, estúdios) vem da pasta conteudo/.
// O Lang muda esse conteúdo no painel, sem mexer aqui.
// =========================================================


// ---------- 1. Conteúdo (é preenchido quando os ficheiros carregam) ----------

let SITE = {};       //textos e contactos (conteudo/site.json);
let TRABALHOS = [];  //tattoos (conteudo/trabalhos.json);
let PRODUTOS = [];   //loja (conteudo/produtos.json);
let ESTUDIOS = [];   //estúdios (conteudo/estudios.json);


// ---------- 2. Atalhos ----------

const $ = (id) => document.getElementById(id); //vai buscar um elemento pelo id;

function limpo(texto) { //evita que símbolos como < estraguem a página;
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emLingua(texto, l = lingua) { //devolve o texto numa só língua;
  if (texto && typeof texto === "object") return l === "en" ? (texto.en || texto.pt || "") : (texto.pt || "");
  return texto ?? "";
}

function duasLinguas(texto) { //escreve o texto nas duas línguas (o CSS mostra só uma);
  if (!texto || typeof texto !== "object") return limpo(texto);
  return `<span lang="pt">${limpo(emLingua(texto, "pt"))}</span><span lang="en">${limpo(emLingua(texto, "en"))}</span>`;
}

function paragrafos(texto) { //cada linha do texto passa a ser um parágrafo;
  const dividir = (l) => emLingua(texto, l).split("\n").filter((linha) => linha.trim());
  return ["pt", "en"]
    .map((l) => dividir(l).map((linha) => `<p lang="${l}">${limpo(linha)}</p>`).join(""))
    .join("");
}

function procurar(caminho) { //vai buscar um texto ao SITE (ex.: "inicio.frase");
  return caminho.split(".").reduce((obj, chave) => (obj ? obj[chave] : undefined), SITE);
}

function euro(valor) { //escreve um preço em euros (ex.: 20,00 €);
  return Number(valor || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function linkWhatsApp(texto) { //link que abre o WhatsApp com a mensagem escrita;
  return `https://wa.me/${SITE.contactos.whatsapp}?text=${encodeURIComponent(texto)}`;
}


// ---------- 3. Mensagens que o cliente envia ao Lang ----------

function mensagens() {
  const { dono, nome } = SITE.contactos;
  return {
    pt: {
      pedido: `Olá ${dono}! Quero fazer este pedido no ${nome}:`,
      nome: "Nome",
      telefone: "Telemóvel",
      notas: "Notas",
      tattoo: `Olá ${dono}! Vi o teu trabalho no ${nome} e queria marcar uma tattoo. A minha ideia é: `,
      estudio: `Olá ${dono}! Queria marcar uma tattoo no estúdio: `
    },
    en: {
      pedido: `Hi ${dono}! I would like to order this from ${nome}:`,
      nome: "Name",
      telefone: "Phone",
      notas: "Notes",
      tattoo: `Hi ${dono}! I saw your work on ${nome} and would like to book a tattoo. My idea is: `,
      estudio: `Hi ${dono}! I would like to book a tattoo at this studio: `
    }
  }[lingua];
}


// ---------- 4. Estado do site ----------

const PAGINAS = ["inicio", "work", "loja", "studio"];

let lingua = "pt";      //língua escolhida;
let pagina = "inicio";  //página aberta;
let filtro = "todos";   //filtro da loja;
let carrinho = [];      //produtos no carrinho: { nome, opcao, qtd };

try {
  lingua = localStorage.getItem("lang-space-lingua") || "pt";
  carrinho = JSON.parse(localStorage.getItem("lang-space-carrinho")) || [];
} catch (e) {}

function guardar() { //guarda a língua e o carrinho no browser;
  try {
    localStorage.setItem("lang-space-lingua", lingua);
    localStorage.setItem("lang-space-carrinho", JSON.stringify(carrinho));
  } catch (e) {}
}

const produtoDe = (c) => PRODUTOS.find((p) => p.nome === c.nome); //encontra o produto pelo nome;


// ---------- 5. Textos das páginas ----------

function escreverTextos() {
  //todos os elementos com data-texto no index.html;
  document.querySelectorAll("[data-texto]").forEach((el) => {
    el.innerHTML = duasLinguas(procurar(el.dataset.texto));
  });

  const inicio = SITE.inicio;

  //quem é o Lang;
  $("sobreTexto").innerHTML = paragrafos(inicio.sobreTexto);
  $("fotoLang").innerHTML = inicio.sobreFoto
    ? `<img src="${limpo(inicio.sobreFoto)}" alt="${limpo(SITE.contactos.dono)}">`
    : limpo(SITE.contactos.dono).charAt(0);

  //caixas extra (se não houver, a secção fica escondida);
  const caixas = inicio.caixas || [];
  $("caixasSecao").hidden = caixas.length === 0;
  $("caixas").innerHTML = caixas.map((c) => `
    <article class="caixa">
      ${c.foto ? `<img src="${limpo(c.foto)}" alt="">` : ""}
      <div class="caixa-texto">
        <h3>${duasLinguas(c.titulo)}</h3>
        ${paragrafos(c.texto)}
      </div>
    </article>`).join("");

  //contactos no rodapé;
  const wa = String(SITE.contactos.whatsapp);
  $("rodapeWa").textContent = "+" + wa.replace(/^(\d{3})(\d{3})(\d{3})(\d+)$/, "$1 $2 $3 $4");
  $("rodapeIg").textContent = "@" + SITE.contactos.instagram;
}


// ---------- 6. Cartões de trabalhos e produtos ----------

function cartaoTrabalho(t) {
  const imagem = t.foto
    ? `<img src="${limpo(t.foto)}" alt="${limpo(emLingua(t.titulo, "pt"))}">`
    : `<span lang="pt">Foto do trabalho</span><span lang="en">Work photo</span>`;

  return `
    <figure class="obra">
      <div class="img">${imagem}</div>
      <figcaption>${duasLinguas(t.titulo)}<span>${limpo(t.ano)}</span></figcaption>
    </figure>`;
}

function cartaoProduto(p, i, prefixo) {
  const nome = emLingua(p.nome, "pt");
  const imagem = p.foto
    ? `<img src="${limpo(p.foto)}" alt="${limpo(nome)}">`
    : limpo(nome.charAt(0));

  const opcoes = (p.opcoes || []).map((o) => `<option>${limpo(o)}</option>`).join("");
  const escolha = opcoes
    ? `<select id="${prefixo}op-${i}" aria-label="${limpo(nome)}">${opcoes}</select>`
    : "";

  return `
    <article class="produto">
      <div class="foto">${imagem}</div>
      <div class="info">
        <span class="tipo">${limpo(p.tipo)}</span>
        <h3>${duasLinguas(p.nome)}</h3>
        <p class="desc">${duasLinguas(p.descricao)}</p>
        <span class="preco">${euro(p.preco)}</span>
        ${escolha}
        <button class="adicionar" data-i="${i}" data-prefixo="${prefixo}">
          <span lang="pt">Adicionar</span><span lang="en">Add</span>
        </button>
      </div>
    </article>`;
}

function desenharTrabalhos() {
  $("galeria").innerHTML = TRABALHOS.map(cartaoTrabalho).join("");
  $("workPreview").innerHTML = TRABALHOS.slice(0, 4).map(cartaoTrabalho).join("");
}

function desenharLoja() {
  $("lojaPreview").innerHTML = PRODUTOS.slice(0, 4).map((p, i) => cartaoProduto(p, i, "d")).join("");

  $("grelha").innerHTML = PRODUTOS
    .map((p, i) => (filtro === "todos" || p.tipo === filtro) ? cartaoProduto(p, i, "l") : "")
    .join("");

  //marca o filtro ativo;
  document.querySelectorAll("[data-filtro]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.filtro === filtro);
  });
}


// ---------- 7. My Studio: mapa e estúdios ----------

//contorno simples de Portugal continental (longitude, latitude);
const PORTUGAL = [
  [-8.87, 41.87], [-8.62, 42.05], [-8.17, 42.15], [-8.08, 41.85], [-7.6, 41.87], [-7.2, 41.88],
  [-6.85, 41.95], [-6.55, 41.95], [-6.2, 41.6], [-6.45, 41.25], [-6.93, 41.02], [-6.8, 40.85],
  [-6.84, 40.3], [-7.0, 40.2], [-7.02, 39.67], [-7.53, 39.66], [-7.3, 39.45], [-7.2, 39.1],
  [-7.0, 38.88], [-7.3, 38.45], [-7.0, 38.2], [-7.3, 37.95], [-7.5, 37.55], [-7.4, 37.18],
  [-7.93, 37.0], [-8.6, 37.1], [-8.97, 37.02], [-8.8, 37.4], [-8.88, 37.95], [-8.8, 38.45],
  [-9.2, 38.42], [-9.25, 38.68], [-9.5, 38.78], [-9.42, 39.1], [-9.38, 39.37], [-9.07, 39.6],
  [-8.9, 40.15], [-8.75, 40.6], [-8.67, 41.15], [-8.78, 41.5], [-8.87, 41.87]
];

function ponto([lng, lat]) { //converte coordenadas num ponto do desenho;
  return [((lng + 9.7) * 76).toFixed(1), ((42.25 - lat) * 100).toFixed(1)];
}

function desenharStudio() {
  const contorno = PORTUGAL.map((c) => ponto(c).join(",")).join(" ");

  const pins = ESTUDIOS.map((s, k) => {
    const [x, y] = ponto([Number(s.lng), Number(s.lat)]);
    return `<g class="pin"><circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y}">${k + 1}</text></g>`;
  }).join("");

  $("mapa").innerHTML = `
    <svg viewBox="0 0 280 540" role="img" aria-label="Portugal">
      <polygon class="pais" points="${contorno}"/>
      ${pins}
      <text class="legenda" x="200" y="520">PORTUGAL</text>
    </svg>`;

  $("estudios").innerHTML = ESTUDIOS.map((s, k) => {
    const linkMapa = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${s.nome}, ${s.morada}, ${s.cidade}`);
    const linkMarcar = linkWhatsApp(`${mensagens().estudio}${s.nome} (${s.cidade})`);

    return `
      <article class="estudio">
        <span class="num">${k + 1}</span>
        <h3>${limpo(s.nome)}</h3>
        <span class="cidade">${limpo(s.cidade)}</span>
        <p>${limpo(s.morada)} · ${duasLinguas(s.dias)}</p>
        <div class="links">
          <a href="${linkMapa}" target="_blank" rel="noopener"><span lang="pt">Abrir no Google Maps</span><span lang="en">Open in Google Maps</span></a>
          <a href="${linkMarcar}" target="_blank" rel="noopener"><span lang="pt">Marcar aqui</span><span lang="en">Book here</span></a>
        </div>
      </article>`;
  }).join("");
}


// ---------- 8. Língua ----------

function mudarLingua(nova) {
  lingua = nova;
  document.documentElement.lang = lingua === "pt" ? "pt-PT" : "en-GB"; //o CSS esconde a outra língua;

  document.querySelectorAll("[data-lingua]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.lingua === lingua);
  });

  //as mensagens do WhatsApp também mudam de língua;
  $("marcarWa").href = linkWhatsApp(mensagens().tattoo);
  desenharStudio();
  atualizarCarrinho();
  guardar();
}


// ---------- 9. Navegação entre páginas ----------

function ir(destino) {
  pagina = destino;

  PAGINAS.forEach((p) => {
    $(p).hidden = p !== destino;
  });

  //sublinha a página aberta no menu;
  document.querySelectorAll("nav button").forEach((b) => {
    if (b.dataset.ir === destino) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });

  window.scrollTo(0, 0);
  desenharPadroes();
}


// ---------- 10. Cliques em todo o site ----------

document.addEventListener("click", (e) => {
  const botaoPagina = e.target.closest("[data-ir]");
  const botaoLingua = e.target.closest("[data-lingua]");
  const botaoFiltro = e.target.closest("[data-filtro]");
  const botaoAdicionar = e.target.closest(".adicionar");

  if (botaoPagina) ir(botaoPagina.dataset.ir);
  if (botaoLingua) mudarLingua(botaoLingua.dataset.lingua);

  if (botaoFiltro) {
    filtro = botaoFiltro.dataset.filtro;
    desenharLoja();
  }

  if (botaoAdicionar) adicionar(botaoAdicionar);
});


// ---------- 11. Carrinho ----------

function adicionar(botao) {
  const i = Number(botao.dataset.i);
  const nome = PRODUTOS[i].nome;
  const escolha = $(botao.dataset.prefixo + "op-" + i);
  const opcao = escolha ? escolha.value : "";
  const existente = carrinho.find((c) => c.nome === nome && c.opcao === opcao);

  if (existente) existente.qtd++;
  else carrinho.push({ nome, opcao, qtd: 1 });

  guardar();
  atualizarCarrinho();

  //confirmação rápida no botão;
  const textoOriginal = botao.innerHTML;
  botao.innerHTML = `<span lang="pt">Adicionado ✓</span><span lang="en">Added ✓</span>`;
  botao.classList.add("ok");

  setTimeout(() => {
    botao.innerHTML = textoOriginal;
    botao.classList.remove("ok");
  }, 1200);
}

function total() {
  return carrinho.reduce((soma, c) => soma + Number(produtoDe(c).preco) * c.qtd, 0);
}

function mensagem() { //texto do pedido que vai por WhatsApp ou Instagram;
  const msg = mensagens();
  const nome = $("nome").value.trim();
  const telefone = $("telefone").value.trim();
  const notas = $("notas").value.trim();

  const linhas = carrinho.map((c) => {
    const p = produtoDe(c);
    const opcao = c.opcao ? ` (${c.opcao})` : "";
    return `• ${c.qtd}x ${emLingua(p.nome)}${opcao} — ${euro(p.preco * c.qtd)}`;
  });

  let texto = `${msg.pedido}\n\n${linhas.join("\n")}\n\nTotal: ${euro(total())}`;
  if (nome) texto += `\n${msg.nome}: ${nome}`;
  if (telefone) texto += `\n${msg.telefone}: ${telefone}`;
  if (notas) texto += `\n${msg.notas}: ${notas}`;

  return texto;
}

function atualizarCarrinho() {
  const vazio = carrinho.length === 0;

  $("contador").textContent = carrinho.reduce((soma, c) => soma + c.qtd, 0);
  $("total").textContent = euro(total());

  //lista de produtos;
  $("itens").innerHTML = vazio
    ? `<p class="vazio"><span lang="pt">O carrinho está vazio.</span><span lang="en">Your cart is empty.</span></p>`
    : carrinho.map((c, k) => {
        const p = produtoDe(c);
        const opcao = c.opcao ? `<div class="op">${limpo(c.opcao)}</div>` : "";

        return `
          <div class="item">
            <div class="nome">${duasLinguas(p.nome)}${opcao}</div>
            <div class="sub">${euro(p.preco * c.qtd)}</div>
            <div class="qtd">
              <button data-k="${k}" data-mudar="-1" aria-label="−1">−</button>
              <span>${c.qtd}</span>
              <button data-k="${k}" data-mudar="1" aria-label="+1">+</button>
            </div>
          </div>`;
      }).join("");

  //botões de envio;
  $("enviarWa").setAttribute("aria-disabled", vazio);
  $("enviarIg").setAttribute("aria-disabled", vazio);
  $("enviarWa").href = linkWhatsApp(mensagem());
  $("enviarIg").href = `https://ig.me/m/${SITE.contactos.instagram}`;
}

//botões + e − de cada produto;
$("itens").addEventListener("click", (e) => {
  const botao = e.target.closest("[data-mudar]");
  if (!botao) return;

  const k = Number(botao.dataset.k);
  carrinho[k].qtd += Number(botao.dataset.mudar);
  if (carrinho[k].qtd <= 0) carrinho.splice(k, 1);

  guardar();
  atualizarCarrinho();
});

//atualiza a mensagem quando o cliente escreve;
["nome", "telefone", "notas"].forEach((id) => {
  $(id).addEventListener("input", atualizarCarrinho);
});

//Instagram: copia a mensagem antes de abrir a conversa;
$("enviarIg").addEventListener("click", () => {
  copiar(mensagem());
  mostrarAviso();
});

function copiar(texto) { //copia texto; se o browser não deixar, usa o método antigo;
  const metodoAntigo = () => {
    const caixa = document.createElement("textarea");
    caixa.value = texto;
    document.body.appendChild(caixa);
    caixa.select();
    try { document.execCommand("copy"); } catch (e) {}
    caixa.remove();
  };

  try { navigator.clipboard.writeText(texto).catch(metodoAntigo); }
  catch (e) { metodoAntigo(); }
}

//abrir e fechar o carrinho;
function mostrarCarrinho(mostrar) {
  $("painel").hidden = !mostrar;
  $("sombra").hidden = !mostrar;
}

$("abrir").addEventListener("click", () => mostrarCarrinho(true));
$("fechar").addEventListener("click", () => mostrarCarrinho(false));
$("sombra").addEventListener("click", () => mostrarCarrinho(false));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") mostrarCarrinho(false);
});

//aviso "Mensagem copiada" durante 3 segundos;
let tempoAviso;

function mostrarAviso() {
  $("toast").hidden = false;
  clearTimeout(tempoAviso);
  tempoAviso = setTimeout(() => { $("toast").hidden = true; }, 3000);
}


// ---------- 12. Padrões geométricos (estilo das tattoos) ----------

function pontoCurva(c, t) { //ponto numa curva entre três pontos;
  const u = 1 - t;
  return [
    u * u * c[0][0] + 2 * u * t * c[1][0] + t * t * c[2][0],
    u * u * c[0][1] + 2 * u * t * c[1][1] + t * t * c[2][1]
  ];
}

function curva(ctx, c, grossura) { //desenha uma curva;
  ctx.beginPath();
  ctx.moveTo(...c[0]);
  ctx.quadraticCurveTo(...c[1], ...c[2]);
  ctx.lineWidth = grossura;
  ctx.stroke();
}

function barra(ctx, a, b, largInicio, largFim) { //barra afunilada com um degrau a meio;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const comp = Math.hypot(dx, dy);
  const ux = dx / comp, uy = dy / comp; //direção da barra;
  const nx = -uy, ny = ux;              //direção perpendicular;

  const P = (s, w) => [a[0] + ux * comp * s + nx * w, a[1] + uy * comp * s + ny * w];

  const pedaco = (s0, s1, w0, w1) => {
    ctx.beginPath();
    [P(s0, w0), P(s1, w1), P(s1, -w1), P(s0, -w0)].forEach((p) => ctx.lineTo(...p));
    ctx.closePath();
    ctx.fill();
  };

  pedaco(.06, .6, largInicio, largInicio + (largFim - largInicio) * .6);
  pedaco(.66, .93, largFim * 1.15, largFim * 1.15);
}

function peito(ctx, cx, topo, tamanho, cor) { //ornamento em V (peça do peito);
  ctx.save();
  ctx.translate(cx, topo);
  ctx.scale(tamanho, tamanho);
  ctx.fillStyle = ctx.strokeStyle = cor;

  //lado esquerdo e lado direito (espelhado);
  for (const lado of [-1, 1]) {
    ctx.save();
    ctx.scale(lado, 1);

    const fora = [[.48, 0], [.45, .55], [.03, 1.02]];
    const dentro = [[.15, .04], [.17, .5], [.03, .84]];
    curva(ctx, fora, .035);
    curva(ctx, dentro, .02);

    //costelas;
    for (let k = 0; k < 15; k++) {
      const t = (k + .5) / 15;
      barra(ctx, pontoCurva(dentro, t), pontoCurva(fora, Math.max(0, t - .05)), .006, .016 * (1 - t * .5));
    }

    //coleira;
    for (let k = 0; k < 9; k++) {
      ctx.fillRect(.1 + k * .042, -.08, .024, .055);
    }

    //asa interior;
    for (let k = 0; k < 10; k++) {
      const p = pontoCurva(dentro, .1 + k * .08);
      barra(ctx, [.04, p[1] + .05], [p[0] - .025, p[1] - .01], .004, .008);
    }

    ctx.restore();
  }

  //espinha central;
  ctx.lineWidth = .012;
  for (let k = 0; k < 12; k++) {
    const y = .2 + k * .055;
    ctx.beginPath();
    ctx.moveTo(-.03, y);
    ctx.lineTo(0, y + .035);
    ctx.lineTo(.03, y);
    ctx.stroke();
  }

  //três pontos no topo;
  [0, .045, .085].forEach((y, k) => {
    ctx.beginPath();
    ctx.arc(0, y, .016 - k * .003, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function espiral(ctx, cx, cy, raio, cor, voltas) { //espiral com raios (peça do braço);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = ctx.strokeStyle = cor;

  const inicio = raio * .05;
  const fim = voltas * 2 * Math.PI;
  const b = Math.log(raio / inicio) / fim;
  const r = (angulo) => inicio * Math.exp(b * angulo);

  //linha da espiral;
  ctx.beginPath();
  for (let a = 0; a <= fim; a += .04) {
    ctx.lineTo(r(a) * Math.cos(a), r(a) * Math.sin(a));
  }
  ctx.lineWidth = raio * .022;
  ctx.stroke();

  //raios entre as voltas;
  for (let a = Math.PI * 1.5; a <= fim; a += .13) {
    const r1 = r(a);
    const r2 = Math.min(r(a + 2 * Math.PI), raio * 1.15);
    const c = Math.cos(a), s = Math.sin(a);
    barra(ctx, [r1 * c, r1 * s], [r2 * c, r2 * s], r1 * .012, r2 * .028);
  }

  //anel exterior;
  ctx.beginPath();
  ctx.arc(0, 0, raio * 1.2, 0, Math.PI * 2);
  ctx.lineWidth = raio * .012;
  ctx.stroke();

  ctx.restore();
}

function preparar(canvas) { //ajusta o canvas ao tamanho e nitidez do ecrã;
  const escala = Math.min(window.devicePixelRatio || 1, 2);
  const caixa = canvas.getBoundingClientRect();

  canvas.width = Math.round(caixa.width * escala);
  canvas.height = Math.round(caixa.height * escala);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  ctx.clearRect(0, 0, caixa.width, caixa.height);

  return [ctx, caixa.width, caixa.height];
}

function desenharPadroes() { //fundo de todo o site + espiral dourada do início;
  const css = getComputedStyle(document.documentElement);
  const corPadrao = css.getPropertyValue("--padrao").trim();
  const corDourada = css.getPropertyValue("--padrao-dourado").trim();

  //fundo;
  let [ctx, w, h] = preparar($("geoFundo"));
  peito(ctx, w / 2, h * .1, Math.min(w * .95, h * .95, 1100), corPadrao);
  espiral(ctx, -w * .02, h * .98, Math.min(w, h) * .32, corPadrao, 3);

  //espiral do início;
  if ($("inicio").hidden) return;

  [ctx, w, h] = preparar($("geoHero"));
  const telemovel = w < 700;
  ctx.globalAlpha = telemovel ? .6 : 1;

  if (telemovel) espiral(ctx, w * .95, h * .5, w * .55, corDourada, 3);
  else espiral(ctx, w * .87, h * .5, Math.min(h * .62, w * .3), corDourada, 3);
}


// ---------- 13. Arranque ----------

async function carregarConteudo() { //lê os 4 ficheiros da pasta conteudo/;
  const ler = (nome) => fetch(`conteudo/${nome}.json`, { cache: "no-cache" }).then((r) => r.json());
  [SITE, TRABALHOS, PRODUTOS, ESTUDIOS] = await Promise.all(["site", "trabalhos", "produtos", "estudios"].map(ler));
}

async function iniciar() {
  try {
    await carregarConteudo();
  } catch (e) {
    document.body.insertAdjacentHTML("afterbegin",
      `<p class="erro-carregar">Não foi possível carregar o conteúdo. Abre o site com o Live Server (botão Go Live).</p>`);
    return;
  }

  carrinho = carrinho.filter(produtoDe); //tira produtos que já não existem;

  //abre logo a página pedida no link (ex.: site.pt/#loja);
  const paginaDoLink = location.hash.slice(1);
  if (PAGINAS.includes(paginaDoLink)) pagina = paginaDoLink;

  escreverTextos();
  desenharTrabalhos();
  desenharLoja();
  mudarLingua(lingua);
  ir(pagina);

  //redesenha quando as letras acabam de carregar;
  if (document.fonts) document.fonts.ready.then(desenharPadroes);
}

//redesenha os padrões quando a janela muda de tamanho;
let tempoResize;
window.addEventListener("resize", () => {
  clearTimeout(tempoResize);
  tempoResize = setTimeout(desenharPadroes, 150);
});

iniciar();
