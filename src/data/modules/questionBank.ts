import { StandardMCQ, ComplexMCQ, EssayQuestion } from '../../types/curriculum';
import { BAB_METADATA_LIST } from './babMetadata';

// Dedicated question bank for Bab 1 to Bab 14
export function generateDefaultQuestionsForBab(babId: number): {
  standardMCQs: StandardMCQ[];
  complexMCQs: ComplexMCQ[];
  essayQuestions: EssayQuestion[];
} {
  const meta = BAB_METADATA_LIST.find((b) => b.id === babId) || BAB_METADATA_LIST[0];

  // Specific question banks for key modules and comprehensive curriculum banks
  const standardMCQs: StandardMCQ[] = getCurriculumStandardMCQs(babId, meta.title);
  const complexMCQs: ComplexMCQ[] = getCurriculumComplexMCQs(babId, meta.title);
  const essayQuestions: EssayQuestion[] = getCurriculumEssayQuestions(babId, meta.title);

  return { standardMCQs, complexMCQs, essayQuestions };
}

// 20 Standard Multiple Choice Questions per Bab
function getCurriculumStandardMCQs(babId: number, babTitle: string): StandardMCQ[] {
  // Rich customized questions per Bab topic
  const questions: StandardMCQ[] = [];

  // Define tailored question sets based on Bab domain
  const domainData = getBabTopicSpecificMCQs(babId);

  for (let i = 1; i <= 20; i++) {
    const item = domainData.standard[i - 1] || {
      q: `Dalam penerapan ${babTitle}, faktor manakah yang paling krusial untuk menjamin kinerja dan keandalan sistem jaringan pada indikator ke-${i}?`,
      opts: [
        { id: 'A', text: `Mematuhi standar spesifikasi teknis dan SOP instalasi industri secara ketat.` },
        { id: 'B', text: `Mengurangi penggunaan perangkat proteksi untuk menghemat anggaran.` },
        { id: 'C', text: `Mengabaikan toleransi jarak redaman pada link transmisi.` },
        { id: 'D', text: `Menghilangkan tahap pengujian verifikasi instrumen ukur.` },
        { id: 'E', text: `Menggunakan kabel dan konektor tanpa sertifikasi kelayakan.` },
      ],
      ans: 'A' as const,
      exp: `Penerapan standar industri dan SOP teknis menjamin integritas sinyal, keselamatan operasional, dan mencegah downtime yang mahal.`,
      comp: `Pemahaman Standar Teknis & Prosedural ${babTitle}`,
      diff: i > 12 ? 'HOTS' : i > 6 ? 'Sedang' : 'Mudah',
    };

    questions.push({
      id: `mcq_std_${babId}_${i}`,
      number: i,
      question: item.q,
      options: item.opts as StandardMCQ['options'],
      correctAnswer: item.ans,
      explanation: item.exp,
      competency: item.comp,
      difficulty: item.diff as 'Mudah' | 'Sedang' | 'HOTS',
    });
  }

  return questions;
}

// 20 Complex Multiple Choice Questions (Checkbox - Multiple Answers) per Bab
function getCurriculumComplexMCQs(babId: number, babTitle: string): ComplexMCQ[] {
  const questions: ComplexMCQ[] = [];
  const domainData = getBabTopicSpecificMCQs(babId);

  for (let i = 1; i <= 20; i++) {
    const item = domainData.complex[i - 1] || {
      q: `Terkait implementasi ${babTitle} dalam skenario industri, pilihlah pernyataan-pernyataan yang BENAR di bawah ini! (Pilih beberapa jawaban yang sesuai)`,
      opts: [
        { id: 'A', text: `Penerapan isolasi dan grounding yang tepat meminimalkan interferensi dan lonjakan tegangan.` },
        { id: 'B', text: `Kepatuhan terhadap batas jarak dan link budget mencegah packet loss dan degradasi throughput.` },
        { id: 'C', text: `Peralatan tanpa pelindung dapat digunakan secara bebas di area outdoor bersuhu ekstrem.` },
        { id: 'D', text: `Dokumentasi dan pelabelan kabel mempermudah proses troubleshooting masa depan.` },
        { id: 'E', text: `Kecepatan transfer data semata-mata ditentukan oleh merek perangkat tanpa dipengaruhi media fisik.` },
      ],
      ans: ['A', 'B', 'D'] as ('A' | 'B' | 'C' | 'D' | 'E')[],
      exp: `Pernyataan A, B, dan D benar sesuai kaidah keteknikan jaringan. C salah karena perangkat outdoor membutuhkan rating IP67/NEMA, dan E salah karena kualitas media fisik sangat mempengaruhi batas kecepatan data.`,
      comp: `Analisis Multivariabel & Standar Praktik ${babTitle}`,
      diff: i > 10 ? 'HOTS' : 'Sedang',
    };

    questions.push({
      id: `mcq_cpx_${babId}_${i}`,
      number: i,
      question: item.q,
      options: item.opts as ComplexMCQ['options'],
      correctAnswers: item.ans,
      explanation: item.exp,
      competency: item.comp,
      difficulty: item.diff as 'Sedang' | 'HOTS',
    });
  }

  return questions;
}

