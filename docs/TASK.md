# TASK.md — PULSE LOCK

Aturan umum: kerjakan berurutan per milestone. Tiap tugas selesai hanya jika seluruh Acceptance Criteria (AC) terpenuhi. Acuan nilai ada di `PRD.md` dan `DESIGN.md`.

## Milestone 1: Kerangka dan Loop 60 fps

- [x] **T1.1 Scaffold proyek**
      Buat `index.html`, folder `js/`, file modul kosong sesuai DESIGN.md bagian 5, dan `netlify.toml` berisi `[build] publish = "."`.
  - AC: halaman terbuka lewat server lokal tanpa error di console.
  - AC: Tailwind Play CDN termuat dan kelas utilitas bekerja (uji dengan `bg-zinc-950`).
  - AC: tidak ada referensi ke `.png`, `.jpg`, `.svg`, `.mp3`, atau `.wav` eksternal.

- [x] **T1.2 Konstanta dan state**
      Isi `config.js` dengan seluruh konstanta dari DESIGN.md dan `state.js` dengan `resetState()`.
  - AC: `resetState()` menghasilkan `combo=0`, `score=0`, `energy=100`, `dir=1`, `theme='normal'`.
  - AC: tidak ada angka ajaib (magic number) di modul lain; semua berasal dari `config.js`.

- [x] **T1.3 Game loop**
      Implementasi `requestAnimationFrame` dengan `dt` dalam detik dan clamp `DT_MAX = 0.05`.
  - AC: `dt` rata-rata 16.7 ms (+/- 1 ms) di monitor 60 Hz, tercatat selama 10 detik.
  - AC: kecepatan gerak identik (selisih waktu 1 putaran maksimal 1%) di 60 Hz dan 144 Hz.
  - AC: saat tab disembunyikan 5 detik lalu dibuka, kursor tidak melompat lebih dari `180 * 0.05` derajat dalam satu frame.

- [x] **T1.4 Stage SVG statis**
      Gambar ring, kursor, zona GOOD dan PERFECT, serta angka combo di tengah, sesuai DESIGN.md bagian 2.3.
  - AC: layout tampil benar pada 360x640, 768x1024, dan 1440x900 tanpa scroll horizontal.
  - AC: stage tetap persegi (rasio 1:1) di semua ukuran uji.

- [x] **T1.5 State machine**
      Implementasi `MENU`, `PLAYING`, `PAUSED`, `GAME_OVER` dan transisinya.
  - AC: transisi yang tidak valid (misalnya `MENU -> PAUSED`) diabaikan tanpa error.
  - AC: hanya satu overlay yang terlihat pada satu waktu.

## Milestone 2: Mekanik Inti dan Matematika Sudut

- [x] **T2.1 Fungsi matematika sudut**
      Implementasi `normalize` dan `angleDelta` di `math.js`.
  - AC: `angleDelta(355, 5) = 10`, `angleDelta(0, 180) = 180`, `angleDelta(90, 90) = 0`, `angleDelta(10, 350) = 20`.
  - AC: untuk 1000 pasangan acak, hasil selalu di `[0, 180]` dan simetris (`angleDelta(a,b) == angleDelta(b,a)`).

- [x] **T2.2 Rotasi kursor**
      Implementasi `update(dt)` dengan `dir` dan `omega` sesuai PRD 4.1 dan 4.5.
  - AC: pada combo 0, satu putaran penuh = 2.00 detik (+/- 0.05).
  - AC: pada combo 10 (`omega = 204`), satu putaran = 1.76 detik (+/- 0.05).
  - AC: `thetaC` selalu di `[0, 360)`.

- [x] **T2.3 Input**
      Pasang `keydown` Spasi dan `pointerdown` pada `#stage`; cegah scroll akibat Spasi; abaikan `e.repeat`.
  - AC: menekan dan menahan Spasi hanya menghasilkan satu penilaian.
  - AC: tap di layar sentuh tidak memicu zoom atau scroll (`touch-action: none`).
  - AC: input diabaikan saat state bukan `PLAYING`.

- [x] **T2.4 Penilaian dan kompensasi latensi**
      Implementasi `judge(thetaInput)` dan ekstrapolasi PRD 4.4.
  - AC: `delta = 8` dinilai PERFECT, `delta = 8.01` dinilai GOOD, `delta = 22` GOOD, `delta = 22.01` MISS.
  - AC: nilai `(t_event - t_lastFrame)` di-clamp ke `[0, 34]` ms.

- [x] **T2.5 Combo, skor, dan multiplier**
      Implementasi PRD 4.3 dan 4.8.
  - AC: dari combo 10, satu PERFECT menambah tepat `200` poin; satu GOOD menambah `100`.
  - AC: multiplier tidak melebihi `4.0`.
  - AC: MISS mereset combo ke 0 tanpa mengurangi skor.

- [x] **T2.6 Penempatan target**
      Implementasi PRD 4.7.
  - AC: dalam 1000 simulasi, jarak target baru dari kursor searah gerak selalu di `[90, 270]` derajat.
  - AC: setelah MISS, target tidak berpindah.

- [x] **T2.7 Polarity Flip**
      Implementasi PRD 4.6.
  - AC: flip terjadi tepat di combo 5, 10, 15, dan seterusnya, tidak di combo lain.
  - AC: pada flip, `dir` berbalik dan `theme` berganti pada frame yang sama.
  - AC: MISS mengembalikan `dir = +1` dan `theme = 'normal'`.
  - AC: target baru pada combo kelipatan 5 ditempatkan memakai `dir` yang sudah dibalik.

