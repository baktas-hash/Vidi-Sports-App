# Backend planı

Karar: ayrı bir `apps/api` yok. Next.js hem sayfayı hem route handler'ı
veriyor; iki kişilik ekipte ayrı servis demek ikinci deploy, ikinci auth
katmanı ve gereksiz CORS. Gerçek ihtiyaç doğarsa (ağır cron, kuyruk) monorepo
zaten ayırmayı kolaylaştırıyor.

## Durum

Yazılmış ve gerçek isteklerle denenmiş:

| Endpoint | Notlar |
| --- | --- |
| `POST /api/auth/register` | scrypt, oturum çerezi kurulur |
| `POST /api/auth/login` | e-posta büyük/küçük harf duyarsız, sabit hata mesajı |
| `POST /api/auth/logout` | 204 |
| `GET /api/auth/me` | giriş yoksa 200 + `user: null` |
| `POST /api/logs` | yarım yıldız, segment, görünürlük doğrulaması |
| `GET /api/logs` | `scope=global\|following\|user`, cursor |
| `GET/PATCH/DELETE /api/logs/[id]` | sahiplik ve görünürlük kontrolü |
| `GET /api/events` | tek kutu arama + filtreler |
| `GET /api/events/[slug]` | stat ismi maç tarihine göre |
| `GET /api/events/[slug]/stats` | ağırlıklı ortalama, dağılım, `byMedium` |

Henüz yok: beğeni, yorum, takip, listeler, stat sayfası, arayüz.

## Klasörler

```
apps/web/
  app/
    (site)/                     giriş, hakkında — auth istemeyen sayfalar
    (app)/
      layout.tsx
      page.tsx                  ana akış
      [handle]/page.tsx         profil
      [handle]/logs/page.tsx    kullanıcının log'ları
      event/[slug]/page.tsx     event sayfası + puan dağılımı + yorumlar
      venue/[slug]/page.tsx     stat sayfası
      list/[handle]/[slug]/
      search/page.tsx
    api/
      auth/[...nextauth]/route.ts
      logs/route.ts                 GET akış (cursor)   POST yeni log
      logs/[id]/route.ts            GET  PATCH  DELETE
      logs/[id]/like/route.ts       PUT  DELETE
      logs/[id]/comments/route.ts   GET  POST
      comments/[id]/route.ts        PATCH  DELETE
      events/route.ts               GET arama/filtre
      events/[slug]/route.ts        GET detay
      events/[slug]/stats/route.ts  GET ağırlıklı ortalama, dağılım, kapsam
      venues/[slug]/route.ts        GET detay + o statta oynanmış event'ler
      users/[handle]/route.ts       GET profil + sayaçlar
      users/[handle]/follow/route.ts PUT  DELETE
      lists/route.ts                GET  POST
      lists/[id]/route.ts           GET  PATCH  DELETE
      lists/[id]/items/route.ts     PUT (sıralamayı toptan yaz)
      search/route.ts               GET tek kutu arama (event + venue + entity)
  lib/
    session.ts                  auth okuma, `requireUser()`
    queries/                    aggregate başına bir dosya, ham SQL
      logs.ts  events.ts  venues.ts  users.ts  lists.ts  feed.ts
    validation/                 istek gövdesi şemaları (zod)
    http.ts                     ok() / fail() / problem detayları

packages/db/                    pg pool + tip parser'ları + query helper
                                (hem apps/web hem data/ scriptleri kullanır)
packages/shared/                enum, slug, puan, kapsam — şu an var
```

`data/src/db.ts` şu an pool'u kendi tutuyor. `packages/db`'ye taşınacak; tarih
tip parser'ı gibi şeyler tek yerde durmalı.

## Endpoint sözleşmeleri

Hepsi JSON. Hata formatı tek: `{ error: { code, message, fields? } }`.
Liste dönen her endpoint cursor tabanlı: `?cursor=<opaque>&limit=<n>`,
cevapta `{ items, nextCursor }`. Offset kullanmıyoruz — akışa sürekli yeni log
girdiği için sayfa kayar.

