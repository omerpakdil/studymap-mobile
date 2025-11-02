# 📱 StudyMap Subscription Kurulum Rehberi

## 📋 Genel Bakış

Bu rehber, StudyMap uygulaması için **RevenueCat** ve **Apple App Store Connect** kullanarak subscription sistemini sıfırdan kurmanız için gerekli tüm adımları içerir.

## 🔗 Apple Store Connect ↔ RevenueCat İlişkisi

### ⚠️ ÖNEMLİ: Her İkisinde de Kurulum Gerekli!

**Apple Store Connect** = Mağaza (Zorunlu)
- Subscription ürünlerini tanımlar
- Fiyatları belirler
- Parayı toplar
- App Store'da yayınlar

**RevenueCat** = Arabulucu (Zorunlu)
- Apple ile app'iniz arasında köprü
- Subscription durumunu kontrol eder
- Analytics sağlar
- Kod'unuzu basitleştirir

### Akış Şeması:
```
1. Kullanıcı → "Purchase" basar
2. App → RevenueCat'e sorar: "Hangi planlar var?"
3. RevenueCat → Apple'a sorar
4. Apple → RevenueCat'e cevap verir
5. RevenueCat → App'e planları gönderir
6. Kullanıcı → Plan seçer, onaylar
7. Apple → Parayı alır
8. RevenueCat → App'e bildirir: "Kullanıcı premium!"
```

### ⚠️ Kritik Kural:
**Product ID'ler TAMAMEN AYNI olmalı!**

Apple'da: `com.studymap.premium.monthly`
RevenueCat'te: `com.studymap.premium.monthly` ← Aynı!

### Kurulum Sırası:
1. **ÖNCE** → Apple Store Connect (Ürünleri oluştur)
2. **SONRA** → RevenueCat (Apple'dakilerle aynı ID'leri kullan)

---

## 🎯 Senin Plan Yapın

### ✅ Kullanacağın Planlar:

### 1. **Weekly Plan** (Haftalık) - 🆕 DENEME
- **Fiyat**: Belirlemen gereken (örn: $2.99/hafta)
- **Hedef Kitle**: Deneme yapmak isteyen kullanıcılar
- **Özellik**: Düşük başlangıç maliyeti
- **Mevcut Durum**: ❌ Oluşturman gerekiyor

### 2. **Monthly Plan** (Aylık)
- **Fiyat**: Belirlemen gereken (örn: $9.99/ay)
- **Hedef Kitle**: Esneklik isteyen kullanıcılar
- **Özellik**: İptal kolaylığı
- **Mevcut Durum**: ✅ Apple'da oluşturulmuş

### 3. **Annual Plan** (Yıllık) - ⭐ ANA PLAN
- **Fiyat**: Belirlemen gereken (örn: $69.99/yıl)
- **Hedef Kitle**: Uzun vadeli kullanıcılar
- **Özellik**: En popüler plan, maksimum tasarruf
- **Mevcut Durum**: ✅ Apple'da oluşturulmuş

### ❌ Kullanmayacakların:
- **Lifetime**: Non-Consumable olarak tanımlanmış ama subscription sisteminde kullanmayacaksın → SİL veya GÖRMEZDEN GEL

---

## 📱 Senin App Bilgilerin

**Bundle ID**: `com.studymap.mobile`

**Product ID'ler (Standart format):**
- Weekly: `com.studymap.mobile.premium.weekly` (oluşturacaksın)
- Monthly: `com.studymap.mobile.premium.monthly`
- Annual: `com.studymap.mobile.premium.annual`

> ⚠️ **ÖNEMLİ:** Subscription Group'taki mevcut 2 subscription'ın Product ID'lerini kontrol et. Eğer farklıysa (örn: `studymap_pro_monthly`), aşağıdaki rehberde o ID'leri kullan!

---

## 1️⃣ Apple App Store Connect Ayarları

