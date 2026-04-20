(function () {
  window.TRANSLATIONS = window.TRANSLATIONS || {};
  window.ORDINALS = window.ORDINALS || {};
  window.DATE_LOCALES = window.DATE_LOCALES || {};
  window.LANGS = window.LANGS || [];

  window.TRANSLATIONS['bn'] = {
    theme_to_light: 'লাইট মোডে স্যুইচ করুন',
    theme_to_dark: 'ডার্ক মোডে স্যুইচ করুন',
    heading: 'সিজন \u2014 আল্টিমেট গিফট ক্যালকুলেটর',
    subtitle: 'Sky: Children of the Light \u00b7 আত্মা, প্রতি স্তরের আইটেম এবং আল্টিমেট গিফট কনফিগার করুন \u00b7 সর্বোত্তম পথ স্বয়ংক্রিয়ভাবে গণনা করে',
    aria_github: 'গিটহাবে সোর্স দেখুন',
    label_season_name: 'সিজনের নাম',
    label_start_date: 'সিজন শুরু (দিন ১)',
    section_rules: 'নিয়মাবলী',
    btn_load_season: 'সিজন লোড করুন',
    label_cpd: 'মোমবাতি / দিন',
    label_pass: 'সিজন পাস বোনাস',
    label_heart: 'হার্ট খরচ (লেভেল ৫)',
    note_skip_days: 'প্রতি স্তরের জন্য বাদ দিন। যখন কোনো স্তরে ২টি আইটেম থাকে এবং আপনি তার একটি কিনেন, তখন হাফ-বাদ প্রযোজ্য।',
    th_lv1: 'লেভেল ১', th_lv2: 'লেভেল ২', th_lv3: 'লেভেল ৩', th_lv4: 'লেভেল ৪',
    fullskip_days: 'ফুল-বাদ দিন',
    halfskip_days: 'হাফ-বাদ দিন',
    section_spirits: 'আত্মা',
    btn_add_spirit: '+ আত্মা যোগ করুন',
    note_spirit_levels: 'প্রতি স্তর: আইটেমের মূল্য লিখুন। যদি কোনো স্তরে মাত্র ১টি আইটেম থাকে তবে দ্বিতীয় ফিল্ড ফাঁকা রাখুন।',
    spirit_count: '({count} / {max})',
    spirit_capped: 'গণনা দ্রুত রাখতে সর্বোচ্চ {max} পর্যন্ত সীমাবদ্ধ',
    spirit_remove: 'আত্মা সরান',
    spirit_name_default: 'আত্মা {n}',
    lv_label: 'লেভেল {n}',
    cost_placeholder: 'মূল্য',
    cost2_placeholder: '(দ্বিতীয়)',
    section_ultimates: 'আল্টিমেট গিফট',
    btn_add_ult: '+ আল্টিমেট যোগ করুন',
    ult_nth: '{ord} আল্টিমেট',
    ult_season_hearts: 'সিজনাল হার্ট',
    ult_prioritize: 'অগ্রাধিকার দিন',
    ult_remove: 'সরান',
    ult_summary: 'প্রতিটি আল্টিমেটে ক্রমবর্ধমান হার্ট: {cumStr}। পরিকল্পনায় সম্পন্ন {done} / {total} আত্মা। অপ্টিমাইজ করা হচ্ছে: <b>{ultNth}</b> (সর্বপ্রথম উপলব্ধ)।',
    ult_summary_empty: 'অন্তত একটি আল্টিমেট গিফট যোগ করুন।',
    section_result: 'ফলাফল',
    target_badge: 'লক্ষ্য',
    ult_hearts_label: '{ord} আল্টিমেট ({hearts} হার্ট)',
    day_prefix: 'দিন {n}',
    season_fallback: 'সিজন',
    page_title: '{name} \u2014 আল্টিমেট গিফট ক্যালকুলেটর',
    total_candles: 'মোট খরচ মোমবাতি',
    earned_surplus: 'দিন {day} পর্যন্ত অর্জিত: {earned} মোমবাতি (উদ্বৃত্ত {surplus})',
    invite_days: 'ইনভাইট দিন ব্যবহৃত',
    invite_rate: 'প্রতিদিন ১টি ইনভাইট',
    section_strategy: 'প্রতি-আত্মা কৌশল',
    th_spirit: 'আত্মা',
    th_cost: 'খরচ',
    th_days: 'দিন',
    not_used: 'পরিকল্পনায় ব্যবহৃত হয়নি',
    note_lv5: 'প্রতি ব্যবহৃত আত্মার জন্য অতিরিক্ত লেভেল ৫ হার্ট ({heart} মোমবাতি)। #N চিহ্নটি পরিকল্পনায় সম্পন্নের ক্রম নির্দেশ করে।',
    section_treemap: 'ট্রি ম্যাপ (নিচ থেকে উপরে, শুধুমাত্র ব্যবহৃত আত্মা)',
    legend_buy: 'কিনুন',
    legend_skip: 'ফ্রেন্ডশিপ-বাদ',
    section_discord: 'ডিসকর্ড পোস্ট',
    btn_copy: 'কপি করুন',
    copy_copied: 'কপি হয়েছে',
    copy_failed: 'ব্যর্থ হয়েছে',
    err_no_ult: 'অন্তত একটি আল্টিমেট গিফট যোগ করুন।',
    err_no_spirit: 'অন্তত একটি আত্মা যোগ করুন।',
    err_hearts: '{hearts}টি সিজনাল হার্ট প্রয়োজন কিন্তু কেবল {count}টি আত্মা কনফিগার করা হয়েছে। আরও {more}টি আত্মা যোগ করুন অথবা আল্টিমেট হার্টের খরচ কমান।',
    err_no_plan: 'কোনো সম্ভাব্য পরিকল্পনা পাওয়া যায়নি।',
    err_solver: 'সলভার ত্রুটি: ',
    desc_none: '(এই স্তরে কোনো আইটেম নেই)',
    desc_buy: '{c} মোমবাতি কিনুন',
    desc_skip: '{c} মোমবাতি বাদ করুন ({d} দিন)',
    desc_buy_both: 'উভয়ই কিনুন {exp}+{cheap} মোমবাতি',
    desc_buy_cheap: '{cheap} মোমবাতি কিনুন, {exp} মোমবাতি বাদ করুন ({d} দিন)',
    desc_buy_exp: '{exp} মোমবাতি কিনুন, {cheap} মোমবাতি বাদ করুন ({d} দিন)',
    desc_skip_both: 'উভয়ই বাদ করুন ({d} দিন)',
    badge_buy: '{c} মোমবাতি কিনুন',
    badge_skip: 'বাদ ({d} দিন)',
    stage_none: '(কোনো আইটেম নেই)',
    stage_buy: '{c} মোমবাতি কিনুন',
    stage_skip: 'বাদ ({d} দিন)',
    stage_skip_both: 'উভয়ই বাদ করুন ({d} দিন)',
    stage_mixed: '{b} মোমবাতি কিনুন | {s} মোমবাতি বাদ করুন ({d} দিন)',
    svg_lv5: 'লেভেল ৫ হার্ট', svg_lv4: 'লেভেল ৪', svg_lv3: 'লেভেল ৩', svg_lv2: 'লেভেল ২', svg_lv1: 'লেভেল ১',
    svg_heart: 'হার্ট {c} মোমবাতি',
    svg_buy_line: 'কিনুন\n{c} মোমবাতি',
    svg_skip_line: 'বাদ\n{c} মোমবাতি\n({d} দিন)',
    svg_skip_days: 'বাদ ({d} দিন)',
    svg_buy_both: '{a}+{b} মোমবাতি কিনুন',
    svg_skip_both_days: 'উভয়ই বাদ করুন ({d} দিন)',
    post_header: '\uD83C\uDF81 {name} \u2014 দ্রুততম আল্টিমেট গিফট প্রাপ্তির রুট',
    post_tldr: '**TL;DR** ({ord} আল্টিমেট সর্বপ্রথম পাওয়ার জন্য অপ্টিমাইজ করা)',
    post_ult_line: '\u2022 {ord} আল্টিমেট ({hearts} সিজনাল হার্ট): দিন {day} ({date}){mark}',
    post_requires: '_সিজন পাস প্রয়োজন (+{pass} মোমবাতি স্টার্টার)। {spiritCount}টি আত্মা উপলব্ধ, সকল আল্টিমেট গিফটের জন্য প্রয়োজন {totalHearts}টি হার্ট।_',
    post_per_spirit: '**প্রতি-আত্মা কৌশল** (সম্পন্নের ক্রমানুসারে)',
    post_spirit_entry: '__{n}. {name}__ \u2014 {cost} মোমবাতি, {days} ইনভাইট দিন',
    post_lv_entry: '  লেভেল {n}: {desc}',
    post_lv5: '  লেভেল ৫: হার্ট কিনুন ({heart} মোমবাতি)',
    post_skipped: '_সম্পূর্ণ বাদ করা হয়েছে: {names} (প্রয়োজন নেই)।_',
    post_schedule_header: '**ইনভাইট সময়সূচী** (প্রতিদিন ১টি ইনভাইট, ক্রমানুসারে)',
    post_no_invites: '({name}: কোনো ইনভাইট নেই \u2014 সবকিছু কেনা হচ্ছে)',
    post_day_single: 'দিন {day}',
    post_day_range: 'দিন {start}-{end}',
    post_invite_line: '{dayStr}: {name} ইনভাইট করুন ({d} দিন, লেভেল {lv} বাদ)',
    post_ult_milestone: '   \u2192 {ord} আল্টিমেট দিন {day} ({date}) এ উপলব্ধ হবে',
    post_accumulate: '{dayStr}: মোমবাতি জমা করুন',
    post_candle_header: '**মোমবাতি হিসাব**',
    post_earned: '\u2022 দিন {day} পর্যন্ত অর্জিত: {earned} মোমবাতি ({pass} পাস + {cpd}\xd7{tmax})',
    post_spent: '\u2022 খরচ: {cost} মোমবাতি',
    post_surplus: '\u2022 উদ্বৃত্ত: {surplus} মোমবাতি',
    post_invite_used: '\u2022 ইনভাইট দিন ব্যবহৃত: {used} / {avail} উপলব্ধ',
  };

  window.ORDINALS['bn'] = function (n) {
    var bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    var toBengali = function(num) {
      return String(num).split('').map(function(d) { return bengaliDigits[parseInt(d,10)]; }).join('');
    };
    var bnNum = toBengali(n);
    if (n >= 11 && n <= 20) return bnNum + 'তম';
    var lastDigit = n % 10;
    if (lastDigit === 1) return bnNum + 'ম';
    if (lastDigit === 2) return bnNum + 'য়';
    if (lastDigit === 3) return bnNum + 'য়';
    if (lastDigit === 4) return bnNum + 'র্থ';
    if (lastDigit === 6) return bnNum + 'ষ্ঠ';
    return bnNum + 'ম';
  };

  window.DATE_LOCALES['bn'] = 'bn-BD';
  window.LANGS.push({ code: 'bn', label: 'বাংলা' });
})();