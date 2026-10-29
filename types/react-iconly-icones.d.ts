// Ícones avulsos do react-iconly: importar um por um evita carregar o pacote inteiro (~500 kB).
declare module "react-iconly/dist/Icons/*.mjs" {
  import type { IconProps } from "react-iconly";
  const Icone: import("react").FC<IconProps>;
  export default Icone;
}