> ✅ **Mevcut Durum:** "StudyMap Pro Subscriptions" group'unda **2 subscription var** (Monthly + Annual)
> 🆕 **Yapman Gereken:** Weekly subscription ekle

### A. Mevcut Subscription'ları Kontrol Et

#### Adım 1: Subscription Group'a Git
1. App Store Connect → Uygulamana git
2. **"Subscriptions"** tab'ına tıkla (soldaki menüden)
3. **"StudyMap Pro Subscriptions"** grubuna tıkla

#### Adım 2: Mevcut Product ID'leri Not Et
İçindeki 2 subscription'a tıkla ve şunları not et:

**Monthly Plan:**
```
Product ID: _____________ (buraya yaz)
Duration: 1 Month ✅
Price: _____________
```

**Annual Plan:**
```
Product ID: _____________ (buraya yaz)
Duration: 1 Year ✅
Price: _____________
```

> 🔍 **Bu Product ID'leri çok önemli! RevenueCat'te AYNEN bunları kullanacaksın.**

#### Adım 3: Weekly Subscription Ekle (YENİ)

1. "StudyMap Pro Subscriptions" grup sayfasındayken
2. **"+"** butonuna tıkla (grup içine yeni subscription eklemek için)
3. Bilgileri doldur:

**Weekly Plan:**
```
Product ID: com.studymap.mobile.premium.weekly
(veya mevcut pattern'e uygun: studymap_pro_weekly)

Reference Name: StudyMap Premium Weekly
Subscription Group: StudyMap Pro Subscriptions (otomatik seçili)
Subscription Duration: 1 Week
```

4. **Localizations** ekle (en-US minimum):
   - **Display Name**: "Weekly Premium Trial"
   - **Description**: "Try StudyMap Premium for one week with full access to AI-powered features"

5. **Price** seç:
   - Örn: $2.99 (veya Türkiye için uygun fiyat)

6. **Save** tıkla

7. Product ID'yi not et:
```
Weekly Product ID: _____________ (buraya yaz)
```

#### Adım 3: Kontrol Et - Eksik Olan Varsa Tamamla

Her iki subscription için kontrol et:

**✅ Olması Gerekenler:**
- [ ] Product ID var
- [ ] Price seçilmiş
- [ ] Duration doğru (Monthly: 1 Month, Annual: 1 Year)
- [ ] Localizations eklenmiş (en-US minimum)
  - Display Name: "Monthly Premium" / "Annual Premium"
  - Description: En az 10 kelime
- [ ] Review Screenshot yüklenmiş (**ZORUNLU!**)
- [ ] Status: "Ready to Submit" veya "Approved"

**❌ Eksikse:**
- Her subscription'a tıkla → Edit → Ekle → Save

#### Adım 5: Lifetime Product'ı Görmezden Gel

**"Lifetime"** (Product ID: `studymap_pro_lifetime`) → **KULLANMA**
- Non-Consumable type (subscription değil)
- Subscription sisteminle uyumsuz
- RevenueCat'te ekleme
- Silebilirsin veya draft olarak bırakabilirsin

#### Adım 6: App-Specific Shared Secret Oluştur
1. App Store Connect → **Apps** → **Uygulamana tıkla** → **App Information**
2. **"App-Specific Shared Secret"** bölümü
3. **"Manage"** → **"Generate"** tıkla (eğer yoksa)
4. Key'i kopyala (örn: `a1b2c3d4e5f6...`) → RevenueCat'te lazım olacak

#### Adım 7: Agreements & Tax Form (Eğer yoksa)
- **Paid Applications Agreement** imzalanmalı
- **Banking & Tax** bilgileri doldurulmalı

---

## 2️⃣ RevenueCat Dashboard Ayarları (APPLE'DAN SONRA)

> 💡 **Neden sonra RevenueCat?** Çünkü Apple'da oluşturduğun Product ID'leri buraya gireceksin. Önce ürünler Apple'da olmalı.

