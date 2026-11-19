# PRD.md — PALse lock

## 1. Visi Produk

PALse lock adalah game arcade refleks-ritme berbasis browser. Pemain mengunci kursor yang mengorbit 360° tepat di atas zona target melengkung. Satu sesi bermain berlangsung 30–120 detik, dengan tekanan tempo dari bar energi yang terus menyusut. Game gratis, statis, tanpa akun, tanpa backend, dan di-deploy ke Netlify.

## 2. Target Pemain

- Pemain kasual mobile (tap layar), sesi pendek saat jeda aktivitas.
- Pemain desktop yang menyukai game refleks presisi (tombol Spasi).
- Pemain kompetitif ringan yang mengejar high score pribadi.

## 3. Konvensi Teknis

| Item                  | Nilai                                                  |
| --------------------- | ------------------------------------------------------ |
| Titik 0°              | Jam 12 (atas)                                          |
| Arah sudut positif    | Clockwise (CW)                                         |
| Rentang sudut         | `[0, 360)`                                             |
| Satuan waktu internal | detik (float), `dt` dari `requestAnimationFrame`       |
| `dt` maksimum         | `0.05` detik (di-clamp agar tidak lompat saat tab lag) |
| Arah rotasi `dir`     | `+1` = CW, `-1` = CCW                                  |

## 4. Mekanik Inti dan Rumus

### 4.1 Gerak Kursor

`theta_c = (theta_c + dir * omega * dt) mod 360` (pakai mod positif: `((x % 360) + 360) % 360`)

### 4.2 Selisih Sudut Melingkar

`delta = abs( ((theta_c - theta_t + 540) mod 360) - 180 )`

Hasil `delta` selalu di `[0, 180]`. Contoh: `theta_c = 355`, `theta_t = 5` menghasilkan `((350 + 540) mod 360) - 180 = 170 - 180 = -10`, nilai absolut `10`. Tanpa rumus ini, wraparound di 0°/360° menghasilkan bug.

### 4.3 Penilaian Presisi

| Hasil   | Syarat            | Efek combo   | Efek energi | Skor dasar |
| ------- | ----------------- | ------------ | ----------- | ---------- |
| PERFECT | `delta <= 8`      | `+1`         | `+15`       | 100        |
| GOOD    | `8 < delta <= 22` | `+1`         | `+8`        | 50         |
| MISS    | `delta > 22`      | reset ke `0` | `-20`       | 0          |

### 4.4 Kompensasi Latensi Input

Event input membawa timestamp `t_event` (dari `event.timeStamp` atau `performance.now()`). Sudut saat input dihitung dengan ekstrapolasi dari frame terakhir:
`theta_input = theta_last + dir * omega * ((t_event - t_lastFrame) / 1000)`
Nilai `(t_event - t_lastFrame)` di-clamp ke `[0, 34]` ms. Penilaian memakai `theta_input`, bukan `theta_c` frame berikutnya.

### 4.5 Kecepatan Rotasi

- `level = floor(combo / 5)`
- `omega = min(180 + 12 * level, 360)` derajat/detik (batas 360 adalah asumsi, tercapai di combo 75)

| Combo | level | omega (°/detik) | Waktu 1 putaran |
| ----- | ----- | --------------- | --------------- |
| 0–4   | 0     | 180             | 2.00 detik      |
| 5–9   | 1     | 192             | 1.88 detik      |
| 25–29 | 5     | 240             | 1.50 detik      |
| 75+   | 15    | 360 (cap)       | 1.00 detik      |

### 4.6 Polarity Flip

- Terjadi seketika setelah combo naik dan `combo % 5 == 0` dengan `combo > 0`.
- Aksi: `dir = -dir`, toggle tema (Normal <-> Flip), mainkan efek suara flip.
- Saat MISS: combo reset, `dir` kembali ke `+1`, tema kembali Normal (asumsi).

### 4.7 Penempatan Target Baru

Setelah PERFECT atau GOOD, target baru ditempatkan di depan arah gerak kursor (arah setelah flip jika ada):
`theta_t = (theta_c + dir * rand(90, 270)) mod 360`
Jarak minimum 90° menjamin jeda reaksi minimal sekitar 0.5 detik pada kecepatan dasar (`90 / 180`). Setelah MISS, target tidak berpindah.

