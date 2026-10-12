// Clippr prototype behaviours, layered on the static screens exported from the design canvas.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const screen = document.body.firstElementChild;
  const page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  const TODAY = new Date(2026, 9, 11); // the mock's "today", matching the sample data
  const EXPIRY = new Date(2026, 9, 17); // Northwind Books, the voucher used across the flow
  const CURRENCIES = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'ILS', symbol: '₪' },
  ];
  const CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7"></path></svg>';

  const store = {
    get(key, fallback) {
      try { return localStorage.getItem('clippr.' + key) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('clippr.' + key, value); } catch { /* storage unavailable */ }
    },
  };
  const currency = () => CURRENCIES.find((c) => c.code === store.get('currency', 'USD')) ?? CURRENCIES[0];

  const byText = (sel, text) => $$(sel).find((el) => el.textContent.trim().startsWith(text));
  const go = (href, message) => {
    location.href = message ? `${href}?toast=${encodeURIComponent(message)}` : href;
  };
  const shortDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');

  // ---------- Toast + sheet ----------
  function toast(message) {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.textContent = message;
    Object.assign(el.style, {
      position: 'absolute', left: '50%', bottom: '136px', transform: 'translateX(-50%)', zIndex: '60',
      height: '40px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px',
      borderRadius: '100px', background: '#17132e', color: '#ffffff', whiteSpace: 'nowrap',
      font: "600 14px 'Inter', system-ui, sans-serif", letterSpacing: '-0.02em',
      boxShadow: 'rgba(23, 19, 46, 0.25) 0px 8px 24px 0px', transition: 'opacity 0.3s',
    });
    screen.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2000);
  }

  function sheet({ title, body, confirm, onConfirm }) {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'absolute', inset: '0', zIndex: '50', background: 'rgba(23, 19, 46, 0.4)',
      display: 'flex', alignItems: 'flex-end',
    });
    overlay.innerHTML = `
      <div role="dialog" aria-modal="true" aria-labelledby="sheet-title" style="width: 100%; box-sizing: border-box; padding: 28px 20px 34px; border-radius: 32px 32px 0 0; background: #ffffff; display: flex; flex-direction: column; gap: 8px; font-family: 'Inter', system-ui, sans-serif; letter-spacing: -0.02em; color: #1b1830">
        <h2 id="sheet-title" style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.03em">${title}</h2>
        <p style="margin: 0 0 16px; font-size: 15px; font-weight: 500; line-height: 1.45; color: #625e78">${body}</p>
        <button data-act="confirm" style="height: 56px; border: 0; border-radius: 100px; background: #17132e; color: #ffffff; font: inherit; font-size: 16px; font-weight: 600; cursor: pointer">${confirm}</button>
        <button data-act="cancel" style="height: 52px; border: 0; border-radius: 100px; background: #f8f7fd; color: #1b1830; font: inherit; font-size: 16px; font-weight: 600; cursor: pointer">Cancel</button>
      </div>`;
    const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.dataset.act === 'cancel') close();
      if (e.target.dataset.act === 'confirm') { close(); onConfirm(); }
    });
    document.addEventListener('keydown', onKey);
    screen.appendChild(overlay);
    $('[data-act="confirm"]', overlay).focus();
  }

  function pick(type, initial, onPick) {
    const input = document.createElement('input');
    input.type = type;
    input.value = initial;
    Object.assign(input.style, { position: 'absolute', left: '50%', top: '50%', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' });
    screen.appendChild(input);
    input.addEventListener('change', () => { if (input.value) onPick(input.value); input.remove(); });
    input.addEventListener('blur', () => setTimeout(() => input.remove(), 500));
    try { input.showPicker(); } catch { input.focus(); input.click(); }
  }

  // ---------- Generic controls ----------
  function paintChip(btn, on) {
    btn.style.background = on ? '#17132e' : '#ffffff';
    btn.style.color = on ? '#ffffff' : '#1b1830';
    btn.style.borderColor = on ? '#17132e' : '#d3d0e3';
  }

  function setPressed(btn, on) {
    btn.setAttribute('aria-pressed', String(on));
    paintChip(btn, on);
    const svg = $('svg', btn);
    if (on && !svg) {
      btn.insertAdjacentHTML('afterbegin', CHECK);
      Object.assign(btn.style, { display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px 0 10px' });
    } else if (!on && svg) {
      svg.remove();
      btn.style.padding = '0 14px';
    }
  }

  function setSwitch(sw, on) {
    sw.setAttribute('aria-checked', String(on));
    sw.style.background = on ? '#17132e' : '#e7e5f1';
    sw.style.justifyContent = on ? 'flex-end' : 'flex-start';
  }

  // Multi-select chips with a check mark (reminder defaults)
  $$('button[aria-pressed]').forEach((btn) => {
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
      setPressed(btn, btn.getAttribute('aria-pressed') !== 'true');
      btn.dispatchEvent(new CustomEvent('toggle', { bubbles: true }));
    });
  });

  // Single-select radio groups (category, currency)
  $$('[role="radiogroup"]').forEach((group) => {
    const radios = $$('[role="radio"]', group);
    radios.forEach((radio) => {
      radio.style.cursor = 'pointer';
      radio.addEventListener('click', () => {
        radios.forEach((r) => {
          const on = r === radio;
          r.setAttribute('aria-checked', String(on));
          paintChip(r, on);
          const sub = r.children[1];
          if (sub) { sub.style.color = on ? '#ffffff' : '#625e78'; sub.style.opacity = on ? '0.8' : '1'; }
        });
        group.dispatchEvent(new CustomEvent('pick', { detail: radio }));
      });
    });
  });

  // iOS-style switches
  $$('[role="switch"]').forEach((sw) => {
    sw.style.cursor = 'pointer';
    sw.addEventListener('click', () => {
      if (sw.getAttribute('aria-disabled') === 'true') { toast('That date has already passed'); return; }
      setSwitch(sw, sw.getAttribute('aria-checked') !== 'true');
      sw.dispatchEvent(new CustomEvent('toggle'));
    });
  });

  $$('button').forEach((b) => { b.style.cursor = 'pointer'; });

  // Let tall screens scroll inside the phone, clearing the fixed bottom bar
  const content = screen.firstElementChild;
  if (content && getComputedStyle(content).position === 'static') {
    const bar = $$(':scope > [style*="bottom"]', screen).filter((el) => el.style.position === 'absolute');
    const clearance = bar.reduce((max, el) => Math.max(max, el.offsetHeight + parseFloat(el.style.bottom || 0)), 0);
    Object.assign(content.style, { height: '100%', overflowY: 'auto', boxSizing: 'border-box', paddingBottom: `${clearance + 24}px`, scrollbarWidth: 'none' });
    [...content.children].forEach((child) => { child.style.flexShrink = '0'; });
  }

  const message = new URLSearchParams(location.search).get('toast');
  if (message) { toast(message); history.replaceState(null, '', location.pathname); }

  // ---------- Per-screen behaviour ----------
  const screens = {
    Main() {
      if (store.get('state') === 'empty') { location.replace('Empty.html' + location.search); return; }
      const removed = store.get('state') === 'removed';
      const total = $('div[style*="font-size: 48px"]');
      if (total) total.firstChild.textContent = `${currency().symbol}${removed ? '1,244' : '1,284'}`;

      const cards = $$('a[href="Detail.html"]').filter((a) => a.style.position === 'relative');
      if (removed) {
        // Northwind Books was deleted or used: drop it and promote the next expiring voucher
        cards.shift().remove();
        total.nextElementSibling.textContent = 'Across 8 vouchers · 1 expires this month';
        const banner = $$('a[href="Detail.html"]').find((a) => a.style.position !== 'relative');
        $('span', banner).textContent = '11';
        const lines = $$('div > span', banner).filter((s) => s.parentElement !== banner.firstElementChild);
        lines[0].textContent = 'Petal & Co.';
        lines[1].textContent = '$60.00 · expires Thu, 22 Oct';
        $$('[role="tab"]')[0].textContent = 'All 8';
        $$('[role="tab"]')[1].textContent = 'Expiring 1';
      }
      const tabs = $$('[role="tab"]');
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          tabs.forEach((t) => {
            const on = t === tab;
            t.setAttribute('aria-selected', String(on));
            t.style.background = on ? '#17132e' : '#f8f7fd';
            t.style.color = on ? '#ffffff' : '#1b1830';
            t.style.boxShadow = on ? 'rgb(35, 30, 64) 0px 0px 0px 1px, rgba(23, 19, 46, 0.48) 0px 1px 2px 0px' : 'none';
          });
          const label = tab.textContent.trim();
          cards.forEach((card) => {
            const sub = card.querySelectorAll('span')[2]?.textContent ?? '';
            const days = Number((card.textContent.match(/(\d+) days/) || [])[1] ?? Infinity);
            let show = true;
            if (label.startsWith('Expiring')) show = days <= 30;
            else if (!label.startsWith('All')) show = sub.startsWith(label);
            card.style.display = show ? 'block' : 'none';
          });
        });
      });
    },

    Scan() {
      const flash = $('button[aria-label^="Flash"]');
      flash?.addEventListener('click', () => {
        const on = flash.getAttribute('aria-label') === 'Flash off';
        flash.setAttribute('aria-label', on ? 'Flash on' : 'Flash off');
        flash.style.background = on ? '#ffffff' : 'rgba(255, 255, 255, 0.12)';
        $('path', flash).setAttribute('stroke', on ? '#17132e' : '#ffffff');
        $('svg', flash).setAttribute('stroke', on ? '#17132e' : '#ffffff');
        toast(on ? 'Flash on' : 'Flash off');
      });
      byText('button', 'Library')?.addEventListener('click', () => go('Analyze.html', 'Photo imported'));
    },

    Empty() {
      const library = byText('a', 'Pick from library');
      if (library) library.href = 'Analyze.html?toast=' + encodeURIComponent('Photo imported');
    },

    Review() {
      const curBtn = $('button[aria-label^="Currency"]');
      let idx = CURRENCIES.findIndex((c) => c.code === currency().code);
      const paintCurrency = () => {
        const c = CURRENCIES[idx];
        curBtn.firstChild.textContent = `${c.symbol} ${c.code} `;
        curBtn.setAttribute('aria-label', `Currency, ${c.code}`);
      };
      if (curBtn) {
        paintCurrency();
        curBtn.addEventListener('click', () => { idx = (idx + 1) % CURRENCIES.length; paintCurrency(); });
      }

      // Fields read from the photo lose their tag once the user edits them
      $$('input').forEach((input) => {
        input.addEventListener('input', () => {
          const tag = input.nextElementSibling;
          if (tag?.textContent.trim() === 'From photo') { tag.remove(); input.style.paddingRight = '14px'; }
        }, { once: true });
      });

      const expiry = $('#expiry');
      expiry?.addEventListener('click', () => {
        pick('date', '2026-10-17', (value) => {
          const [y, m, d] = value.split('-').map(Number);
          const date = new Date(y, m - 1, d);
          const days = Math.round((date - TODAY) / 86400000);
          const spans = expiry.querySelectorAll('span');
          spans[0].textContent = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(',', ',');
          spans[1].textContent = days < 0 ? 'already expired' : days === 0 ? 'today' : `in ${days} days`;
        });
      });
    },

    SetReminders() {
      const summary = $$('div').find((d) => /local notifications? will be scheduled/.test(d.textContent) && d.children.length === 1);
      const custom = { days: 2 };
      const customDate = () => { const d = new Date(EXPIRY); d.setDate(d.getDate() - custom.days); return d; };
      const recount = () => {
        const n = $$('[role="switch"][aria-checked="true"]').length + (customDate() < TODAY ? 0 : 1);
        if (summary) summary.lastChild.textContent = ` ${n} local notification${n === 1 ? '' : 's'} will be scheduled`;
      };
      $$('[role="switch"]').forEach((sw) => sw.addEventListener('toggle', recount));

      // Start from the defaults chosen in Settings
      const defaults = JSON.parse(store.get('defaults', '["7d","3d","1d"]'));
      const keyFor = { '7 days before': '7d', '3 days before': '3d', '1 day before': '1d', 'On the day': 'On the day' };
      $$('[role="switch"]').forEach((sw) => {
        if (sw.getAttribute('aria-disabled') !== 'true') setSwitch(sw, defaults.includes(keyFor[sw.getAttribute('aria-label')]));
      });
      const time = store.get('notifyAt', '9:00 AM');
      $$('span').filter((sp) => sp.textContent.endsWith('· 9:00 AM')).forEach((sp) => { sp.textContent = sp.textContent.replace('9:00 AM', time); });
      recount();

      const minus = $('button[aria-label="Fewer days"]');
      const plus = $('button[aria-label="More days"]');
      const value = minus?.nextElementSibling;
      const subtitle = minus?.closest('div[style*="height: 68px"]')?.querySelector('div span:nth-child(2)');
      const paint = () => {
        value.textContent = `${custom.days} day${custom.days === 1 ? '' : 's'}`;
        const date = customDate();
        recount();
        subtitle.textContent = date < TODAY ? `${shortDate(date)} · date already passed` : `${shortDate(date)} · ${store.get('notifyAt', '9:00 AM')}`;
        minus.disabled = custom.days <= 1;
        minus.style.opacity = minus.disabled ? '0.4' : '1';
      };
      minus?.addEventListener('click', () => { custom.days = Math.max(1, custom.days - 1); paint(); });
      plus?.addEventListener('click', () => { custom.days = Math.min(60, custom.days + 1); paint(); });
      if (value) paint();

      // Saving restores the full sample wallet, so the flow can be replayed
      byText('a', 'Save voucher')?.addEventListener('click', (e) => {
        e.preventDefault();
        store.set('state', 'full');
        go('Main.html', 'Voucher saved · reminders scheduled');
      });
    },

    Detail() {
      const title = $('h1');
      const amount = title?.nextElementSibling;
      const edit = byText('button', 'Edit');
      let editing = false;
      edit?.addEventListener('click', () => {
        editing = !editing;
        [title, amount].forEach((el) => {
          el.contentEditable = String(editing);
          el.style.outline = editing ? '2px dashed #d3d0e3' : 'none';
          el.style.outlineOffset = '4px';
          el.style.borderRadius = '8px';
        });
        edit.lastChild.textContent = editing ? ' Done ' : ' Edit ';
        edit.style.background = editing ? '#17132e' : '#f8f7fd';
        edit.style.color = editing ? '#ffffff' : '#1b1830';
        $('svg', edit).setAttribute('stroke', editing ? '#ffffff' : '#1b1830');
        if (editing) {
          title.focus();
          const range = document.createRange();
          range.selectNodeContents(title);
          getSelection().removeAllRanges();
          getSelection().addRange(range);
        } else {
          getSelection().removeAllRanges();
          toast('Saved · reminders rescheduled');
        }
      });

      byText('button', 'Delete')?.addEventListener('click', () => sheet({
        title: 'Delete this voucher?',
        body: 'Its photo, details and 3 scheduled reminders will be removed from this phone. This can’t be undone.',
        confirm: 'Delete voucher',
        onConfirm: () => { store.set('state', 'removed'); go('Main.html', 'Voucher deleted'); },
      }));
      byText('button', 'Mark as used')?.addEventListener('click', () => {
        store.set('state', 'removed');
        go('Main.html', 'Marked as used · reminders cancelled');
      });

      byText('button', 'Full photo')?.addEventListener('click', () => {
        const photo = $('[role="img"]').cloneNode(true);
        const overlay = document.createElement('div');
        Object.assign(overlay.style, { position: 'absolute', inset: '0', zIndex: '50', background: '#17132e', display: 'flex', alignItems: 'center', justifyContent: 'center' });
        Object.assign(photo.style, { position: 'static', margin: '0', transform: 'scale(1.6)' });
        const close = document.createElement('button');
        close.setAttribute('aria-label', 'Close photo');
        close.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>';
        Object.assign(close.style, { position: 'absolute', top: '58px', left: '20px', width: '44px', height: '44px', border: '0', borderRadius: '888px', background: 'rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' });
        close.addEventListener('click', () => overlay.remove());
        overlay.append(photo, close);
        screen.appendChild(overlay);
        close.focus();
      });
    },

    Reminders() {
      if (store.get('state') === 'empty') {
        const list = byText('span', 'This week').parentElement;
        byText('span', '6 reminders').textContent = 'Nothing scheduled yet';
        byText('span', 'Next ·').parentElement.remove();
        list.innerHTML = '<div style="padding: 32px 24px; border-radius: 32px; background: #f8f7fd; text-align: center; display: flex; flex-direction: column; gap: 6px"><span style="font-size: 16px; font-weight: 600">No reminders</span><span style="font-size: 14px; font-weight: 500; color: #625e78; line-height: 1.45">Add a voucher and Clippr schedules alerts before it expires.</span></div>';
        return;
      }
      if (store.get('state') !== 'removed') return;
      // Its reminders were cancelled with the voucher
      const rows = $$('a[href="Detail.html"]').slice(1);
      rows.filter((r) => r.textContent.includes('Northwind')).forEach((r) => r.remove());
      byText('span', '6 reminders').textContent = '3 reminders scheduled on this phone';
      byText('span', 'Next ·').textContent = 'Next · Thu 15 Oct, 9:00 AM';
      const preview = $('a[href="Detail.html"]');
      const lines = $$('span', preview).filter((s) => !s.children.length && s.textContent.length > 12);
      lines[0].textContent = 'Petal & Co. expires in 7 days';
      lines[1].textContent = '$60.00 voucher — tap to open it.';
    },

    Settings() {
      const counts = { removed: ['8 · 2.1 MB', 8], empty: ['0 · 0 MB', 0] }[store.get('state')] ?? ['9 · 2.4 MB', 9];
      byText('span', '9 · 2.4 MB').textContent = counts[0];
      const deleteAll = byText('button', 'Delete all vouchers');
      if (counts[1] === 0) { deleteAll.disabled = true; deleteAll.style.color = '#8f8aa6'; deleteAll.style.cursor = 'default'; }
      const chips = $$('button[aria-pressed]');
      const defaults = JSON.parse(store.get('defaults', '["7d","3d","1d"]'));
      chips.forEach((chip) => setPressed(chip, defaults.includes(chip.textContent.trim())));
      chips.forEach((chip) => chip.addEventListener('toggle', () => {
        store.set('defaults', JSON.stringify(chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.textContent.trim())));
      }));

      const group = $('[role="radiogroup"]');
      const radios = $$('[role="radio"]', group);
      const saved = radios.find((r) => r.textContent.includes(currency().code));
      if (saved && saved.getAttribute('aria-checked') !== 'true') saved.click();
      group?.addEventListener('pick', (e) => {
        const code = CURRENCIES.find((c) => e.detail.textContent.includes(c.code)).code;
        store.set('currency', code);
        toast(`Currency set to ${code}`);
      });

      const notify = byText('button', 'Notify at');
      notify.lastElementChild.firstChild.textContent = store.get('notifyAt', '9:00 AM');
      notify?.addEventListener('click', () => {
        pick('time', '09:00', (value) => {
          const [h, m] = value.split(':').map(Number);
          const label = new Date(2026, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          notify.lastElementChild.firstChild.textContent = label;
          store.set('notifyAt', label);
          toast(`Reminders will arrive at ${label}`);
        });
      });

      byText('button', 'Delete all vouchers')?.addEventListener('click', () => sheet({
        title: 'Delete all vouchers?',
        body: `All ${counts[1]} vouchers, their photos and every scheduled reminder will be removed from this phone. This can’t be undone.`,
        confirm: 'Delete everything',
        onConfirm: () => { store.set('state', 'empty'); go('Empty.html', 'All vouchers deleted'); },
      }));
    },
  };

  screens[page]?.();

  // Show amounts in the currency picked in Settings (the voucher photo and OCR result stay as scanned)
  if (['Main', 'Empty', 'Detail', 'Reminders'].includes(page) && currency().symbol !== '$') {
    const walker = document.createTreeWalker(screen, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeValue.includes('$') && !node.parentElement.closest('[role="img"]')) {
        node.nodeValue = node.nodeValue.replaceAll('$', currency().symbol);
      }
    }
  }
})();
