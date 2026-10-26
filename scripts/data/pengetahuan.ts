/**
 * Basis pengetahuan asisten gizi. Disusun tim Nurtura sebagai ringkasan pedoman yang umum dipakai;
 * BUKAN kutipan langsung, jadi tidak mencantumkan nomor halaman. Perlu ditinjau bidan/ahli gizi
 * sebelum dipakai di lapangan.
 */
const WHO = "Ringkasan tim dari pedoman WHO tentang makanan pendamping anak 6–23 bulan (2023)";
const PMBA = "Ringkasan tim dari materi Pemberian Makan Bayi dan Anak (PMBA) Kemenkes";
const KIA = "Ringkasan tim dari materi Buku KIA Kemenkes";
const KEAMANAN = "Ringkasan tim dari rekomendasi keamanan pangan bayi (CDC dan American Academy of Pediatrics)";

export type Pengetahuan = { topik: string; umurMin: number; umurMax: number; isi: string; sumber: string };

export const PENGETAHUAN: Pengetahuan[] = [
  { topik: "ASI eksklusif sampai 6 bulan", umurMin: 0, umurMax: 6, sumber: KIA,
    isi: "Bayi cukup diberi ASI saja sampai umur 6 bulan, tanpa air putih, madu, susu formula, atau makanan lain kecuali obat atas anjuran tenaga kesehatan. Susui sesering bayi mau, siang dan malam. Bila bayi tampak belum kenyang, periksakan pelekatan menyusui ke bidan." },
  { topik: "Kapan mulai makanan pendamping (MPASI)", umurMin: 4, umurMax: 8, sumber: WHO,
    isi: "MPASI dimulai saat bayi berumur 6 bulan, sambil ASI tetap diteruskan. Memulai terlalu dini (sebelum 6 bulan) atau terlambat sama-sama tidak dianjurkan. Konsultasikan ke bidan bila ada alasan khusus untuk memulai lebih awal." },
  { topik: "Tekstur dan porsi MPASI umur 6–8 bulan", umurMin: 6, umurMax: 8, sumber: PMBA,
    isi: "Umur 6–8 bulan: makanan dilumatkan atau disaring (bubur kental, tidak encer). Mulai 2–3 sendok makan sekali makan, bertahap hingga setengah mangkuk ukuran 250 ml. Beri 2–3 kali makan utama dan 1–2 kali selingan sehari, ASI tetap diteruskan." },
  { topik: "Tekstur dan porsi MPASI umur 9–11 bulan", umurMin: 9, umurMax: 11, sumber: PMBA,
    isi: "Umur 9–11 bulan: makanan dicincang halus atau lembik dan mulai dikenalkan makanan yang bisa dipegang sendiri (finger food). Porsi setengah sampai tiga perempat mangkuk 250 ml, 3–4 kali makan utama dan 1–2 kali selingan sehari." },
  { topik: "Tekstur dan porsi makan anak umur 12–23 bulan", umurMin: 12, umurMax: 23, sumber: PMBA,
    isi: "Umur 12–23 bulan: anak sudah bisa makan makanan keluarga yang dipotong kecil atau dicincang bila perlu. Porsi tiga perempat sampai satu mangkuk 250 ml, 3–4 kali makan utama dan 1–2 kali selingan sehari. ASI dapat diteruskan sampai 2 tahun atau lebih." },
  { topik: "Makan anak umur 2–5 tahun", umurMin: 24, umurMax: 60, sumber: KIA,
    isi: "Anak 2–5 tahun makan makanan keluarga 3 kali sehari dengan 1–2 kali selingan sehat. Gunakan prinsip piring makan seimbang: makanan pokok, lauk hewani, lauk nabati, sayur, dan buah. Batasi makanan dan minuman manis, asin, dan berlemak." },
  { topik: "Protein hewani setiap hari untuk mencegah stunting", umurMin: 6, umurMax: 60, sumber: WHO,
    isi: "Berikan makanan sumber hewani setiap hari, misalnya telur, ikan, hati ayam, daging ayam, atau daging sapi. Protein hewani mengandung zat gizi yang penting untuk pertumbuhan tinggi badan dan mencegah stunting. Telur dan ikan lokal seperti lele, kembung, atau teri adalah pilihan yang terjangkau." },
  { topik: "Zat besi dan mencegah anemia", umurMin: 6, umurMax: 60, sumber: WHO,
    isi: "Setelah 6 bulan kebutuhan zat besi bayi meningkat dan tidak cukup dari ASI saja. Sumber zat besi yang baik adalah hati ayam, daging merah, ikan, dan telur. Sayuran hijau seperti bayam juga mengandung zat besi; padukan dengan buah sumber vitamin C agar lebih mudah diserap." },
  { topik: "Sayur, buah, dan kacang-kacangan", umurMin: 6, umurMax: 60, sumber: WHO,
    isi: "Sayur dan buah sebaiknya diberikan setiap hari. Kacang-kacangan, tahu, dan tempe dapat menjadi tambahan protein, tetapi tidak menggantikan protein hewani. Untuk bayi, kacang dihaluskan dulu; jangan memberi kacang utuh pada anak kecil karena berisiko tersedak." },
  { topik: "Anak susah makan atau tutup mulut (GTM)", umurMin: 6, umurMax: 60, sumber: WHO,
    isi: "Terapkan pemberian makan responsif: tawarkan makanan dengan sabar, ikuti tanda lapar dan kenyang anak, dan jangan memaksa. Buat jadwal makan teratur 30 menit per sesi, matikan televisi dan gawai, ajak anak makan bersama keluarga, dan tawarkan ulang makanan baru hingga 8–10 kali. Hindari memberi camilan atau susu berlebihan menjelang waktu makan." },
  { topik: "Memperkenalkan makanan baru dan alergi", umurMin: 6, umurMax: 24, sumber: PMBA,
    isi: "Kenalkan satu jenis bahan baru setiap beberapa hari agar mudah mengenali bila ada reaksi seperti ruam, bengkak, muntah, atau diare. Telur dan ikan tidak perlu ditunda bila tidak ada riwayat alergi. Bila muncul sesak napas atau bengkak di wajah setelah makan, segera bawa ke fasilitas kesehatan." },
  { topik: "Garam, gula, dan penyedap untuk bayi", umurMin: 6, umurMax: 12, sumber: WHO,
    isi: "Jangan menambahkan garam, gula, kecap, atau penyedap pada makanan bayi di bawah 1 tahun. Rasa makanan bisa diperkaya dengan bawang, daun salam, atau kaldu buatan sendiri tanpa garam. Hindari makanan olahan tinggi garam dan gula." },
  { topik: "Madu tidak boleh untuk bayi di bawah 1 tahun", umurMin: 0, umurMax: 12, sumber: KIA,
    isi: "Madu tidak boleh diberikan kepada bayi di bawah 12 bulan, baik dicampur makanan maupun minuman, karena berisiko menyebabkan botulisme pada bayi." },
  { topik: "Minuman manis dan jus", umurMin: 6, umurMax: 60, sumber: WHO,
    isi: "Hindari minuman manis seperti teh manis, sirup, minuman kemasan, dan susu kental manis. Susu kental manis bukan pengganti susu. Lebih baik memberi buah utuh daripada jus. Untuk minum, berikan ASI dan air putih matang." },
  { topik: "Susu selain ASI", umurMin: 6, umurMax: 36, sumber: WHO,
    isi: "Untuk bayi 6–11 bulan yang tidak mendapat ASI, gunakan susu formula bayi sesuai anjuran tenaga kesehatan. Susu sapi segar atau UHT tawar boleh diberikan mulai umur 12 bulan sebagai bagian dari menu, bukan pengganti makan. Pilih susu tanpa tambahan gula." },
  { topik: "Mencegah tersedak", umurMin: 6, umurMax: 48, sumber: PMBA,
    isi: "Hindari makanan kecil, keras, dan bulat yang mudah tersangkut seperti kacang utuh, anggur utuh, permen, dan popcorn untuk balita. Potong makanan kecil-kecil dan pastikan anak makan dalam posisi duduk serta selalu diawasi." },
  { topik: "Madu, gula, dan garam untuk bayi dan balita", umurMin: 0, umurMax: 36, sumber: KEAMANAN,
    isi: "Madu tidak boleh diberikan kepada bayi di bawah 12 bulan, termasuk yang dicampur ke makanan atau minuman, karena dapat mengandung spora bakteri penyebab botulisme bayi. Setelah anak berumur 12 bulan, madu boleh diberikan dalam jumlah kecil. Untuk bayi di bawah 12 bulan, jangan menambahkan garam, gula, kecap, atau penyedap pada MPASI; setelah 12 bulan tetap batasi. Bila bayi tiba-tiba lemas, sembelit, atau sulit menyusu setelah makan madu, segera bawa ke fasilitas kesehatan." },
  { topik: "Kebersihan saat menyiapkan makanan", umurMin: 6, umurMax: 60, sumber: PMBA,
    isi: "Cuci tangan pakai sabun sebelum menyiapkan makanan dan sebelum menyuapi anak. Gunakan peralatan bersih, masak bahan hewani sampai matang, dan simpan makanan matang tidak lebih dari 2 jam di suhu ruang. Gunakan air matang untuk minum." },
  { topik: "Makan saat anak sakit dan setelah sembuh", umurMin: 6, umurMax: 60, sumber: WHO,
    isi: "Saat anak sakit, teruskan ASI dan tawarkan makanan lunak kesukaannya sedikit tapi sering, serta perbanyak minum. Setelah sembuh, beri satu porsi tambahan setiap hari selama sekitar dua minggu untuk mengejar ketertinggalan berat badan." },
  { topik: "Diare pada balita", umurMin: 0, umurMax: 60, sumber: KIA,
    isi: "Saat diare, teruskan ASI dan makan, beri oralit untuk mencegah kekurangan cairan, dan tablet zinc sesuai anjuran petugas kesehatan selama 10 hari. Segera bawa ke fasilitas kesehatan bila diare berdarah, anak sangat lemas, tidak mau minum, muntah terus, atau mata cekung." },
  { topik: "Tanda bahaya pada balita", umurMin: 0, umurMax: 60, sumber: KIA,
    isi: "Segera bawa anak ke fasilitas kesehatan bila: tidak bisa minum atau menyusu, muntah terus-menerus, kejang, sangat lemas atau tidak sadar, napas cepat atau sesak, demam tinggi, atau diare berdarah." },
  { topik: "Berat badan tidak naik", umurMin: 0, umurMax: 60, sumber: KIA,
    isi: "Bila berat badan anak tidak naik dalam penimbangan bulanan, perhatikan pola makan dan kesehatan anak, lalu konsultasikan ke kader dan bidan. Penimbangan rutin setiap bulan di posyandu membantu menemukan masalah lebih awal sebelum anak kekurangan gizi." },
  { topik: "Apa itu stunting dan cara mencegahnya", umurMin: 0, umurMax: 60, sumber: KIA,
    isi: "Stunting adalah kondisi anak lebih pendek dari standar umurnya karena kekurangan gizi dalam waktu lama dan infeksi berulang, terutama pada 1.000 hari pertama kehidupan. Pencegahannya meliputi ASI eksklusif, MPASI yang cukup protein hewani, imunisasi lengkap, kebersihan dan sanitasi, serta penimbangan dan pengukuran rutin di posyandu." },
  { topik: "Vitamin A dan obat cacing", umurMin: 6, umurMax: 60, sumber: KIA,
    isi: "Balita mendapat kapsul vitamin A di posyandu setiap bulan Februari dan Agustus: kapsul biru untuk bayi 6–11 bulan dan kapsul merah untuk anak 12–59 bulan. Obat cacing diberikan sesuai jadwal program untuk anak mulai umur 1 tahun. Tanyakan jadwalnya kepada kader posyandu." },
  { topik: "Contoh lauk hewani murah", umurMin: 6, umurMax: 60, sumber: PMBA,
    isi: "Protein hewani tidak harus mahal. Telur ayam, hati ayam, ikan lele, ikan kembung, dan ikan teri tersedia di pasar dengan harga terjangkau. Satu butir telur atau satu potong kecil ikan sudah membantu mencukupi kebutuhan protein hewani anak dalam sehari." },
  { topik: "Makanan selingan sehat", umurMin: 6, umurMax: 60, sumber: PMBA,
    isi: "Selingan sehat untuk balita misalnya potongan buah lunak (pisang, pepaya, alpukat), puding susu buatan sendiri, bubur kacang hijau, atau roti dengan telur. Hindari biskuit manis, keripik asin, dan jajanan kemasan sebagai selingan rutin." },
];
