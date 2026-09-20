/** Hamburger toggle for the mobile nav drawer (left-panel-stack + right-context-rail). Desktop is unaffected — this only does anything under the mobile-nav.css breakpoint. */
export function initMobileNav() {
  if (document.getElementById('mobile-nav-toggle')) return;

  const toggle = document.createElement('button');
  toggle.id = 'mobile-nav-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML =
    '<span class="mobile-nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>';

  const backdrop = document.createElement('div');
  backdrop.id = 'mobile-nav-backdrop';

  function setOpen(open) {
    document.body.classList.toggle('mobile-nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('mobile-nav-open'));
  });
  backdrop.addEventListener('click', () => setOpen(false));

  document.body.append(toggle, backdrop);
}
