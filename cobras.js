// =========================================================
// COBRAS ANIMADAS NO FUNDO (opcional)
// Realizado completamente com a ajuda do c
// Cobras ao estilo da tattoo de serpente, a mexer devagar nas zonas pretas.
// Para tirar: apaga a linha <script src="cobras.js"></script> no index.html.
// =========================================================


// ---------- 1. Definições (podes mudar à vontade) ----------

const COR_COBRA = "#1b1b20";   //cor das cobras (um pouco mais clara que o fundo);
const VELOCIDADE = 22;         //píxeis por segundo;
const SEGMENTOS = 46;          //tamanho da cobra (número de blocos do corpo);


// ---------- 2. Canvas por cima do fundo e por baixo do conteúdo ----------

const telaCobras = document.createElement("canvas");
telaCobras.setAttribute("aria-hidden", "true");
Object.assign(telaCobras.style, {
  position: "fixed",
  inset: "0",
  width: "100%",
  height: "100%",
  zIndex: "0",
  pointerEvents: "none"
});
document.body.prepend(telaCobras);

const ctxCobras = telaCobras.getContext("2d");
let larguraTela = 0, alturaTela = 0;

function ajustarTela() { //acerta o tamanho do canvas ao ecrã;
  const escala = Math.min(window.devicePixelRatio || 1, 1.5);
  larguraTela = telaCobras.clientWidth;
  alturaTela = telaCobras.clientHeight;
  telaCobras.width = Math.round(larguraTela * escala);
  telaCobras.height = Math.round(alturaTela * escala);
  ctxCobras.setTransform(escala, 0, 0, escala, 0, 0);
}


// ---------- 3. Onde andam as cobras ----------

function cobrasDoEcra() { //cada cobra dá voltas num circuito oval nas margens do ecrã;
  const w = larguraTela, h = alturaTela;
  const telemovel = w < 700;
  const margem = Math.max(110, (w - 1100) / 2);  //espaço livre ao lado do conteúdo;
  const largura = telemovel ? 20 : Math.max(30, Math.min(44, w * .028));

  //circuito em forma de pista: duas retas onduladas ligadas por duas curvas;
  const circuito = (cx, sentido, atraso) => {
    const raio = telemovel ? 40 : Math.max(largura * 1.7, Math.min(120, margem * .35));
    const meiaReta = h * .3;
    return {
      largura,
      sentido,
      atraso,
      cx,
      cy: h * .5,
      raio,
      meiaReta,
      curvas: telemovel ? 10 : 18,                       //tamanho das ondas nas retas;
      perimetro: 4 * meiaReta + 2 * Math.PI * raio
    };
  };

  const direita = circuito(telemovel ? w - 6 : w - margem / 2, 1, 0);
  const esquerda = circuito(margem / 2, -1, .5);

  return telemovel ? [direita] : [direita, esquerda];
}

function pontoNoCircuito(c, d) { //ponto do circuito a uma distância d do início;
  const reta = 2 * c.meiaReta;
  const curva = Math.PI * c.raio;
  const onda = (t) => c.curvas * Math.sin(Math.PI * t * Math.max(1, Math.round(reta / 220))); //zero nas pontas da reta;
  d = ((d % c.perimetro) + c.perimetro) % c.perimetro;

  if (d < reta) {                                    //reta da direita, a subir;
    const t = d / reta;
    return [c.cx + c.raio + onda(t), c.cy + c.meiaReta - reta * t];
  }
  d -= reta;
  if (d < curva) {                                   //curva de cima;
    const a = d / c.raio;
    return [c.cx + c.raio * Math.cos(a), c.cy - c.meiaReta - c.raio * Math.sin(a)];
  }
  d -= curva;
  if (d < reta) {                                    //reta da esquerda, a descer;
    const t = d / reta;
    return [c.cx - c.raio - onda(t), c.cy - c.meiaReta + reta * t];
  }
  d -= reta;
  const a = Math.PI + d / c.raio;                    //curva de baixo;
  return [c.cx + c.raio * Math.cos(a), c.cy + c.meiaReta - c.raio * Math.sin(a)];
}


// ---------- 4. Desenho de uma cobra ----------

const misturar = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; //ponto entre dois pontos;

function pontosDaCobra(cobra, tempo) { //posição de cada bloco do corpo neste instante;
  const passo = cobra.largura * .55;                                                 //distância entre blocos;
  const blocos = Math.max(16, Math.min(SEGMENTOS, Math.round(cobra.perimetro * .42 / passo))); //ocupa menos de meia volta;
  const dCabeca = cobra.atraso * cobra.perimetro + cobra.sentido * tempo * VELOCIDADE;

  const pontos = [];
  for (let i = 0; i <= blocos; i++) {
    pontos.push(pontoNoCircuito(cobra, dCabeca - cobra.sentido * i * passo));
  }
  return pontos;
}

function direcoes(pontos) { //para onde aponta cada bloco (frente e lado);
  return pontos.map((p, i) => {
    const antes = pontos[Math.max(0, i - 1)];
    const depois = pontos[Math.min(pontos.length - 1, i + 1)];
    let fx = antes[0] - depois[0], fy = antes[1] - depois[1];
    const d = Math.hypot(fx, fy) || 1;
    fx /= d; fy /= d;
    return { f: [fx, fy], n: [-fy, fx] };
  });
}

