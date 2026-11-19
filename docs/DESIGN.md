# DESIGN.md — PALse lock (Revisi: gaya "Crystal Shadow")

## 1. Prinsip Desain dan Referensi Visual

Arah visual: dunia kristal bersudut yang diterangi cahaya di tengah bayangan. Semua bentuk bersudut tajam (low-poly) kecuali ring orbit, yang melengkung karena itu inti mekanik. Tanpa aset eksternal: visual lewat SVG inline, CSS, dan kelas Tailwind; audio lewat Web Audio API.

| Elemen di gambar referensi | Ciri                                                                      | Penerapan di PALse lock                                                      |
| -------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Latar                      | Gradasi biru di atas, cyan terang berkabut di tengah, ungu gelap di bawah | Latar 2 lapis gradien (Normal dan Flip) dengan kabut radial dan sinar lembut |
| Bentuk umum                | Serpihan kristal bersudut, tanpa lengkung                                 | Panel, tombol, chip HUD, dan bar energi memakai `clip-path: polygon()`       |
| Panel gelap pusat          | Poligon navy-hitam dengan tepi magenta dan ungu berlapis (offset)         | Papan permainan (board) di belakang ring orbit                               |
| Judul                      | Huruf mint pucat, bersudut, tinggi-rendah tidak seragam                   | Judul "PALse lock" dengan huruf berselisih posisi dan rotasi tetap           |
| Subjudul                   | Cyan terang, miring, tersusun bertumpuk                                   | Tagline 3 baris, miring `-6deg`, di pojok kanan bawah panel judul            |
| Bola kristal               | Bola bercahaya dengan facet bintang                                       | Kursor orbit                                                                 |
| Siluet batu                | Bentuk ungu gelap di bagian bawah                                         | Dua siluet poligon di pojok bawah layar                                      |
| Cahaya                     | Pendar dan sinar lembut                                                   | Kabut radial dan 2 pita sinar diagonal berkontras rendah                     |

Dua tema mengikuti dua keluarga warna gambar:

- **Normal ("SKY")**: dominan biru dan cyan, tepi panel magenta.
- **Flip ("SHADOW")**: dominan ungu dan magenta, tepi panel cyan (warna dibalik).

## 2. Hirarki Layout

### 2.1 Struktur DOM (dari belakang ke depan)

1. `#bg` : `fixed inset-0 -z-10 pointer-events-none`, berisi `#bg-normal`, `#bg-flip` (dua gradien yang di-crossfade), `#bg-facets` (SVG poligon dekoratif), `#bg-rays` (pita sinar).
2. `#fg-rocks` : `fixed bottom-0 inset-x-0 pointer-events-none`, dua siluet batu.
3. `#app` : `relative min-h-[100dvh] flex flex-col items-center text-mint font-display`
4. `#hud` : tiga chip (SCORE, HIGH, MULT), `pt-[env(safe-area-inset-top)]`
5. `#energy` : bar energi faset
6. `#stage` : kontainer SVG persegi, `touch-action: none`, area tap utama
7. `#hint` : teks "SPASI / TAP"
8. `#vignette` : `fixed inset-0 pointer-events-none`, gelap di tepi, hanya terlihat saat energi rendah
9. `#wipe` : `fixed inset-0 pointer-events-none`, panel gelap untuk transisi Flip
10. `#overlay-menu`, `#overlay-pause`, `#overlay-gameover` : `fixed inset-0`, hanya satu tampil

### 2.2 Responsif

| Breakpoint             | Stage                                | HUD                            | Catatan                                             |
| ---------------------- | ------------------------------------ | ------------------------------ | --------------------------------------------------- |
| Mobile (`< 640px`)     | `w-[min(92vw,70dvh)] aspect-square`  | `px-4 text-sm`                 | Seluruh `#app` area tap; padding aman notch         |
| Desktop (`>= 640px`)   | `w-[min(520px,80dvh)] aspect-square` | `max-w-[560px] px-0 text-base` | Spasi sebagai input utama                           |
| Tinggi layar `< 560px` | tetap                                | tetap                          | `#fg-rocks` disembunyikan agar tidak menutupi stage |

### 2.3 SVG Stage

`viewBox="0 0 400 400"`, pusat `(200, 200)`, radius orbit `R = 150`. Urutan lapisan dari bawah ke atas:

