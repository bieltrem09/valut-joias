'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renderiza no <body>, fora do <main> (que cria um contexto de empilhamento
 * com z-10). Sem isso, modais abertos dentro das páginas ficam por baixo do header.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