> ⚠️ **HATIRLATMA:** Apple'da oluşturduğun Product ID'leri (örn: `com.studymap.premium.monthly`) burada **AYNEN** kullanacaksın!

### A. Proje Oluştur

#### Adım 1: RevenueCat Hesabı
1. https://app.revenuecat.com/ → Sign Up/Login
2. **Create New Project**
3. **Project Name**: "StudyMap" (veya istediğin isim)

#### Adım 2: App Store Integration
1. **Project Settings** (sol alt köşe ⚙️) → **Apps**
2. **"+"** → **"Apple App Store"**
3. Gerekli bilgileri gir:
   - **App Name**: StudyMap
   - **Bundle ID**: `com.studymap.app` (uygulamanın bundle ID'si)
   - **App Store Connect API Key** veya **App-Specific Shared Secret**

**App-Specific Shared Secret Alma**:
- App Store Connect → **Apps** → **[Uygulan]** → **App Information**
- **"App-Specific Shared Secret"** bölümünden **"Generate"** tıkla
- Oluşan key'i kopyala ve RevenueCat'e yapıştır

4. **Save**

### B. Products Oluştur

#### Adım 1: RevenueCat Products
1. Sol menüden **"Products"** seç
2. Her plan için **"New"** butonuna tıkla

##### Monthly Product:
```
Identifier: rc_monthly
↑ Bu senin seçtiğin isim (internal, istediğin olabilir)

App Store Product ID: [APPLE'DAN KOPYALADIĞIN PRODUCT ID]
↑ ⚠️ ÖRN: studymap_pro_monthly VEYA com.studymap.mobile.premium.monthly
↑ ⚠️ APPLE'DAN AYNEN KOPYALA! (Yukarıda not ettiğin Product ID)

Type: Subscription
Platform: iOS
```

##### Annual Product:
```
Identifier: rc_annual
↑ Internal isim (istediğin olabilir)

App Store Product ID: [APPLE'DAN KOPYALADIĞIN PRODUCT ID]
↑ ⚠️ ÖRN: studymap_pro_annual VEYA com.studymap.mobile.premium.annual
↑ ⚠️ APPLE'DAN AYNEN KOPYALA! (Yukarıda not ettiğin Product ID)

Type: Subscription
Platform: iOS
```

3. Her product için **"Save"**

> 🔍 **Hatırlatma:** Apple Store Connect → Subscriptions → StudyMap Pro Subscriptions → Her subscription'a tıkla → "Product ID" alanını kopyala → RevenueCat'e yapıştır
>
> ⚠️ **SADECE 2 PRODUCT!** Weekly yok, Lifetime kullanmıyoruz!

### C. Entitlements Oluştur

#### Adım 1: Entitlement Tanımla
1. Sol menüden **"Entitlements"** seç
2. **"New"** butonuna tıkla

```
Identifier: premium
(⚠️ ÖNEMLİ: Kod'da 'premium' kullanılıyor, değiştirme!)

Display Name: Premium Access
Description: Full access to all premium features
```

#### Adım 2: Products Ekle
- Oluşturduğun **2 subscription product'ı** (rc_monthly, rc_annual) entitlement'a ekle
- **"Attach Products"** → Her iki product'ı seç → **"Save"**
- ⚠️ Lifetime ekleme!

### D. Offerings Oluştur (ÇOK ÖNEMLİ!)

#### Adım 1: Default Offering
1. Sol menüden **"Offerings"** seç
2. **"New Offering"** tıkla

```
Identifier: default
Description: Default Premium Offering
Make this the current offering: ✅ (Mutlaka seç!)
```

#### Adım 2: Packages Ekle

Offering içinde **"+"** butonuna tıklayarak packages ekle:

##### Annual Package (İlk sırada - En popüler):
```
Identifier: $rc_annual
($ ile başlamalı - RevenueCat default package convention)

Package Type: Annual (dropdown'dan seç)
Product: rc_annual (az önce oluşturduğun)
Position: 1
```

##### Monthly Package:
```
Identifier: $rc_monthly
Package Type: Monthly (dropdown'dan seç)
Product: rc_monthly (az önce oluşturduğun)
Position: 2
```

> ⚠️ **SADECE 2 PACKAGE!** Weekly ve Lifetime ekleme!

#### Adım 3: Save Offering
- Tüm packages'ı ekledikten sonra **"Save Offering"**
- **"Make Current"** butonuna tıkla (eğer otomatik olmadıysa)

### E. API Keys

#### Adım 1: API Key'i Kopyala
1. **Project Settings** → **API Keys**
2. **Public app-specific API key** bölümünden iOS key'ini kopyala
3. `.env` dosyasına ekle:

```bash
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_xxxxxxxxxxxx
```

---

## 3️⃣ Kod Güncellemeleri

### ✅ Tamamlananlar:
- RevenueCat entegrasyonu (/Users/macbookair/Desktop/studymap-mobile/app/utils/subscriptionManager.ts:1-268)
- Subscription UI (/Users/macbookair/Desktop/studymap-mobile/app/(onboarding)/subscription.tsx:1-1184)
- Purchase fonksiyonu aktif edildi (/Users/macbookair/Desktop/studymap-mobile/app/(onboarding)/subscription.tsx:114-153)
- Error handling eklendi
- Multiple plans desteği hazır

### 📝 Yapman Gerekenler:
✅ **YOK! Kod hazır, sadece RevenueCat ve App Store Connect ayarlarını tamamla**

---

## 4️⃣ Test Etme

### A. Sandbox Test Hesabı Oluştur

#### Adım 1: Test Kullanıcısı
1. App Store Connect → **"Users and Access"** → **"Sandbox Testers"**
2. **"+"** butonuna tıkla
3. Test email ve şifre oluştur (örn: `test@studymap.com`)

#### Adım 2: iOS Cihaz Ayarları
1. **Settings** → **App Store** → **Sandbox Account**
2. Test hesabıyla giriş yap
3. **ASLA** gerçek App Store hesabınla test yapma!

### B. Test Senaryoları

#### ✅ Test 1: Offerings Yükleniyor mu?
1. Uygulamayı aç
2. Subscription ekranına git
3. Tüm planlar görünmeli (Monthly, Annual, Weekly)
4. Console'da şu log'ları kontrol et:
   ```
   📦 Available offerings: ...
   📦 Available packages count: 2 (veya 3)
   ```

#### ✅ Test 2: Purchase Akışı
1. Bir plan seç
2. **"Start Premium"** butonuna tıkla
3. Sandbox ödeme ekranı açılmalı
4. Test hesabıyla onayla
5. Success modal görünmeli
6. Dashboard'a yönlendirilmeli

#### ✅ Test 3: Restore Purchases
1. Aboneliği iptal et veya uygulamayı sil
2. Uygulamayı tekrar yükle
3. Subscription ekranına git
4. **"Restore Purchases"** tıkla
5. Abonelik restore edilmeli

#### ✅ Test 4: Intro Offers
1. Yeni bir sandbox hesabı kullan
2. Intro offer görünmeli ("7 days FREE" badge)
3. Purchase yaptığında trial başlamalı

### C. Hata Kontrolü

#### Sık Karşılaşılan Hatalar:

**1. "No subscription options available"**
- **Sebep**: RevenueCat offering'i current değil
- **Çözüm**: RevenueCat'te offering'i "Make Current" yap

**2. "Product not available for purchase"**
- **Sebep**: App Store Connect'te product'lar onaylanmamış
- **Çözüm**: Product'ların status'ü "Ready to Submit" veya "Approved" olmalı

**3. "Unable to connect to App Store"**
- **Sebep**: Sandbox hesabı doğru ayarlanmamış
- **Çözüm**: Settings → App Store → Sandbox hesabını kontrol et

**4. "Entitlement not found"**
- **Sebep**: RevenueCat'te entitlement'a product eklenmemiş
- **Çözüm**: Entitlements → premium → Products ekle

---

## 5️⃣ Production'a Alma

### A. App Review Hazırlığı

#### Gerekli Bilgiler:
1. **Screenshot**: Subscription ekranının screenshot'ı
2. **Demo Hesap**: Reviewer'ların test edebileceği hesap
3. **Subscription Explanation**: "Why subscription?" sorusuna cevap
4. **Restore Purchases**: Uygulamada görünür olmalı ✅

#### App Review Notes:
```
Subscription Features:
- AI-powered personalized study plans
- Advanced analytics and progress tracking
- Unlimited access to all premium content

Test Account:
Email: reviewer@studymap.com
Password: [TestPassword123]

Note: All subscription features are implemented using RevenueCat.
Restore purchases button is visible on the subscription screen.
```

### B. Production Build

#### Adım 1: EAS Build (Expo)
```bash
# .env dosyasını production moduna al
EXPO_PUBLIC_APP_ENV=production

# Build al
eas build --platform ios --profile production
```

#### Adım 2: TestFlight
1. Build'i App Store Connect'e yükle
2. Internal test için TestFlight'ta yayınla
3. Gerçek hesaplarla test et

#### Adım 3: App Store Submission
1. App Store Connect → **"App Store"** tab
2. **"+"** → **"New Version"**
3. Tüm metadata'yı doldur
4. Screenshots yükle (subscription ekranı dahil!)
5. **"Submit for Review"**

---

## 6️⃣ Analytics ve Monitoring

### A. RevenueCat Dashboard

#### Önemli Metrikler:
- **MRR (Monthly Recurring Revenue)**: Aylık yinelenen gelir
- **Active Subscriptions**: Aktif abonelik sayısı
- **Churn Rate**: İptal oranı
- **Trial Conversion**: Deneme → Ödeme dönüşüm oranı

#### Charts:
1. **Overview** → Dashboard'da genel bakış
2. **Charts** → Detaylı grafik ve analizler
3. **Customers** → Bireysel kullanıcı abonelik geçmişi

### B. App Store Connect

#### Sales and Trends:
- **Subscriptions** tab → Günlük/haftalık/aylık abonelik raporları
- **Proceeds** → Net gelir (Apple komisyonu sonrası)

---

## 7️⃣ Fiyatlandırma Stratejisi

### Önerilen Ayarlar:

#### Annual Plan (En Popüler):
- **Base**: $69.99/yıl
- **Trial**: 7 gün ücretsiz
- **Badge**: "MOST POPULAR" + "SAVE 42%"
- **Position**: İlk sırada göster

#### Monthly Plan:
- **Base**: $9.99/ay
- **Trial**: Yok (veya 3 gün)
- **Badge**: "Flexible"
- **Position**: İkinci sırada

#### Conversion Optimization:
- Annual plan'ı default seçili yap ✅ (kod'da yapıldı)
- Aylık eşdeğer göster ("Only $5.83/month") ✅
- Tasarruf yüzdesini vurgula ✅