| No  | Lapisan               | Spesifikasi                                                                                                                                                                                                                                          |
| --- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rim belakang          | `<polygon>` papan digeser `translate(5,4)`, `fill="none"`, `stroke="var(--rim-2)"`, `stroke-width="3"`                                                                                                                                               |
| 2   | Papan                 | `<polygon points="200,6 322,34 394,140 378,276 296,376 168,392 52,330 8,206 40,88">`, `fill="var(--ink)"`, `stroke="var(--rim)"`, `stroke-width="3"`, `stroke-linejoin="miter"`                                                                      |
| 3   | Facet papan           | 5 garis atau segitiga di dalam papan, `fill="var(--ink-2)"`, opacity 0.6 (statis)                                                                                                                                                                    |
| 4   | Ring orbit            | `<circle r="150" fill="none" stroke="var(--accent)" stroke-opacity="0.28" stroke-width="2">`                                                                                                                                                         |
| 5   | Tanda ring            | 12 garis pendek tiap 30°, dari r=128 ke r=136, `stroke="var(--accent)"`, opacity 0.35                                                                                                                                                                |
| 6   | Zona GOOD             | Arc `±22°` dari `theta_t`, `stroke-width="18"`, `stroke="var(--accent)"`, opacity 0.40, `stroke-linecap="butt"`                                                                                                                                      |
| 7   | Zona PERFECT          | Arc `±8°` dari `theta_t`, `stroke-width="18"`, `stroke="var(--perfect)"`, `stroke-linecap="butt"`                                                                                                                                                    |
| 8   | Ujung kristal target  | Grup `rotate(theta_t 200 200)`, `<polygon points="195,30 205,30 200,40">`, `fill="var(--perfect)"` (penunjuk di sisi luar zona)                                                                                                                      |
| 9   | Jejak kursor          | 3 lingkaran di sudut `theta - dir*5°`, `*10°`, `*15°`; radius 7, 5, 3; opacity 0.5, 0.3, 0.15; `fill="var(--accent)"`                                                                                                                                |
| 10  | Kursor (bola kristal) | Grup `rotate(theta 200 200)`, pusat `(200, 50)`. Halo `r=18` gradien radial (putih, `--accent`, transparan); inti `r=9` `fill="var(--perfect)"`; bintang 4 sudut `points="200,38 203,47 212,50 203,53 200,62 197,53 188,50 197,47"` `fill="#F4FBFF"` |
| 11  | Pusat                 | Angka combo (`text-6xl`), label "COMBO" kecil, dan chevron arah (segitiga kecil yang di-flip dengan `scaleX(-1)` saat CCW)                                                                                                                           |
| 12  | Lapisan FX            | Ripple (`<circle r="150" fill="none" stroke-width="3" opacity="0">`), pool 12 poligon serpihan, 3 garis retak                                                                                                                                        |

Rumus titik arc: `P(a) = (200 + 150*sin(a), 200 - 150*cos(a))`, `a` dalam radian (0° di jam 12, searah jarum jam positif, konsisten dengan PRD).

Koordinat papan sudah dicek agar seluruh zona target (jari-jari luar 159) berada di dalam poligon dengan jarak minimum sekitar 172 dari pusat.

### 2.4 Lapisan Latar dan Dekorasi

| Lapisan      | Spesifikasi                                                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#bg-normal` | `background: radial-gradient(60% 40% at 45% 55%, var(--haze) 0%, transparent 70%), linear-gradient(180deg, var(--bg-top) 0%, var(--bg-mid) 45%, var(--bg-bot) 100%)` memakai token tema Normal |
| `#bg-flip`   | Sama, memakai token tema Flip; `opacity` 0 pada Normal dan 1 pada Flip                                                                                                                         |
| Crossfade    | `transition: opacity 300ms ease-in-out`. Gradien tidak bisa dianimasikan langsung, jadi dua lapisan di-crossfade                                                                               |
| `#bg-facets` | SVG `viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"`, 14 segitiga statis (`fill` putih atau `--accent`, opacity 0.04 sampai 0.10) dan 6 segitiga melayang pelan                    |
| `#bg-rays`   | 2 pita diagonal `linear-gradient` putih-ke-transparan, opacity 0.10 sampai 0.14, "bernapas" 6 detik. Tanpa `mix-blend-mode`                                                                    |
| `#fg-rocks`  | 2 poligon ungu gelap (`#1B0F6B`) di pojok kiri dan kanan bawah, tinggi maksimum 18% layar, sisi terang tipis (`#5B2FD6`, 2px)                                                                  |
| `#vignette`  | `radial-gradient(transparent 55%, rgba(10,6,36,0.75) 100%)`, opacity 0 (normal)                                                                                                                |

