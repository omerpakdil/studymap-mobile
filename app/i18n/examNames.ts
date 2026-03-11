import type { SupportedLanguage } from '@/app/i18n';

const enExamNames: Record<string, string> = {
  sat: 'SAT',
  act: 'ACT',
  gre: 'GRE',
  gmat: 'GMAT',
  lsat: 'LSAT',
  mcat: 'MCAT',
  usmle: 'USMLE',
  toefl: 'TOEFL',
  ielts: 'IELTS',
  gaokao: 'Gaokao',
  gaokao_science: 'Gaokao (Science)',
  gaokao_humanities: 'Gaokao (Humanities)',
  kaoyan: 'Kaoyan',
  guokao: 'Guokao',
  cpa_cn: 'China CPA',
  bar_cn: 'National Legal Professional Qualification Exam',
  hsk: 'HSK',
  common_test_jp: 'Common Test for University Admissions',
  todai_exam: 'University of Tokyo Entrance Exam',
  bar_jp: 'Bar Exam',
  civil_service_jp: 'National Public Service Exam',
  jlpt: 'JLPT',
  med_lic_jp: 'National Medical Practitioners Exam',
  jee: 'JEE',
  neet: 'NEET',
  upsc: 'UPSC',
  cat: 'CAT',
  gate: 'GATE',
  ca_final: 'CA Final',
  enem: 'ENEM',
  vestibular: 'Vestibular',
  oab: 'OAB Exam',
  enade: 'ENADE',
  suneung: 'Suneung (CSAT)',
  suneung_science: 'Suneung (Science)',
  suneung_humanities: 'Suneung (Humanities)',
  gsat: 'GSAT',
  psat_kr: 'Korean PSAT',
  bar_kr: 'Bar Exam',
  topik: 'TOPIK',
  med_lic_kr: 'Korean Medical Licensing Exam',
  abitur: 'Abitur',
  staatsexamen: 'Staatsexamen',
  testdaf: 'TestDaF',
  nc_track: 'Numerus Clausus (NC)',
  steuerberater: 'Steuerberaterpruefung',
  zweites_staatsexamen: 'Zweites Staatsexamen',
  a_levels: 'A-Levels',
  a_levels_science: 'A-Levels (Science)',
  a_levels_humanities: 'A-Levels (Humanities)',
  ucat: 'UCAT',
  lnat: 'LNAT',
  sqe: 'SQE',
  acca_icaew: 'ACCA/ICAEW',
  utbk_snbt: 'UTBK-SNBT',
  cpns: 'CPNS',
  ukmppd: 'UKMPPD',
  cpa_id: 'CPA Indonesia',
  baccalaureat: 'Baccalauréat',
  baccalaureat_science: 'Baccalauréat (Science)',
  baccalaureat_humanities: 'Baccalauréat (Humanities)',
  concours_ge: 'Concours Grandes Ecoles',
  polytechnique_track: 'Ecole Polytechnique Entrance Exam',
  insp_ena: 'INSP (ex-ENA) Competition',
  crfpa: 'CRFPA/Barreau',
  delf_dalf: 'DELF/DALF',
  mccqe: 'MCCQE',
  cpa_ca: 'CPA Canada',
  nca_bar: 'NCA Exams + Bar Admission',
  tyt: 'TYT',
  ayt: 'AYT',
  tyt_ayt: 'TYT + AYT',
  ayt_sayisal: 'AYT (Sayısal)',
  ayt_ea: 'AYT (Eşit Ağırlık)',
  ayt_sozel: 'AYT (Sözel)',
  tyt_ayt_sayisal: 'TYT + AYT (Sayısal)',
  tyt_ayt_ea: 'TYT + AYT (Eşit Ağırlık)',
  tyt_ayt_sozel: 'TYT + AYT (Sözel)',
  ydt_tr: 'YDT',
  kpss: 'KPSS',
  kpss_gygk: 'KPSS (Genel Kültür-Genel Yetenek)',
  kpss_egitim: 'KPSS (Eğitim Bilimleri)',
  kpss_oabt: 'KPSS (ÖABT)',
  kpss_a: 'KPSS (A Grubu)',
  ales: 'ALES',
  yds: 'YDS/YÖKDİL',
  dus: 'DUS',
  tus: 'TUS',
  qudrat: 'Qudrat',
  tahsili: 'Tahsili',
  scfhs: 'SCFHS Exams',
  bar_sa: 'Saudi Bar',
  cma_sa: 'CMA Saudi',
};

