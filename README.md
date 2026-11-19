# PULSE LOCK

> **OUTRUN THE FADING LIGHT**  
> Game arcade refleks-ritme berbasis browser bergaya **Crystal Shadow** — tanpa aset gambar/audio eksternal, tanpa framework, dan tanpa build step.

[![Live Demo](https://img.shields.io/badge/Play%20Now-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://pulse-lock-qqsy.netlify.app)
![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-ES%20Modules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-Play%20CDN-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-C84BFF?style=for-the-badge)

---

## Mainkan Sekarang

- **Live (Netlify):** https://pulse-lock-qqsy.netlify.app

---

## Fitur Utama

- **Mekanik Presisi 360°**: Kunci kursor bola kristal tepat di atas zona target melengkung dengan kompensasi latensi input hingga `34 ms`.
- **Polarity Flip & Transisi Api**:
  - Tiap **kelipatan 5x combo** (`5, 15, 25, ...`): arah rotasi berbalik, tema berpindah (**SKY ↔ SHADOW**), disertai kobaran **api biru** low-poly di tepi layar dan sekeliling papan.
  - Tiap **kelipatan 10x combo** (`10, 20, 30, ...`): arah rotasi berbalik dengan kobaran **api ungu** yang menyala di tepi layar dan sekeliling papan.
- **Tekanan Tempo Energi**: Bar energi terus menyusut (`passive decay`) yang makin cepat seiring naiknya level combo — tahan ritme sebelum energi habis.
- **Audio Sintesis Web Audio API**: 9 efek suara prosedural tanpa satu pun file `.mp3`/`.wav` eksternal.
- **Ringan & Tanpa Build Step**: Total aset kustom `< 70 KB` (HTML + CSS + JS murni), animasi hanya `transform`/`opacity`, dan mendukung `prefers-reduced-motion`.
- **High Score Lokal**: Tersimpan otomatis di `localStorage` dengan fallback aman untuk mode privat.

---

## Kontrol

| Input | Aksi |
| --- | --- |
| `Spasi` (desktop) | Kunci kursor di zona target |
| `Tap` / `Klik` pada ring (mobile & desktop) | Kunci kursor di zona target |
| `Esc` | Jeda / lanjutkan permainan |
| `Enter` | Mulai / lanjut / main lagi saat di layar overlay |

---

## Aturan Penilaian

| Hasil | Toleransi Sudut | Combo | Energi | Skor Dasar |
| --- | --- | --- | --- | --- |
| **PERFECT** | `≤ 8°` | `+1` | `+15` | `100 × mult` |
| **GOOD** | `8° < Δ ≤ 22°` | `+1` | `+8` | `50 × mult` |
| **MISS** | `> 22°` | Reset ke `0` | `-20` | `0` |

- **Multiplier**: Naik `+0.5` tiap 5 combo hingga batas `x4.0`.
- **Kecepatan Orbit**: Mulai `180°/detik` dan meningkat hingga batas `360°/detik`.
- **Game Over**: Permainan berakhir ketika energi menyentuh `0`.

---

## Menjalankan Secara Lokal

Proyek menggunakan ES Modules native sehingga perlu dijalankan lewat server HTTP lokal (bukan membuka `index.html` langsung via `file://`):

```bash
git clone https://github.com/nflilham/pulse-lock.git
cd pulse-lock
python -m http.server 8000
```

Lalu buka `http://localhost:8000` di browser modern (Chrome, Edge, Firefox, atau Safari).

---

## Arsitektur Proyek

```text
pulse-lock/
├── index.html          # Markup, konfigurasi Tailwind Play CDN, token tema & SVG stage
├── netlify.toml        # Konfigurasi deploy statis (publish = ".")
├── docs/               # PRD, spesifikasi desain Crystal Shadow, dan checklist tugas
└── js/
    ├── config.js       # Seluruh konstanta mekanik, geometri, audio, dan state
    ├── math.js         # Fungsi matematika sudut murni (tanpa akses DOM)
    ├── state.js        # State tunggal permainan dan resetState()
    ├── game.js         # Logika inti murni: update, judge, flip, target, decay
    ├── input.js        # Handler Spasi, Esc, Enter, pointerdown, visibilitychange
    ├── render.js       # Sinkronisasi DOM/SVG per frame (tulis hanya saat berubah)
    ├── fx.js           # Pool 12 serpihan FX, ripple, retak, dan animasi api 5x/10x
    ├── audio.js        # Sintesis efek suara via Web Audio API
    ├── storage.js      # Baca/simpan high score di localStorage
    └── main.js         # State machine dan loop requestAnimationFrame
```