## 3. Sistem Desain

### 3.1 Palet Warna

Nilai merupakan estimasi dari gambar referensi; sesuaikan dengan eyedropper bila perlu.

| Token           | Normal (SKY)             | Flip (SHADOW)              | Fungsi                                                                      |
| --------------- | ------------------------ | -------------------------- | --------------------------------------------------------------------------- |
| `--bg-top`      | `#2352D8`                | `#1A0B5E`                  | Atas latar                                                                  |
| `--bg-mid`      | `#3FA8E8`                | `#6A2BD9`                  | Tengah latar                                                                |
| `--bg-bot`      | `#3A1C9E`                | `#8A1FA8`                  | Bawah latar                                                                 |
| `--haze`        | `rgba(190,240,255,0.55)` | `rgba(240,150,255,0.45)`   | Kabut cahaya                                                                |
| `--ink`         | `#0B0A2E`                | `#0A0624`                  | Papan, panel, chip                                                          |
| `--ink-2`       | `#15124A`                | `#1A0E4F`                  | Facet dan permukaan sekunder                                                |
| `--scrim`       | `rgba(11,10,46,0.82)`    | `rgba(10,6,36,0.82)`       | Latar overlay                                                               |
| `--rim`         | `#D63BDB` (magenta)      | `#22D3F5` (cyan)           | Tepi papan dan tombol                                                       |
| `--rim-2`       | `#5B2FD6` (ungu)         | `#2B6BE8` (biru)           | Rim belakang berlapis                                                       |
| `--accent`      | `#22D3F5` (cyan)         | `#E24BF0` (magenta terang) | Ring, zona GOOD, bar energi, aksen                                          |
| `--accent-glow` | `rgba(34,211,245,0.55)`  | `rgba(226,75,240,0.55)`    | Pendar                                                                      |
| `--perfect`     | `#C8F2E4` (mint)         | `#C8F2E4`                  | Zona PERFECT, judul, angka                                                  |
| `--text`        | `#F4FBFF`                | `#F4FBFF`                  | Teks utama                                                                  |
| `--text-muted`  | `#8FB8E8`                | `#C9A8F5`                  | Label                                                                       |
| `--danger`      | `#FF3D8B` (pink panas)   | `#F4FBFF` (putih)          | MISS dan energi rendah; putih pada Flip agar kontras terhadap latar magenta |

Implementasi: variabel CSS di `:root[data-theme="normal"]` dan `:root[data-theme="flip"]`. Semua warna dipakai lewat token, tidak ada heksadesimal di luar blok variabel. Konfigurasi Tailwind Play CDN agar kelas seperti `text-perfect`, `bg-ink`, `stroke-accent` tersedia:

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          ink: "var(--ink)",
          "ink-2": "var(--ink-2)",
          rim: "var(--rim)",
          "rim-2": "var(--rim-2)",
          accent: "var(--accent)",
          perfect: "var(--perfect)",
          danger: "var(--danger)",
          muted: "var(--text-muted)",
        },
        fontFamily: {
          display: ['"Chakra Petch"', "ui-monospace", "monospace"],
        },
      },
    },
  };
