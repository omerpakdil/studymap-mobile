export type ExamCategory = 'high_school' | 'university' | 'language' | 'professional';

export interface ExamCatalogItem {
  examCode: string;
  examName: string;
  category: ExamCategory;
  priority: number;
}

export const globalExamCatalog: ExamCatalogItem[] = [
  { examCode: 'ielts', examName: 'IELTS', category: 'language', priority: 1 },
  { examCode: 'toefl', examName: 'TOEFL', category: 'language', priority: 2 },
];

const globalExamCodeSet = new Set(globalExamCatalog.map((item) => item.examCode));

export const examCatalogByCountry: Record<string, ExamCatalogItem[]> = {
  US: [
    { examCode: 'sat', examName: 'SAT', category: 'university', priority: 1 },
    { examCode: 'act', examName: 'ACT', category: 'university', priority: 2 },
    { examCode: 'mcat', examName: 'MCAT', category: 'professional', priority: 3 },
    { examCode: 'lsat', examName: 'LSAT', category: 'professional', priority: 4 },
    { examCode: 'gre', examName: 'GRE', category: 'university', priority: 5 },
    { examCode: 'usmle', examName: 'USMLE', category: 'professional', priority: 6 },
  ],
  CN: [
    { examCode: 'gaokao', examName: 'Gaokao', category: 'university', priority: 1 },
    { examCode: 'kaoyan', examName: 'Kaoyan', category: 'university', priority: 2 },
    { examCode: 'guokao', examName: 'Guokao', category: 'professional', priority: 3 },
    { examCode: 'cpa_cn', examName: 'China CPA', category: 'professional', priority: 4 },
    { examCode: 'bar_cn', examName: 'National Legal Professional Qualification Exam', category: 'professional', priority: 5 },
    { examCode: 'hsk', examName: 'HSK', category: 'language', priority: 6 },
  ],
  JP: [
    { examCode: 'common_test_jp', examName: 'Common Test for University Admissions', category: 'university', priority: 1 },
    { examCode: 'todai_exam', examName: 'University of Tokyo Entrance Exam', category: 'university', priority: 2 },
    { examCode: 'bar_jp', examName: 'Bar Exam', category: 'professional', priority: 3 },
    { examCode: 'civil_service_jp', examName: 'National Public Service Exam', category: 'professional', priority: 4 },
    { examCode: 'jlpt', examName: 'JLPT', category: 'language', priority: 5 },
    { examCode: 'med_lic_jp', examName: 'National Medical Practitioners Exam', category: 'professional', priority: 6 },
  ],
  IN: [
    { examCode: 'jee', examName: 'JEE', category: 'university', priority: 1 },
    { examCode: 'neet', examName: 'NEET', category: 'professional', priority: 2 },
    { examCode: 'upsc', examName: 'UPSC', category: 'professional', priority: 3 },
    { examCode: 'cat', examName: 'CAT', category: 'university', priority: 4 },
    { examCode: 'gate', examName: 'GATE', category: 'university', priority: 5 },
    { examCode: 'ca_final', examName: 'CA Final', category: 'professional', priority: 6 },
  ],
  BR: [
    { examCode: 'enem', examName: 'ENEM', category: 'university', priority: 1 },
    { examCode: 'vestibular', examName: 'Vestibular', category: 'university', priority: 2 },
    { examCode: 'oab', examName: 'OAB Exam', category: 'professional', priority: 3 },
    { examCode: 'enade', examName: 'ENADE', category: 'professional', priority: 4 },
    { examCode: 'ielts', examName: 'IELTS', category: 'language', priority: 5 },
    { examCode: 'toefl', examName: 'TOEFL', category: 'language', priority: 6 },
  ],
  KR: [
    { examCode: 'suneung', examName: 'Suneung (CSAT)', category: 'university', priority: 1 },
    { examCode: 'gsat', examName: 'GSAT', category: 'professional', priority: 2 },
    { examCode: 'psat_kr', examName: 'Korean PSAT', category: 'professional', priority: 3 },
    { examCode: 'bar_kr', examName: 'Bar Exam', category: 'professional', priority: 4 },
    { examCode: 'topik', examName: 'TOPIK', category: 'language', priority: 5 },
    { examCode: 'med_lic_kr', examName: 'Korean Medical Licensing Exam', category: 'professional', priority: 6 },
  ],
  DE: [
    { examCode: 'abitur', examName: 'Abitur', category: 'high_school', priority: 1 },
    { examCode: 'staatsexamen', examName: 'Staatsexamen', category: 'professional', priority: 2 },
    { examCode: 'testdaf', examName: 'TestDaF', category: 'language', priority: 3 },
    { examCode: 'nc_track', examName: 'Numerus Clausus (NC)', category: 'university', priority: 4 },
    { examCode: 'steuerberater', examName: 'Steuerberaterprüfung', category: 'professional', priority: 5 },
    { examCode: 'zweites_staatsexamen', examName: 'Zweites Staatsexamen', category: 'professional', priority: 6 },
  ],
  UK: [
    { examCode: 'a_levels', examName: 'A-Levels', category: 'high_school', priority: 1 },
    { examCode: 'ucat', examName: 'UCAT', category: 'university', priority: 2 },
    { examCode: 'lnat', examName: 'LNAT', category: 'university', priority: 3 },
    { examCode: 'sqe', examName: 'SQE', category: 'professional', priority: 4 },
    { examCode: 'acca_icaew', examName: 'ACCA/ICAEW', category: 'professional', priority: 5 },
    { examCode: 'ielts', examName: 'IELTS', category: 'language', priority: 6 },
  ],
  ID: [
    { examCode: 'utbk_snbt', examName: 'UTBK-SNBT', category: 'university', priority: 1 },
    { examCode: 'cpns', examName: 'CPNS', category: 'professional', priority: 2 },
    { examCode: 'ukmppd', examName: 'UKMPPD', category: 'professional', priority: 3 },
    { examCode: 'cpa_id', examName: 'CPA Indonesia', category: 'professional', priority: 4 },
    { examCode: 'ielts', examName: 'IELTS', category: 'language', priority: 5 },
    { examCode: 'toefl', examName: 'TOEFL', category: 'language', priority: 6 },
  ],
  FR: [
    { examCode: 'baccalaureat', examName: 'Baccalauréat', category: 'high_school', priority: 1 },
    { examCode: 'concours_ge', examName: 'Concours Grandes Écoles', category: 'university', priority: 2 },
    { examCode: 'polytechnique_track', examName: 'École Polytechnique Entrance Exam', category: 'university', priority: 3 },
    { examCode: 'insp_ena', examName: 'INSP (ex-ENA) Competition', category: 'professional', priority: 4 },
    { examCode: 'crfpa', examName: 'CRFPA/Barreau', category: 'professional', priority: 5 },
    { examCode: 'delf_dalf', examName: 'DELF/DALF', category: 'language', priority: 6 },
  ],
  CA: [
    { examCode: 'mcat', examName: 'MCAT', category: 'professional', priority: 1 },
    { examCode: 'lsat', examName: 'LSAT', category: 'professional', priority: 2 },
    { examCode: 'mccqe', examName: 'MCCQE', category: 'professional', priority: 3 },
    { examCode: 'cpa_ca', examName: 'CPA Canada', category: 'professional', priority: 4 },
    { examCode: 'nca_bar', examName: 'NCA Exams + Bar Admission', category: 'professional', priority: 5 },
    { examCode: 'ielts', examName: 'IELTS', category: 'language', priority: 6 },
    { examCode: 'toefl', examName: 'TOEFL', category: 'language', priority: 7 },
  ],
  TR: [
    { examCode: 'tyt_ayt', examName: 'TYT + AYT', category: 'university', priority: 1 },
    { examCode: 'tyt', examName: 'TYT', category: 'university', priority: 2 },
    { examCode: 'ayt', examName: 'AYT', category: 'university', priority: 3 },
    { examCode: 'ydt_tr', examName: 'YDT', category: 'language', priority: 4 },
    { examCode: 'kpss', examName: 'KPSS', category: 'professional', priority: 5 },
    { examCode: 'ales', examName: 'ALES', category: 'university', priority: 6 },
    { examCode: 'yds', examName: 'YDS/YÖKDİL', category: 'language', priority: 7 },
    { examCode: 'dus', examName: 'DUS', category: 'professional', priority: 8 },
    { examCode: 'tus', examName: 'TUS', category: 'professional', priority: 9 },
  ],
  SA: [
    { examCode: 'qudrat', examName: 'Qudrat', category: 'university', priority: 1 },
    { examCode: 'tahsili', examName: 'Tahsili', category: 'university', priority: 2 },
    { examCode: 'scfhs', examName: 'SCFHS Exams', category: 'professional', priority: 3 },
    { examCode: 'bar_sa', examName: 'Saudi Bar', category: 'professional', priority: 4 },
    { examCode: 'cma_sa', examName: 'CMA Saudi', category: 'professional', priority: 5 },
    { examCode: 'ielts', examName: 'IELTS', category: 'language', priority: 6 },
    { examCode: 'toefl', examName: 'TOEFL', category: 'language', priority: 7 },
  ],
};

export const getExamCatalogForCountry = (countryCode?: string): ExamCatalogItem[] => {
  if (!countryCode) return examCatalogByCountry.US;
  return examCatalogByCountry[countryCode.toUpperCase()] ?? examCatalogByCountry.US;
};

export const getPrimaryExamCatalogForCountry = (countryCode?: string): ExamCatalogItem[] => {
  return getExamCatalogForCountry(countryCode).filter((item) => !globalExamCodeSet.has(item.examCode));
};

export const getGlobalExamCatalogForCountry = (countryCode?: string): ExamCatalogItem[] => {
  const countryCatalog = getExamCatalogForCountry(countryCode);
  const countryCodes = new Set(countryCatalog.map((item) => item.examCode));

  return globalExamCatalog.filter((item) => !countryCodes.has(item.examCode));
};