---

## 8️⃣ Checklist

### 🍎 Apple Store Connect (ÖNCE):
- [ ] "StudyMap Pro Subscriptions" subscription group'u kontrol edildi ✅
- [ ] Monthly subscription Product ID'si not edildi: `_____________`
- [ ] Annual subscription Product ID'si not edildi: `_____________`
- [ ] Her iki subscription için:
  - [ ] Localizations tamamlandı (Display Name + Description)
  - [ ] Review Screenshot yüklendi (**ZORUNLU!**)
  - [ ] Status: "Ready to Submit" veya "Approved"
- [ ] Intro offers eklendi (7-day free trial) - İsteğe bağlı
- [ ] Lifetime product görmezden gelindi veya silindi
- [ ] App-Specific Shared Secret oluşturuldu ve kopyalandı

### 🐈 RevenueCat (SONRA):
- [ ] Project oluşturuldu
- [ ] App Store integration yapıldı:
  - [ ] Bundle ID: `com.studymap.mobile` ✅
  - [ ] Shared Secret yapıştırıldı
- [ ] Products oluşturuldu (**SADECE 2 TANE**):
  - [ ] `rc_monthly` → App Store Product ID: `[APPLE'DAN KOPYALADIĞIN]` ✅ AYNI
  - [ ] `rc_annual` → App Store Product ID: `[APPLE'DAN KOPYALADIĞIN]` ✅ AYNI
