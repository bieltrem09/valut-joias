import { AberturaSaida } from "./abertura-saida";

/**
 * Tela de abertura do aplicativo instalado: fundo roxo neon com a logo B7.
 * Vem pronta no HTML (aparece antes do JS) e liga sempre que o app abre no celular
 * (instalado ou pelo navegador do celular). No computador não aparece (teste com ?abertura).
 */
export function Abertura() {
  return (
    <>
      {/* O fundo já vem junto com a página: a abertura não aparece "vazia" no primeiro instante. */}
      <link rel="preload" as="image" href="/app/abertura-roxo.webp" type="image/webp" fetchPriority="high" />
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var m=function(q){return matchMedia(q).matches},app=m("(display-mode: standalone)")||m("(display-mode: fullscreen)")||m("(display-mode: minimal-ui)")||navigator.standalone,cel=m("(pointer: coarse)")&&m("(max-width: 900px)");if(/[?&]abertura/.test(location.search)||app||cel){document.documentElement.dataset.abertura="1";window.__aberturaDesde=performance.now()}}catch(e){}`,
        }}
      />
      <div id="abertura" aria-hidden className="abertura">
        <div className="abertura-fundo" />
        <div className="abertura-cor" />
        <div className="abertura-veu" />
        <div className="abertura-centro">
          <div className="abertura-icone">
            <svg viewBox="12 12 42 38" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ab-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" />
                  <stop offset=".55" stopColor="#efe6ff" />
                  <stop offset="1" stopColor="#9a5cff" />
                </linearGradient>
                <linearGradient id="ab-s" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#e6d4ff" />
                  <stop offset="1" stopColor="#a148ff" />
                </linearGradient>
              </defs>
              <path
                fill="url(#ab-g)"
                fillRule="evenodd"
                d="M15 15h14.5a8 8 0 0 1 5.6 13.7A9.5 9.5 0 0 1 31 47H15zM21 21v6.2h8a3.1 3.1 0 0 0 0-6.2zM21 32.6v8.6h9.6a4.3 4.3 0 0 0 0-8.6z"
              />
              <path fill="url(#ab-s)" d="M38.5 15H51v4.6L44.4 35h-5.6l6.3-15.4h-6.6z" />
            </svg>
          </div>
          <p className="abertura-nome">Basik7</p>
          <p className="abertura-sub">Placas de avaliação Google</p>
        </div>
        <div className="abertura-carga">
          <i />
        </div>
        <p className="abertura-rodape">Painel de vendas</p>
      </div>
      <AberturaSaida />
    </>
  );
}
