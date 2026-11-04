# IMAGE_PROMPTS: Zero Um CT Americana

**Prioridade:** fotos reais da Zero Um (salão, drone, Sala Recovery, equipe) valem mais do que qualquer imagem gerada. Use estes prompts só para o que não der para fotografar, ou como briefing para o fotógrafo.

**Como trocar um placeholder:** salve o arquivo em `public/photos/` (de preferência com 2048px ou mais de largura) e preencha `src` no slot correspondente em `src/content/media.ts`. O `next/image` gera AVIF, WebP e os tamanhos 640/1280/2048 sozinho.

**Tratamento único para todas as fotos:** pretos profundos, levemente dessaturadas, com um toque de luz vermelha (fita de LED ou rim light).

## Bloco de estilo (anexar a TODOS os prompts)

```
editorial fitness photography, shot on Sony A1, 35mm f/1.4 or 85mm f/1.8, hard directional side light with deep black shadows, subtle red practical LED light as rim light, large modern Brazilian gym with black rubber floor and dark steel equipment, real Brazilian people with natural skin texture, visible pores, real sweat, chalk on hands, slight motion blur on moving limbs, fine 35mm film grain, desaturated grade with crushed blacks and red accents, no text, no logos, no watermark, photorealistic, not CGI
```

**Negativo:** `plastic skin, airbrushed, oversaturated, cartoon, 3d render, deformed hands, extra fingers, bent barbell, warped plates, text, logo, watermark, pink dumbbells, stock photo smile, posing at camera`

## Shot list (equilíbrio entre mulheres e homens)

| Slot (`media.ts`) | Proporção | Onde aparece | Prompt (+ bloco de estilo) |
|---|---|---|---|
| `hero-bg` | 16:9 | Hero (fundo) | empty dark gym, long rows of squat racks in perspective, red LED strip along the ceiling, haze. Deixe o terço superior com pouca informação: o logo ZEROUM fica por cima. |
| `hero-athlete-f` | 4:5, **PNG com fundo transparente** | Hero (recorte na frente do logo) | strong Brazilian woman in her late 20s at the bottom of a heavy barbell back squat, black training top, intense focus, isolated subject with clean edges |
| `hero-athlete-m` | 4:5, PNG transparente | Hero (2º slide/alternativa) | muscular Brazilian man in his 30s mid conventional deadlift, black sleeveless shirt, isolated subject with clean edges |
| `estrutura-drone` | 21:9 | Home e /estrutura | aerial drone shot of a large industrial gym building at dusk, lights on inside (**o Instagram já tem esse material**) |
| `estrutura-peso-livre` | 3:4 | Estrutura | rack of dumbbells up to heavy weights, close-up, red reflection on chrome |
| `estrutura-maquinas` | 4:5 | Estrutura | long row of plate-loaded machines in a huge gym, symmetrical, night |
| `estrutura-cardio` | 1:1 | Estrutura | treadmills facing tall windows at 4am, one woman running alone |
| `estrutura-recovery` | 4:5 | Estrutura | recovery room with ice bath tub, massage guns and foam rollers, calm dim light |
| `estrutura-gelo` | 1:1 | Estrutura | ice being scooped from a commercial ice machine into a tub, frost detail |
| `estrutura-vestiario` | 3:4 | Estrutura | clean modern locker room, black tiles, wood benches, warm light |
| `estrutura-recepcao` | 4:5 | Estrutura | modern gym reception desk at night, black and red details, turnstile |
| `estrutura-estacionamento` | 1:1 | Estrutura (oculto até confirmar) | gym parking lot at night, building facade lit |
| `prof-01` … `prof-04` | 3:4 | Professores | portrait of a Brazilian strength coach (2 women, 2 men, varied ages and ethnicities), arms crossed or chalking hands, looking slightly off camera, gym bokeh. **Usar as fotos reais da equipe.** |
| `resultados` | 16:9 | Resultados ("TODO DIA") | woman pulling a heavy sumo deadlift, extreme effort face, dark background, red rim light. Deixe a faixa inferior livre: o texto vermelho vaza por cima. |
| `madrugada` | 16:9 | /horarios | man training alone at 3am under a single overhead light, clock visible on the wall |
| `cta` | 16:9 | CTA final | mixed group of men and women fist-bumping after a workout, candid, not posed. Pessoas no terço direito (o texto fica à esquerda). |
| `footer` | 21:9 | Footer (logo gigante por cima) | wide shot of the gym floor at 5am, few people training, blue-hour light mixed with red LEDs |
| `evento-halloween`, `evento-sorteio`, `evento-inauguracao` | 4:5 | Comunidade | **usar as artes reais dos posts do Instagram** |
| `antes`, `depois` | 4:5 | Slider antes/depois | **somente fotos reais, com autorização por escrito do aluno** |
