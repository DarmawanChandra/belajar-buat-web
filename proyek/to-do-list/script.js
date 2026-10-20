/* ================================================================
   script.js — otak aplikasi To-Do List

   Alur besarnya:
   1. Ambil elemen HTML yang kita butuhkan.
   2. Simpan semua tugas dalam sebuah array (daftar) bernama "tugasList".
   3. Fungsi render() menggambar array itu menjadi baris-baris di layar.
   4. Setiap perubahan (tambah/centang/hapus) mengubah array,
      menyimpannya ke localStorage, lalu memanggil render() lagi.

   localStorage = tempat penyimpanan kecil di dalam browser.
   Isinya bertahan walau tab/browser ditutup.
   ================================================================ */


/* ----------------------------------------------------------------
   1. Ambil elemen dari HTML
   document.getElementById("...") = cari elemen dengan id tersebut.
   ---------------------------------------------------------------- */
const form        = document.getElementById("form-tugas");
const input       = document.getElementById("input-tugas");
const daftar      = document.getElementById("daftar-tugas");
const info        = document.getElementById("info-tugas");
const pesanKosong = document.getElementById("pesan-kosong");


/* ----------------------------------------------------------------
   2. Data tugas
   Setiap tugas adalah objek: { teks: "...", selesai: true/false }

   Saat halaman dibuka, kita coba ambil tugas lama dari localStorage.
   - Kalau ada  -> ubah teks JSON kembali menjadi array (JSON.parse).
   - Kalau tidak -> mulai dengan array kosong [].
   ---------------------------------------------------------------- */
let tugasList = JSON.parse(localStorage.getItem("tugasList")) || [];


/* ----------------------------------------------------------------
   3. Simpan ke localStorage
   localStorage hanya bisa menyimpan teks, jadi array kita diubah
   menjadi teks dulu dengan JSON.stringify.
   ---------------------------------------------------------------- */
function simpan() {
  localStorage.setItem("tugasList", JSON.stringify(tugasList));
}


/* ----------------------------------------------------------------
   4. Gambar ulang seluruh daftar ke layar
   Dipanggil setiap kali data berubah.
   ---------------------------------------------------------------- */
function render() {
  // Kosongkan daftar lama dulu, supaya tidak dobel.
  daftar.innerHTML = "";

  // Tampilkan/ sembunyikan pesan "belum ada tugas".
  if (tugasList.length === 0) {
    pesanKosong.classList.remove("sembunyi");
  } else {
    pesanKosong.classList.add("sembunyi");
  }

  // Hitung berapa yang sudah selesai, untuk teks ringkasan.
  const jumlahSelesai = tugasList.filter((t) => t.selesai).length;
  info.textContent =
    tugasList.length === 0
      ? ""
      : `${jumlahSelesai} dari ${tugasList.length} tugas selesai`;

  // Buat satu baris <li> untuk setiap tugas.
  tugasList.forEach((tugas, indeks) => {
    const li = document.createElement("li");
    li.className = "item-tugas" + (tugas.selesai ? " selesai" : "");

    // --- Kotak centang ---
    const centang = document.createElement("input");
    centang.type = "checkbox";
    centang.checked = tugas.selesai;
    // Saat kotak diklik: balik status selesai, simpan, gambar ulang.
    centang.addEventListener("change", () => {
      tugasList[indeks].selesai = !tugasList[indeks].selesai;
      simpan();
      render();
    });

    // --- Teks tugas ---
    const span = document.createElement("span");
    span.className = "teks-tugas";
    span.textContent = tugas.teks;

    // --- Tombol hapus ---
    const hapus = document.createElement("button");
    hapus.className = "btn-hapus";
    hapus.type = "button";
    hapus.textContent = "\u00D7";           // tanda silang (×)
    hapus.setAttribute("aria-label", "Hapus tugas");
    hapus.addEventListener("click", () => {
      // splice(indeks, 1) = buang 1 item pada posisi "indeks".
      tugasList.splice(indeks, 1);
      simpan();
      render();
    });

    // Rangkai ketiganya ke dalam <li>, lalu <li> ke dalam daftar.
    li.appendChild(centang);
    li.appendChild(span);
    li.appendChild(hapus);
    daftar.appendChild(li);
  });
}


/* ----------------------------------------------------------------
   5. Tambah tugas baru saat form dikirim (klik Tambah / tekan Enter)
   ---------------------------------------------------------------- */
form.addEventListener("submit", (event) => {
  // Cegah halaman me-reload (perilaku bawaan form).
  event.preventDefault();

  // Ambil teks, buang spasi di awal/akhir.
  const teks = input.value.trim();

  // Kalau kosong, jangan tambahkan apa-apa.
  if (teks === "") return;

  // Tambah tugas baru ke array.
  tugasList.push({ teks: teks, selesai: false });

  // Simpan, gambar ulang, kosongkan kotak input, fokuskan lagi.
  simpan();
  render();
  input.value = "";
  input.focus();
});


/* ----------------------------------------------------------------
   6. Gambar pertama kali saat halaman dibuka
   (menampilkan tugas lama kalau ada)
   ---------------------------------------------------------------- */
render();