### 4.7a Passive Decay Energi

- Energi: `E` dalam `[0, 100]`, mulai `100`.
- Laju decay: `decay = min(8 + 0.5 * level, 20)` unit/detik.
- Per frame: `E = E - decay * dt`.
- `E <= 0` berarti Game Over.
- Peringatan visual dan audio saat `E < 25`.

### 4.8 Sistem Skor

- `mult = min(1 + 0.5 * level, 4.0)`, memakai `level` sebelum combo bertambah.
- `score += round(skorDasar * mult)`.
- Contoh: combo saat ini 10 (`level = 2`, `mult = 2.0`), PERFECT menghasilkan `200` poin.
- High score disimpan di `localStorage` kunci `palselock.highscore.v1`.

## 5. Functional Requirements

### MVP

| ID    | Requirement                                                          |
| ----- | -------------------------------------------------------------------- |
| FR-01 | Layar menu dengan tombol Mulai dan tampilan high score               |
| FR-02 | Kursor mengorbit dengan `requestAnimationFrame` berbasis `dt`        |
| FR-03 | Input Spasi (desktop) dan `pointerdown` pada stage (mobile)          |
| FR-04 | Penilaian PERFECT, GOOD, MISS sesuai tabel 4.3                       |
| FR-05 | Target berpindah sesuai 4.7                                          |
| FR-06 | Skor, combo, dan multiplier tampil di HUD                            |
| FR-07 | Bar energi dengan passive decay dan pengisian ulang                  |
| FR-08 | Polarity Flip tiap kelipatan 5 combo, termasuk perubahan tema        |
| FR-09 | Efek suara sintesis Web Audio untuk semua event                      |
| FR-10 | Layar Game Over dengan skor, combo maksimum, dan tombol Main Lagi    |
| FR-11 | Simpan dan muat high score dari `localStorage`                       |
| FR-12 | Pause otomatis saat tab tidak aktif; tombol `Esc` untuk pause manual |

### Post-MVP

| ID    | Requirement                                      |
| ----- | ------------------------------------------------ |
| FR-13 | Tombol mute dan pengaturan volume                |
| FR-14 | Mode "Hardcore" (decay x1.5, tanpa GOOD)         |
| FR-15 | Statistik sesi (akurasi, jumlah PERFECT)         |
| FR-16 | Opsi kalibrasi latensi audio-visual              |
| FR-17 | Bagikan skor (Web Share API)                     |
| FR-18 | Mode `prefers-reduced-motion` yang lebih lengkap |

## 6. Non-Functional Requirements

| ID     | Requirement                         | Ukuran                                                                                  |
| ------ | ----------------------------------- | --------------------------------------------------------------------------------------- |
| NFR-01 | Frame rate                          | Stabil 60 fps di mid-range mobile; gerak berbasis `dt` sehingga konsisten di 120/144 Hz |
| NFR-02 | Latensi input ke umpan balik visual | Maksimal 1 frame (16.7 ms)                                                              |
| NFR-03 | Latensi umpan balik audio           | Maksimal 50 ms dari input                                                               |
| NFR-04 | Input                               | Mobile touch (`pointerdown`) dan desktop keyboard; abaikan `e.repeat`                   |
| NFR-05 | Ukuran aset kustom (HTML+CSS+JS)    | Di bawah 100 KB, tanpa gambar dan audio eksternal                                       |
| NFR-06 | Deploy                              | Statis murni di Netlify tanpa build step                                                |
| NFR-07 | Kompatibilitas                      | Chrome, Edge, Firefox, Safari (2 versi terakhir), iOS Safari, Chrome Android            |
| NFR-08 | Ketahanan                           | Game tetap jalan jika `localStorage` atau Web Audio tidak tersedia                      |
| NFR-09 | Console                             | Nol error saat bermain 5 menit                                                          |
| NFR-10 | Lighthouse (mobile)                 | Performance 90 atau lebih                                                               |

## 7. Di Luar Cakupan

Akun pengguna, leaderboard online, backend, aset gambar atau audio eksternal, framework JS, bundler.