- [ ] Entitlement oluşturuldu (`premium`)
- [ ] **2 product** entitlement'a eklendi (rc_monthly, rc_annual)
- [ ] Offering oluşturuldu (`default`)
- [ ] **2 Package** eklendi ve sıralandı:
  - [ ] Position 1: Annual (`$rc_annual`)
  - [ ] Position 2: Monthly (`$rc_monthly`)
- [ ] Offering "Make Current" yapıldı ⚠️ ÖNEMLİ!
- [ ] API key .env'de mevcut ✅ (zaten var: `appl_BxarIUADgNlVXQRsTzQByoWrxAl`)

### Test:
- [ ] Sandbox hesabı oluşturuldu
- [ ] Offerings yüklendiği test edildi
- [ ] Purchase akışı test edildi
- [ ] Restore purchases test edildi
- [ ] Intro offers test edildi
- [ ] Error handling test edildi

### Production:
- [ ] TestFlight'ta internal test yapıldı
- [ ] External test kullanıcılarla denendi
- [ ] App Review notes hazırlandı
- [ ] Screenshots güncellendi
- [ ] App Store submission yapıldı

---

## 🆘 Destek ve Kaynaklar

### Dokümantasyon:
- RevenueCat: https://docs.revenuecat.com/
- Apple In-App Purchase: https://developer.apple.com/in-app-purchase/
- Expo Config: https://docs.expo.dev/

