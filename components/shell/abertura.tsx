import { AberturaSaida } from "./abertura-saida";

/**
 * Tela de abertura do aplicativo instalado: fundo roxo neon com a logo B7.
 * Vem pronta no HTML (aparece antes do JS) e só é ligada no app da tela inicial,
 * uma vez por abertura. No navegador comum não aparece (teste com ?abertura).
 */
export function Abertura() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var d=document.documentElement,s=sessionStorage;if(/[?&]abertura/.test(location.search)||(matchMedia("(display-mode: standalone)").matches||navigator.standalone)&&!s.getItem("abertura")){d.dataset.abertura="1";s.setItem("abertura","1")}}catch(e){}`,
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