</script>
```

Catatan: pada warna berbasis variabel, pengubah opasitas Tailwind (misalnya `bg-ink/80`) tidak bekerja. Untuk latar transparan pakai token `--scrim`.

Transisi tema: elemen memakai `transition: stroke 300ms, fill 300ms, color 300ms, background-color 300ms`; latar lewat crossfade (bagian 2.4).

### 3.2 Tipografi

Font: **Chakra Petch** (Google Fonts, bobot 500/600/700), satu-satunya sumber eksternal, dimuat lewat `<link>` stylesheet dengan `display=swap`. Fallback `ui-monospace, monospace`; bila gagal dimuat, game tetap berfungsi.

| Elemen                   | Kelas / gaya                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Judul "PALse" dan "lock" | `font-display font-bold text-6xl sm:text-7xl leading-[0.9] tracking-wider text-perfect`, tiap huruf `inline-block` dengan offset tetap (lihat di bawah) |
| Tagline                  | `font-display font-bold uppercase text-accent text-lg sm:text-xl leading-tight -skew-x-6 -rotate-6`                                                               |
| Skor                     | `font-display font-bold tabular-nums text-2xl sm:text-3xl text-perfect`                                                                                           |
| Label HUD                | `font-display font-medium text-xs uppercase tracking-widest text-accent`                                                                                          |
| Combo di pusat           | `font-display font-bold tabular-nums text-6xl text-perfect`                                                                                                       |
| Teks penilaian           | `font-display font-bold text-lg tracking-widest uppercase`                                                                                                        |

Offset huruf judul (deterministik, bukan acak, agar tidak berubah tiap render), berulang per huruf:

| Huruf ke- | translateY | rotate  |
| --------- | ---------- | ------- |
| 1         | `0`        | `-3deg` |
| 2         | `-6px`     | `2deg`  |
| 3         | `4px`      | `-2deg` |
| 4         | `-3px`     | `3deg`  |
| 5         | `5px`      | `-1deg` |

Tagline default: "OUTRUN THE / FADING / LIGHT" (boleh diganti, tiga baris rata kiri).

### 3.3 Skala, Glow, dan Bentuk Faset

Bentuk faset memakai `clip-path` (tidak ada utilitas bawaan Tailwind), jadi didefinisikan sebagai kelas CSS kecil di `<style>`:

| Kelas          | `clip-path`                                                                           | Dipakai untuk                   |
| -------------- | ------------------------------------------------------------------------------------- | ------------------------------- |
| `.facet-cut`   | `polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)` | Tombol, chip HUD                |
| `.facet-skew`  | `polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)`                             | Bar energi                      |
| `.facet-panel` | `polygon(0 4%, 6% 0, 100% 3%, 97% 100%, 3% 96%)`                                      | Panel overlay (menu, game over) |

Dua hal penting tentang `clip-path`:

1. `clip-path` memotong border, `box-shadow`, dan outline. Tepi berlapis dibuat dengan **dua elemen bertumpuk**: lapisan luar berwarna `--rim` dengan `clip-path`, lapisan dalam berwarna `--ink` dengan `clip-path` yang sama tetapi diinset 3px (`padding: 3px` pada pembungkus).
2. Pendar untuk elemen berfaset dibuat dengan `filter: drop-shadow(0 0 10px var(--accent-glow))` pada **pembungkus** (induk) elemen yang di-clip, bukan pada elemen itu sendiri.

Pendar lainnya:

- Kursor memakai halo gradien radial (bukan `filter`), karena kursor bergerak tiap frame. Saat `E < 25`, radius halo naik dari 18 ke 24 dan opacity naik.
- Ring saat hit: `scale 1 -> 1.06 -> 1`.
- Tombol: pembungkus ber-`drop-shadow` statis, isi `bg-perfect text-ink font-display font-bold px-6 py-3 facet-cut`, hover `brightness-110`, `focus-visible:outline outline-2 outline-accent`.

### 3.4 Bar Energi

- Kontainer: `h-3 w-full facet-skew bg-ink-2`.
- Fill: `h-full origin-left` dengan `background: linear-gradient(90deg, var(--accent), var(--perfect))`; lebar diatur lewat `transform: scaleX(E/100)` (lebih murah daripada mengubah `width`, tanpa layout).
- `E < 25`: fill berganti ke `var(--danger)` dan opacity berkedip 1 ke 0.5 selama 600 ms (loop).

## 4. Micro-Interactions

| Event         | Efek                                                                                                                                                                                                                                                    | Durasi                                                           | Easing                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------- |
| PERFECT       | Ripple r 150 ke 186, opacity 0.7 ke 0, warna `--perfect`; ring `scale 1 -> 1.06 -> 1`; ledakan 6 serpihan segitiga dari titik target menyebar 40px sambil berputar dan memudar; bola kristal membesar 1 ke 1.5 ke 1; teks "PERFECT" muncul lalu memudar | 300 ms (ripple), 160 ms (ring), 320 ms (serpihan), 140 ms (bola) | `ease-out`              |
| GOOD          | Ripple warna `--accent`; 3 serpihan menyebar 24px; teks "GOOD"                                                                                                                                                                                          | 240 ms                                                           | `ease-out`              |
| MISS          | `#stage` bergetar `translateX` 0, -8, 8, -6, 6, 0 px; 3 garis retak bergerigi berwarna `--danger` di atas papan, opacity 0.9 ke 0; kilat lapisan `--danger` opacity 0.18 ke 0; teks "MISS"                                                              | 240 ms (getar dan retak), 80 ms (kilat)                          | `linear`                |
| Polarity Flip | `#wipe` (panel gelap miring) menyapu layar dari kiri ke kanan; tema berganti tepat di titik tengah sapuan; latar crossfade; tepi papan bertukar warna; teks "FLIP" tampil; chevron arah berbalik                                                        | 300 ms                                                           | `ease-in-out`           |
| Energi rendah | `#vignette` opacity 0 ke 0.5 berdenyut; bar berkedip; halo kursor membesar                                                                                                                                                                              | 600 ms (loop)                                                    | `ease-in-out`           |
| Ambient       | 6 serpihan latar melayang pelan (`translateY` +-12px, `rotate` +-8°); sinar latar "bernapas"                                                                                                                                                            | 14 sampai 22 detik; 6 detik                                      | `linear`; `ease-in-out` |
| Game Over     | Stage `opacity-40 scale-[0.98]`, overlay naik dari bawah                                                                                                                                                                                                | 250 ms                                                           | `ease-out`              |

