/* ================================================================
   script.js — otak Papan Skor Olahraga

   Gambaran besar:
   1. "aturan" menyimpan aturan tiap olahraga (poin menang, selisih,
      batas skor, berapa game untuk menang pertandingan).
   2. "skor" menyimpan keadaan sekarang: skor dua pemain + game menang.
   3. Saat tombol +1 / -1 ditekan, kita ubah skor, lalu cek apakah
      ada yang memenangkan game. Kalau pertandingan selesai, tombol
      dikunci dan pemenang diumumkan.

   Catatan istilah:
   - "game"  = satu babak (contoh: set pertama badminton sampai 21).
   - "match" = keseluruhan pertandingan (contoh: menang 2 dari 3 game).
   ================================================================ */


/* ----------------------------------------------------------------
   1. ATURAN TIAP OLAHRAGA

   target     : poin untuk menang satu game
   selisih    : selisih minimal untuk menang (deuce). 1 = tidak ada deuce
   batas       : skor maksimal; siapa yang capai ini duluan langsung menang
                 (null = tidak ada batas)
   gameUntukMenang : jumlah game yang harus dimenangkan untuk juara
                 (1 = cukup satu game)
   adaBatasMenang  : false untuk basket (skor bebas, tidak menang otomatis)
   ---------------------------------------------------------------- */
const aturan = {
  "badminton": {
    nama: "Badminton",
    target: 21, selisih: 2, batas: 30,
    gameUntukMenang: 2,   // best of 3
    adaBatasMenang: true,
    keterangan: "Menang di 21 poin (selisih 2, batas 30). Juara: menang 2 dari 3 game.",
  },
  "tenis-meja": {
    nama: "Tenis Meja",
    target: 11, selisih: 2, batas: null,
    gameUntukMenang: 3,   // best of 5
    adaBatasMenang: true,
    keterangan: "Menang di 11 poin (selisih 2). Juara: menang 3 dari 5 game.",
  },
  "voli": {
    nama: "Bola Voli",
    target: 25, selisih: 2, batas: null,
    gameUntukMenang: 3,   // best of 5 (set ke-5 ke 15, disederhanakan di sini)
    adaBatasMenang: true,
    keterangan: "Menang di 25 poin (selisih 2). Juara: menang 3 dari 5 set.",
  },
  "basket": {
    nama: "Bola Basket",
    target: null, selisih: 1, batas: null,
    gameUntukMenang: 1,
    adaBatasMenang: false,
    keterangan: "Skor bebas tanpa batas. Pemenang ditentukan manual (tekan Mulai Ulang untuk reset).",
  },
};


/* ----------------------------------------------------------------
   2. KEADAAN SEKARANG
   ---------------------------------------------------------------- */
let olahragaDipilih = "badminton";
let skor = {
  1: { poin: 0, game: 0 },
  2: { poin: 0, game: 0 },
};
let matchSelesai = false;   // true kalau pertandingan sudah ada juaranya


/* ----------------------------------------------------------------
   3. Ambil elemen HTML
   ---------------------------------------------------------------- */
const selectOlahraga = document.getElementById("olahraga");
const keteranganAturan = document.getElementById("keterangan-aturan");
const elSkor = { 1: document.getElementById("skor-1"), 2: document.getElementById("skor-2") };
const elGame = { 1: document.getElementById("game-1"), 2: document.getElementById("game-2") };
const sisi = { 1: document.querySelector('[data-pemain="1"].sisi'), 2: document.querySelector('[data-pemain="2"].sisi') };
const pengumuman = document.getElementById("pengumuman");
const tombolTambah = document.querySelectorAll(".btn-tambah");
const tombolKurang = document.querySelectorAll(".btn-kurang");
const btnReset = document.getElementById("btn-reset");


/* ----------------------------------------------------------------
   4. Nama pemain (dibaca dari judul yang bisa diedit)
   ---------------------------------------------------------------- */
function namaPemain(nomor) {
  return sisi[nomor].querySelector(".nama-pemain").textContent.trim() || ("Pemain " + nomor);
}


/* ----------------------------------------------------------------
   5. Cek apakah pemain "nomor" memenangkan game saat ini
   Mengembalikan true/false.
   ---------------------------------------------------------------- */
function menangGame(nomor) {
  const a = aturan[olahragaDipilih];
  if (!a.adaBatasMenang) return false;       // basket: tidak ada menang otomatis

  const poinKu = skor[nomor].poin;
  const poinLawan = skor[nomor === 1 ? 2 : 1].poin;

  // Menang di batas skor (contoh 30 di badminton), tidak perlu selisih.
  if (a.batas !== null && poinKu >= a.batas) return true;

  // Menang normal: capai target DAN unggul minimal "selisih".
  if (poinKu >= a.target && (poinKu - poinLawan) >= a.selisih) return true;

  return false;
}