### `POST /api/logs`

Ürünün tek önemli yazma yolu.

```jsonc
{
  "eventId": "uuid",
  "medium": "stadium",          // enums.ts MEDIUMS
  "watchedOn": "2026-02-15",    // takvim günü, saat yok
  "rating": 3.5,                // yarım yıldız; DB'de 7 olarak durur
  "atmosphere": 5,              // sadece anlamlıysa
  "review": "…",
  "hasSpoilers": false,
  "isLiveWatch": true,
  "isRewatch": false,
  "ticketRef": "Kapalı, Blok 214, Sıra 12",
  "segments": [1, 2],           // boş/yok = tamamını izledi
  "visibility": "public"
}
```

Sunucu tarafında:

1. `watchedOn` event tarihinden önce olamaz — DB trigger'ı zaten reddediyor,
   API bunu 422'ye çevirir, 500'e değil.
2. `rating` yarım yıldız gridine oturmalı; `starsToPoint` zaten `RangeError`
   atıyor.
3. `segments` `event.segment_count_actual`'ı aşamaz.
4. `medium: 'stadium'` ileride doğrulama katmanının bağlanacağı yer — şimdilik
   sadece bir alan.

### `GET /api/events/[slug]/stats`

Puan ortalaması burada hesaplanıyor, kolona yazılmıyor. Ağırlık formülü
(`ratingWeight`) beta verisi görülmeden doğru olamaz; view'da ve fonksiyonda
durması bilerek.

```jsonc
{
  "count": 128,
  "average": 3.8,               // ratingWeight ile ağırlıklı
  "unweightedAverage": 3.9,
  // Dizi, sözlük değil: JS tam sayı benzeri anahtarları öne alıyor, yani
  // { "1": …, "4.5": … } istemcide 1,2,3,4,5,0.5,1.5… sırasına düşüyor.
  "distribution": [{ "stars": 0.5, "count": 2 }, { "stars": 1, "count": 5 }],
  "sawEndingShare": 0.71,       // sonunu görenlerin oranı
  "byMedium": { "stadium": { "count": 12, "average": 4.4 } }
}
```

`byMedium` ilk günden dursun: stada gidenin puanı ile televizyondan izleyenin
puanı ayrı okunabilmeli. Aynı mekanizma ileride taraftarlık kırılımına da yer
açıyor.

### `GET /api/logs` — akış

Üç mod: `?scope=following` (varsayılan), `?scope=global`,
`?scope=user&handle=…`. `visibility` filtresi sorgunun içinde, uygulama
katmanında değil — bir endpoint'i unutmak sızıntı demek.

## Sırası

1. ~~`packages/db` — pool ve tip parser'larını tek yere al.~~
2. ~~`lib/queries/*` + `POST /api/logs` + `GET /api/events/[slug]`.~~
3. ~~Auth (e-posta + şifre, kendi oturum tablosu).~~
4. Beğeni, yorum, takip — akışın sosyal tarafı.
5. Arayüz: event sayfası ve log formu.
6. Listeler ve stat koleksiyonu.

## Açık kalanlar

- **Tip üretimi**: `enums.ts` ile SQL `CHECK`'leri elle senkron. İkiden fazla
  yere yayılırsa migration'dan tip üretmek (kanel, pg-to-ts) daha güvenli.
- **`ratingWeight` katsayıları**: uydurma. Beta verisi görülmeden doğru olamaz;
  `packages/shared/src/coverage.ts` içinde tek yerde duruyor.
- **Oturum temizliği**: süresi geçmiş `session` satırlarını silen bir iş yok.
  Sorgular `expires_at > now()` filtreliyor, yani güvenlik değil hijyen sorunu.
- **Rate limit**: `POST /api/auth/login` ve `register` şu an sınırsız.
