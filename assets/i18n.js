(function () {
  var TRANSLATIONS = window.TRANSLATIONS || {};
  var ORDINALS = window.ORDINALS || {};
  var DATE_LOCALES = window.DATE_LOCALES || {};

  TRANSLATIONS.en = {
    theme_to_light: 'Switch to light mode',
    theme_to_dark: 'Switch to dark mode',
    heading: 'Season \u2014 Ultimate Gift Calculator',
    subtitle: 'Sky: Children of the Light \u00b7 Configure spirits, items per level, and ultimate gifts \u00b7 Auto-computes optimal route',
    aria_github: 'View source on GitHub',
    label_season_name: 'Season Name',
    label_start_date: 'Season Start (Day 1)',
    section_rules: 'Rules',
    btn_load_season: 'Load Season',
    label_cpd: 'Candles / Day',
    label_pass: 'Season Pass Bonus',
    label_heart: 'Heart Cost (Lv 5)',
    note_skip_days: 'Skip Days Per Level. Half-skip is used when a level has 2 items and you buy one of them.',
    th_lv1: 'Lv 1', th_lv2: 'Lv 2', th_lv3: 'Lv 3', th_lv4: 'Lv 4',
    fullskip_days: 'Full-Skip Days',
    halfskip_days: 'Half-Skip Days',
    section_spirits: 'Spirits',
    btn_add_spirit: '+ Add Spirit',
    note_spirit_levels: 'Each Level: Enter cost of the item(s). Leave the 2nd field blank for levels with only 1 item.',
    spirit_count: '({count} / {max})',
    spirit_capped: 'Capped at {max} to keep computation fast',
    spirit_remove: 'Remove Spirit',
    spirit_name_default: 'Spirit {n}',
    lv_label: 'Lv {n}',
    cost_placeholder: 'Cost',
    cost2_placeholder: '(2nd)',
    section_ultimates: 'Ultimate Gifts',
    btn_add_ult: '+ Add Ultimate',
    ult_nth: '{ord} Ultimate',
    ult_season_hearts: 'Seasonal Hearts',
    ult_prioritize: 'Prioritize',
    ult_remove: 'Remove',
    ult_summary: 'Cumulative hearts at each Ultimate: {cumStr}. Plan completes {done} / {total} spirits. Optimizing for: <b>{ultNth}</b> (Earliest Available).',
    ult_summary_empty: 'Add at least one ultimate gift.',
    section_result: 'Result',
    target_badge: 'Target',
    ult_hearts_label: '{ord} Ultimate ({hearts} Hearts)',
    day_prefix: 'Day {n}',
    season_fallback: 'Season',
    page_title: '{name} \u2014 Ultimate Gift Calculator',
    total_candles: 'Total Candles Spent',
    earned_surplus: 'Earned by D{day}: {earned}C (Surplus {surplus})',
    invite_days: 'Invite Days Used',
    invite_rate: '1 Invite per day',
    section_strategy: 'Per-Spirit Strategy',
    th_spirit: 'Spirit',
    th_cost: 'Cost',
    th_days: 'Days',
    not_used: 'Not Used in Plan',
    note_lv5: 'Plus Lv 5 Heart ({heart}C) per used spirit. Pill #N = completion order in the plan.',
    section_treemap: 'Tree Map (Bottom-up, Used Spirits Only)',
    legend_buy: 'Buy',
    legend_skip: 'Friendship-skip',
    section_discord: 'Discord Post',
    btn_copy: 'Copy',
    copy_copied: 'Copied',
    copy_failed: 'Failed',
    err_no_ult: 'Add At Least One Ultimate Gift.',
    err_no_spirit: 'Add At Least One Spirit.',
    err_hearts: 'Need {hearts} Seasonal Hearts but only {count} spirit(s) configured. Add {more} more spirit(s) or reduce ultimate heart costs.',
    err_no_plan: 'No Feasible Plan Found.',
    err_solver: 'Solver error: ',
    desc_none: '(no items at this level)',
    desc_buy: 'Buy {c}C',
    desc_skip: 'Skip {c}C ({d}D)',
    desc_buy_both: 'Buy both {exp}+{cheap}C',
    desc_buy_cheap: 'Buy {cheap}C, skip {exp}C ({d}D)',
    desc_buy_exp: 'Buy {exp}C, skip {cheap}C ({d}D)',
    desc_skip_both: 'Skip both ({d}D)',
    badge_buy: 'Buy {c}C',
    badge_skip: 'Skip ({d}D)',
    stage_none: '(no items)',
    stage_buy: 'Buy {c}C',
    stage_skip: 'Skip ({d}d)',
    stage_skip_both: 'Skip both ({d}d)',
    stage_mixed: 'Buy {b}C | skip {s}C ({d}d)',
    svg_lv5: 'Lv 5 heart', svg_lv4: 'Lv 4', svg_lv3: 'Lv 3', svg_lv2: 'Lv 2', svg_lv1: 'Lv 1',
    svg_heart: 'Heart {c}C',
    svg_buy_line: 'Buy\n{c}C',
    svg_skip_line: 'Skip\n{c}C\n({d}D)',
    svg_skip_days: 'Skip ({d}D)',
    svg_buy_both: 'Buy {a}+{b}C',
    svg_skip_both_days: 'Skip both ({d}D)',
    post_header: '\uD83C\uDF81 {name} \u2014 Fastest Ultimate Gift Route',
    post_tldr: '**TL;DR** (Optimizing for {ord} Ultimate Earliest)',
    post_ult_line: '\u2022 {ord} Ultimate ({hearts} Seasonal Hearts): Day {day} ({date}){mark}',
    post_requires: '_Requires Season Pass (+{pass} Candle Starter). {spiritCount} Spirits Available, {totalHearts} Hearts Needed for All Ultimate Gifts._',
    post_per_spirit: '**Per-Spirit Strategy** (in completion order)',
    post_spirit_entry: '__{n}. {name}__ \u2014 {cost}C, {days} Invite Days',
    post_lv_entry: '  Lv {n}: {desc}',
    post_lv5: '  Lv 5: Buy Heart ({heart}C)',
    post_skipped: '_Skipped Entirely: {names} (Not Needed)._',
    post_schedule_header: '**Invite Schedule** (1 invite/day, sequential)',
    post_no_invites: '({name}: no invites \u2014 buying everything)',
    post_day_single: 'Day {day}',
    post_day_range: 'Day {start}-{end}',
    post_invite_line: '{dayStr}: Invite {name} ({d}D, Lv {lv} Skip)',
    post_ult_milestone: '   \u2192 {ord} Ultimate Available @ Day {day} ({date})',
    post_accumulate: '{dayStr}: Accumulate Candles',
    post_candle_header: '**Candle Accounting**',
    post_earned: '\u2022 Earned by Day {day}: {earned}C ({pass} Pass + {cpd}\xd7{tmax})',
    post_spent: '\u2022 Spent: {cost}C',
    post_surplus: '\u2022 Surplus: {surplus}C',
    post_invite_used: '\u2022 Invite Days Used: {used} / {avail} Available',
  };

  ORDINALS.en = function (n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  DATE_LOCALES.en = 'en-US';

  window.LANGS = [{ code: 'en', label: 'English' }].concat(window.LANGS || []);

  var _lang = 'en';

  window.getLang = function () { return _lang; };

  window.t = function (key, vars) {
    var dict = TRANSLATIONS[_lang] || TRANSLATIONS.en;
    var str = dict[key];
    if (str === undefined && _lang !== 'en') str = TRANSLATIONS.en[key];
    if (str === undefined) {
      if (typeof console !== 'undefined') console.warn('[i18n] missing key: ' + key);
      return '\u26a0\ufe0f' + key;
    }
    if (vars) {
      str = str.replace(/\{(\w+)\}/g, function (_, k) {
        return vars[k] !== undefined ? vars[k] : '{' + k + '}';
      });
    }
    return str;
  };

  function applyStaticTranslations() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-i18n');
      var attr = el.getAttribute('data-i18n-attr');
      var val = window.t(key);
      if (attr) {
        el.setAttribute(attr, val);
      } else {
        el.textContent = val;
      }
    }
  }

  window.setLang = function (code) {
    if (!TRANSLATIONS[code]) code = 'en';
    _lang = code;
    window.DATE_LOCALE = DATE_LOCALES[code] || 'en-US';
    window.ordinal = ORDINALS[code] || ORDINALS.en;
    document.documentElement.lang = code;
    try { localStorage.setItem('lang', code); } catch (e) { }
    applyStaticTranslations();
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: code } }));
  };

  // Initialise from localStorage
  var saved = 'en';
  try { saved = localStorage.getItem('lang') || 'en'; } catch (e) { }
  if (!TRANSLATIONS[saved]) saved = 'en';
  _lang = saved;
  window.DATE_LOCALE = DATE_LOCALES[saved] || 'en-US';
  window.ordinal = ORDINALS[saved] || ORDINALS.en;
  document.documentElement.lang = saved;

  applyStaticTranslations();

  var sel = document.getElementById('lang-select');
  if (sel) {
    sel.value = _lang;
    sel.addEventListener('change', function () { window.setLang(sel.value); });
  }

  window.initLangSelect = function () {
    var sel = document.getElementById('lang-select');
    if (sel && window.LANGS) {
      sel.innerHTML = window.LANGS.map(function (lang) {
        return '<option value="' + lang.code + '">' + lang.label + '</option>';
      }).join('');
      sel.value = _lang;
      sel.addEventListener('change', function () { window.setLang(sel.value); });
    }
  };

  window.formatDate = function (dt) {
    var month = dt.getUTCMonth() + 1;
    var day = dt.getUTCDate();
    if (_lang === 'zh-CN') {
      return month + ' 月 ' + day + ' 日';
    } else {
      return dt.toLocaleDateString(window.DATE_LOCALE || 'en-US', { month: 'short', timeZone: 'UTC' }) + ' ' + day;
    }
  };
})();