/* ----------------------------------------------------------------
   6. Gambar ulang tampilan sesuai keadaan
   ---------------------------------------------------------------- */
function render() {
  const a = aturan[olahragaDipilih];
  keteranganAturan.textContent = a.keterangan;

  [1, 2].forEach((n) => {
    elSkor[n].textContent = skor[n].poin;

    // Titik-titik game yang dimenangkan
    elGame[n].innerHTML = "";
    for (let i = 0; i < skor[n].game; i++) {
      elGame[n].appendChild(document.createElement("span"));
    }

    // Tandai sisi pemenang
    sisi[n].classList.remove("menang");
  });

  // Aktif/nonaktifkan tombol sesuai apakah pertandingan selesai
  const kunci = matchSelesai;
  tombolTambah.forEach((b) => (b.disabled = kunci));
  tombolKurang.forEach((b) => (b.disabled = kunci));
}


/* ----------------------------------------------------------------
   7. Tambah 1 poin untuk pemain "nomor"
   ---------------------------------------------------------------- */

// Bikin kotak tap pemain "nomor" berkedip sebentar.
// Kelas dilepas dulu lalu dipasang lagi, supaya tap cepat berturut-turut
// tetap memunculkan kedipan baru.
function kedip(nomor) {
  const kotak = sisi[nomor].querySelector(".area-tap");
  kotak.classList.remove("kedip");
  void kotak.offsetWidth;   // paksa browser "lupa" animasi sebelumnya
  kotak.classList.add("kedip");
}

function tambahPoin(nomor) {
  if (matchSelesai) return;

  // Tanda poin masuk, supaya wasit yakin tap-nya terhitung:
  // 1. Getar (Android). iPhone tidak mendukung getar dari situs web.
  // 2. Kotak berkedip warna (semua HP, termasuk iPhone).
  if (navigator.vibrate) navigator.vibrate(90);
  kedip(nomor);

  skor[nomor].poin++;

  // Cek apakah game ini dimenangkan
  if (menangGame(nomor)) {
    skor[nomor].game++;
    const a = aturan[olahragaDipilih];

    // Apakah sudah cukup game untuk juara?
    if (skor[nomor].game >= a.gameUntukMenang) {
      matchSelesai = true;
      render();
      sisi[nomor].classList.add("menang");
      tampilkanPengumuman(namaPemain(nomor) + " Menang!");
      return;
    }

    // Belum juara: mulai game baru (skor poin kembali 0).
    skor[1].poin = 0;
    skor[2].poin = 0;
    render();
    tampilkanPengumuman("Game untuk " + namaPemain(nomor) + ". Lanjut game berikutnya!");
    return;
  }

  sembunyikanPengumuman();
  render();
}


/* ----------------------------------------------------------------
   8. Kurangi 1 poin (untuk koreksi salah pencet)
   ---------------------------------------------------------------- */
function kurangiPoin(nomor) {
  if (matchSelesai) return;
  if (skor[nomor].poin > 0) {
    skor[nomor].poin--;
    sembunyikanPengumuman();
    render();
  }
}


/* ----------------------------------------------------------------
   9. Pengumuman
   ---------------------------------------------------------------- */
function tampilkanPengumuman(teks) {
  pengumuman.textContent = teks;
  pengumuman.classList.remove("sembunyi");
}
function sembunyikanPengumuman() {
  pengumuman.classList.add("sembunyi");
}


/* ----------------------------------------------------------------
   10. Reset ke keadaan awal
   ---------------------------------------------------------------- */
function reset() {
  skor = { 1: { poin: 0, game: 0 }, 2: { poin: 0, game: 0 } };
  matchSelesai = false;
  sembunyikanPengumuman();
  render();
}


/* ----------------------------------------------------------------
   11. Pasang "pendengar" (event listener) ke tombol
   ---------------------------------------------------------------- */
tombolTambah.forEach((b) => {
  b.addEventListener("click", () => tambahPoin(Number(b.dataset.pemain)));
});
tombolKurang.forEach((b) => {
  b.addEventListener("click", () => kurangiPoin(Number(b.dataset.pemain)));
});

// Ganti olahraga -> pakai aturan baru dan reset skor.
selectOlahraga.addEventListener("change", () => {
  olahragaDipilih = selectOlahraga.value;
  reset();
});

btnReset.addEventListener("click", reset);


/* ----------------------------------------------------------------
   12. Gambar pertama kali
   ---------------------------------------------------------------- */
render();
