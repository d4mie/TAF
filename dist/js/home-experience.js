/**
 * Homepage polish:
 * 1) Custom cursor + magnetic tile pull
 * 4) Sticky VISIONARY that shrinks as you scroll
 * (Grain + letterbox are CSS-only on .is-home)
 */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* —— Sticky VISIONARY —— */
  function initStickyTitle() {
    const sticky = document.getElementById('visionary-sticky');
    if (!sticky) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const compact = window.scrollY > 72;
      sticky.classList.toggle('is-compact', compact);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* —— Custom cursor + magnetic hover —— */
  function initCursorAndMagnetic() {
    if (reduceMotion || !finePointer) return;

    const cursor = document.getElementById('site-cursor');
    if (!cursor) return;

    document.body.classList.add('has-custom-cursor');

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const tip = { x: mouse.x, y: mouse.y };
    let hovering = false;
    let magnetic = false;
    let activeItem = null;
    let rafId = 0;

    const setVars = (el, x, y) => {
      if (!el) return;
      el.style.setProperty('--mx', `${x.toFixed(1)}px`);
      el.style.setProperty('--my', `${y.toFixed(1)}px`);
    };

    const clearMagnetic = () => {
      if (!activeItem) return;
      activeItem.classList.remove('is-magnetic');
      setVars(activeItem, 0, 0);
      activeItem = null;
      magnetic = false;
      cursor.classList.remove('is-magnetic');
      cursor.style.removeProperty('--cursor-accent');
    };

    const pullTile = (item, clientX, clientY) => {
      const tile = item.querySelector('.featured-tile');
      if (!tile) return;
      const rect = tile.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const strength = 0.14;
      const max = 14;
      const mx = Math.max(-max, Math.min(max, dx * strength));
      const my = Math.max(-max, Math.min(max, dy * strength));
      setVars(item, mx, my);
    };

    const bindTiles = () => {
      document.querySelectorAll('#featured-grid .featured-item').forEach((item) => {
        if (item.dataset.magneticBound === '1') return;
        item.dataset.magneticBound = '1';

        item.addEventListener('mouseenter', () => {
          clearMagnetic();
          activeItem = item;
          magnetic = true;
          item.classList.add('is-magnetic');
          cursor.classList.add('is-magnetic');
          const accent = getComputedStyle(item).getPropertyValue('--accent').trim();
          if (accent) cursor.style.setProperty('--cursor-accent', accent);
        });

        item.addEventListener('mousemove', (e) => {
          if (activeItem === item) pullTile(item, e.clientX, e.clientY);
        });

        item.addEventListener('mouseleave', () => {
          if (activeItem === item) clearMagnetic();
        });
      });
    };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!cursor.classList.contains('is-active')) {
        tip.x = mouse.x;
        tip.y = mouse.y;
        cursor.classList.add('is-active');
      }
    };

    const onOver = (e) => {
      const interactive = e.target.closest('a, button, [role="button"], input, textarea, select');
      hovering = Boolean(interactive);
      cursor.classList.toggle('is-hover', hovering || magnetic);
    };

    const onLeaveWindow = () => {
      cursor.classList.remove('is-active');
      clearMagnetic();
    };

    const tick = () => {
      tip.x += (mouse.x - tip.x) * 0.22;
      tip.y += (mouse.y - tip.y) * 0.22;
      cursor.style.transform = `translate3d(${tip.x}px, ${tip.y}px, 0)`;
      cursor.classList.toggle('is-hover', hovering || magnetic);
      rafId = window.requestAnimationFrame(tick);
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseleave', onLeaveWindow);
    document.addEventListener('home:featured-ready', bindTiles);
    bindTiles();
    rafId = window.requestAnimationFrame(tick);

    window.addEventListener(
      'beforeunload',
      () => {
        window.cancelAnimationFrame(rafId);
      },
      { once: true }
    );
  }

  document.addEventListener('DOMContentLoaded', () => {
    initStickyTitle();
    initCursorAndMagnetic();
  });
})();
