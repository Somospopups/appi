/* ============================================================
   APPI · Telegram · vincular el chat de titular o socio
   ============================================================ */
(function () {
  'use strict';

  var BOT = 'APPI_Avisos_bot';
  var pollTimer = 0;

  function config() {
    return window.APPIAuth && window.APPIAuth.config ? window.APPIAuth.config() : window.APPI_AUTH || {};
  }
  function accessToken() {
    return window.APPIAuth && window.APPIAuth.accessToken ? window.APPIAuth.accessToken() : '';
  }
  function persona() {
    try {
      var p = window.APPIAuth && window.APPIAuth.activePerson && window.APPIAuth.activePerson();
      return p && p.tipo === 'socio' ? 'socio' : 'titular';
    } catch (e) { return 'titular'; }
  }
  function functionUrl() {
    return String(config().url || '').replace(/\/$/, '') + '/functions/v1/telegram-avisos';
  }
  async function call(body, retry) {
    if (retry === undefined) retry = true;
    var res;
    try {
      res = await fetch(functionUrl(), {
        method: 'POST',
        cache: 'no-store',
        headers: {
          apikey: config().anonKey,
          Authorization: 'Bearer ' + accessToken(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.assign({ persona_tipo: persona() }, body))
      });
    } catch (e) {
      throw new Error('No pudimos hablar con Telegram. Revisá internet.');
    }
    if (res.status === 401 && retry && window.APPIAuth && window.APPIAuth.refresh) {
      await window.APPIAuth.refresh();
      return call(body, false);
    }
    var data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) throw new Error(data.error || data.message || 'No se pudo completar.');
    return data;
  }
  function stopPoll() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = 0; }
  }
  function updateMenu(vinculado) {
    var txt = document.getElementById('toolsTelegramTxt');
    if (txt) txt.textContent = vinculado ? 'Telegram vinculado' : 'Vincular Telegram';
  }
  async function refreshMenu() {
    var btn = document.getElementById('btnToolsTelegram');
    var profile = window.APPIAuth && window.APPIAuth.isEnabled && window.APPIAuth.isEnabled()
      ? window.APPIAuth.currentProfile() : null;
    var ok = !!(profile && profile.rol !== 'admin');
    if (btn) btn.hidden = !ok;
    if (!ok) return;
    try {
      var st = await call({ action: 'estado' });
      updateMenu(!!st.vinculado);
    } catch (e) { updateMenu(false); }
  }
  async function abrir() {
    try { if (typeof cerrarToolsMenu === 'function') cerrarToolsMenu(); } catch (e) {}
    if (!window.APPIDialog) return;
    var st;
    try { st = await call({ action: 'estado' }); }
    catch (e) {
      window.APPIDialog.alert(e.message || 'No se pudo consultar Telegram.', { title: 'Telegram', icon: '✈️' });
      return;
    }
    if (st.vinculado) {
      var pick = await window.APPIDialog.choose(
        'Este Telegram ya está vinculado' + (st.username ? ' (@' + st.username + ')' : '') + '.',
        [
          { label: 'Probar aviso', value: 'probar' },
          { label: 'Desvincular', value: 'cortar' }
        ],
        { title: 'Telegram', icon: '✈️' }
      );
      if (pick === 'probar') {
        try {
          await call({ action: 'probar' });
          window.APPIDialog.alert('Mirá Telegram: te tiene que haber llegado un mensaje de APPI.', { title: 'Telegram', icon: '✈️' });
        } catch (e) {
          window.APPIDialog.alert(e.message || 'No se pudo enviar.', { title: 'Telegram', icon: '✈️' });
        }
      } else if (pick === 'cortar') {
        try {
          await call({ action: 'desvincular' });
          updateMenu(false);
          window.APPIDialog.alert('Listo. Este chat ya no recibe avisos.', { title: 'Telegram', icon: '✈️' });
        } catch (e) {
          window.APPIDialog.alert(e.message || 'No se pudo desvincular.', { title: 'Telegram', icon: '✈️' });
        }
      }
      return;
    }
    var link;
    try { link = await call({ action: 'vincular' }); }
    catch (e) {
      window.APPIDialog.alert(e.message || 'No se pudo crear el vínculo.', { title: 'Telegram', icon: '✈️' });
      return;
    }
    var ir = await window.APPIDialog.confirm(
      'Se abre Telegram. Tocá Iniciar en @' + (link.bot || BOT) + '.\nEl código vale ' + (link.minutos || 10) + ' minutos.',
      { title: 'Vincular Telegram', icon: '✈️', okText: 'Abrir Telegram' }
    );
    if (!ir) return;
    window.open(link.url, '_blank', 'noopener');
    var tries = 0;
    stopPoll();
    pollTimer = setInterval(async function () {
      tries += 1;
      if (tries > 40) { stopPoll(); return; }
      try {
        var now = await call({ action: 'estado' });
        if (now.vinculado) {
          stopPoll();
          updateMenu(true);
          if (window.APPIDialog) window.APPIDialog.alert('Telegram quedó vinculado. Ya podés recibir avisos acá.', { title: 'Telegram', icon: '✈️' });
        }
      } catch (e) {}
    }, 3000);
  }

  window.APPITelegram = { abrir: abrir, refreshMenu: refreshMenu };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(refreshMenu, 700); });
  else setTimeout(refreshMenu, 700);
})();
