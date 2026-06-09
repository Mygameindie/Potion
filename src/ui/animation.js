
// ===== Animation Pack: Brew Progress, Overlay Fade, Transform Flash =====
// Usage:
//  - Animation.startBrew(9000, onDone)  // 9s bar
//  - Animation.transformForm(() => { ...load new form... }, { flashes: 3, period: 300 })
//  - Animation.fadeIn(elem) / Animation.fadeOut(elem)

const Animation = (() => {
  let brewTimer = null;
  let brewInFlight = false;

  // Ensure DOM nodes exist
  function ensureBrewNodes() {
    let wrap = document.getElementById('brew-progress');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'brew-progress';
      const bar = document.createElement('div');
      bar.className = 'bar';
      wrap.appendChild(bar);
      document.body.appendChild(wrap);
    }
    return wrap;
  }

  function startBrew(durationMs = 9000, onComplete = () => {}) {
    if (brewInFlight) cancelBrew(); // reset if already running
    const wrap = ensureBrewNodes();
    const bar = wrap.querySelector('.bar');

    // reset
    wrap.classList.add('show');
    bar.style.transition = 'none';
    bar.style.width = '0%';
    // force reflow so next transition applies
    void bar.offsetWidth;

    // animate
    brewInFlight = true;
    bar.style.transition = `width ${durationMs}ms linear`;
    bar.style.width = '100%';

    brewTimer = window.setTimeout(() => {
      wrap.classList.remove('show');
      bar.style.transition = 'none';
      bar.style.width = '0%';
      brewInFlight = false;
      brewTimer = null;
      try { onComplete(); } catch(e) { console.error(e); }
    }, durationMs);
  }

  function cancelBrew() {
    const wrap = document.getElementById('brew-progress');
    if (brewTimer) {
      clearTimeout(brewTimer);
      brewTimer = null;
    }
    if (wrap) {
      wrap.classList.remove('show');
      const bar = wrap.querySelector('.bar');
      if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
      }
    }
    brewInFlight = false;
  }

  // Screen flash then call cb to switch form
  function transformForm(cbSwitchForm, opts = {}) {
    const flashes = Math.max(1, opts.flashes ?? 3);
    const period = Math.max(80, opts.period ?? 300); // per flash
    const total = flashes * period;

    // ensure node
    let flash = document.getElementById('flash-black');
    if (!flash) {
      flash = document.createElement('div');
      flash.id = 'flash-black';
      document.body.appendChild(flash);
    }
    flash.style.setProperty('--flash-count', String(flashes));
    flash.classList.add('flash-active');

    // switch form mid-sequence (slightly before the end feels snappier)
    const switchAt = Math.max(0, total - Math.floor(period * 0.6));
    window.setTimeout(() => {
      try { cbSwitchForm?.(); } catch (e) { console.error(e); }
    }, switchAt);

    flash.addEventListener('animationend', () => {
      flash.classList.remove('flash-active');
    }, { once: true });
  }

  // Generic fades for overlays/endings
  function fadeIn(elem) {
    if (!elem) return;
    elem.classList.add('fadeable', 'is-open');
    // If using [hidden], unhide a tick before
    if (elem.hasAttribute('hidden')) {
      elem.removeAttribute('hidden');
      // force reflow
      void elem.offsetWidth;
      elem.classList.add('fadeable', 'is-open');
    }
  }
  function fadeOut(elem) {
    if (!elem) return;
    elem.classList.add('fadeable');
    elem.classList.remove('is-open');
    // if you also use [hidden], hide after transition
    const dur = getComputedStyle(elem).transitionDuration || '0.4s';
    const ms = Math.max(50, Math.floor(parseFloat(dur) * (dur.includes('ms') ? 1 : 1000)));
    window.setTimeout(() => {
      elem.setAttribute('hidden', '');
    }, ms);
  }

  return {
    startBrew,
    cancelBrew,
    transformForm,
    fadeIn,
    fadeOut,
  };
})();

// Optional: global for quick hooking
window.Animation = Animation;
