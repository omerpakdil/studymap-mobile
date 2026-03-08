# Subject Localization Smoke Test

Bu liste, subject adlarinin generic ceviri degil, sinavin yerel kullanimi ile gorundugunu dogrulamak icin hazirlandi.

Kontrol edilecek ekranlar:
- `Onboarding > Subject Focus`
- `Onboarding > Plan Preview`
- `Dashboard`
- `Calendar`
- `Progress`
- `Study Session`

Her testte:
- Telefon dilini hedef locale yap
- Ilgili ulkeyi sec
- Sinavi sec
- Subject adlarinin asagidaki beklenen karsiliklarla geldigini kontrol et

## Turkiye

### ALES
- `Quantitative` -> `Sayisal`
- `Verbal/Language` -> `Sozel`
- `Practice & Review` -> `Deneme ve Analiz`

### YKS
- `TYT Core` -> `TYT`
- `AYT Field` -> `AYT`
- `YDT/Elective` -> `YDT/Secmeli`

### KPSS
- `General Ability` -> `Genel Yetenek`
- `General Culture` -> `Genel Kultur`
- `Field/Education` -> `Alan Bilgisi/Egitim`

### YDS
- `Reading` -> `Okuma`
- `Listening` -> `Dinleme`
- `Writing` -> `Yazma`
- `Speaking` -> `Konusma`

### DUS
- `Core Concepts` -> `Temel Bilimler`
- `Applied Reasoning` -> `Klinik Yorum`
- `Practice Tests` -> `Deneme ve Vaka Analizi`

### TUS
- `Core Concepts` -> `Temel Bilimler`
- `Applied Reasoning` -> `Klinik Bilimler`
- `Practice Tests` -> `Deneme ve Vaka Analizi`

## Cin

### Gaokao
- `Chinese` -> `语文`
- `Math` -> `数学`
- `English` -> `英语`
- `Track Subjects` -> `选考科目`

### Kaoyan
- `Politics` -> `政治`
- `English` -> `英语`
- `Math/Core` -> `数学/专业基础`
- `Major Subject` -> `专业课`

### Guokao
- `Administrative Aptitude` -> `行测`
- `Essay/Policy` -> `申论`

### HSK
- `Listening` -> `听力`
- `Reading` -> `阅读`
- `Writing` -> `书写`

## Japonya

### Common Test
- `Japanese` -> `国語`
- `Math` -> `数学`
- `English` -> `英語`
- `Science/Social` -> `理科/地歴公民`

### Todai Exam
- `Quantitative` -> `数学`
- `Verbal/Language` -> `国語/英語`
- `Practice & Review` -> `過去問演習`

### JLPT
- `Vocabulary/Kanji` -> `文字・語彙`
- `Grammar/Reading` -> `文法・読解`
- `Listening` -> `聴解`

## Hindistan

### JEE
- `Physics` -> `भौतिकी`
- `Chemistry` -> `रसायन विज्ञान`
- `Math` -> `गणित`

### NEET
- `Physics` -> `भौतिकी`
- `Chemistry` -> `रसायन विज्ञान`
- `Biology` -> `जीव विज्ञान`

### CAT / GATE
- `Quantitative` -> `क्वांट`
- `Verbal/Language` -> `वर्बल/रीडिंग`
- `Practice & Review` -> `मॉक और रिव्यू`

## Brezilya

### ENEM
- `Languages` -> `Linguagens`
- `Human Sciences` -> `Ciencias Humanas`
- `Natural Sciences` -> `Ciencias da Natureza`
- `Math` -> `Matematica`
- `Essay` -> `Redacao`

### Vestibular
- `Quantitative` -> `Matematica`
- `Verbal/Language` -> `Linguagens`
- `Practice & Review` -> `Simulados e Revisao`

## Kore

### Suneung
- `Korean` -> `국어`
- `Math` -> `수학`
- `English` -> `영어`
- `Electives` -> `탐구`

### TOPIK
- `Reading` -> `읽기`
- `Listening` -> `듣기`
- `Writing` -> `쓰기`
- `Speaking` -> `말하기`

## Almanya

### Abitur
- `German` -> `Deutsch`
- `Math` -> `Mathematik`
- `Foreign Language` -> `Fremdsprache`
- `Electives` -> `Leistungskurse`

### TestDaF
- `Reading` -> `Leseverstehen`
- `Listening` -> `Hoerverstehen`
- `Writing` -> `Schriftlicher Ausdruck`
- `Speaking` -> `Muendlicher Ausdruck`

## Fransa

### Baccalaureat
- `French` -> `Francais`
- `Philosophy` -> `Philosophie`
- `Specialties` -> `Specialites`
- `Oral/Written` -> `Grand oral / Epreuves ecrites`

### DELF/DALF
- `Reading` -> `Comprehension ecrite`
- `Listening` -> `Comprehension orale`
- `Writing` -> `Production ecrite`
- `Speaking` -> `Production orale`

## Endonezya

### UTBK-SNBT
- `Aptitude` -> `Potensi Skolastik`
- `Literacy` -> `Literasi`
- `Numeracy` -> `Penalaran Matematika`

## Suudi Arabistan

### Qudrat
- `Verbal` -> `لفظي`
- `Quantitative` -> `كمي`

### Tahsili
- `Math` -> `رياضيات`
- `Physics` -> `فيزياء`
- `Chemistry` -> `كيمياء`
- `Biology` -> `أحياء`

## Notlar

- `US` ve `UK` sinavlarinda cogu subject adi zaten dogal İngilizce oldugu icin fark daha az gorunur.
- Bir subject generic gorunuyorsa ilk bakilacak yer:
  - `app/i18n/subjectNames.ts`
  - ilgili `examCode` icin `examSpecificOverrides`
