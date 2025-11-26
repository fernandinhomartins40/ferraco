/**
 * SCRIPT DE DIAGNÓSTICO - DETECTOR DE ELEMENTOS SOBREPOSTOS
 *
 * Cole este script no Console do DevTools para diagnosticar por que os cliques não funcionam
 *
 * Uso:
 * 1. Abra DevTools (F12)
 * 2. Cole todo este script no Console e pressione Enter
 * 3. Clique em qualquer item do menu do Header
 * 4. Veja os logs detalhados no console
 */

console.log('%c🔍 DETECTOR DE OVERLAY ATIVADO', 'background: #2bb931; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
console.log('Clique em qualquer item do menu do Header para diagnosticar...\n');

// Detectar todos os cliques na página
document.addEventListener('click', function(e) {
  console.group('%c🖱️ CLIQUE DETECTADO', 'background: #0544ad; color: white; padding: 5px;');

  // 1. Elemento que recebeu o clique
  console.log('%c1️⃣ Elemento clicado:', 'font-weight: bold; color: #2bb931;');
  console.log('  Tag:', e.target.tagName);
  console.log('  ID:', e.target.id || '(sem id)');
  console.log('  Classes:', e.target.className || '(sem classes)');
  console.log('  Texto:', e.target.textContent?.substring(0, 50) || '(sem texto)');
  console.log('  Elemento:', e.target);

  // 2. Verificar se é um botão do header
  const isHeaderButton = e.target.closest('header button');
  console.log('%c2️⃣ É botão do Header?', 'font-weight: bold; color: #2bb931;', isHeaderButton ? '✅ SIM' : '❌ NÃO');

  if (isHeaderButton) {
    console.log('  Botão encontrado:', isHeaderButton);
    console.log('  Texto do botão:', isHeaderButton.textContent);
  }

  // 3. Elementos na posição do clique
  const x = e.clientX;
  const y = e.clientY;
  console.log('%c3️⃣ Posição do clique:', 'font-weight: bold; color: #2bb931;', `x=${x}, y=${y}`);

  // Obter todos os elementos nessa posição (do topo até o fundo)
  const elementsAtPoint = [];
  let currentElement = document.elementFromPoint(x, y);

  while (currentElement) {
    elementsAtPoint.push({
      tag: currentElement.tagName,
      id: currentElement.id,
      classes: currentElement.className,
      zIndex: window.getComputedStyle(currentElement).zIndex,
      pointerEvents: window.getComputedStyle(currentElement).pointerEvents,
      position: window.getComputedStyle(currentElement).position
    });

    // Temporariamente ocultar para pegar o próximo elemento
    const display = currentElement.style.display;
    currentElement.style.display = 'none';
    currentElement = document.elementFromPoint(x, y);

    // Restaurar
    if (elementsAtPoint[elementsAtPoint.length - 1]) {
      const lastIndex = elementsAtPoint.length - 1;
      const elements = document.querySelectorAll(elementsAtPoint[lastIndex].tag);
      elements.forEach(el => {
        if (el.style.display === 'none') el.style.display = display;
      });
    }

    if (elementsAtPoint.length > 20) break; // Limite de segurança
  }

  console.log('%c4️⃣ Pilha de elementos na posição do clique (do topo ao fundo):', 'font-weight: bold; color: #2bb931;');
  elementsAtPoint.forEach((el, index) => {
    const emoji = index === 0 ? '👆' : '  ';
    console.log(`${emoji} ${index + 1}. <${el.tag}> id="${el.id}" class="${el.classes}" z-index="${el.zIndex}" pointer-events="${el.pointerEvents}"`);
  });

  // 5. Verificar se há elementos bloqueando
  const topElement = elementsAtPoint[0];
  if (topElement && topElement.tag !== 'BUTTON') {
    console.log('%c⚠️ PROBLEMA DETECTADO!', 'background: red; color: white; padding: 5px; font-weight: bold;');
    console.log(`  Um elemento <${topElement.tag}> está sobre o botão!`);
    console.log('  Este elemento está bloqueando os cliques.');
    console.log('  Solução: Adicionar "pointer-events: none" ao elemento bloqueador.');
  }

  // 6. Verificar Header
  const header = document.querySelector('header');
  if (header) {
    console.log('%c5️⃣ Informações do Header:', 'font-weight: bold; color: #2bb931;');
    console.log('  Atributo data-header-version:', header.getAttribute('data-header-version') || '❌ NÃO ENCONTRADO (versão antiga!)');
    console.log('  Z-index:', window.getComputedStyle(header).zIndex);
    console.log('  Position:', window.getComputedStyle(header).position);

    // Verificar botões
    const buttons = header.querySelectorAll('button');
    console.log('  Botões encontrados:', buttons.length);

    buttons.forEach((btn, i) => {
      const hasOnClick = btn.onclick !== null;
      const hasClickListener = btn.getAttribute('onclick') !== null;
      console.log(`  Botão ${i + 1}: "${btn.textContent.trim()}" - onClick: ${hasOnClick}, listener: ${hasClickListener}`);
    });
  }

  console.groupEnd();
}, true); // true = capture phase (pega eventos antes de bubbling)

// Detector de hover
let lastHoveredElement = null;
document.addEventListener('mousemove', function(e) {
  const element = document.elementFromPoint(e.clientX, e.clientY);

  if (element !== lastHoveredElement) {
    const isHeaderArea = element.closest('header');

    if (isHeaderArea) {
      console.log('%c🎯 Hover no Header', 'color: #0544ad;', {
        tag: element.tagName,
        id: element.id,
        text: element.textContent?.substring(0, 30),
        pointerEvents: window.getComputedStyle(element).pointerEvents
      });
    }

    lastHoveredElement = element;
  }
});

console.log('%c✅ Detector pronto! Agora clique em um item do menu.', 'background: #2bb931; color: white; padding: 5px;');