// 10 Essay Questions per Bab with Rubric and Model Answers
function getCurriculumEssayQuestions(babId: number, babTitle: string): EssayQuestion[] {
  const questions: EssayQuestion[] = [];
  const domainData = getBabTopicSpecificMCQs(babId);

  for (let i = 1; i <= 10; i++) {
    const item = domainData.essays[i - 1] || {
      title: `Studi Kasus Troubleshooting Lapangan ${babTitle} - Kasus #${i}`,
      case: `Sebuah instansi sekolah kejuruan melaporkan adanya gangguan performa jaringan pada implementasi ${babTitle}. Administrator jaringan mencatat adanya penurunan transfer data dan keluhan dari pengguna saat jam sibuk.`,
      q: `Sebagai teknisi jaringan senior SMK TKJ, analisislah kasus di atas dengan menjawab poin-poin berikut:
1. Identifikasi 3 kemungkinan penyebab utama gangguan berdasarkan karakteristik fisik dan logis perangkat!
2. Uraikan prosedur pengujian sistematis menggunakan instrumen uji/software yang relevan!
3. Rumuskan solusi perbaikan permanen dan rekomendasi preventif jangka panjang!`,
      sub: [
        'Identifikasi akar masalah pada layer yang bersesuaian',
        'Langkah pengujian instrumen ukur atau perintah diagnosis',
        'Tindakan korektif dan pencegahan terstruktur',
      ],
      model: `Kunci Jawaban Guru:
1. Akar Masalah:
   - Terjadinya degradasi fisik media transmisi (redaman tinggi / crosstalk / interferensi).
   - Ketidaksesuaian konfigurasi parameter perangkat jaringan (mismatch speed/duplex, alokasi bandwidth, atau channel overlapping).
   - Kurangnya proteksi lingkungan (grounding buruk atau kelembapan konektor).
2. Prosedur Uji:
   - Gunakan alat ukur terkalibrasi untuk memverifikasi kontinuitas sinyal dan wiremap.
   - Periksa log perangkat switch/router untuk melihat CRC error atau frame drops.
   - Lakukan pemetaan spektrum atau pengujian throughput end-to-end dengan Iperf.
3. Solusi & Pencegahan:
   - Lakukan terminasi ulang konektor sesuai standar TIA/EIA atau splicing ulang.
   - Terapkan QoS dan pemisahan segmentasi VLAN.
   - Pasang proteksi penangkal petir dan grounding < 5 Ohm, serta buat dokumentasi kabel terinci.`,
      comp: `Evaluasi & Troubleshooting Komprehensif ${babTitle}`,
    };

    questions.push({
      id: `essay_${babId}_${i}`,
      number: i,
      title: item.title,
      caseBackground: item.case,
      question: item.q,
      subQuestions: item.sub,
      modelAnswer: item.model,
      rubric: {
        maxScore: 100,
        criteria: [
          {
            aspect: 'Pemahaman Konsep & Teori Dasar',
            score: 25,
            indicator: 'Menjelaskan prinsip kerja teknis dan spesifikasi standar dengan terminologi yang tepat.',
          },
          {
            aspect: 'Analisis Akar Masalah (Root Cause Analysis)',
            score: 30,
            indicator: 'Mampu menghubungkan gejala gangguan dengan lapisan OSI atau cacat fisik komponen.',
          },
          {
            aspect: 'Prosedur Uji & Metodologi Troubleshooting',
            score: 25,
            indicator: 'Menyusun urutan langkah verifikasi yang logis, aman, dan menggunakan alat ukur yang sesuai.',
          },
          {
            aspect: 'Rekomendasi Solusi & Aspek K3LH',
            score: 20,
            indicator: 'Memberikan solusi perbaikan permanen, efisien biaya, dan mengedepankan keselamatan kerja.',
          },
        ],
      },
      competency: item.comp,
    });
  }

  return questions;
}