const localizedOverrides: Partial<Record<SupportedLanguage, Record<string, string>>> = {
  tr: {
    tyt: 'TYT',
    ayt: 'AYT',
    tyt_ayt: 'TYT + AYT',
    ayt_sayisal: 'AYT (Sayısal)',
    ayt_ea: 'AYT (Eşit Ağırlık)',
    ayt_sozel: 'AYT (Sözel)',
    tyt_ayt_sayisal: 'TYT + AYT (Sayısal)',
    tyt_ayt_ea: 'TYT + AYT (Eşit Ağırlık)',
    tyt_ayt_sozel: 'TYT + AYT (Sözel)',
    ydt_tr: 'YDT',
    kpss: 'KPSS',
    kpss_gygk: 'KPSS (Genel Kültür-Genel Yetenek)',
    kpss_egitim: 'KPSS (Eğitim Bilimleri)',
    kpss_oabt: 'KPSS (ÖABT)',
    kpss_a: 'KPSS (A Grubu)',
    common_test_jp: 'Üniversite Girişi Ortak Sınavı',
    todai_exam: 'Tokyo Üniversitesi Giriş Sınavı',
    civil_service_jp: 'Ulusal Kamu Hizmeti Sınavı',
    med_lic_jp: 'Ulusal Tıp Pratisyenlik Sınavı',
    bar_cn: 'Ulusal Hukuk Mesleği Yeterlilik Sınavı',
    nc_track: 'Numerus Clausus (NC)',
    polytechnique_track: 'École Polytechnique Giriş Sınavı',
    insp_ena: 'INSP (eski ENA) Yarışması',
    nca_bar: 'NCA Sınavları + Bar Kabulü',
    suneung: 'Suneung (CSAT)',
    suneung_science: 'Suneung (Science)',
    suneung_humanities: 'Suneung (Humanities)',
    psat_kr: 'Kore PSAT',
    med_lic_kr: 'Kore Tıp Lisans Sınavı',
    baccalaureat: 'Baccalauréat',
    baccalaureat_science: 'Baccalauréat (Sayısal)',
    baccalaureat_humanities: 'Baccalauréat (Sözel)',
    a_levels: 'A-Levels',
    a_levels_science: 'A-Levels (Sayısal)',
    a_levels_humanities: 'A-Levels (Sözel)',
  },
  ar: {
    common_test_jp: 'اختبار القبول الجامعي الموحد',
    todai_exam: 'اختبار القبول بجامعة طوكيو',
    civil_service_jp: 'اختبار الخدمة العامة الوطني',
    med_lic_jp: 'الاختبار الوطني لمزاولة الطب',
    bar_cn: 'الاختبار الوطني للتأهيل المهني القانوني',
    nc_track: 'Numerus Clausus (NC)',
    polytechnique_track: 'اختبار دخول مدرسة البوليتكنيك',
    insp_ena: 'مسابقة INSP (ENA سابقا)',
    nca_bar: 'اختبارات NCA + قبول نقابة المحامين',
    suneung: 'Suneung (CSAT)',
    psat_kr: 'PSAT الكوري',
    med_lic_kr: 'اختبار الترخيص الطبي الكوري',
    baccalaureat: 'Baccalauréat',
    baccalaureat_science: 'Baccalauréat (Science)',
    baccalaureat_humanities: 'Baccalauréat (Humanities)',
    a_levels: 'A-Levels',
    a_levels_science: 'A-Levels (Science)',
    a_levels_humanities: 'A-Levels (Humanities)',
  },
  de: {
    bar_cn: 'Nationale juristische Qualifikationspruefung',
    common_test_jp: 'Common Test fuer die Universitaetszulassung',
    todai_exam: 'Aufnahmepruefung der Universitaet Tokio',
    civil_service_jp: 'Nationale Staatsdienstpruefung',
    med_lic_jp: 'Nationale aerztliche Approbationspruefung',
    polytechnique_track: 'Aufnahmepruefung Ecole Polytechnique',
    insp_ena: 'INSP-Wettbewerb (ex-ENA)',
    nca_bar: 'NCA-Pruefungen + Zulassung',
    psat_kr: 'Koreanischer PSAT',
    med_lic_kr: 'Koreanische medizinische Zulassungspruefung',
    baccalaureat: 'Baccalauréat',
    baccalaureat_science: 'Baccalauréat (Wissenschaften)',
    baccalaureat_humanities: 'Baccalauréat (Geisteswissenschaften)',
    a_levels: 'A-Levels',
    a_levels_science: 'A-Levels (Wissenschaften)',
    a_levels_humanities: 'A-Levels (Geisteswissenschaften)',
  },
  ja: {
    gaokao: '高考',
    gaokao_science: '高考（理科）',
    gaokao_humanities: '高考（文科）',
    kaoyan: '考研',
    guokao: '国考',
    bar_cn: '国家法律職業資格試験',
    common_test_jp: '大学入学共通テスト',
    todai_exam: '東京大学入試',
    civil_service_jp: '国家公務員試験',
    med_lic_jp: '医師国家試験',
    polytechnique_track: 'エコール・ポリテクニーク入試',
    insp_ena: 'INSP（旧ENA）競争試験',
    nca_bar: 'NCA試験＋法曹登録',
    suneung: '修能（CSAT）',
    psat_kr: '韓国PSAT',
    med_lic_kr: '韓国医師国家試験',
    baccalaureat: 'Baccalauréat',
    baccalaureat_science: 'バカロレア（理系）',
    baccalaureat_humanities: 'バカロレア（文系）',
    a_levels: 'A-Levels',
    a_levels_science: 'A-Levels（理系）',
    a_levels_humanities: 'A-Levels（文系）',
  },
  fr: {
    baccalaureat: 'Baccalauréat',
    baccalaureat_science: 'Baccalauréat (Scientifique)',
    baccalaureat_humanities: 'Baccalauréat (Humanites)',
    a_levels: 'A-Levels',
    a_levels_science: 'A-Levels (Scientifique)',
    a_levels_humanities: 'A-Levels (Humanites)',
  },
  ko: {
    gaokao: '가오카오',
    kaoyan: '카오옌',
    guokao: '궈카오',
    bar_cn: '중국 국가 법률전문자격시험',
    common_test_jp: '일본 대학입학 공통시험',
    todai_exam: '도쿄대 입학시험',
    civil_service_jp: '일본 국가공무원시험',
    med_lic_jp: '일본 의사국가시험',
    polytechnique_track: '에콜 폴리테크니크 입학시험',
    insp_ena: 'INSP(구 ENA) 경쟁시험',
    nca_bar: 'NCA 시험 + 변호사 자격',
    suneung: '수능 (CSAT)',
    suneung_science: '수능 (이과)',
    suneung_humanities: '수능 (문과)',
    psat_kr: '한국형 PSAT',
    med_lic_kr: '한국 의사국가시험',
    baccalaureat: 'Baccalauréat',
    baccalaureat_science: 'Baccalauréat (이과)',
    baccalaureat_humanities: 'Baccalauréat (문과)',
    a_levels: 'A-Levels',
    a_levels_science: 'A-Levels (이과)',
    a_levels_humanities: 'A-Levels (문과)',
  },
  'pt-BR': {
    common_test_jp: 'Teste Comum para Admissao Universitaria',
    todai_exam: 'Exame de Ingresso da Universidade de Toquio',
    civil_service_jp: 'Exame Nacional de Servico Publico',
    med_lic_jp: 'Exame Nacional de Licenciamento Medico',
    bar_cn: 'Exame Nacional de Qualificacao Profissional Juridica',
    nc_track: 'Numerus Clausus (NC)',
    polytechnique_track: 'Exame de Ingresso da Ecole Polytechnique',
    insp_ena: 'Concurso INSP (ex-ENA)',
    nca_bar: 'Exames NCA + Admissao na Ordem',
    suneung: 'Suneung (CSAT)',
    psat_kr: 'PSAT Coreano',
    med_lic_kr: 'Exame Coreano de Licenciamento Medico',
    baccalaureat: 'Baccalauréat',
    baccalaureat_science: 'Baccalauréat (Ciencias)',
    baccalaureat_humanities: 'Baccalauréat (Humanidades)',
    a_levels: 'A-Levels',
    a_levels_science: 'A-Levels (Ciencias)',
    a_levels_humanities: 'A-Levels (Humanidades)',
  },
  'zh-Hans': {
    bar_cn: '国家法律职业资格考试',
    common_test_jp: '日本大学入学共通考试',
    todai_exam: '东京大学入学考试',
    civil_service_jp: '日本国家公务员考试',
    med_lic_jp: '日本医师国家考试',
    polytechnique_track: '巴黎综合理工学院入学考试',
    insp_ena: 'INSP（原 ENA）选拔考试',
    nca_bar: 'NCA 考试 + 律师资格',
    suneung: '修能（CSAT）',
    suneung_science: '修能（理科）',
    suneung_humanities: '修能（文科）',
    psat_kr: '韩国 PSAT',
    med_lic_kr: '韩国医师执照考试',
    baccalaureat: 'Baccalauréat',
    baccalaureat_science: 'Baccalauréat（理科）',
    baccalaureat_humanities: 'Baccalauréat（文科）',
    a_levels: 'A-Levels',
    a_levels_science: 'A-Levels（理科）',
    a_levels_humanities: 'A-Levels（文科）',
  },
};