### Sorun Giderme:
- RevenueCat Debug Logs: App'te console.log'ları kontrol et
- App Store Connect Status: Products tab'ında status kontrol et
- RevenueCat Support: support@revenuecat.com

---

## 📊 Beklenen Sonuçlar

### Başarılı Kurulumda:
✅ Subscription ekranında 2-3 plan görünmeli
✅ Purchase akışı sorunsuz çalışmalı
✅ Success modal gösterilmeli
✅ Restore purchases çalışmalı
✅ Intro offers (trial) görünmeli
✅ Analytics'te data akmalı

### İlk Ay Metrikleri:
- **Trial-to-Paid Conversion**: %20-30 (iyi)
- **Annual Plan Selection**: %60-70 (hedef)
- **Churn Rate**: <%10 (ilk ay için)

---

## 🎉 Tamamlandı!

Subscription sistemi tamamen hazır. Sadece App Store Connect ve RevenueCat'te yukarıdaki adımları takip et, testlerini yap ve production'a al!

---

## 📝 Hızlı Özet: Apple ↔ RevenueCat İlişkisi

| Konu | Apple Store Connect | RevenueCat |
|------|---------------------|------------|
| **Rol** | Ürün sahibi (fiyat, satış) | Arabulucu (kontrol, analytics) |
| **Sıra** | 1. ÖNCE buraya | 2. SONRA buraya |
| **Product ID** | `com.studymap.premium.monthly` | **AYNI**: `com.studymap.premium.monthly` |
| **İç İsim** | Yok | `rc_monthly` (istediğin) |
| **Bağlantı** | App-Specific Shared Secret | Shared Secret ile bağlan |
| **Görevi** | Parayı toplar | Durumu kontrol eder |

### En Önemli Kural:
```
Apple'da oluşturduğun Product ID
    ↓
RevenueCat'e AYNEN kopyala
    ↓
Aksi halde çalışmaz!
```

**Sorularında bana ulaşabilirsin!** 🚀