Implementasi: toggle kelas (`.is-hit`, `.is-miss`, `.is-flip`) dan lepas pada `animationend`. Animasi hanya memakai `transform` dan `opacity`. Saat state `PAUSED`, animasi ambient dijeda (`animation-play-state: paused`).

Jika `prefers-reduced-motion: reduce`: nonaktifkan getar, ledakan serpihan, sapuan `#wipe`, scale, dan ambient. Pertahankan perubahan warna, ripple (fade saja), dan teks penilaian.

## 5. Arsitektur Kode JS Modular

Tanpa bundler, memakai ES Modules native (`<script type="module" src="js/main.js">`). ES Modules tidak jalan dari `file://` di Chrome, jadi saat pengembangan gunakan server lokal (misalnya `python -m http.server`). Fallback: gabungkan semua modul menjadi satu `index.html` dengan objek bernamespace yang sama.

| File            | Tanggung jawab                                                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`    | Markup, Tailwind Play CDN dan konfigurasinya, `<link>` font, blok variabel tema, kelas `.facet-*`, SVG stage                                                                                                                                   |
| `js/config.js`  | Semua konstanta: `PERFECT_TOL=8`, `GOOD_TOL=22`, `BASE_OMEGA=180`, `OMEGA_STEP=12`, `OMEGA_CAP=360`, `DECAY_BASE=8`, `DECAY_STEP=0.5`, `DECAY_CAP=20`, `ENERGY_PERFECT=15`, `ENERGY_GOOD=8`, `ENERGY_MISS=-20`, `DT_MAX=0.05`, `SHARD_POOL=12` |
| `js/math.js`    | Fungsi murni: `normalize(a)`, `angleDelta(a, b)`, `polarToXY(a, r)`, `arcPath(center, tol)`, `randRange(min, max)`                                                                                                                             |
| `js/state.js`   | Objek state tunggal (`phase`, `thetaC`, `thetaT`, `dir`, `combo`, `maxCombo`, `score`, `energy`, `theme`) dan `resetState()`                                                                                                                   |
| `js/game.js`    | Logika murni: `update(dt)`, `judge(thetaInput)`, `applyResult(result)`, `maybeFlip()`, `placeTarget()`                                                                                                                                         |
| `js/input.js`   | Listener `keydown` (Space, Esc), `pointerdown`; mengirim timestamp ke `game.judge`                                                                                                                                                             |
| `js/render.js`  | Cache elemen DOM, `render(state)` per frame, update posisi kursor, jejak, zona, HUD (hanya jika nilai berubah), pergantian `data-theme`                                                                                                        |
| `js/fx.js`      | Efek visual: pool 12 poligon serpihan (dibuat sekali, dipakai ulang), ripple, retak, sapuan Flip. Tidak membuat elemen DOM baru saat bermain                                                                                                   |
| `js/audio.js`   | `initAudio()` (dibuat dan di-resume pada gesture pertama), `play(eventName)`                                                                                                                                                                   |
| `js/storage.js` | `loadHighScore()`, `saveHighScore(n)` dengan try/catch                                                                                                                                                                                         |
| `js/main.js`    | State machine (`MENU`, `PLAYING`, `PAUSED`, `GAME_OVER`), loop `requestAnimationFrame`, wiring antar modul                                                                                                                                     |

Aturan: `math.js` dan `game.js` tidak menyentuh DOM. `render.js` dan `fx.js` hanya membaca state, tidak mengubahnya.

## 6. Spesifikasi Web Audio API

### 6.1 Pengaturan Umum

- Satu `AudioContext`, satu `masterGain` bernilai `0.3`.
- Envelope tiap bunyi: `gain` dari 0 ke `0.2` dalam 5 ms (linear), lalu `exponentialRampToValueAtTime(0.0001, t + durasi)`.
- `audioCtx.resume()` dipanggil pada interaksi pertama pengguna (kebijakan autoplay).
- Jika `AudioContext` tidak tersedia, `play()` menjadi no-op.

### 6.2 Tabel Event

| Event           | Gelombang           | Frekuensi                                | Durasi     | Catatan                                       |
| --------------- | ------------------- | ---------------------------------------- | ---------- | --------------------------------------------- |
| UI klik         | `sine`              | 660 Hz                                   | 60 ms      | Tombol menu                                   |
| Start           | `sine`              | 523.25 -> 659.25 -> 783.99 Hz (arpeggio) | 3 x 80 ms  | Nada berurutan                                |
| PERFECT         | `sine` + `triangle` | 1318.5 Hz + 1975.5 Hz                    | 120 ms     | Dua oscillator bersamaan                      |
| GOOD            | `triangle`          | 880 Hz                                   | 100 ms     |                                               |
| MISS            | `sawtooth`          | 140 -> 70 Hz (sweep turun)               | 180 ms     | `exponentialRampToValueAtTime` pada frekuensi |
| Polarity Flip   | `square`            | 330 -> 660 Hz (sweep naik)               | 150 ms     | Gain puncak 0.12 agar tidak tajam             |
| Energi rendah   | `square`            | 220 Hz                                   | 50 ms      | Diulang tiap 600 ms saat `E < 25`             |
| Game Over       | `sawtooth`          | 440 -> 110 Hz (sweep turun)              | 600 ms     |                                               |
| High score baru | `sine`              | 784 -> 988 -> 1319 Hz                    | 3 x 100 ms | Tampil di layar Game Over                     |

## 7. Layar dan State UI

| State     | Tampilan                                                                                                                                                                                                                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MENU      | Komposisi seperti sampul: panel `.facet-panel` gelap bertepi magenta-ungu berlapis di tengah, "PALse" dan "lock" bertumpuk dengan huruf berselisih, tagline miring di pojok kanan bawah panel (menimpa tepi panel), chip high score, tombol "MULAI" berfaset, petunjuk kontrol. Bola kristal berdenyut di bawah judul |
| PLAYING   | HUD tiga chip, bar energi, stage, petunjuk "SPASI / TAP"                                                                                                                                                                                                                                                              |
| PAUSED    | `--scrim` penuh layar, panel kecil dengan tombol "LANJUT" dan teks "Esc"                                                                                                                                                                                                                                              |
| GAME_OVER | Panel `.facet-panel`: teks "LIGHT FADED", skor akhir, combo maksimum, high score (label "BARU" berfaset jika memecahkan rekor), tombol "MAIN LAGI"                                                                                                                                                                    |

## 8. Aksesibilitas

- Kontras teks terhadap latar minimal 4.5:1 (verifikasi dengan DevTools). Teks di atas latar gradien selalu diletakkan di dalam chip atau panel `--ink`, tidak langsung di atas gradien.
- Status PERFECT, GOOD, MISS disampaikan lewat teks, dan arah putaran lewat chevron di pusat, tidak hanya lewat warna.
- Elemen status memakai `aria-live="polite"`.
- Fokus keyboard terlihat pada semua tombol (`outline outline-2 outline-accent`).
- Tidak ada kilatan layar lebih dari 3 kali per detik; kilat MISS dibatasi opacity 0.18, dan Flip paling cepat terjadi tiap 5 combo.
- Mendukung `prefers-reduced-motion` seperti di bagian 4.

## 9. Batas Performa Visual

Gaya low-poly mudah membengkak jika tidak dibatasi. Batas berikut wajib dipatuhi agar NFR 60 fps tercapai:

| Aspek                   | Batas                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| Poligon dekoratif latar | Maksimum 14 statis + 6 melayang                                              |
| Pool serpihan FX        | 12 poligon, dipakai ulang (tanpa membuat elemen baru saat bermain)           |
| Efek yang dilarang      | `backdrop-filter`, `mix-blend-mode`, `filter: blur()` pada elemen beranimasi |
| `drop-shadow`           | Hanya pada elemen statis (rim papan, tombol); tidak pada kursor              |
| Animasi                 | Hanya `transform` dan `opacity`                                              |
| Update DOM per frame    | Hanya atribut `transform` kursor, jejak, dan nilai HUD yang berubah          |
| Aset eksternal          | Hanya stylesheet Google Fonts (opsional); tanpa gambar dan audio             |
