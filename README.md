# Vidi

Spor için log, puan ve yorum. Bir event'e gidersin ya da izlersin; kaydeder,
puan verir, yazarsın.

## Kurulum

```bash
npm install
cp .env.example .env          # gerekirse DATABASE_URL'i düzelt
createdb vidi_dev

npm run db:migrate            # şemayı kur
npm run db:seed               # data/sports.json -> sport + format
npm run db:seed:demo          # yerel geliştirme için örnek veri

npm run dev                   # http://localhost:3000
```

`apps/web` kendi `.env.local`'ını okur (Next kök dizinin `.env`'ini görmez):

```bash
printf 'DATABASE_URL=postgres://localhost:5432/vidi_dev\n' > apps/web/.env.local
```

macOS + Homebrew'da Postgres kapalıysa:

```bash
brew services start postgresql@14
```

## Komutlar

| Komut                  | Ne yapar                                              |
| ---------------------- | ----------------------------------------------------- |
| `npm run db:migrate`   | `db/migrations/*.sql`'i sırayla, bir kez uygular       |
| `npm run db:seed`      | Spor ve format tablolarını `sports.json`'dan doldurur  |
| `npm run db:seed:demo` | Örnek stat/kulüp/event/log verisi (reset sonrası)      |
| `npm run db:reset`     | `public` şemasını siler (sadece localhost'a izin verir)|
| `npm run dev`          | Next dev sunucusu                                     |
| `npm run build`        | Üretim derlemesi                                      |
| `npm run typecheck`    | Bütün workspace'ler + `apps/web`                      |
| `npm test`             | `packages/shared` testleri                            |

## Yapı

```
db/migrations/     Numaralı SQL dosyaları. Uygulanmış dosya DEĞİŞTİRİLMEZ,
                   yenisi yazılır — migrate checksum tutuyor.
data/sports.json   İçerik operasyonunun sahip olduğu tek dosya. Spor ve format
                   listesi burada; kod tarafında karşılığı yok.
data/src/          Migration runner ve seed scriptleri (tsx ile çalışır).
packages/shared/   Enum'lar, slug, puan ve kapsam mantığı. Hem web hem
                   scriptler buradan import eder.
packages/db/       pg pool ve tip parser'ları. Tek doğruluk kaynağı.
apps/web/          Next.js — sayfalar ve API. Ayrı bir backend servisi yok.
  lib/queries/     Aggregate başına ham SQL.
  lib/validation/  İstek gövdesi şemaları (zod).
  app/api/         Route handler'lar.
docs/              Şema ve API kararları.
```

`packages/*` derlenmiş değil, TypeScript kaynağı olarak import ediliyor. Bu
yüzden paket içi importlar uzantısız (`./pool`, `./pool.js` değil): Turbopack
`.js` → `.ts` eşlemesi yapmıyor ve bunu yapılandırmanın bir yolu yok.

## Bilinmesi gereken üç şey

1. **Stat, ev sahibi kulüpten türetilmez.** `event.venue_id` maçın kendi
   kolonu. Ceza, tadilat, nötr saha, stat paylaşımı hepsi normal durum.
2. **İsimler değişir.** `venue_name` ve `entity_name` tarih aralıklı geçmiş
   tutuyor. Kullanıcı 2013'te gittiği maçı 2013'teki isimle görmeli.
3. **Kapsam yüzde değil, segment listesi.** Beş setlik maçın ilk iki seti ile
   son iki seti aynı %40 değil. `log_segment` tek tek saklıyor, `log_coverage`
   view'ı `saw_ending` ve `is_fragmented`'ı buradan hesaplıyor.