- [x] **T2.8 Passive decay dan Game Over**
      Implementasi PRD 4.7a.
  - AC: tanpa input, energi 100 habis dalam 12.5 detik (+/- 0.3) pada level 0.
  - AC: laju decay tidak melebihi 20/detik.
  - AC: energi tidak pernah di luar `[0, 100]`.
  - AC: saat `E <= 0` state berubah ke `GAME_OVER` tepat satu kali.

## Milestone 3: Polish UI Tailwind dan Web Audio

- [x] **T3.1 HUD dan bar energi**
      Tampilkan skor, high score, combo, multiplier, dan bar energi.
  - AC: elemen HUD hanya diperbarui saat nilainya berubah (diverifikasi lewat jumlah penulisan DOM per detik di DevTools).
  - AC: bar energi berubah ke warna token --danger (kelas bg-danger) dan berkedip saat `E < 25`.

- [x] **T3.2 Sistem tema**
      Implementasi variabel CSS `data-theme` sesuai DESIGN.md 3.1.
  - AC: seluruh warna aksen berubah dalam 300 ms (+/- 50) saat flip.
  - AC: tidak ada warna heksadesimal yang di-hardcode di luar blok variabel tema.

- [x] **T3.3 Micro-interactions**
      Implementasi efek PERFECT, GOOD, MISS, Flip, dan energi rendah sesuai DESIGN.md bagian 4.
  - AC: efek diputar ulang dengan benar pada hit beruntun cepat (interval 150 ms) tanpa efek yang "menempel".
  - AC: kelas animasi dilepas pada `animationend`.
  - AC: dengan `prefers-reduced-motion: reduce`, tidak ada shake, flash, atau scale.
  - AC: frame rate tetap di atas 55 fps selama animasi (Performance tab).

- [x] **T3.4 Modul audio**
      Implementasi `audio.js` sesuai DESIGN.md 6.1 dan 6.2.
  - AC: seluruh 9 event menghasilkan bunyi dengan frekuensi, gelombang, dan durasi sesuai tabel.
  - AC: tidak ada bunyi "klik" (pop) pada awal atau akhir nada.
  - AC: `AudioContext` dibuat atau di-resume hanya setelah gesture pertama; tidak ada warning autoplay di console.
  - AC: `play()` tidak melempar error jika Web Audio tidak tersedia.

- [x] **T3.5 Layar menu, pause, dan Game Over**
  - AC: tombol Mulai, Lanjut, dan Main Lagi berfungsi dengan mouse, touch, dan keyboard (Enter).
  - AC: Esc dan `visibilitychange` (hidden) memasukkan game ke `PAUSED`; saat dilanjutkan, `dt` pertama tidak melonjak.
  - AC: layar Game Over menampilkan skor, combo maksimum, dan label "BARU" jika memecahkan rekor.

- [x] **T3.6 Penyimpanan high score**
      Implementasi `storage.js`.
  - AC: high score bertahan setelah reload halaman.
  - AC: jika `localStorage` melempar error (mode privat atau diblokir), game tetap berjalan dan high score hanya berlaku untuk sesi itu.
  - AC: nilai korup (bukan angka) diperlakukan sebagai 0.

## Milestone 4: Edge-Case Testing dan Deploy Netlify

- [ ] **T4.1 Pengujian edge case**
  - AC: spam Spasi 20 kali per detik tidak menyebabkan error dan energi turun sesuai aturan MISS.
  - AC: input saat transisi overlay tidak menghasilkan penilaian ganda.
  - AC: rotasi layar (portrait <-> landscape) dan resize jendela tidak merusak layout stage.
  - AC: game berjalan 5 menit tanpa error di console dan tanpa kebocoran memori (heap stabil di Memory tab).
  - AC: combo 80 ke atas (kecepatan sudah di-cap 360) tetap bisa dimainkan dan tidak menghasilkan `NaN`.

- [ ] **T4.2 Pengujian lintas perangkat**
  - AC: lolos uji manual di Chrome desktop, Firefox, Edge, iOS Safari, dan Chrome Android.
  - AC: tap pada mobile tidak memiliki jeda 300 ms dan tidak memicu long-press menu.

- [ ] **T4.3 Audit performa**
  - AC: Lighthouse mobile Performance minimal 90.
  - AC: total file kustom (HTML+CSS+JS) di bawah 100 KB.
  - AC: durasi frame rata-rata di Performance tab di bawah 16.7 ms pada CPU throttling 4x.

- [x] **T4.4 Deploy ke Netlify**
      Deploy lewat drag-and-drop folder proyek atau repo Git terhubung, dengan publish directory root dan tanpa build command.
  - AC: URL `*.netlify.app` dapat dibuka dan game berjalan identik dengan lokal.
  - AC: tidak ada error 404 pada Network tab (semua modul `js/*.js` termuat).
  - AC: HTTPS aktif dan Web Audio berjalan setelah gesture pertama.

- [x] **T4.5 Dokumentasi singkat**
      Buat `README.md` berisi cara menjalankan lokal, kontrol permainan, dan tautan game.
  - AC: orang lain dapat menjalankan game lokal hanya dari README.