function desenharCobra(ctx, cobra, tempo) {
  const W = cobra.largura;
  const pontos = pontosDaCobra(cobra, tempo);
  const dir = direcoes(pontos);
  const N = pontos.length - 1;

  //largura de cada bloco (a cauda vai afinando);
  const larg = pontos.map((_, i) => W * (i > N - 10 ? .35 + .65 * (N - i) / 10 : 1));
  const lado = (i, s, extra = 0) => [ //ponto na borda do corpo;
    pontos[i][0] + dir[i].n[0] * s * (larg[i] / 2 + extra),
    pontos[i][1] + dir[i].n[1] * s * (larg[i] / 2 + extra)
  ];

  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = COR_COBRA;
  ctx.lineWidth = Math.max(1.5, W * .07);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  //plumas em caracol, em leque de 3 (ondulam um pouco);
  for (let i = 3; i < N - 8; i += 4) {
    const s = (i / 4) % 2 < 1 ? 1 : -1;
    const { f, n } = dir[i];
    const mexe = Math.sin(tempo * 1.5 + i) * W * .15;
    for (const recuo of [0, .45, .9]) {
      const base = lado(i + Math.round(recuo * 2), s);
      const ctrl = [base[0] + n[0] * s * (W * .9 + mexe) - f[0] * W * .3, base[1] + n[1] * s * (W * .9 + mexe) - f[1] * W * .3];
      const fim = [base[0] + n[0] * s * (W * 1.1 + mexe) - f[0] * W * (1.2 + recuo), base[1] + n[1] * s * (W * 1.1 + mexe) - f[1] * W * (1.2 + recuo)];
      ctx.beginPath();
      ctx.moveTo(...base);
      ctx.quadraticCurveTo(...ctrl, ...fim);
      ctx.arc(fim[0] + f[0] * W * .14, fim[1] + f[1] * W * .14, W * .14, Math.atan2(-f[1], -f[0]), Math.atan2(-f[1], -f[0]) + Math.PI * 1.6);
      ctx.stroke();
    }
  }

  //contorno do corpo (duas linhas, uma de cada lado);
  for (const s of [1, -1]) {
    ctx.beginPath();
    pontos.forEach((_, i) => ctx.lineTo(...lado(i, s)));
    ctx.stroke();
  }

  //blocos do corpo;
  for (let i = 0; i < N; i++) {
    const a = misturar(pontos[i], pontos[i + 1], .15);
    const b = misturar(pontos[i], pontos[i + 1], .85);
    const n = dir[i].n;
    const meia = Math.min(larg[i], larg[i + 1]) * .4;
    ctx.beginPath();
    ctx.moveTo(a[0] + n[0] * meia, a[1] + n[1] * meia);
    ctx.lineTo(b[0] + n[0] * meia, b[1] + n[1] * meia);
    ctx.lineTo(b[0] - n[0] * meia, b[1] - n[1] * meia);
    ctx.lineTo(a[0] - n[0] * meia, a[1] - n[1] * meia);
    ctx.closePath();
    ctx.fill();
  }

  //pontos nas bordas;
  for (let i = 1; i < N - 6; i += 2) {
    for (const s of [1, -1]) {
      const p = lado(i, s, W * .14);
      ctx.beginPath();
      ctx.arc(p[0], p[1], W * .05, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  //guizo na ponta da cauda;
  const fimCauda = pontos[N];
  const fc = dir[N].f;
  for (let k = 1; k <= 3; k++) {
    const t = W * (.22 - k * .04);
    const c = [fimCauda[0] - fc[0] * W * .3 * k, fimCauda[1] - fc[1] * W * .3 * k];
    ctx.fillRect(c[0] - t / 2, c[1] - t / 2, t, t);
  }

  //cabeça em degraus com olhos;
  const f0 = dir[0].f;
  const centro = [pontos[0][0] + f0[0] * W * .45, pontos[0][1] + f0[1] * W * .45];
  ctx.translate(...centro);
  ctx.rotate(Math.atan2(f0[1], f0[0]));
  const a = W * .8, b = W * .72, k = W * .2;
  ctx.strokeRect(-a, -b, a * 2, b * 2);                 //quadrado de fora;
  ctx.strokeRect(-a * .45, -b * .3, a * .9, b * .6);    //quadrado de dentro;
  [[-a, -b], [a - k, -b], [-a, b - k], [a - k, b - k]].forEach(([x, y]) => ctx.fillRect(x, y, k, k)); //cantos;
  for (const s of [1, -1]) {
    ctx.beginPath();
    ctx.arc(0, s * b * .62, W * .16, 0, Math.PI * 2);  //olho;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, s * b * .62, W * .06, 0, Math.PI * 2);  //pupila;
    ctx.fill();
  }
  ctx.fillRect(a, -b * .55, W * .25, W * .16);          //presas;
  ctx.fillRect(a, b * .55 - W * .16, W * .25, W * .16);

  ctx.restore();
}


// ---------- 5. Animação ----------

const paradas = matchMedia("(prefers-reduced-motion: reduce)").matches; //quem pede menos movimento vê-as paradas;

function desenharCobras(tempo) {
  ctxCobras.clearRect(0, 0, larguraTela, alturaTela);
  cobrasDoEcra().forEach((cobra) => desenharCobra(ctxCobras, cobra, tempo));
}

function animarCobras(ms) {
  desenharCobras(ms / 1000);
  requestAnimationFrame(animarCobras);
}

ajustarTela();
window.addEventListener("resize", ajustarTela);

if (paradas) desenharCobras(20);
else requestAnimationFrame(animarCobras);