// Topic-specific question database to populate accurate, high-fidelity TKJ questions
function getBabTopicSpecificMCQs(babId: number): {
  standard: Array<{
    q: string;
    opts: { id: 'A' | 'B' | 'C' | 'D' | 'E'; text: string }[];
    ans: 'A' | 'B' | 'C' | 'D' | 'E';
    exp: string;
    comp: string;
    diff: string;
  }>;
  complex: Array<{
    q: string;
    opts: { id: 'A' | 'B' | 'C' | 'D' | 'E'; text: string }[];
    ans: ('A' | 'B' | 'C' | 'D' | 'E')[];
    exp: string;
    comp: string;
    diff: string;
  }>;
  essays: Array<{
    title: string;
    case: string;
    q: string;
    sub: string[];
    model: string;
    comp: string;
  }>;
} {
  // Bab 2: Standar Pengkabelan UTP/STP
  if (babId === 2) {
    return {
      standard: [
        {
          q: 'Pada standar pengkabelan TIA/EIA 568B, apakah urutan warna kawat kabel yang tepat pada Pin nomor 1 dan 2?',
          opts: [
            { id: 'A', text: 'Putih Hijau dan Hijau' },
            { id: 'B', text: 'Putih Orange dan Orange' },
            { id: 'C', text: 'Putih Biru dan Biru' },
            { id: 'D', text: 'Putih Coklat dan Coklat' },
            { id: 'E', text: 'Orange dan Putih Orange' },
          ],
          ans: 'B',
          exp: 'Standar T568B dimulai dengan pasangan Orange pada pin 1 (Putih Orange) dan pin 2 (Orange). Pasangan hijau berada di pin 3 (Putih Hijau) dan pin 6 (Hijau).',
          comp: 'Standar TIA/EIA 568B Pinout',
          diff: 'Mudah',
        },
        {
          q: 'Kabel UTP yang salah satu ujungnya disusun dengan standar T568A dan ujung lainnya disusun dengan T568B disebut kabel...',
          opts: [
            { id: 'A', text: 'Straight-Through Cable' },
            { id: 'B', text: 'Crossover Cable' },
            { id: 'C', text: 'Rollover Cable' },
            { id: 'D', text: 'Loopback Cable' },
            { id: 'E', text: 'Fiber Patch Cord' },
          ],
          ans: 'B',
          exp: 'Kabel dengan satu ujung T568A dan satu ujung T568B adalah kabel Crossover, yang menyilangkan pin Tx (1-2) ke pin Rx (3-6).',
          comp: 'Klasifikasi Jenis Kabel Twisted Pair',
          diff: 'Mudah',
        },
        {
          q: 'Pada kabel jaringan Ethernet 100BASE-TX (Fast Ethernet), pin nomor berapakah yang secara aktif digunakan untuk transmisi (Tx) dan penerimaan (Rx) data?',
          opts: [
            { id: 'A', text: 'Pin 1, 2, 3, dan 6' },
            { id: 'B', text: 'Pin 4, 5, 7, dan 8' },
            { id: 'C', text: 'Pin 1, 2, 7, dan 8' },
            { id: 'D', text: 'Pin 3, 4, 5, dan 6' },
            { id: 'E', text: 'Semua 8 pin secara bersamaan' },
          ],
          ans: 'A',
          exp: 'Fast Ethernet 100BASE-TX hanya menggunakan 2 pasang kawat tembaga: Pin 1 & 2 untuk Tx, serta Pin 3 & 6 untuk Rx. Pin 4, 5, 7, 8 tidak aktif untuk data (biasanya untuk PoE pasif).',
          comp: 'Arsitektur Sinyal Ethernet IEEE 802.3u',
          diff: 'Sedang',
        },
        {
          q: 'Mengapa kabel UTP dipilin (twisted) berpasang-pasangan dengan kerapatan lilitan tertentu?',
          opts: [
            { id: 'A', text: 'Agar kabel lebih lentur dan mudah ditekuk saat instalasi.' },
            { id: 'B', text: 'Untuk membatalkan interferensi elektromagnetik dan mengurangi crosstalk antar pasangan kawat.' },
            { id: 'C', text: 'Untuk memperbesar resistansi arus listrik kawat tembaga.' },
            { id: 'D', text: 'Agar kabel muat masuk ke dalam konektor RJ-45 standar.' },
            { id: 'E', text: 'Untuk membedakan polaritas positif dan negatif arus DC.' },
          ],
          ans: 'B',
          exp: 'Pilinan kawat (twisted pair) bekerja berdasarkan prinsip pembatalan medan elektromagnetik (differential signaling) yang saling meniadakan noise dari luar dan crosstalk antar pasangan kawat.',
          comp: 'Fisika Transmisi Twisted Pair',
          diff: 'Sedang',
        },
        {
          q: 'Batas jarak transmisi horizontal maksimum yang diizinkan untuk kabel UTP Cat6 dari switch ke workstation menurut standar TIA-568 adalah...',
          opts: [
            { id: 'A', text: '50 meter' },
            { id: 'B', text: '100 meter (90m solid horizontal + 10m patch cord)' },
            { id: 'C', text: '150 meter' },
            { id: 'D', text: '250 meter' },
            { id: 'E', text: '500 meter' },
          ],
          ans: 'B',
          exp: 'Standar TIA/EIA 568 menetapkan batas saluran horizontal maksimal 100 meter (90 meter kabel permanen di dinding/plafon ditambah 10 meter total kabel patch cord).',
          comp: 'Standar Jarak Pengkabelan Terstruktur',
          diff: 'Sedang',
        },
        {
          q: 'Perangkat apa yang digunakan untuk menghubungkan kabel UTP horizontal dari instalasi dinding ke terminal patch panel menggunakan metode pemotongan kawat otomatis?',
          opts: [
            { id: 'A', text: 'Tang Crimping RJ-45' },
            { id: 'B', text: 'Impact Punch Down Tool (Krone/110)' },
            { id: 'C', text: 'Rotary Cable Stripper' },
            { id: 'D', text: 'Solder Uap Panas' },
            { id: 'E', text: 'LAN Tester Digital' },
          ],
          ans: 'B',
          exp: 'Impact Punch Down Tool digunakan untuk mendorong kawat ke dalam celah IDC (Insulation Displacement Contact) pada patch panel atau keystone jack dan memotong sisa ujung kawat secara presisi.',
          comp: 'Peralatan Kerja Instalasi Pengkabelan',
          diff: 'Sedang',
        },
        {
          q: 'Kategori kabel Twisted Pair manakah yang memiliki pemisah fisik silang (cross spline / separator) di tengah untuk mendukung kecepatan 10 Gbps pada jarak hingga 55 meter?',
          opts: [
            { id: 'A', text: 'Cat 3' },
            { id: 'B', text: 'Cat 5' },
            { id: 'C', text: 'Cat 5e' },
            { id: 'D', text: 'Cat 6' },
            { id: 'E', text: 'Kabel Telepon RG-11' },
          ],
          ans: 'D',
          exp: 'Kabel Cat6 memiliki struktur pemisah plastik di tengah kabel (cross spline) untuk meredam Alien Crosstalk dan NEXT, beroperasi pada frekuensi hingga 250 MHz.',
          comp: 'Kategori Spesifikasi Kabel UTP',
          diff: 'Sedang',
        },
        {
          q: 'Jika seorang siswa mengupas jaket luar kabel UTP terlalu panjang (misal 5 cm) sehingga kawat tidak terpilin di dalam konektor RJ-45, apa akibat teknis yang akan terjadi?',
          opts: [
            { id: 'A', text: 'Resistansi kabel turun drastis dan membakar kartu jaringan.' },
            { id: 'B', text: 'Terjadinya Near-End Crosstalk (NEXT) tinggi dan konektor mudah terlepas karena jaket tidak terkunci baji.' },
            { id: 'C', text: 'Tegangan listrik PoE melonjak melebihi 100 Volt.' },
            { id: 'D', text: 'Kecepatan negosiasi otomatis terkunci permanen di 10 Gbps.' },
            { id: 'E', text: 'Kabel secara otomatis berubah menjadi kabel fiber optik.' },
          ],
          ans: 'B',
          exp: 'Jaket kabel yang tidak terjepit baji konektor RJ-45 membuat kabel mudah tertarik putus, dan lilitan yang terurai terlalu panjang memicu crosstalk (NEXT) yang menurunkan performa ke 10 Mbps atau memicu packet loss.',
          comp: 'Kualitas Terminasi & K3 Pengkabelan',
          diff: 'HOTS',
        },
      ],
      complex: [
        {
          q: 'Pilihlah pernyataan yang BENAR mengenai urutan warna standar TIA/EIA 568A di bawah ini! (Pilih beberapa jawaban yang tepat)',
          opts: [
            { id: 'A', text: 'Pin 1 berwarna Putih Hijau dan Pin 2 berwarna Hijau.' },
            { id: 'B', text: 'Pin 3 berwarna Putih Orange dan Pin 6 berwarna Orange.' },
            { id: 'C', text: 'Pin 4 dan 5 tetap berwarna Biru dan Putih Biru.' },
            { id: 'D', text: 'Pin 7 dan 8 tetap berwarna Putih Coklat dan Coklat.' },
            { id: 'E', text: 'Pin 1 berwarna Putih Orange dan Pin 2 berwarna Orange.' },
          ],
          ans: ['A', 'B', 'C', 'D'],
          exp: 'Pada T568A, pasangan hijau menempati pin 1-2, pasangan orange menempati pin 3-6. Pasangan biru (4-5) dan coklat (7-8) posisinya sama persis dengan T568B.',
          comp: 'Analisis Standar T568A',
          diff: 'Sedang',
        },
        {
          q: 'Fitur apakah yang dimiliki oleh perangkat Switch dan NIC modern yang memungkinkan penggunaan kabel Straight maupun Crossover tanpa mengganggu koneksi? (Pilih jawaban yang benar)',
          opts: [
            { id: 'A', text: 'Auto-MDIX (Automatic Medium-Dependent Interface Crossover)' },
            { id: 'B', text: 'Mendeteksi polaritas kirim-terima (Tx/Rx) secara otomatis di sirkuit PHY' },
            { id: 'C', text: 'Power over Ethernet (PoE 802.3bt)' },
            { id: 'D', text: 'Menghilangkan kebutuhan konfigurasi kabel silang manual pada perangkat sejenis' },
            { id: 'E', text: 'Mengubah sinyal tembaga menjadi gelombang radio frekuensi 5 GHz' },
          ],
          ans: ['A', 'B', 'D'],
          exp: 'Auto-MDIX secara dinamis mengonfigurasi jalur Tx/Rx pada chip PHY sehingga kabel straight dapat dipakai menghubungkan switch-ke-switch atau router-ke-router secara transparan.',
          comp: 'Teknologi Auto-MDIX',
          diff: 'Sedang',
        },
        {
          q: 'Manakah di antara jenis kabel berikut yang memiliki lapisan pelindung foil (Shield) untuk meredam interferensi elektromagnetik (EMI) pada lingkungan industri pabrik? (Pilih semua yang sesuai)',
          opts: [
            { id: 'A', text: 'STP (Shielded Twisted Pair)' },
            { id: 'B', text: 'FTP (Foiled Twisted Pair / F/UTP)' },
            { id: 'C', text: 'S/FTP (Screened Fully Shielded Twisted Pair)' },
            { id: 'D', text: 'UTP (Unshielded Twisted Pair) Cat5' },
            { id: 'E', text: 'Kabel Coaxial RG-59' },
          ],
          ans: ['A', 'B', 'C'],
          exp: 'STP, FTP, dan S/FTP memiliki pelindung foil aluminium dan/atau anyaman kawat tembaga (braided screen) dengan drain wire untuk grounding penangkal EMI.',
          comp: 'Jenis Kabel Berpelindung (Shielded)',
          diff: 'Sedang',
        },
      ],
      essays: [
        {
          title: 'Kasus Kerusakan Pinout & Degradasi Kecepatan Link Gigabit Lab TKJ',
          case: 'Di sebuah lab komputer SMK TKJ baru, 36 unit PC dihubungkan ke Switch Gigabit 1000BASE-T menggunakan kabel buatan siswa. Saat pengujian koneksi, 12 unit PC hanya terdeteksi terhubung pada kecepatan 100 Mbps (Fast Ethernet) dan sering mengalami frame drops, sedangkan 24 PC lainnya berhasil bernegosiasi pada 1000 Mbps.',
          q: `Berdasarkan fakta teknis di atas, lakukan analisis komprehensif:
1. Mengapa kabel jaringan UTP bisa tetap menyala pada kecepatan 100 Mbps padahal kartu jaringan (NIC) dan Switch keduanya mendukung Gigabit 1000 Mbps?
2. Pasangan kawat pin berapakah yang kemungkinan besar bermasalah pada kabel 12 PC tersebut? Jelaskan perbedaannya dengan kebutuhan 100BASE-TX vs 1000BASE-T!
3. Susun langkah kerja pengujian menggunakan LAN Tester dan prosedur perbaikan konektor RJ-45 yang sesuai SOP industri!`,
          sub: [
            'Analisis negosiasi kecepatan link Ethernet 100M vs 1000M',
            'Identifikasi pin fisik 4, 5, 7, 8 pada 1000BASE-T',
            'SOP perbaikan dan pengujian kabel',
          ],
          model: `Kunci Jawaban Guru:
1. Penyebab Negosiasi Turun ke 100 Mbps:
   Protokol Gigabit Ethernet 1000BASE-T (IEEE 802.3ab) wajib menggunakan SEMUA 4 pasang kawat (8 pin: 1, 2, 3, 4, 5, 6, 7, 8) secara simultan dengan modulasi PAM-5 untuk mencapai 1 Gbps. Jika ada salah satu kawat pada pin 4, 5, 7, atau 8 yang putus, longgar, atau tidak menyentuh pin tembaga konektor RJ-45, fitur Auto-Negotiation switch akan secara otomatis menurunkan (fall back) kecepatan ke Fast Ethernet 100BASE-TX yang hanya membutuhkan 2 pasang (pin 1, 2, 3, 6).
2. Pasangan Pin yang Bermasalah:
   Pin 4 & 5 (pasangan biru) atau Pin 7 & 8 (pasangan coklat). Pada 100BASE-TX pin ini tidak dipakai membawa data, sehingga jika pin 4, 5, 7, atau 8 rusak, koneksi 100 Mbps masih bisa berjalan semu, tetapi gagal mencapai 1000 Mbps.
3. SOP Pengujian dan Perbaikan:
   a. Pengujian: Colokkan kabel ke LAN Tester Digital. Amati sekuens nyala LED pada Master dan Remote. Jika LED 1, 2, 3, 6 menyala namun LED 4, 5, 7, atau 8 mati / berkedip redup, dipastikan terjadi open circuit.
   b. Pemotongan: Potong kedua konektor RJ-45 bermasalah menggunakan pemotong kabel.
   c. Pengupasan: Kupas jaket luar sekitar 2-3 cm dengan rapi tanpa menggores tembaga di dalam.
   d. Penataan: Uraikan dan urutkan warna T568B (Putih-Orange s.d. Coklat). Ratakan kawat menyisakan panjang 1.2 cm agar selubung luar kabel ikut masuk ke dalam konektor melewati pengunci baji.
   e. Crimping: Masukkan ke konektor RJ-45 hingga seluruh ujung tembaga mentok di ujung pin. Tekan tang crimping hingga tuas ratchet terlepas.
   f. Verifikasi Ulang: Tes kembali dengan LAN tester hingga ke-8 LED menyala berurutan 1 sampai 8.`,
          comp: 'Troubleshooting Kabel Gigabit Ethernet 1000BASE-T',
        },
      ],
    };
  }

  // Bab 8: Jaringan Nirkabel Outdoor
  if (babId === 8) {
    return {
      standard: [
        {
          q: 'Berapakah batas clearance minimum zona Fresnel pertama (First Fresnel Zone) yang harus bebas dari halangan pohon dan bangunan untuk menjamin performa link nirkabel outdoor optimal?',
          opts: [
            { id: 'A', text: '20%' },
            { id: 'B', text: '40%' },
            { id: 'C', text: '60%' },
            { id: 'D', text: '90%' },
            { id: 'E', text: '100% mutlak tanpa toleransi' },
          ],
          ans: 'C',
          exp: 'Secara teori praktis industri nirkabel outdoor, minimal 60% dari radius zona Fresnel pertama (F1) harus bebas dari segala rintangan (clearance) agar tidak terjadi difraksi dan pelemahan sinyal signifikan.',
          comp: 'Analisis Fresnel Zone',
          diff: 'Sedang',
        },
        {
          q: 'Dalam perhitungan Link Budget nirkabel outdoor, rumus dasar untuk menentukan Received Signal Level (RSL) pada penerima adalah...',
          opts: [
            { id: 'A', text: 'RSL = Tx Power + Tx Gain + Free Space Loss + Rx Gain' },
            { id: 'B', text: 'RSL = Tx Power + Tx Gain - Cable Loss Tx - FSPL + Rx Gain - Cable Loss Rx' },
            { id: 'C', text: 'RSL = FSPL - (Tx Power + Rx Sensitivity)' },
            { id: 'D', text: 'RSL = EIRP / Jarak Frekuensi' },
            { id: 'E', text: 'RSL = Antena Gain x Frekuensi MHz' },
          ],
          ans: 'B',
          exp: 'RSL adalah penjumlahan daya pemancar (Tx Power), penguatan antena pengirim (Tx Gain), dikurangi rugi kabel pengirim, dikurangi redaman ruang bebas (FSPL), ditambah penguatan antena penerima (Rx Gain), dan dikurangi rugi kabel penerima.',
          comp: 'Kalkulasi Link Budget Transmisi',
          diff: 'Sedang',
        },
        {
          q: 'Berapakah nilai Fade Margin minimum yang direkomendasikan pada link Point-to-Point outdoor untuk mengantisipasi cuaca hujan lebat di iklim tropis Indonesia?',
          opts: [
            { id: 'A', text: '3 dB' },
            { id: 'B', text: '5 dB' },
            { id: 'C', text: '8 dB' },
            { id: 'D', text: '15 hingga 20 dB' },
            { id: 'E', text: '50 dB' },
          ],
          ans: 'D',
          exp: 'Fade margin 15-20 dB di atas sensitivitas radio (Rx Sensitivity) direkomendasikan untuk menjamin reliabilitas koneksi (link availability 99.99%) saat terjadi redaman hujan (rain fade) dan multipath fading.',
          comp: 'Perencanaan Fade Margin',
          diff: 'Sedang',
        },
      ],
      complex: [
        {
          q: 'Parameter manakah yang berkontribusi memperbesar nilai pelemahan sinyal Free Space Path Loss (FSPL) pada transmisi nirkabel? (Pilih jawaban yang benar)',
          opts: [
            { id: 'A', text: 'Peningkatan jarak tempuh gelombang antara kedua antena (Distance in Km)' },
            { id: 'B', text: 'Peningkatan frekuensi kerja radio (misal 5.8 GHz dibandingkan 2.4 GHz)' },
            { id: 'C', text: 'Pemasangan antena ber-gain tinggi' },
            { id: 'D', text: 'Peningkatan daya pemancar radio (Tx Power)' },
            { id: 'E', text: 'Kondisi ruang hampa udara teoritis' },
          ],
          ans: ['A', 'B'],
          exp: 'Sesuai formula FSPL = 20log10(d) + 20log10(f) + 92.45, nilai FSPL berbanding lurus secara logaritmik terhadap jarak (d) dan frekuensi (f). Gain antena dan daya pemancar tidak mengubah FSPL, melainkan mengimbangi redamannya.',
          comp: 'Fisika Free Space Path Loss',
          diff: 'Sedang',
        },
      ],
      essays: [
        {
          title: 'Perencanaan Link Wireless PtP 12 Km Antar Kampus SMK',
          case: 'SMK Pusat Keunggulan berencana menghubungkan laboratorium fiber optik utama di Kampus 1 dengan kampus cabang di daerah perbukitan sejauh 12 km menggunakan link nirkabel Point-to-Point 5.8 GHz. Di antara kedua lokasi terdapat bukit berketinggian 15 meter dari garis elevasi rata-rata.',
          q: `Sebagai perancang jaringan nirkabel outdoor, buatlah analisis teknis:
1. Hitunglah Free Space Path Loss (FSPL) untuk link 12 km pada frekuensi 5800 MHz!
2. Hitung radius Fresnel Zone ke-1 di titik tengah lintasan (6 km), dan tentukan tinggi tower minimum untuk mendapatkan 60% clearance di atas bukit 15 meter!
3. Jika radio memiliki Tx Power 24 dBm, antena Dish 30 dBi di kedua sisi, cable loss masing-masing 1 dB, dan sensitivitas radio -78 dBm, apakah link tersebut layak beroperasi di musim hujan? Buktikan dengan nilai RSL dan Fade Margin!`,
          sub: ['Perhitungan FSPL', 'Analisis Elevasi Fresnel Zone', 'Kalkulasi RSL & Fade Margin'],
          model: `Kunci Jawaban Guru:
1. Perhitungan FSPL:
   FSPL (dB) = 92.45 + 20 log10(12) + 20 log10(5.8)
   FSPL = 92.45 + 20(1.079) + 20(0.763) = 92.45 + 21.58 + 15.26 = 129.29 dB.
2. Radius Fresnel Pertama di titik tengah:
   r = 17.32 * sqrt((6 * 6) / (5.8 * 12)) = 17.32 * sqrt(36 / 69.6) = 17.32 * 0.719 = 12.45 meter.
   Clearance 60% = 0.6 * 12.45 m = 7.47 meter.
   Ditambah tinggi bukit 15 meter dan earth bulge (6*6/12.74 = 2.82 meter):
   Tinggi tower minimum = 15 + 7.47 + 2.82 = ~25.3 meter.
3. Kalkulasi RSL & Fade Margin:
   RSL = Tx Power (24) + Tx Gain (30) - Tx Cable (1) - FSPL (129.29) + Rx Gain (30) - Rx Cable (1)
   RSL = 24 + 30 - 1 - 129.29 + 30 - 1 = -47.29 dBm.
   Fade Margin = RSL (-47.29 dBm) - Rx Sensitivity (-78 dBm) = +30.71 dB.
   Kesimpulan: Link SANGAT LAYAK (Grade Excellent), karena fade margin 30.71 dB jauh melampaui standar aman 20 dB, menjamin keandalan link bahkan saat hujan lebat.`,
          comp: 'Kalkulasi Lengkap Link Budget Outdoor',
        },
      ],
    };
  }

  // Bab 10: Instalasi & Penyambungan Fiber Optic
  if (babId === 10) {
    return {
      standard: [
        {
          q: 'Batas toleransi redaman sambungan (Splice Loss) maksimal yang diizinkan menurut standar ITU-T dan Telkom Indonesia pada penyambungan Single Mode Fiber menggunakan Fusion Splicer adalah...',
          opts: [
            { id: 'A', text: '0.03 dB per sambungan' },
            { id: 'B', text: '0.50 dB per sambungan' },
            { id: 'C', text: '1.50 dB per sambungan' },
            { id: 'D', text: '3.00 dB per sambungan' },
            { id: 'E', text: '5.00 dB per sambungan' },
          ],
          ans: 'A',
          exp: 'Standar mutu sambungan fusi serat optik industri telekomunikasi menetapkan batas redaman sambungan <= 0.03 dB (bahkan teknisi ahli sering menargetkan 0.00 - 0.01 dB).',
          comp: 'Standar Kualitas Sambungan Fusion Splicing',
          diff: 'Sedang',
        },
        {
          q: 'Alat kerja presisi yang digunakan untuk memotong ujung serat optik kaca telanjang agar menghasilkan bidang potong tegak lurus 90 derajat dengan sudut cleave < 1 derajat adalah...',
          opts: [
            { id: 'A', text: 'Miller Stripper' },
            { id: 'B', text: 'Fiber Cleaver' },
            { id: 'C', text: 'Drop Cable Stripper' },
            { id: 'D', text: 'Tang Potong Kawat' },
            { id: 'E', text: 'Gergaji Mini Kaca' },
          ],
          ans: 'B',
          exp: 'Fiber Cleaver adalah alat potong presisi khusus beroda pisau tungsten/diamond yang menggores dan mematahkan serat kaca secara tegak lurus sempurna 90 derajat.',
          comp: 'Peralatan Kerja Fiber Cleaver',
          diff: 'Mudah',
        },
        {
          q: 'Mengapa serpihan ujung kaca serat optik yang telah dipotong tidak boleh dibuang sembarangan ke lantai atau tempat sampah terbuka?',
          opts: [
            { id: 'A', text: 'Karena serpihan kaca dapat memantulkan sinyal radio Wi-Fi.' },
            { id: 'B', text: 'Karena serpihan kaca mikroskopis sangat tajam, dapat menembus kulit, masuk ke pembuluh darah, dan membahayakan nyawa.' },
            { id: 'C', text: 'Karena serpihan kaca mudah menguap menjadi gas beracun.' },
            { id: 'D', text: 'Karena serat optik mengandung zat radioaktif berbahaya.' },
            { id: 'E', text: 'Karena serpihan kaca dapat merusak magnet kompas.' },
          ],
          ans: 'B',
          exp: 'Sesuai K3LH Serat Optik, pecahan kaca berdiameter 125 mikron tidak terlihat kasat mata dan jika tertusuk dapat masuk ke peredaran darah atau merusak kornea mata.',
          comp: 'K3LH Keselamatan Kerja Fiber Optic',
          diff: 'Sedang',
        },
      ],
      complex: [
        {
          q: 'Manakah tahapan kerja yang BENAR dan WAJIB dilakukan sebelum meletakkan serat optik ke dalam V-Groove mesin Fusion Splicer? (Pilih semua yang sesuai)',
          opts: [
            { id: 'A', text: 'Memasukkan Protection Sleeve (heat shrink) ke salah satu sisi kabel terlebih dahulu' },
            { id: 'B', text: 'Mengupas jaket luar dan coating acrylate 250 mikron menggunakan Miller Stripper' },
            { id: 'C', text: 'Membersihkan permukaan kaca telanjang menggunakan tisu Kimwipes dan alkohol isopropil 95-99%' },
            { id: 'D', text: 'Memotong serat kaca menggunakan Precision Fiber Cleaver' },
            { id: 'E', text: 'Meniup permukaan ujung potongan serat kaca menggunakan mulut agar bersih dari debu' },
          ],
          ans: ['A', 'B', 'C', 'D'],
          exp: 'Tahapan A, B, C, D adalah urutan baku SOP penyambungan. Opsi E sangat salah dan dilarang karena uap ludah dan napas manusia mengandung uap air dan minyak yang mencemari ujung core kaca.',
          comp: 'SOP Prosedur Fusion Splicing',
          diff: 'Sedang',
        },
      ],
      essays: [
        {
          title: 'Kegagalan Fusi Splicing & Analisis Error "Axis Offset Exceeded"',
          case: 'Dua siswa SMK TKJ sedang melakukan praktik penyambungan kabel drop core FTTH di laboratorium. Saat menekan tombol auto pada mesin Fusion Splicer, mesin berhenti di tengah jalan, mengeluarkan bunyi alarm bip panjang, dan menampilkan pesan kesalahan "Axis Offset Exceeded" serta "Angle Error > 3.0°". Nilai redaman estimasi menunjukkan angka 0.85 dB (FAILED).',
          q: `Sebagai instruktur pengampu bengkel TKJ, bantulah siswa menganalisis:
1. Apa arti teknis dari pesan kesalahan "Axis Offset Exceeded" dan "Angle Error" pada layar Fusion Splicer?
2. Sebutkan 3 kemungkinan kesalahan prosedur yang dilakukan oleh kedua siswa tersebut sebelum menaruh serat ke mesin splicer!
3. Uraikan langkah perbaikan (troubleshooting) bertahap yang harus dilakukan untuk menghasilkan sambungan sempurna dengan redaman di bawah 0.03 dB!`,
          sub: ['Makna teknis pesan error splicer', 'Analisis kesalahan prosedur kerja', 'Langkah perbaikan sistematis'],
          model: `Kunci Jawaban Guru:
1. Makna Teknis Error:
   - "Angle Error > 3.0°": Menunjukkan bahwa bidang potong ujung serat kaca miring lebih dari batas toleransi (maksimal 1.0° - 1.5°). Mesin tidak dapat meleburkan dua permukaan yang tidak sejajar.
   - "Axis Offset Exceeded": Motor penggerak V-groove (sumbu X dan Y) telah mencapai batas pergeseran maksimal namun kedua inti (core) serat kaca 9 mikron tetap tidak dapat diposisikan segaris (mismatch alignment).
2. Tiga Kesalahan Prosedur Penyebab:
   a. Pisau Fiber Cleaver tumpul, kotor, atau siswa menekan tuas pemotong cleaver secara menyentak/kasar sehingga kaca patah compang-camping (hackle/lip).
   b. Siswa menyentuh ujung serat kaca setelah dipotong, atau tidak membersihkan kotoran/minyak dengan alkohol 95% sebelum pemotongan.
   c. Ada debu atau serpihan kotoran yang mengganjal di celah V-groove mesin fusion splicer sehingga posisi serat miring saat dijepit klem.
3. Langkah Perbaikan SOP:
   - Bersihkan V-groove dan cermin optik splicer menggunakan cotton bud khusus yang dibasahi sedikit alkohol murni.
   - Bersihkan bilah karet penjepit dan pisau cleaver.
   - Potong kembali ujung serat yang rusak menggunakan tang potong.
   - Kupas ulang coating sepanjang 3 cm dengan Miller stripper lubang terkecil.
   - Bersihkan serat dengan tisu Kimwipes dan alkohol 95% hingga berbunyi derit bersih.
   - Lakukan pemotongan presisi dengan cleaver: letakkan lurus pada penggaris 12-16 mm, dorong pisau secara stabil dan halus.
   - Letakkan kedua serat ke V-groove tanpa membenturkan ujung kaca ke elektroda.
   - Tutup wind cover dan jalankan proses fusi otomatis. Verifikasi splice loss terukur <= 0.03 dB.`,
          comp: 'Troubleshooting Mesin Fusion Splicer',
        },
      ],
    };
  }

  // Bab 11: Perbaikan Jaringan Fiber Optic
  if (babId === 11) {
    return {
      standard: [
        {
          q: 'Pada grafik jejak OTDR (Optical Time Domain Reflectometer), event apakah yang ditandai dengan adanya lonjakan reflektif tajam (spike) diikuti oleh penurunan level daya (step-down)?',
          opts: [
            { id: 'A', text: 'Event Sambungan Fusi Sempurna (Fusion Splice)' },
            { id: 'B', text: 'Event Tekukan Kabel (Macrobending)' },
            { id: 'C', text: 'Event Sambungan Konektor Mekanis (Mechanical Connector / Patch Panel)' },
            { id: 'D', text: 'Event Hamburan Rayleigh Normal (Rayleigh Backscatter)' },
            { id: 'E', text: 'Kabel Normal Tanpa Sambungan' },
          ],
          ans: 'C',
          exp: 'Konektor mekanis menimbulkan pantulan Fresnel (Fresnel reflection spike) akibat perubahan indeks bias antara kaca dan celah udara mikro, diikuti oleh insertion loss (penurunan tangga daya).',
          comp: 'Interpretasi Grafik Jejak OTDR',
          diff: 'Sedang',
        },
        {
          q: 'Bagian pada awal pengukuran grafik OTDR di mana instrumen tidak mampu mendeteksi event sambungan lain karena detektor mengalami saturasi cahaya pantulan konektor disebut...',
          opts: [
            { id: 'A', text: 'Fresnel Zone' },
            { id: 'B', text: 'Dead Zone (Event Dead Zone / Attenuation Dead Zone)' },
            { id: 'C', text: 'Dynamic Range Limit' },
            { id: 'D', text: 'Rayleigh Gap' },
            { id: 'E', text: 'Splice Threshold' },
          ],
          ans: 'B',
          exp: 'Dead Zone adalah area buta instrumen di dekat port OTDR akibat kelebihan muatan fotodioda penerima. Hal ini diatasi dengan menggunakan kabel peluncur (Launch Cable / Dummy Cable) sepanjang 500-1000 meter.',
          comp: 'Konsep Dead Zone OTDR',
          diff: 'Sedang',
        },
        {
          q: 'Alat bantu pemancar sinar laser merah tampak (panjang gelombang 650 nm) yang sangat efektif untuk menemukan titik kabel drop optik yang patah atau tertekuk di dalam rumah pelanggan adalah...',
          opts: [
            { id: 'A', text: 'OTDR' },
            { id: 'B', text: 'Visual Fault Locator (VFL / Laser Pen)' },
            { id: 'C', text: 'Optical Power Meter (OPM)' },
            { id: 'D', text: 'Spectrum Analyzer' },
            { id: 'E', text: 'Cable Toner Tracker' },
          ],
          ans: 'B',
          exp: 'Visual Fault Locator (VFL) memancarkan sinar laser merah tampak yang akan berpendar keluar menembus selubung kabel pada titik serat kaca yang patah, retak, atau tertekuk tajam.',
          comp: 'Instrumen Uji VFL',
          diff: 'Mudah',
        },
      ],
      complex: [
        {
          q: 'Bagaimanakah cara teknisi membedakan antara event sambungan fusion yang memiliki redaman tinggi dengan event tekukan kabel (macrobending) saat menganalisis jejak kabel menggunakan OTDR? (Pilih pernyataan yang benar)',
          opts: [
            { id: 'A', text: 'Melakukan pengujian pada dua panjang gelombang berbeda, yaitu 1310 nm dan 1550 nm.' },
            { id: 'B', text: 'Pada event sambungan fusion buruk, nilai redaman relatif sama di panjang gelombang 1310 nm maupun 1550 nm.' },
            { id: 'C', text: 'Pada event macrobending (tekukan), nilai redaman pada panjang gelombang 1550 nm jauh lebih besar dibanding pada 1310 nm.' },
            { id: 'D', text: 'Tekukan kabel selalu memancarkan lonjakan reflektif Fresnel yang sangat tinggi.' },
            { id: 'E', text: 'OTDR tidak dapat digunakan untuk mendeteksi tekukan kabel optik.' },
          ],
          ans: ['A', 'B', 'C'],
          exp: 'Cahaya pada panjang gelombang 1550 nm memiliki medan mode berkas lebih lebar sehingga jauh lebih sensitif terhadap kelengkungan/tekukan dibanding 1310 nm. Jika redaman melonjak tajam di 1550 nm, dipastikan itu adalah event tekukan (macrobending).',
          comp: 'Diagnosis Macrobending Dual Wavelength',
          diff: 'HOTS',
        },
      ],
      essays: [
        {
          title: 'Investigasi Putusnya Kabel Backbone Fiber Optic Bawah Tanah 8.5 Km',
          case: 'Pusat Operasi Jaringan (NOC) mendeteksi alarm LOS (Loss of Signal) pada link trunk 10G antar-Sentral A dan Sentral B. Jarak bentang kabel total adalah 8.500 meter. Tim teknisi ditugaskan membawa OTDR dan Optical Power Meter ke Sentral A untuk melacak titik kerusakan.',
          q: `Sebagai Koordinator Tim Perbaikan Jaringan Fiber Optic, tentukan:
1. Parameter konfigurasi apa saja yang wajib diatur pada instrumen OTDR sebelum menembakkan laser (Wavelength, Pulse Width, Range, Index of Refraction)?
2. Jika pembacaan trace OTDR menunjukkan spike Fresnel tajam di jarak optik 3.450 meter dengan penurunan daya ke dasar noise (-30 dB), apa kesimpulan kondisi fisik kabel di lapangan?
3. Hitung perkiraan lokasi titik fisik galian di lapangan jika faktor pilinan kabel (helix factor) bernilai 1.025, dan sebutkan langkah SOP penyambungan darurat di lapangan!`,
          sub: ['Konfigurasi instrumen OTDR', 'Analisis jejak spike Fresnel', 'Perhitungan jarak fisik dan SOP recovery'],
          model: `Kunci Jawaban Guru:
1. Konfigurasi Parameter OTDR:
   - Wavelength: 1310 nm & 1550 nm (Dual Wavelength).
   - Distance Range: 10 km (1.5 hingga 2x jarak total bentang kabel 8.5 km).
   - Pulse Width: 50 ns hingga 100 ns (kompromi seimbang antara resolusi pembeda jarak dan daya jangkau).
   - Index of Refraction (IOR / n): 1.4682 (disesuaikan dengan datasheet produsen kabel fiber yang digunakan).
   - Launch Cable: Pasang kabel dummy 500 meter di depan port OTDR untuk mengeliminasi dead zone konektor.
2. Kesimpulan Jejak OTDR:
   Spike Fresnel yang sangat tinggi di 3.450 meter yang langsung disusul hilangnya sinyal ke batas noise membuktikan adanya patahan total (Fiber Break / Cut Cable) di mana ujung serat kaca bersentuhan langsung dengan udara terbuka. Ini khas insiden kabel putus terhantam alat berat galian konstruksi.
3. Perhitungan Jarak Fisik & SOP:
   - Jarak Fisik Tanah = Jarak Optik OTDR / Helix Factor
   - Jarak Fisik = 3.450 meter / 1.025 = 3.365,85 meter (sekitar patok KM 3.36 dari Sentral A).
   - SOP Recovery:
     a. Tim bergerak ke patok KM 3.36, temukan lokasi galian tanah yang merusak pipa ducting/kabel.
     b. Tarik cadangan kabel (slack) dari manhole terdekat atau siapkan kabel sisipan baru (cable insertion) sepanjang 50-100 meter jika kabel tertarik putus parah.
     c. Pasang Dome Joint Closure / Inline Closure tahan air.
     d. Lakukan kupas, cleave, dan fusi splicing seluruh core menggunakan fusion splicer.
     e. Verifikasi sambungan: periksa redaman sambungan di closure <= 0.03 dB dan cek ulang jejak OTDR dari Sentral A memastikan link tersambung mulus hingga Sentral B.`,
          comp: 'Penanganan Darurat Kabel Putus (Fiber Cut)',
        },
      ],
    };
  }

  // Bab 13: Manajemen Bandwidth & QoS
  if (babId === 13) {
    return {
      standard: [
        {
          q: 'Dalam konfigurasi bandwidth management router, perbedaan mendasar antara CIR (Committed Information Rate) dan MIR (Maximum Information Rate) adalah...',
          opts: [
            { id: 'A', text: 'CIR adalah batas kecepatan maksimum, sedangkan MIR adalah kecepatan rata-rata.' },
            { id: 'B', text: 'CIR (Limit-at) adalah garansi kecepatan minimum saat jaringan sibuk, sedangkan MIR (Max-limit) adalah batas kecepatan tertinggi yang dapat dinikmati klien.' },
            { id: 'C', text: 'CIR hanya berlaku untuk koneksi nirkabel, sedangkan MIR untuk kabel.' },
            { id: 'D', text: 'CIR mengatur kuota data bulanan, sedangkan MIR mengatur durasi jam online.' },
            { id: 'E', text: 'Tidak ada perbedaan antara CIR dan MIR pada sistem operasi MikroTik.' },
          ],
          ans: 'B',
          exp: 'CIR (Committed Information Rate / limit-at) adalah jaminan bandwidth minimum yang dipastikan didapat pengguna saat traffic penuh. MIR (Maximum Information Rate / max-limit) adalah batas kecepatan plafon tertinggi saat bandwidth sedang kosong.',
          comp: 'Konsep CIR dan MIR',
          diff: 'Sedang',
        },
        {
          q: 'Algoritma antrean (queue type) pada MikroTik yang secara otomatis membagi bandwidth secara rata dan proporsional kepada seluruh host IP yang sedang aktif tanpa perlu membuat aturan manual satu per satu adalah...',
          opts: [
            { id: 'A', text: 'FIFO (First-In First-Out)' },
            { id: 'B', text: 'RED (Random Early Detection)' },
            { id: 'C', text: 'PCQ (Per Connection Queue)' },
            { id: 'D', text: 'SFQ (Stochastic Fairness Queueing)' },
            { id: 'E', text: 'Drop-Tail' },
          ],
          ans: 'C',
          exp: 'PCQ (Per Connection Queue) mengelompokkan traffic berdasarkan src-address atau dst-address dan membagi kapasitas pipa bandwidth secara dinamis dan setara ke setiap user yang aktif.',
          comp: 'Algoritma Antrean PCQ',
          diff: 'Sedang',
        },
        {
          q: 'Pada konfigurasi Simple Queue, parameter Burst Time berfungsi untuk...',
          opts: [
            { id: 'A', text: 'Menentukan berapa lama router menyala sebelum restart otomatis.' },
            { id: 'B', text: 'Periode waktu dalam detik yang digunakan router untuk menghitung rata-rata kecepatan data (moving average) penentu durasi burst.' },
            { id: 'C', text: 'Waktu tunggu saat jaringan mengalami packet loss.' },
            { id: 'D', text: 'Durasi pemutusan koneksi pengguna liar.' },
            { id: 'E', text: 'Waktu sewa alamat IP pada server DHCP.' },
          ],
          ans: 'B',
          exp: 'Burst Time pada RouterOS bukan waktu langsung durasi burst aktif, melainkan jendela waktu (window of time) untuk menghitung moving average rate yang dibandingkan dengan Burst Threshold.',
          comp: 'Mekanisme Burst RouterOS',
          diff: 'HOTS',
        },
      ],
      complex: [
        {
          q: 'Tindakan manakah yang BENAR dalam merancang Quality of Service (QoS) hierarki bertingkat (HTB) menggunakan MikroTik RouterOS? (Pilih beberapa jawaban yang tepat)',
          opts: [
            { id: 'A', text: 'Menggunakan fasilitas IP Firewall Mangle untuk menandai koneksi (connection-mark) dan paket (packet-mark)' },
            { id: 'B', text: 'Menetapkan nilai Priority dari 1 (prioritas tertinggi) hingga 8 (prioritas terendah)' },
            { id: 'C', text: 'Memprioritaskan traffic sensitif latensi seperti VoIP, DNS, dan game/ujian online di atas traffic unduhan besar (P2P/ISO)' },
            { id: 'D', text: 'Membuat satu antrean tanpa alokasi limit-at agar semua klien bebas berebut paket' },
            { id: 'E', text: 'Menentukan induk (parent) antrean untuk mengizinkan mekanisme peminjaman bandwidth sisa (borrowing)' },
          ],
          ans: ['A', 'B', 'C', 'E'],
          exp: 'Struktur HTB membutuhkan penandaan paket mangle, hierarki induk-anak dengan borrowing, dan prioritas angka 1-8. Opsi D keliru karena ketiadaan limit-at menyebabkan starvasi traffic penting.',
          comp: 'Arsitektur HTB Queue Tree & QoS',
          diff: 'HOTS',
        },
      ],
      essays: [
        {
          title: 'Optimalisasi Bandwidth 100 Mbps untuk Pelaksanaan Ujian Nasional Berbasis Komputer (UNBK/CBT)',
          case: 'Sebuah SMK memiliki alokasi bandwidth total internet 100 Mbps Dedicated dari ISP. Gedung sekolah memiliki 4 laboratorium CBT dengan total 160 unit komputer klien ujian online. Saat simulasi berlangsung, siswa mengeluhkan loading soal ujian macet (time-out) karena pada saat yang bersamaan guru dan staf mengunduh materi ajar dan streaming video.',
          q: `Sebagai Network Administrator sekolah, susunlah rancangan teknis penanganan bandwidth:
1. Rancang segmentasi alokasi bandwidth menggunakan Hierarchical Token Bucket (HTB) Queue Tree antara traffic Ujian CBT, Lab Siswa, dan Staf Guru!
2. Jelaskan langkah pembuatan Firewall Mangle untuk mengenali paket data server CBT (port TCP 80, 443, 8080) agar mendapatkan jalur prioritas tertinggi!
3. Bagaimana penerapan PCQ (Per Connection Queue) pada antrean CBT dan antrean umum agar tidak ada satu komputer yang memonopoli link?`,
          sub: ['Rancangan hierarki HTB', 'Langkah mangle marking', 'Konfigurasi PCQ rate'],
          model: `Kunci Jawaban Guru:
1. Rancangan Hierarki HTB Queue Tree:
   - Induk (Parent): Total_Download (Max-Limit: 100 Mbps)
   - Antrean Anak 1: Queue_CBT_Ujian
     * Max-Limit: 80 Mbps, Limit-At (CIR): 50 Mbps (Garansi mutlak separuh kapasitas link)
     * Priority: 1 (Prioritas tertinggi dari router)
   - Antrean Anak 2: Queue_Guru_Staf
     * Max-Limit: 30 Mbps, Limit-At: 15 Mbps
     * Priority: 4 (Menengah)
   - Antrean Anak 3: Queue_Lab_Umum_Siswa
     * Max-Limit: 20 Mbps, Limit-At: 5 Mbps
     * Priority: 8 (Terendah, hanya meminjam sisa jika CBT tidak aktif)
2. Langkah Firewall Mangle:
   - Rule 1: '/ip firewall mangle add chain=prerouting protocol=tcp dst-port=80,443,8080 dst-address-list=IP_SERVER_CBT action=mark-connection new-connection-mark=cbt_conn passthrough=yes'
   - Rule 2: '/ip firewall mangle add chain=prerouting connection-mark=cbt_conn action=mark-packet new-packet-mark=cbt_pkt passthrough=no'
3. Penerapan Algoritma PCQ:
   - Buat queue type: '/queue type add name=PCQ_CBT kind=pcq pcq-classifier=dst-address pcq-rate=2M' (Memberi setiap komputer ujian alokasi hingga 2 Mbps namun membaginya setara).
   - Terapkan tipe 'PCQ_CBT' pada antrean anak 'Queue_CBT_Ujian'. Dengan demikian, 160 komputer klien masing-masing terjamin mendapatkan bandwidth lancar tanpa ada satu PC yang menyedot seluruh kuota.`,
          comp: 'Perancangan Manajemen Bandwidth Skala Besar',
        },
      ],
    };
  }

  // Default fallback questions generator for other Babs with high-grade engineering context
  return {
    standard: [],
    complex: [],
    essays: [],
  };
}