const normalizeExamKey = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase('en-US')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ı]/g, 'i')
    .replace(/[ş]/g, 's')
    .replace(/[ğ]/g, 'g')
    .replace(/[ç]/g, 'c')
    .replace(/[ö]/g, 'o')
    .replace(/[ü]/g, 'u')
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')');

const examNameToCode = (() => {
  const acc: Record<string, string> = {};

  for (const [code, name] of Object.entries(enExamNames)) {
    acc[normalizeExamKey(code)] = code;
    acc[normalizeExamKey(name)] = code;
  }

  for (const localizedMap of Object.values(localizedOverrides)) {
    if (!localizedMap) continue;
    for (const [code, name] of Object.entries(localizedMap)) {
      acc[normalizeExamKey(code)] = code;
      acc[normalizeExamKey(name)] = code;
    }
  }

  return acc;
})();

const resolveExamCode = (examCodeOrName?: string | null): string | null => {
  if (!examCodeOrName) return null;
  const normalized = normalizeExamKey(examCodeOrName);
  if (!normalized) return null;
  if (enExamNames[normalized]) return normalized;
  return examNameToCode[normalized] ?? null;
};

export const getLocalizedExamName = (
  examCodeOrName?: string | null,
  lang?: SupportedLanguage,
  fallback?: string | null
): string => {
  const code = resolveExamCode(examCodeOrName);
  if (!code) return fallback ?? examCodeOrName ?? '';

  const localized = lang ? localizedOverrides[lang]?.[code] : null;
  if (localized) return localized;

  return enExamNames[code] ?? fallback ?? examCodeOrName ?? code.toUpperCase();
};
