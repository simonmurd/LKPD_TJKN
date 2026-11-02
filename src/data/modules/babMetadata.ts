import { PracticalSimulationTask } from '../../types/curriculum';

export interface BabMetaInfo {
  id: number;
  code: string;
  title: string;
  semester: 1 | 2 | 3 | 4;
  grade: 'Kelas XI' | 'Kelas XII';
  hoursAllocation: number;
  elemen: string;
  capaianPembelajaran: string;
  tujuanPembelajaran: string[];
  primarySimulationType: PracticalSimulationTask['type'];
  simulations: PracticalSimulationTask[];
}

export const BAB_METADATA_LIST: BabMetaInfo[] = [
  {
    id: 1,
    code: 'TJKN-01',
    title: 'Pengenalan Media Transmisi Jaringan',
    semester: 1,
    grade: 'Kelas XI',
    hoursAllocation: 18,
    elemen: 'Perencanaan dan Pengalamatan Jaringan',
    capaianPembelajaran: 'Peserta didik mampu memahami prinsip dasar transmisi data, mengidentifikasi kelebihan dan keterbatasan media tembaga (copper), nirkabel (wireless), dan serat optik (fiber optic) sesuai spesifikasi teknis industri.',
    tujuanPembelajaran: [
      'Mengklasifikasikan karakteristik fisik transmisi data kabel tembaga, nirkabel, dan serat optik.',
      'Menganalisis faktor redaman (attenuation), interferensi elektromagnetik (EMI), dan bandwidth limit pada media transmisi.',
      'Menghitung perkiraan throughput dan delay berdasarkan media yang dipilih.',
      'Menentukan pemilihan media transmisi yang paling cost-effective dan andal untuk skenario jaringan kampus/sekolah.'
    ],
    primarySimulationType: 'topology_vlan',
    simulations: [
      {
        id: 'sim_1_1',
        taskNumber: 1,
        title: 'Komparasi Redaman & Kecepatan Propagasi Media Transmisi',
        type: 'topology_vlan',
        objective: 'Membuktikan perbedaan latensi dan packet loss antara media Copper Cat6, Fiber Optic Single Mode, dan Wi-Fi 5 GHz.',
        toolsAndMaterials: ['Simulator Jaringan', 'Virtual Ping & Iperf Generator', 'Topologi Uji Bandwidth'],
        safetyGuidelines: ['Pastikan parameter daya transmisi tidak melebihi regulasi e.i.r.p', 'Hindari kabel tertekuk tajam'],
        stepByStepGuide: [
          'Hubungkan Host A ke Switch menggunakan kabel UTP Cat6 sepanjang 80 meter, ukur RTT.',
          'Ganti link dengan kabel Fiber Optic 1 Gbps sepanjang 80 meter, ukur RTT dan jitter.',
          'Uji link nirkabel 5 GHz dengan noise background -85 dBm, catat throughput efektif.',
          'Buat tabel perbandingan komparatif ketiga media transmisi.'
        ],
        expectedObservation: 'Fiber optic memiliki latensi terendah dan jitter terkecil, sedangkan wireless mengalami fluktuasi saat interferensi meningkat.',
        criticalAnalysisQuestion: 'Mengapa kabel UTP memiliki batas transmisi teoritis 100 meter, sedangkan Single Mode Fiber dapat mencapai puluhan kilometer tanpa repeater?'
      },
      {
        id: 'sim_1_2',
        taskNumber: 2,
        title: 'Simulasi Efek Interferensi Elektromagnetik (EMI) pada UTP vs STP',
        type: 'lan_tester',
        objective: 'Menganalisis dampak induksi medan magnet motor listrik dan kabel tegangan tinggi terhadap sinyal data kabel UTP dan STP.',
        toolsAndMaterials: ['Simulator Kabel Bertingkat', 'Noise Injection Generator', 'Packet Error Rate Counter'],
        safetyGuidelines: ['Perhatikan grounding kabel STP pada patch panel berpelindung logam.'],
        stepByStepGuide: [
          'Koneksikan kabel UTP di dekat sumber induksi elektromagnetik 50 Hz simulasi.',
          'Catat kenaikan Frame Check Sequence (FCS) error pada interface Switch.',
          'Ganti menggunakan kabel STP (Shielded Twisted Pair) dengan drain wire terhubung ke ground.',
          'Analisis penurunan paket cacat (dropped frames).'
        ],
        expectedObservation: 'Kabel STP dengan grounding yang baik mampu meredam crosstalk dan noise eksternal mendekati 0% FCS error.',
        criticalAnalysisQuestion: 'Apa bahaya yang timbul jika kabel STP dipasang tanpa sistem grounding yang memadai di kedua ujungnya?'
      },
      {
        id: 'sim_1_3',
        taskNumber: 3,
        title: 'Kalkulasi Total Cost of Ownership (TCO) Instalasi Backbone Jaringan',
        type: 'topology_vlan',
        objective: 'Merancang anggaran biaya material dan instalasi media transmisi untuk menghubungkan 3 gedung berjarak 350 meter.',
        toolsAndMaterials: ['Modul Perencanaan BOQ (Bill of Quantity)', 'Katalog Harga Komponen Jaringan'],
        safetyGuidelines: ['Gunakan standar K3LH konstruksi kabel outdoor.'],
        stepByStepGuide: [
          'Bandingkan biaya penarikan Fiber Optic Underground vs Wireless Point-to-Point 60 GHz.',
          'Hitung biaya transceiver SFP, FO closure, dan switch port.',
          'Estimasi biaya pemeliharaan 5 tahun ke depan.',
          'Presentasikan rekomendasi media terbaik sesuai budget sekolah.'
        ],
        expectedObservation: 'Wireless PTP lebih murah pada biaya awal instalasi, namun Fiber Optic menawarkan reliability 99.99% dan upgrade bandwidth bebas lisensi.',
        criticalAnalysisQuestion: 'Pada kondisi geografis seperti apa solusi Wireless PTP lebih direkomendasikan dibandingkan penarikan kabel serat optik darat?'
      },
      {
        id: 'sim_1_4',
        taskNumber: 4,
        title: 'Analisis Spektrum Frekuensi & Propagasi Nirkabel',
        type: 'wireless_spectrum',
        objective: 'Mengamati pelemahan gelombang elektromagnetik terhadap berbagai material penghalang (dinding bata, kaca, beton).',
        toolsAndMaterials: ['Simulator Spektrum Nirkabel', 'Virtual Attenuation Barrier Tool'],
        safetyGuidelines: ['Kepatuhan pada batasan frekuensi ISM band non-komersial.'],
        stepByStepGuide: [
          'Letakkan pemancar AP pada frekuensi 2.4 GHz dan 5 GHz.',
          'Sisipkan material partisi beton bertulang setebal 15 cm di antara AP dan Client.',
          'Ukur penurunan nilai RSSI (Received Signal Strength Indicator) pada kedua frekuensi.',
          'Catat perbedaan daya tembus frekuensi rendah vs frekuensi tinggi.'
        ],
        expectedObservation: 'Frekuensi 2.4 GHz memiliki daya tembus material lebih baik dibanding 5 GHz karena panjang gelombangnya yang lebih besar, namun kapasitas throughput 5 GHz jauh lebih tinggi.',
        criticalAnalysisQuestion: 'Mengapa frekuensi 5 GHz mengalami pelemahan (free space loss & obstacle absorption) yang lebih signifikan dibandingkan 2.4 GHz?'
      }
    ]
  },
  {
    id: 2,
    code: 'TJKN-02',
    title: 'Standar Pengkabelan UTP/STP & Pembuatan Kabel',
    semester: 1,
    grade: 'Kelas XI',
    hoursAllocation: 18,
    elemen: 'Pemasangan dan Konfigurasi Perangkat Jaringan',
    capaianPembelajaran: 'Peserta didik mampu menerapkan standar pengkabelan terstruktur ANSI/TIA-568, memilih jenis kabel twisted-pair yang sesuai, mengupas jaket pelindung, mengurutkan 8 warna pinout secara presisi, dan melakukan terminasi crimping konektor RJ-45 sesuai SOP bengkel jaringan.',
    tujuanPembelajaran: [
      'Menghafal dan membedakan urutan 8 warna kabel standar T568A dan T568B secara teliti.',
      'Membedakan peruntukan kabel Straight-Through, Crossover, dan Rollover pada perangkat DTE dan DCE.',
      'Mengoperasikan alat kerja Tang Crimping, Cable Stripper, dan pemotong kabel dengan menerapkan K3.',
      'Melakukan terminasi konektor RJ-45 secara rapi dengan selubung kabel masuk ke dalam pengunci konektor.'
    ],
    primarySimulationType: 'crimping',
    simulations: [
      {
        id: 'sim_2_1',
        taskNumber: 1,
        title: 'Virtual Crimping Kabel UTP Standar T568B (Straight-Through)',
        type: 'crimping',
        objective: 'Menyusun urutan 8 pin kabel UTP standar TIA/EIA 568B untuk membuat kabel Straight-Through penghubung PC ke Switch.',
        toolsAndMaterials: ['Virtual Cable Crimper Tool', 'Konektor RJ-45 Virtual', 'Kabel UTP Cat6 8 Inti'],
        safetyGuidelines: ['Perhatikan posisi pisau crimping agar tidak melukai jari tangan.'],
        stepByStepGuide: [
          'Kupas jaket luar kabel sepanjang 2-3 cm menggunakan stripper.',
          'Uraikan 4 pasang lilitan (twisted pairs) hingga lurus.',
          'Urutkan warna pin 1 s.d. 8: Putih-Orange, Orange, Putih-Hijau, Biru, Putih-Biru, Hijau, Putih-Coklat, Coklat.',
          'Ratakan ujung kabel dengan pemotong crimper, masukkan ke lubang pin RJ-45 hingga mentok.',
          'Lakukan penekanan tuas crimping sampai terdengar bunyi klik pengunci.'
        ],
        expectedObservation: 'Semua 8 kawat tembaga menyentuh pelat tembaga ujung konektor dan jaket luar terkunci di bawah baji penahan.',
        criticalAnalysisQuestion: 'Mengapa urutan pin 3 dan 5 pada T568B dipisah oleh kawat warna biru dan putih-biru, bukan berpasangan langsung dengan warna pasangannya?'
      },
      {
        id: 'sim_2_2',
        taskNumber: 2,
        title: 'Pembuatan Kabel Crossover Standar T568A ke T568B',
        type: 'crimping',
        objective: 'Membuat kabel Crossover untuk menghubungkan dua perangkat sejenis (Switch ke Switch, atau PC ke PC lama) tanpa fitur Auto-MDIX.',
        toolsAndMaterials: ['Virtual Crimping Station', 'Modul Crossover Pinout Guide'],
        safetyGuidelines: ['Pastikan pin 1 dan 2 pada ujung A bersilangan ke pin 3 dan 6 pada ujung B.'],
        stepByStepGuide: [
          'Terminasi ujung 1 dengan standar T568A: Putih-Hijau, Hijau, Putih-Orange, Biru, Putih-Biru, Orange, Putih-Coklat, Coklat.',
          'Terminasi ujung 2 dengan standar T568B: Putih-Orange, Orange, Putih-Hijau, Biru, Putih-Biru, Hijau, Putih-Coklat, Coklat.',
          'Verifikasi silangan pasangan pin Tx (Transmit) ke Rx (Receive).',
          'Lakukan uji virtual transfer data antar 2 PC.'
        ],
        expectedObservation: 'Link status indikator NIC kedua PC menyala hijau solid tanpa membutuhkan switch perantara.',
        criticalAnalysisQuestion: 'Bagaimana mekanisme sirkuit Auto-MDIX modern pada switch Ethernet mendeteksi dan mengoreksi pembalikan polaritas kabel secara otomatis?'
      },
      {
        id: 'sim_2_3',
        taskNumber: 3,
        title: 'Terminasi Modular Jack RJ-45 Keystone & Patch Panel',
        type: 'crimping',
        objective: 'Memasang kabel UTP pada modular jack RJ-45 dinding dan port patch panel 24-port menggunakan Impact Punch Down Tool.',
        toolsAndMaterials: ['Virtual Punch Down Tool', 'Keystone Jack Cat6', 'Wire Map Diagram T568B'],
        safetyGuidelines: ['Arahkan mata pisau punch down ke sisi luar keystone untuk memotong sisa kawat secara otomatis.'],
        stepByStepGuide: [
          'Kupas selubung kabel sepanjang 4 cm, pisahkan spine/cross separator plastik kabel Cat6.',
          'Letakkan masing-masing kawat pada celah IDC (Insulation Displacement Contact) sesuai kode warna.',
          'Tekan punch down tool dengan mantap hingga kabel terhimpit dan sisa kawat terpotong rata.',
          'Pasang penutup pelindung debu keystone jack.'
        ],
        expectedObservation: 'Kontak isolasi kawat teriris sempurna oleh pin pisau tembaga tanpa merusak inti tembaga di dalamnya.',
        criticalAnalysisQuestion: 'Mengapa menjaga kerapatan lilitan (twist ratio) sedekat mungkin ke titik terminasi IDC sangat penting untuk transmisi Gigabit Ethernet 1000BASE-T?'
      },
      {
        id: 'sim_2_4',
        taskNumber: 4,
        title: 'Pembuatan Kabel Konsol Rollover (RJ-45 ke DB-9/USB Serial)',
        type: 'crimping',
        objective: 'Membuat kabel konfigurasi konsol perangkat router/switch Cisco dengan urutan pin terbalik (Rollover).',
        toolsAndMaterials: ['Virtual Rollover Pinout Simulator', 'RJ45 to RS232 Serial Adapter Guide'],
        safetyGuidelines: ['Kabel rollover hanya digunakan untuk port Console/Aux, jangan colok ke port FastEthernet.'],
        stepByStepGuide: [
          'Susun ujung A dengan pin 1 s.d. 8 standar.',
          'Susun ujung B dengan urutan terbalik tepat 180 derajat (Pin 1 ke 8, 2 ke 7, 3 ke 6, 4 ke 5, 5 ke 4, 6 ke 3, 7 ke 2, 8 ke 1).',
          'Crimping kedua ujung konektor RJ-45.',
          'Uji koneksi serial virtual terminal PuTTY ke router Cisco.'
        ],
        expectedObservation: 'Prompt CLI router `Router>` muncul di jendela terminal emulator serial dengan baud rate 9600 bps.',
        criticalAnalysisQuestion: 'Mengapa kabel rollover tidak dapat digunakan untuk transmisi frame Ethernet IEEE 802.3 normal?'
      }
    ]
  },
  {
    id: 3,
    code: 'TJKN-03',
    title: 'Pengujian Kabel Jaringan',
    semester: 1,
    grade: 'Kelas XI',
    hoursAllocation: 18,
    elemen: 'Pemasangan dan Konfigurasi Perangkat Jaringan',
    capaianPembelajaran: 'Peserta didik mampu melakukan pengujian integritas kabel jaringan menggunakan Digital Cable Tester dan Cable Analyzer, mendiagnosis kegagalan wiremap (open circuit, short circuit, miswire, reversed pair, split pair), serta melakukan tindakan perbaikan.',
    tujuanPembelajaran: [
      'Mengoperasikan alat uji kabel LAN Tester (Master Unit dan Remote Unit) secara prosedural.',
      'Membaca dan menafsirkan pola nyala LED 1-8 pada Master dan Remote tester.',
      'Mengidentifikasi jenis kerusakan fisik kabel: putus (open), korsleting (short), tertukar (miswired), dan split pair.',
      'Menghitung redaman sinyal dan Insertion Loss menggunakan instrumen sertifikasi kabel jaringan.'
    ],
    primarySimulationType: 'lan_tester',
    simulations: [
      {
        id: 'sim_3_1',
        taskNumber: 1,
        title: 'Simulasi Pengujian Kabel Straight-Through Berfungsi Normal',
        type: 'lan_tester',
        objective: 'Memverifikasi sinkronisasi nyala LED pin 1 sampai 8 dan Ground pada LAN Tester untuk kabel Straight normal.',
        toolsAndMaterials: ['Simulator LAN Tester Digital', 'Virtual Cable Test Rig'],
        safetyGuidelines: ['Jangan menguji kabel yang masih terhubung ke port switch bertenaga PoE aktif!'],
        stepByStepGuide: [
          'Tancapkan Ujung A kabel ke port TX Master LAN Tester.',
          'Tancapkan Ujung B kabel ke port RX Remote LAN Tester.',
          'Nyalakan tester pada mode otomatis kecepatan normal.',
          'Amati sekuens nyala LED pin 1 hingga 8 secara berurutan pada kedua unit.'
        ],
        expectedObservation: 'Lampu LED pada Master dan Remote menyala sinkron dari 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 secara berirama.',
        criticalAnalysisQuestion: 'Jika pin nomor 4 dan 5 mati pada kabel Cat5e 100BASE-TX, mengapa koneksi internet PC ke Switch masih bisa tersambung pada kecepatan 100 Mbps?'
      },
      {
        id: 'sim_3_2',
        taskNumber: 2,
        title: 'Diagnosis Gangguan Kabel Putus (Open Circuit) pada Pin 3 & 6',
        type: 'lan_tester',
        objective: 'Mendeteksi letak pin putus yang menyebabkan kegagalan negosiasi kecepatan link Ethernet.',
        toolsAndMaterials: ['Fault Simulator', 'LAN Tester Virtual', 'Tang Crimping Pengganti'],
        safetyGuidelines: ['Potong konektor yang rusak dan lakukan rekrimping ulang.'],
        stepByStepGuide: [
          'Jalankan pengujian pada kabel dengan gangguan open circuit.',
          'Perhatikan LED Master menyala 1-2-3-4-5-6-7-8, namun pada Remote LED 3 dan 6 tidak menyala.',
          'Catat bahwa jalur Transmit/Receive pasangan hijau mengalami diskoneksi.',
          'Potong konektor RJ-45 bermasalah dan pasang konektor baru.'
        ],
        expectedObservation: 'Remote tester melompati LED 3 dan 6 membuktikan sirkuit kawat tembaga terbuka atau tidak terkrimping sempurna.',
        criticalAnalysisQuestion: 'Mengapa kabel dengan pin 3 dan 6 putus akan menyebabkan status antarmuka Windows berbunyi "Network Cable Unplugged"?'
      },
      {
        id: 'sim_3_3',
        taskNumber: 3,
        title: 'Deteksi Korsleting (Short Circuit) antar Pin Bersebelahan',
        type: 'lan_tester',
        objective: 'Menganalisis kondisi hubungan pendek yang terjadi akibat serabut kawat bersentuhan di dalam konektor.',
        toolsAndMaterials: ['Short Circuit Simulator', 'Digital Multimeter / Wiremap Tester'],
        safetyGuidelines: ['Korsleting pada kabel jaringan PoE dapat merusak power supply switch.'],
        stepByStepGuide: [
          'Pasang kabel uji yang memiliki cacat isolasi tembaga pin 1 dan 2.',
          'Amati nyala LED Master 1 dan 2 yang menyala redup bersamaan atau berkedip abnormal pada Remote.',
          'Konfirmasi hambatan menggunakan ohm meter digital (< 1 Ohm berarti korslet).',
          'Analisis penyebab kesalahan pemotongan dan penataan kawat.'
        ],
        expectedObservation: 'Dua LED pada unit Remote menyala bersamaan dalam satu ketukan waktu mengindikasikan short circuit.',
        criticalAnalysisQuestion: 'Mengapa tegangan 48V PoE pada kabel yang mengalami short circuit pin 1-2 atau 4-5 dapat memicu sistem proteksi over-current trip pada switch?'
      },
      {
        id: 'sim_3_4',
        taskNumber: 4,
        title: 'Identifikasi Kesalahan Terbalik (Crossed / Reversed Pair) dan Split Pair',
        type: 'lan_tester',
        objective: 'Membedakan kesalahan urutan kawat sederhana dengan gangguan split pair yang menghasilkan Near-End Crosstalk (NEXT) tinggi.',
        toolsAndMaterials: ['Advanced Cable Certifier Simulator', 'Fluke Wiremap Analyzer'],
        safetyGuidelines: ['Pastikan tester telah terkalibrasi NVP (Nominal Velocity of Propagation).'],
        stepByStepGuide: [
          'Uji kabel yang dipasang dengan warna urutan pin 1-2 tertukar dengan 3-6.',
          'Catat lompatan nomor urut LED pada unit Remote tester.',
          'Uji kabel Split Pair (kawat dari pasangan berbeda dipakai sebagai sirkuit kirim-terima).',
          'Bandingkan pembacaan tester sederhana (bisa lolos LED) dengan sertifier Fluke (gagal uji NEXT).'
        ],
        expectedObservation: 'LAN Tester standar mungkin menunjukkan LED 1-8 menyala jika kontinuitas ada, namun certifier mendeteksi crosstalk parah akibat kehilangan efek pembatalan medan magnet.',
        criticalAnalysisQuestion: 'Mengapa kesalahan Split Pair sangat sulit dideteksi oleh LAN Tester LED murah, namun menyebabkan packet loss parah saat dilewati traffic data 1 Gbps?'
      }
    ]
  },
  {
    id: 4,
    code: 'TJKN-04',
    title: 'Perangkat Keras Jaringan Kabel',
    semester: 1,
    grade: 'Kelas XI',
    hoursAllocation: 18,
    elemen: 'Pemasangan dan Konfigurasi Perangkat Jaringan',
    capaianPembelajaran: 'Peserta didik mampu memilih, merakit, dan mengonfigurasi perangkat keras jaringan kabel (Unmanaged vs Managed Switch, Layer 3 Switch, Router, Patch Panel, Rack Server 19 Inch, PDU) sesuai tata kelola Data Center dan standar TIA-942.',
    tujuanPembelajaran: [
      'Membedakan fungsi dan arsitektur Hub (Collision Domain tunggal) dengan Switch (Dedicated Collision Domain).',
      'Mengidentifikasi spesifikasi teknis Switch Layer 2, Layer 3 (Multilayer Switch), dan Router.',
      'Melakukan instalasi rackmount perangkat ke dalam Server Rack 19 inch dengan cage nut dan patch panel.',
      'Merancang manajemen kabel struktural horizontal dan vertikal pada rack server.'
    ],
    primarySimulationType: 'topology_vlan',
    simulations: [
      {
        id: 'sim_4_1',
        taskNumber: 1,
        title: 'Manajemen Rak Server 19-Inch & Perencanaan Satuan U (Rack Unit)',
        type: 'topology_vlan',
        objective: 'Menata penempatan Server 2U, Managed Switch 1U, Patch Panel 1U, Cable Organizer 1U, dan PDU dalam kabinet rak 42U.',
        toolsAndMaterials: ['Virtual Rack Cabinet Builder', 'Modul Thermal & Cable Distribution'],
        safetyGuidelines: ['Tempatkan perangkat terberat (UPS dan Server baterai) di bagian paling dasar rak demi stabilitas gravitasi.'],
        stepByStepGuide: [
          'Hitung total kebutuhan Rack Unit (RU) untuk 4 server, 2 switch, 2 patch panel, dan 1 UPS.',
          'Pasang UPS di U1-U4, server di U5-U12.',
          'Pasang Patch Panel dan Core Switch di bagian tengah (U20-U24) untuk meminimalkan panjang patch cord.',
          'Pasang Horizontal Cable Management di antara setiap switch dan patch panel.'
        ],
        expectedObservation: 'Susunan rak seimbang secara termal (airflow depan-belakang) dan kabel patch cord terorganisasi rapi tanpa menutupi ventilasi kipas.',
        criticalAnalysisQuestion: 'Mengapa prinsip penataan lorong panas dan lorong dingin (Hot Aisle / Cold Aisle) mutlak diterapkan pada data center ruang server skala menengah ke atas?'
      },
      {
        id: 'sim_4_2',
        taskNumber: 2,
        title: 'Simulasi Perbedaan Forwarding Frame: Hub vs Switch',
        type: 'topology_vlan',
        objective: 'Membuktikan terjadinya tabrakan paket (collision) pada Hub saat transmisi simultan, dibandingkan micro-segmentation pada Switch.',
        toolsAndMaterials: ['Virtual Network Traffic Simulator', 'Collision Packet Detector'],
        safetyGuidelines: ['Hindari broadcast storm dengan menyalakan Storm Control pada switch.'],
        stepByStepGuide: [
          'Buat topologi 4 PC terhubung ke 1 unit Hub 10 Mbps Half-Duplex.',
          'Kirim traffic paket dari PC1 ke PC2 bersamaan dengan PC3 ke PC4.',
          'Amati sinyal jam / collision dan waktu backoff CSMA/CD.',
          'Ganti Hub dengan Switch Layer 2 Full-Duplex 1 Gbps dan ulangi pengujian yang sama.'
        ],
        expectedObservation: 'Pada switch tidak terjadi tabrakan paket karena setiap port merupakan collision domain mandiri dengan MAC address table forwarding.',
        criticalAnalysisQuestion: 'Bagaimana mekanisme Store-and-Forward pada switch memeriksa keabsahan frame Ethernet sebelum diteruskan ke port tujuan?'
      },
      {
        id: 'sim_4_3',
        taskNumber: 3,
        title: 'Konfigurasi Port Security pada Managed Switch Layer 2',
        type: 'topology_vlan',
        objective: 'Mengamankan port switch dari penyusupan perangkat liar dengan mengunci MAC address resmi (Sticky MAC).',
        toolsAndMaterials: ['Switch CLI Emulator', 'Virtual Workstation Client'],
        safetyGuidelines: ['Pastikan port manajemen tidak terkunci oleh rule port-security.'],
        stepByStepGuide: [
          'Akses switch via konsol, masuk ke interface FastEthernet 0/1.',
          'Jalankan perintah `switchport mode access` dan `switchport port-security`.',
          'Atur `switchport port-security maximum 1` dan `mac-address sticky`.',
          'Atur violation mode ke `shutdown`.',
          'Simulasikan penukaran kabel ke laptop asing dan amati perubahan status port menjadi error-disabled.'
        ],
        expectedObservation: 'Port switch otomatis mati seketika (ERR-DISABLE) saat mendeteksi MAC address baru yang tidak terdaftar.',
        criticalAnalysisQuestion: 'Apa perbedaan mendasar antara violation mode `protect`, `restrict`, dan `shutdown` pada port security switch Cisco?'
      },
      {
        id: 'sim_4_4',
        taskNumber: 4,
        title: 'Interkoneksi Fiber SFP Uplink antara Distribution Switch ke Core Switch',
        type: 'topology_vlan',
        objective: 'Mengonfigurasi transceiver optical 10G SFP+ dan Port Channel (Link Aggregation LACP) untuk meningkatkan bandwidth backbone.',
        toolsAndMaterials: ['Switch Interconnect Simulator', 'Transceiver SFP+ Module Manager'],
        safetyGuidelines: ['Jangan mengarahkan mata langsung ke lubang optik SFP yang sedang aktif memancarkan sinar laser.'],
        stepByStepGuide: [
          'Pasang modul SFP+ 10G-SR pada port TenGigabitEthernet 1/1 dan 1/2.',
          'Konfigurasikan LACP (Link Aggregation Control Protocol) channel-group 1 mode active.',
          'Ubah antarmuka Port-Channel 1 menjadi mode Trunk 802.1Q.',
          'Uji failover dengan mencabut satu kabel optik saat transfer data berlangsung.'
        ],
        expectedObservation: 'Troughput meningkat menjadi 20 Gbps agregat dan koneksi tidak terputus (seamless redundancy) saat satu link mati.',
        criticalAnalysisQuestion: 'Mengapa penggunaan LACP IEEE 802.3ad lebih direkomendasikan daripada static aggregation etherchannel tanpa protokol negosiasi?'
      }
    ]
  },
  {
    id: 5,
    code: 'TJKN-05',
    title: 'Dasar Gelombang Radio & Jaringan Nirkabel',
    semester: 1,
    grade: 'Kelas XI',
    hoursAllocation: 18,
    elemen: 'Jaringan Nirkabel',
    capaianPembelajaran: 'Peserta didik memahami fisika dasar gelombang radio frekuensi ISM (2.4 GHz, 5 GHz, 6 GHz), standar protokol IEEE 802.11a/b/g/n/ac/ax/be, konsep modulasi QAM, bandwidth saluran (20/40/80/160 MHz), serta fenomena degradasi sinyal seperti multipath fading, shadow fading, dan interferensi.',
    tujuanPembelajaran: [
      'Menghitung panjang gelombang (lambda = c/f) pada frekuensi 2.4 GHz dan 5.8 GHz.',
      'Menganalisis perbedaan kapasitas saluran dan jarak jangkauan antara standar 802.11n (Wi-Fi 4), 802.11ac (Wi-Fi 5), dan 802.11ax (Wi-Fi 6).',
      'Mengidentifikasi pembagian kanal frekuensi non-overlapping (Kanal 1, 6, 11) pada spektrum 2.4 GHz.',
      'Menganalisis pengaruh modulasi BPSK, QPSK, 64-QAM, 256-QAM, hingga 1024-QAM terhadap SNR (Signal-to-Noise Ratio).'
    ],
    primarySimulationType: 'wireless_spectrum',
    simulations: [
      {
        id: 'sim_5_1',
        taskNumber: 1,
        title: 'Visualisasi Spektrum Kanal 2.4 GHz dan Deteksi Overlapping Channel',
        type: 'wireless_spectrum',
        objective: 'Menganalisis interferensi ko-kanal (Co-Channel Interference) dan kanal bersebelahan (Adjacent Channel Interference).',
        toolsAndMaterials: ['Simulator Spektrum 2.4 GHz', 'Virtual Wi-Fi Scanner / Acrylic Wi-Fi'],
        safetyGuidelines: ['Gunakan frekuensi legal ISM band 2400 - 2483.5 MHz.'],
        stepByStepGuide: [
          'Aktifkan AP 1 pada Kanal 1 (lebar pita 20 MHz).',
          'Aktifkan AP 2 pada Kanal 3 dan amati tumpang tindih spektrum daya.',
          'Ukur persentase frame retransmission dan penurunan throughput klien.',
          'Pindahkan AP 2 ke Kanal 6 dan AP 3 ke Kanal 11 untuk mendapatkan konfigurasi non-overlapping bersih.'
        ],
        expectedObservation: 'Penggunaan kanal berdampingan (seperti kanal 1 dan 3) menimbulkan ACI (Adjacent Channel Interference) yang merusak paket data, sedangkan kanal 1, 6, 11 beroperasi tanpa tabrakan spektral.',
        criticalAnalysisQuestion: 'Mengapa pemilihan lebar saluran 40 MHz pada pita 2.4 GHz sangat tidak disarankan di area padat pemukiman/sekolah?'
      },
      {
        id: 'sim_5_2',
        taskNumber: 2,
        title: 'Komparasi Throughput & Modulasi: 2.4 GHz vs 5 GHz vs 6 GHz (Wi-Fi 6E)',
        type: 'wireless_spectrum',
        objective: 'Membandingkan kecepatan transfer data aktual dan modulasi sinyal terhadap variasi jarak dan redaman partisi.',
        toolsAndMaterials: ['Modulation Analyzer Simulator', 'Virtual Iperf Speedometer'],
        safetyGuidelines: ['Perhatikan aturan regulasi daya pancar EIRP nasional.'],
        stepByStepGuide: [
          'Posisikan klien berjarak 5 meter direct LoS dari AP dual-band.',
          'Catat MCS (Modulation and Coding Scheme) index pada 2.4 GHz (64-QAM) vs 5 GHz (256-QAM/1024-QAM).',
          'Jauhkan klien hingga jarak 30 meter melewati 2 dinding bata.',
          'Amati penurunan indeks modulasi otomatis (Dynamic Rate Adaptation) untuk mempertahankan link.'
        ],
        expectedObservation: 'Pada jarak dekat 5 GHz menghasilkan throughput hingga 800+ Mbps, namun pada jarak jauh 2.4 GHz mempertahankan koneksi lebih stabil meski throughput turun.',
        criticalAnalysisQuestion: 'Bagaimana teknologi OFDMA dan MU-MIMO pada Wi-Fi 6 (802.11ax) mengatasi masalah kepadatan klien bersamaan (high density environment)?'
      },
      {
        id: 'sim_5_3',
        taskNumber: 3,
        title: 'Kalkulasi Panjang Gelombang & Dimensi Fisik Elemen Antena',
        type: 'wireless_spectrum',
        objective: 'Menghitung ukuran fisik dipole antena 1/2 lambda dan 1/4 lambda untuk frekuensi 2.45 GHz dan 5.8 GHz.',
        toolsAndMaterials: ['Antenna Formula Calculator', 'Virtual Waveform Simulator'],
        safetyGuidelines: ['Kalkulasi presisi penting untuk mencapai VSWR (Voltage Standing Wave Ratio) < 1.5.'],
        stepByStepGuide: [
          'Hitung lambda 2.45 GHz: c / f = 300.000.000 / 2.450.000.000 = 0.1224 meter (12.24 cm).',
          'Tentukan panjang elemen 1/4 lambda = 3.06 cm.',
          'Hitung lambda 5.8 GHz: 300.000.000 / 5.800.000.000 = 0.0517 meter (5.17 cm). Elemen 1/4 lambda = 1.29 cm.',
          'Simulasikan pola radiasi (radiation pattern) doughnut shape dari dipole vertikal.'
        ],
        expectedObservation: 'Semakin tinggi frekuensi, semakin pendek panjang gelombangnya, sehingga elemen antena fisik menjadi jauh lebih kompak.',
        criticalAnalysisQuestion: 'Mengapa gelombang dengan frekuensi lebih tinggi (panjang gelombang lebih pendek) lebih rentan mengalami penyerapan oleh uap air dan dedaunan (rain attenuation)?'
      },
      {
        id: 'sim_5_4',
        taskNumber: 4,
        title: 'Pengukuran Signal-to-Noise Ratio (SNR) & Noise Floor Jaringan Nirkabel',
        type: 'wireless_spectrum',
        objective: 'Menganalisis hubungan antara RSSI, Noise Floor, dan SNR terhadap kestabilan transfer data VoIP dan video streaming.',
        toolsAndMaterials: ['Virtual RF Site Survey Tool', 'SNR Graph Plotter'],
        safetyGuidelines: ['Standar industri: SNR minimal untuk koneksi data stabil adalah 20 dB, dan 25 dB untuk VoIP.'],
        stepByStepGuide: [
          'Ukur nilai sinyal diterima RSSI = -65 dBm.',
          'Ukur level kebisingan lingkungan (Noise Floor) = -90 dBm.',
          'Hitung SNR: (-65 dBm) - (-90 dBm) = +25 dB (Kualitas Sangat Bagus).',
          'Simulasikan kenaikan noise microwave menjadi -75 dBm, amati penurunan SNR menjadi 10 dB dan dampaknya pada packet loss.'
        ],
        expectedObservation: 'Meskipun sinyal RSSI terukur cukup kuat, jika noise floor tinggi maka SNR akan anjlok menyebabkan koneksi sering putus (intermittent drop).',
        criticalAnalysisQuestion: 'Mengapa nilai SNR yang tinggi jauh lebih menentukan kualitas performa jaringan nirkabel dibandingkan hanya melihat bar indikator sinyal di sistem operasi?'
      }
    ]
  },
  {
    id: 6,
    code: 'TJKN-06',
    title: 'Perangkat Jaringan Nirkabel',
    semester: 2,
    grade: 'Kelas XI',
    hoursAllocation: 18,
    elemen: 'Jaringan Nirkabel',
    capaianPembelajaran: 'Peserta didik mampu memilih, memasang, dan mengonfigurasi perangkat keras nirkabel enterprise maupun SOHO (Access Point Standalone, Controller-Based AP / CAPsMAN / UniFi, Wireless Router, Switch PoE 802.3af/at/bt, serta berbagai tipe antena nirkabel: Omnidirectional, Sectoral, Grid, dan Solid Dish).',
    tujuanPembelajaran: [
      'Membedakan mode operasi perangkat nirkabel: Access Point (AP), Wireless Client (Station), Repeater/Range Extender, dan WDS.',
      'Menganalisis spesifikasi dan karakteristik pola radiasi antena Omnidirectional (360 derajat) vs Directional (fokus berkas sempit).',
      'Mengidentifikasi standar Power over Ethernet (PoE) 802.3af (15.4W), 802.3at PoE+ (30W), dan PoE pasif 24V.',
      'Melakukan konfigurasi terpusat multi-AP menggunakan Wireless LAN Controller (WLC).'
    ],
    primarySimulationType: 'wireless_spectrum',
    simulations: [
      {
        id: 'sim_6_1',
        taskNumber: 1,
        title: 'Konfigurasi Mode Operasi Wireless: AP Bridge vs Station Pseudobridge',
        type: 'wireless_spectrum',
        objective: 'Mengonfigurasi perangkat MikroTik Wireless Routerboard sebagai pemancar (AP Bridge) dan penerima (Station).',
        toolsAndMaterials: ['Virtual RouterOS Winbox', 'Wireless Interface Simulator'],
        safetyGuidelines: ['Selalu pasang antena sebelum menyalakan daya pemancar radio untuk mencegah kerusakan amplifier RF.'],
        stepByStepGuide: [
          'Buka interface wireless wlan1 pada Router AP, aktifkan mode `ap-bridge`, atur band 2GHz-b/g/n, SSID: `LabTKJ-Hotspot`.',
          'Buka Router 2, aktifkan wlan1 dengan mode `station-pseudobridge`, lakukan scan frekuensi.',
          'Koneksikan ke SSID `LabTKJ-Hotspot` dengan Security Profile yang sesuai.',
          'Verifikasi tabel pendaftaran wireless registration table dan transfer data.'
        ],
        expectedObservation: 'Router 2 berhasil terkoneksi ke Router 1 dan meneruskan frame MAC address klien kabel di belakangnya secara transparan.',
        criticalAnalysisQuestion: 'Mengapa mode standar `station` pada 802.11 tidak mendukung transparent bridging untuk banyak perangkat LAN di belakangnya tanpa ekstensi WDS atau pseudobridge?'
      },
      {
        id: 'sim_6_2',
        taskNumber: 2,
        title: 'Analisis Pola Radiasi Antena (Azimuth & Elevation) Omnidirectional vs Directional',
        type: 'link_budget',
        objective: 'Membandingkan gain (dBi), beamwidth horizontal, dan beamwidth vertikal berbagai jenis antena jaringan.',
        toolsAndMaterials: ['Antenna Radiation Pattern 3D Simulator', 'Gain Analyzer'],
        safetyGuidelines: ['Hindari memasang antena omnidirectional di dekat dinding logam yang dapat mendistorsi pola pancaran.'],
        stepByStepGuide: [
          'Muat profil antena Omnidirectional 9 dBi: amati pancaran 360 derajat horizontal namun sangat tipis vertikal.',
          'Muat profil antena Sectoral 120 derajat 19 dBi: amati jangkauan melebar ke depan.',
          'Muat profil antena Parabolic Dish 30 dBi: amati berkas sinar sangat tajam (pencil beam) sekitar 4-6 derajat.',
          'Tentukan antena yang paling tepat untuk link Point-to-Point 15 km vs hotspot aula sekolah.'
        ],
        expectedObservation: 'Antena dengan dBi semakin tinggi tidak menambah daya total pemancar, melainkan memfokuskan energi gelombang ke arah tertentu seperti lensa lampu senter.',
        criticalAnalysisQuestion: 'Mengapa memasang antena omnidirectional ber-gain sangat tinggi (misal 15 dBi) di dalam ruangan kelas bertingkat justru dapat menimbulkan zona mati (dead zone) bagi siswa yang berada persis di bawahnya?'
      },
      {
        id: 'sim_6_3',
        taskNumber: 3,
        title: 'Perhitungan Daya & Kompatibilitas Power over Ethernet (PoE Budget)',
        type: 'topology_vlan',
        objective: 'Menghitung total kebutuhan watt daya PoE Switch untuk menghidupkan 16 unit Access Point Wi-Fi 6.',
        toolsAndMaterials: ['PoE Calculator Sheet', 'Switch Spec Datasheet'],
        safetyGuidelines: ['Gunakan kabel tembaga murni (Solid Bare Copper) Cat6, hindari CCA (Copper Clad Aluminium) untuk PoE.'],
        stepByStepGuide: [
          'Identifikasi konsumsi daya per AP: 18.5 Watt (membutuhkan standar 802.3at PoE+).',
          'Hitung daya total: 16 x 18.5 W = 296 Watt.',
          'Tambahkan margin rugi-rugi kabel tembaga (cable loss) 15%: 296 W x 1.15 = 340.4 Watt.',
          'Pilih switch PoE dengan kapasitas power supply minimal 370W atau 500W.'
        ],
        expectedObservation: 'Switch dengan PoE budget yang mencukupi mencegah restart acak (spontaneous reboot) pada AP saat traffic mencapai puncak beban kerja.',
        criticalAnalysisQuestion: 'Mengapa kabel UTP berbahan CCA (Copper Clad Aluminium) sangat berbahaya jika digunakan untuk menyuplai daya perangkat PoE daya tinggi?'
      },
      {
        id: 'sim_6_4',
        taskNumber: 4,
        title: 'Provisioning Multi-AP Terpusat via MikroTik CAPsMAN',
        type: 'topology_vlan',
        objective: 'Menerapkan arsitektur Controlled Access Point system Manager (CAPsMAN) untuk mengelola puluhan AP dari satu router utama.',
        toolsAndMaterials: ['Virtual CAPsMAN Controller', 'Virtual CAP Radios'],
        safetyGuidelines: ['Gunakan sertifikat SSL untuk komunikasi kontroler jika melintasi jaringan publik.'],
        stepByStepGuide: [
          'Pada Controller: buat master configuration (SSID, Band, Security, Channel, Datapath local-forwarding).',
          'Aktifkan CAPsMAN manager pada router core.',
          'Pada AP klien: aktifkan mode `CAP` dan arahkan discovery IP ke controller.',
          'Verifikasi otomatisasi provision provisioning interface radio tanpa login ke masing-masing AP.'
        ],
        expectedObservation: 'Semua AP langsung memancarkan konfigurasi SSID dan keamanan yang sama seragam dalam hitungan detik setelah terdeteksi controller.',
        criticalAnalysisQuestion: 'Apa keunggulan arsitektur `local forwarding` dibandingkan `tunnel/capsman forwarding` pada beban transfer data lokal antar klien di jaringan sekolah?'
      }
    ]
  },
  {
    id: 7,
    code: 'TJKN-07',
    title: 'Konfigurasi Keamanan Jaringan Nirkabel',
    semester: 2,
    grade: 'Kelas XI',
    hoursAllocation: 18,
    elemen: 'Keamanan Jaringan',
    capaianPembelajaran: 'Peserta didik mampu merencanakan, mengimplementasikan, dan menguji sistem keamanan jaringan nirkabel (SSID Management, WPA2-Personal vs WPA3-SAE, WPA2/WPA3-Enterprise 802.1X dengan FreeRADIUS Server, MAC Address Filtering, Captive Portal Hotspot, serta mitigasi serangan Rogue AP dan Deauthentication Flood).',
    tujuanPembelajaran: [
      'Menganalisis kelemahan protokol enkripsi warisan (WEP, WPA-TKIP) dan keunggulan WPA2-AES serta WPA3-SAE (Simultaneous Authentication of Equals).',
      'Mengonfigurasi autentikasi pengguna individual menggunakan protokol EAP dan server RADIUS.',
      'Membangun sistem Captive Portal Hotspot sekolah dengan user profile rate limiting dan batas waktu (session timeout).',
      'Melakukan analisis keamanan nirkabel terhadap ancaman Evil Twin dan serangan pemutusan klien (Deauth attack).'
    ],
    primarySimulationType: 'wireless_spectrum',
    simulations: [
      {
        id: 'sim_7_1',
        taskNumber: 1,
        title: 'Implementasi WPA3-Personal (SAE) vs WPA2-Personal (Pre-Shared Key)',
        type: 'wireless_spectrum',
        objective: 'Mengonfigurasi keamanan WPA3-SAE pada Access Point dan menganalisis kekebalan terhadap serangan offline dictionary attack.',
        toolsAndMaterials: ['Virtual Security Configuration Panel', 'Handshake Packet Inspector'],
        safetyGuidelines: ['Gunakan password PSK dengan kombinasi huruf besar, kecil, angka, dan simbol minimal 12 karakter.'],
        stepByStepGuide: [
          'Akses menu Security Profile pada AP nirkabel.',
          'Pilih Authentication Type: WPA2 PSK dengan enkripsi AES-CCMP.',
          'Lakukan pengujian capture 4-Way Handshake saat klien tersambung.',
          'Upgrade mode keamanan ke WPA3-Personal (SAE - Dragonfly Handshake).',
          'Amati perbedaan proteksi terhadap upaya brute force dictionary attack.'
        ],
        expectedObservation: 'WPA3 menggunakan protokol SAE yang melindungi password dari cracking offline meskipun penyerang berhasil menangkap paket handshake saat autentikasi.',
        criticalAnalysisQuestion: 'Mengapa fitur forward secrecy pada WPA3-SAE memastikan bahwa data komunikasi masa lalu tetap aman meskipun di masa depan password Wi-Fi bocor?'
      },
      {
        id: 'sim_7_2',
        taskNumber: 2,
        title: 'Konfigurasi Autentikasi 802.1X Enterprise dengan Server RADIUS',
        type: 'topology_vlan',
        objective: 'Membangun sistem login Wi-Fi dengan username dan password unik per masing-masing guru dan siswa SMK.',
        toolsAndMaterials: ['FreeRADIUS Virtual Server', 'WPA-Enterprise Configurator'],
        safetyGuidelines: ['Lindungi komunikasi secret key antara AP NAS (Network Access Server) dan server RADIUS.'],
        stepByStepGuide: [
          'Buat database pengguna pada server RADIUS (User: `guru_tkj`, Group: `Guru`, VLAN: 10; User: `siswa_tkj`, Group: `Siswa`, VLAN: 20).',
          'Konfigurasikan AP dengan Security Mode: WPA2-Enterprise.',
          'Masukkan IP server RADIUS, port 1812, dan Shared Secret Key.',
          'Uji login dari klien dan verifikasi penempatan VLAN dinamis (Dynamic VLAN Assignment).'
        ],
        expectedObservation: 'Klien yang login menggunakan akun guru otomatis diarahkan ke subnet aman VLAN 10, sedangkan akun siswa diarahkan ke subnet terbatas VLAN 20.',
        criticalAnalysisQuestion: 'Mengapa sistem WPA-Enterprise jauh lebih aman untuk lingkungan institusi/sekolah dibanding membagikan satu password WPA-Personal kepada ratusan siswa?'
      },
      {
        id: 'sim_7_3',
        taskNumber: 3,
        title: 'Pembuatan Sistem Captive Portal Hotspot & User Profile Management',
        type: 'topology_vlan',
        objective: 'Mengonfigurasi server Hotspot MikroTik, kustomisasi halaman login HTML, dan pembatasan bandwidth per user voucher.',
        toolsAndMaterials: ['MikroTik Hotspot Server Simulator', 'HTML/CSS Login Page Editor'],
        safetyGuidelines: ['Pastikan sertifikat HTTPS aktif untuk mencegah penyadapan kredensial login pada captive portal.'],
        stepByStepGuide: [
          'Jalankan wizard Hotspot Setup pada antarmuka wlan1 atau bridge hotspot.',
          'Tentukan IP pool DHCP, DNS name (misal: `hotspot.smk.sch.id`), dan user profile (Rate limit 2M/2M).',
          'Unggah template halaman login sekolah yang responsif.',
          'Uji mekanisme redirection saat pengguna membuka peramban web.',
          'Uji fitur bypass MAC address (IP Binding) untuk printer jaringan.'
        ],
        expectedObservation: 'Klien yang baru terhubung otomatis diarahkan ke halaman login sekolah dan tidak bisa mengakses internet sebelum memasukkan voucher yang valid.',
        criticalAnalysisQuestion: 'Mengapa fitur MAC Randomization (Private MAC) pada smartphone Android dan iOS modern dapat menyulitkan sistem autentikasi hotspot berbasis MAC cookie?'
      },
      {
        id: 'sim_7_4',
        taskNumber: 4,
        title: 'Deteksi & Mitigasi Serangan Rogue AP (Evil Twin Attack) dan Deauth',
        type: 'wireless_spectrum',
        objective: 'Menganalisis paket deauthentication flood 802.11 management frames dan mengaktifkan fitur Wireless Intrusion Prevention System (WIPS).',
        toolsAndMaterials: ['Packet Capture Wireshark 802.11', 'Rogue AP Detection Tool'],
        safetyGuidelines: ['Hanya lakukan simulasi di dalam lab tertutup dengan izin instruktur pengampu.'],
        stepByStepGuide: [
          'Simulasikan pemancar liar dengan SSID identik `LabTKJ-Hotspot` namun memiliki BSSID MAC asing.',
          'Amati injeksi paket deauthentication frame (Type 0, Subtype 12) yang memaksa klien terputus dari AP resmi.',
          'Aktifkan fitur 802.11w (Protected Management Frames / PMF) pada AP resmi.',
          'Verifikasi bahwa klien dengan PMF aktif mengabaikan paket deauth palsu.'
        ],
        expectedObservation: 'Protokol 802.11w mengenkripsi frame manajemen unicast sehingga penyerang tidak dapat memalsukan paket disconnect terhadap klien.',
        criticalAnalysisQuestion: 'Bagaimana cara kerja teknologi 802.11w Protected Management Frames dalam mencegah serangan Deauthentication DoS?'
      }
    ]
  },
  {
    id: 8,
    code: 'TJKN-08',
    title: 'Jaringan Nirkabel Outdoor',
    semester: 2,
    grade: 'Kelas XI',
    hoursAllocation: 18,
    elemen: 'Jaringan Nirkabel',
    capaianPembelajaran: 'Peserta didik mampu merencanakan, menghitung, dan mengimplementasikan link jaringan nirkabel jarak jauh outdoor (Point-to-Point dan Point-to-Multipoint), menganalisis Line of Sight (LoS), menghitung radius Fresnel Zone ke-1 (60% clearance), menghitung Link Budget transmisi, serta memilih tower dan grounding penangkal petir.',
    tujuanPembelajaran: [
      'Menghitung Free Space Path Loss (FSPL) berdasarkan jarak kilometer dan frekuensi gigahertz.',
      'Menghitung jari-jari Fresnel Zone pertama dan menentukan tinggi minimal tower untuk memastikan clearance 60% dari halangan bumi dan bangunan.',
      'Melakukan kalkulasi Link Budget lengkap: Tx Power + Tx Antenna Gain - Cable Loss - FSPL + Rx Antenna Gain - Rx Cable Loss = RSL (Received Signal Level).',
      'Membandingkan RSL dengan Rx Sensitivity perangkat radio untuk memastikan Fade Margin minimal 15 - 20 dB.'
    ],
    primarySimulationType: 'link_budget',
    simulations: [
      {
        id: 'sim_8_1',
        taskNumber: 1,
        title: 'Kalkulasi Link Budget Transmisi Wireless Point-to-Point 10 Km',
        type: 'link_budget',
        objective: 'Menentukan apakah link nirkabel 5.8 GHz sejauh 10 km antara SMK dan Balai Desa memenuhi syarat Received Signal Level (RSL) dan Fade Margin.',
        toolsAndMaterials: ['Outdoor Link Budget Calculator', 'Spesifikasi Radio Outdoor 5 GHz'],
        safetyGuidelines: ['Pastikan daya transmisi EIRP mematuhi batas legal Postel/Kominfo RI (maksimal 36 dBm atau 4 Watt).'],
        stepByStepGuide: [
          'Masukkan parameter Tx Power: 24 dBm.',
          'Pilih Antena Dish 5.8 GHz: Gain 30 dBi di kedua sisi (Tx & Rx).',
          'Masukkan panjang pigtail jumper cable loss: 1 dB di masing-masing sisi.',
          'Hitung FSPL untuk jarak 10 km pada 5800 MHz: FSPL = 92.45 + 20log10(10) + 20log10(5.8) = 127.7 dB.',
          'Hitung RSL = 24 + 30 - 1 - 127.7 + 30 - 1 = -45.7 dBm.',
          'Bandingkan dengan sensitivitas radio (-75 dBm): Fade Margin = (-45.7) - (-75) = +29.3 dB (Status: Excellent Link).'
        ],
        expectedObservation: 'Nilai RSL -45.7 dBm menghasilkan fade margin 29.3 dB yang melampaui batas minimum aman 20 dB untuk menahan gangguan cuaca buruk dan hujan lebat.',
        criticalAnalysisQuestion: 'Apa dampak buruk yang terjadi jika nilai RSL terlalu kuat (misal lebih besar dari -35 dBm) terhadap penerima radio wireless outdoor?'
      },
      {
        id: 'sim_8_2',
        taskNumber: 2,
        title: 'Analisis Kelengkungan Bumi & Perhitungan 60% Fresnel Zone Clearance',
        type: 'link_budget',
        objective: 'Menghitung jari-jari ellipsoid zona Fresnel pertama di titik tengah lintasan link 15 km dan menentukan elevasi tower.',
        toolsAndMaterials: ['Fresnel Zone Simulator', 'Earth Curvature Profile Tool'],
        safetyGuidelines: ['Standar keselamatan K3 panjat tower (Full Body Harness, Helmet, Lanyard).'],
        stepByStepGuide: [
          'Gunakan rumus radius Fresnel pertama: r = 17.32 * sqrt((d1 * d2) / (f * D)).',
          'Pada titik tengah d1 = 7.5 km, d2 = 7.5 km, D = 15 km, f = 5.8 GHz, hitung r = 17.32 * sqrt(56.25 / 87) = 13.92 meter.',
          'Hitung 60% dari radius Fresnel: 0.6 * 13.92 m = 8.35 meter.',
          'Tambahkan tinggi bujukan lengkung bumi (Earth Bulge) h = (d1 * d2) / (12.74) = 4.4 meter.',
          'Tentukan tinggi tower minimal di atas pohon tertinggi (20 meter) = 20 + 8.35 + 4.4 = 32.75 meter.'
        ],
        expectedObservation: 'Halangan yang memotong lebih dari 40% zona Fresnel pertama akan menyebabkan difraksi dan pembatalan fase gelombang sinyal yang merusak kualitas koneksi.',
        criticalAnalysisQuestion: 'Mengapa keberadaan danau air atau permukaan tanah lapang yang rata di bawah lintasan nirkabel dapat menimbulkan fenomena multipath reflection yang merugikan?'
      },
      {
        id: 'sim_8_3',
        taskNumber: 3,
        title: 'Simulasi Point-to-Multipoint (PtMP) dengan Antena Sectoral',
        type: 'link_budget',
        objective: 'Merancang BTS nirkabel pusat untuk mendistribusikan koneksi internet ke 5 lokasi sekolah cabang dalam radius 4 km.',
        toolsAndMaterials: ['PtMP Coverage Planner', 'Sector Antenna Angle Simulator'],
        safetyGuidelines: ['Pastikan sudut down-tilt antena terpasang tepat sesuai radius target klien.'],
        stepByStepGuide: [
          'Posisikan Base Station (AP) dengan 3 unit antena sektoral 120 derajat untuk menjangkau 360 derajat.',
          'Atur frekuensi berbeda pada ketiga sektor (misal: 5180 MHz, 5500 MHz, 5745 MHz) untuk mencegah self-interference.',
          'Konfigurasikan TDMA (Time Division Multiple Access) seperti AirMAX atau NV2.',
          'Koneksikan 5 stasiun klien dengan antena directional terarah ke BTS.'
        ],
        expectedObservation: 'Protokol TDMA menghilangkan masalah hidden node problem dan mengalokasikan time-slot transmisi secara adil ke setiap klien tanpa tabrakan paket.',
        criticalAnalysisQuestion: 'Bagaimana fenomena "Hidden Node Problem" terjadi pada topologi PtMP standar CSMA/CA, dan bagaimana protokol TDMA eksklusif menyelesaikannya?'
      },
      {
        id: 'sim_8_4',
        taskNumber: 4,
        title: 'Instalasi Sistem Proteksi Petir (Grounding & Surge Arrester)',
        type: 'link_budget',
        objective: 'Merancang instalasi pentanahan (grounding) tower triangle, penangkal petir splitzen, dan Ethernet Surge Protector (ESD Protection).',
        toolsAndMaterials: ['Grounding Resistance Simulator (Earth Tester)', 'Surge Protector Diagram'],
        safetyGuidelines: ['Pastikan nilai resistansi grounding terukur di bawah 5 Ohm sesuai PUIL (Pedoman Umum Instalasi Listrik).'],
        stepByStepGuide: [
          'Tancapkan batang tembaga (copper rod) sepanjang 3 meter ke dalam tanah yang lembap.',
          'Ukur nilai tahanan grounding menggunakan Earth Clamp Tester (Target < 2 Ohm).',
          'Hubungkan kabel tembaga BC (Bare Copper) 50mm² dari ujung penangkal petir langsung ke tanah tanpa belokan tajam 90 derajat.',
          'Pasang Gigabit PoE Surge Protector di dekat radio outdoor dan di dalam ruang server sebelum masuk ke switch.'
        ],
        expectedObservation: 'Muatan induksi elektrostatis dan lonjakan tegangan (voltage surge) petir dibuang secara aman ke tanah sebelum merusak sirkuit elektronik radio.',
        criticalAnalysisQuestion: 'Mengapa kabel penyalur petir tidak boleh dibelokkan dengan sudut tajam atau patah 90 derajat?'
      }
    ]
  },
  {
    id: 9,
    code: 'TJKN-09',
    title: 'Pengenalan Teknologi Fiber Optic',
    semester: 3,
    grade: 'Kelas XII',
    hoursAllocation: 18,
    elemen: 'Jaringan Fiber Optic',
    capaianPembelajaran: 'Peserta didik mampu memahami prinsip fisika perambatan cahaya dalam serat kaca (Hukum Snellius dan Total Internal Reflection), mengidentifikasi struktur kabel serat optik (Core, Cladding, Coating, Strength Member, Jacket), membedakan Single Mode vs Multi Mode, memahami panjang gelombang kerja (850, 1310, 1490, 1550 nm), serta arsitektur jaringan akses FTTx / GPON (OLT, FDT/ODC, FAT/ODP, Roset/OTP, ONT/ONU).',
    tujuanPembelajaran: [
      'Menjelaskan fenomena pembiasan dan Pemantulan Internal Total (Total Internal Reflection) pada batas Core dan Cladding.',
      'Membedakan dimensi dan karakteristik serat Single-Mode (9/125 mikron) dengan Multi-Mode (50/125 & 62.5/125 mikron).',
      'Mengidentifikasi komponen pasif dan aktif dalam jaringan Gigabit Capable Passive Optical Network (GPON).',
      'Menghitung rasio pembagian daya optik pada Optical Splitter (1:2, 1:4, 1:8, 1:16, 1:32).'
    ],
    primarySimulationType: 'fiber_splice',
    simulations: [
      {
        id: 'sim_9_1',
        taskNumber: 1,
        title: 'Simulasi Pemantulan Internal Total (Total Internal Reflection) Serat Kaca',
        type: 'fiber_splice',
        objective: 'Membuktikan syarat terjadinya perambatan gelombang cahaya di dalam core optik menggunakan indeks bias n1 > n2 dan sudut datang kritis.',
        toolsAndMaterials: ['Optics Ray Tracing Simulator', 'Refraction Index Modeler'],
        safetyGuidelines: ['Cahaya laser serat optik tidak terlihat oleh mata manusia (inframerah), jangan pernah menatap ujung serat yang aktif!'],
        stepByStepGuide: [
          'Atur indeks bias Core n1 = 1.48 dan Cladding n2 = 1.46.',
          'Hitung sudut kritis: theta_c = arcsin(n2 / n1) = arcsin(1.46 / 1.48) = 80.59 derajat.',
          'Tembakkan sinar dengan sudut datang lebih besar dari sudut kritis (85 derajat).',
          'Amati pemantulan sempurna 100% tanpa cahaya yang tembus ke lapisan cladding.'
        ],
        expectedObservation: 'Cahaya terperangkap dan merambat zig-zag di dalam core silika murni dengan redaman energi yang sangat kecil.',
        criticalAnalysisQuestion: 'Apa yang terjadi pada rambatan cahaya jika kabel serat optik ditekuk melebihi batas radius tekukan minimum (bending radius)?'
      },
      {
        id: 'sim_9_2',
        taskNumber: 2,
        title: 'Komparasi Single-Mode Fiber (SMF) vs Multi-Mode Fiber (MMF)',
        type: 'fiber_splice',
        objective: 'Menganalisis perbedaan dispersi modal (modal dispersion), sumber cahaya (Laser Diode vs LED/VCSEL), dan jarak jangkau.',
        toolsAndMaterials: ['Fiber Mode Waveform Analyzer', 'Spectral Attenuation Curve Tool'],
        safetyGuidelines: ['Perhatikan warna jaket standar TIA-598: Kuning untuk Single-Mode OS1/OS2, Aqua untuk Multi-Mode OM3/OM4.'],
        stepByStepGuide: [
          'Muat kabel Multi-Mode OM3 dengan diameter core 50 mikrometer pada panjang gelombang 850 nm.',
          'Amati berbagai mode berkas cahaya merambat dengan jalur tempuh berbeda, menimbulkan pelebaran pulsa (modal dispersion) setelah 500 meter.',
          'Ganti ke Single-Mode OS2 dengan diameter core 9 mikrometer pada 1310 nm / 1550 nm.',
          'Amati hanya ada satu mode sinar fundamental yang merambat lurus bebas dari dispersi modal hingga puluhan kilometer.'
        ],
        expectedObservation: 'Single Mode menghilangkan dispersi modal sepenuhnya sehingga mampu mentransmisikan data puluhan Gbps pada jarak hingga 40-80 km.',
        criticalAnalysisQuestion: 'Mengapa core kabel Single-Mode dibuat sangat kecil (hanya 9 mikron atau sepersepuluh tebal rambut manusia)?'
      },
      {
        id: 'sim_9_3',
        taskNumber: 3,
        title: 'Pemetaan Arsitektur Topologi FTTH / GPON dari Sentral ke Rumah Pelanggan',
        type: 'topology_vlan',
        objective: 'Menyusun alur perangkat pasif dan aktif jaringan FTTH: OLT -> ODC (FDT) -> ODP (FAT) -> Roset (OTP) -> ONT.',
        toolsAndMaterials: ['GPON Topology Builder', 'Optical Power Budget Calculator'],
        safetyGuidelines: ['Pastikan penggunaan adapter konektor SC/UPC (biru) vs SC/APC (hijau sudut 8 derajat) tidak tertukar.'],
        stepByStepGuide: [
          'Hubungkan port PON OLT (Optical Line Terminal) di Central Office dengan output daya +3 dBm.',
          'Sambungkan kabel feeder ke ODC (Optical Distribution Cabinet) yang memuat splitter tahap 1 (1:4).',
          'Distribusikan kabel distribusi ke ODP (Optical Distribution Point) tiang dengan splitter tahap 2 (1:8).',
          'Tarik drop cable 1-core ke Roset rumah pelanggan dan sambungkan ke ONT (Optical Network Terminal).'
        ],
        expectedObservation: 'Total rasio pembagian adalah 1:32 (4 x 8), melayani 32 pelanggan dari satu core serat optik OLT.',
        criticalAnalysisQuestion: 'Mengapa konektor tipe APC (Angled Physical Contact warna hijau) lebih disukai untuk layanan video RF dan PON dibanding konektor UPC (warna biru)?'
      },
      {
        id: 'sim_9_4',
        taskNumber: 4,
        title: 'Perhitungan Redaman Daya Pasif Optical Splitter (Link Loss Budget GPON)',
        type: 'otdr_analysis',
        objective: 'Menghitung estimasi penurunan daya optik pada splitter PLC 1:2, 1:4, 1:8, 1:16, dan 1:32.',
        toolsAndMaterials: ['Splitter Loss Reference Table', 'Virtual Optical Power Meter'],
        safetyGuidelines: ['Redaman total jaringan GPON dari OLT ke ONT harus berada di antara -8 dBm hingga -27 dBm (Class B+ / C+).'],
        stepByStepGuide: [
          'Gunakan rumus teoritis redaman splitter: Loss = 10 * log10(N) + excess loss.',
          'Splitter 1:2 = ~3.5 dB; 1:4 = ~7.2 dB; 1:8 = ~10.5 dB; 1:16 = ~13.8 dB; 1:32 = ~17.2 dB.',
          'Hitung total redaman link: Tx OLT (+3 dBm) - Redaman kabel (10 km x 0.35 dB/km = 3.5 dB) - Splitter 1:4 (7.2 dB) - Splitter 1:8 (10.5 dB) - Konektor (4 x 0.25 dB = 1 dB) = RSL.',
          'RSL = 3 - 3.5 - 7.2 - 10.5 - 1 = -19.2 dBm.'
        ],
        expectedObservation: 'RSL yang diterima ONT bernilai -19.2 dBm, berada sempurna dalam batas sensitivitas standar GPON Class B+ (-8 s.d. -27 dBm).',
        criticalAnalysisQuestion: 'Jika pembacaan Optical Power Meter di ONT pelanggan menunjukkan angka -32 dBm, apa dampaknya terhadap koneksi internet pelanggan dan bagaimana langkah diagnosisnya?'
      }
    ]
  },
  {
    id: 10,
    code: 'TJKN-10',
    title: 'Instalasi & Penyambungan Fiber Optic',
    semester: 3,
    grade: 'Kelas XII',
    hoursAllocation: 18,
    elemen: 'Jaringan Fiber Optic',
    capaianPembelajaran: 'Peserta didik mampu menerapkan prosedur K3 kerja serat optik, menggunakan peralatan kerja (Miller Stripper, Fiber Cleaver, Alkohol Isopropil 95%, Protection Sleeve), mengoperasikan mesin Fusion Splicer dengan presisi, dan memasang sambungan ke dalam Optical Termination Box (OTB) / Closure dengan redaman sambungan <= 0.03 dB.',
    tujuanPembelajaran: [
      'Menerapkan K3LH khusus penanganan serpihan kaca serat optik (menggunakan kacamata pelindung dan tempat pembuangan khusus).',
      'Melakukan pengupasan lapisan pelindung serat optik secara bertahap menggunakan Miller Stripper 3-lubang.',
      'Melakukan pemotongan inti serat optik tegak lurus 90 derajat menggunakan Precision Fiber Cleaver.',
      'Mengoperasikan mesin Fusion Splicer (core alignment, arc calibration, fusion cycle) hingga menghasilkan nilai sambungan loss <= 0.03 dB.'
    ],
    primarySimulationType: 'fiber_splice',
    simulations: [
      {
        id: 'sim_10_1',
        taskNumber: 1,
        title: 'Prosedur K3 & Pengupasan Serat Optik Bertingkat dengan Miller Stripper',
        type: 'fiber_splice',
        objective: 'Mengupas jacket luar 2-3 mm, tight buffer 900 mikron, dan acrylate coating 250 mikron tanpa mencakar inti kaca 125 mikron.',
        toolsAndMaterials: ['Miller Tri-Hole Stripper Virtual', 'Kimwipes Lint-Free Tissue', 'Alkohol 95%'],
        safetyGuidelines: ['Jangan pernah mengusap mata saat memegang serat optik, buang serpihan kaca ke kotak disposal khusus bertutup!'],
        stepByStepGuide: [
          'Pasang Protection Sleeve (heat shrink tube) ke salah satu ujung kabel sebelum proses penyambungan.',
          'Gunakan lubang pertama stripper untuk mengupas jaket luar sepanjang 5 cm.',
          'Gunakan lubang kedua untuk mengupas buffer 900 mikron.',
          'Gunakan lubang terkecil ketiga untuk mengupas coating 250 mikron menyisakan cladding 125 mikron telanjang sepanjang 3 cm.',
          'Basahi tisu Kimwipes dengan alkohol 95%, bersihkan kaca hingga berbunyi derit khas (squeak sound).'
        ],
        expectedObservation: 'Kaca serat optik bersih mengkilap tanpa sisa lapisan polimer dan tidak ada retakan mikro (micro-cracks).',
        criticalAnalysisQuestion: 'Mengapa membersihkan kaca serat optik mutlak menggunakan alkohol kadar tinggi (minimal 95% atau 99%) dan tidak boleh menggunakan alkohol medis 70%?'
      },
      {
        id: 'sim_10_2',
        taskNumber: 2,
        title: 'Pemotongan Presisi Inti Serat Kaca dengan Precision Fiber Cleaver',
        type: 'fiber_splice',
        objective: 'Memotong serat kaca telanjang dengan sudut kemiringan (cleave angle) kurang dari 1.0 derajat agar proses fusi busur listrik berhasil.',
        toolsAndMaterials: ['Virtual Fiber Cleaver', 'Cleave Angle Measurement Gauge'],
        safetyGuidelines: ['Pastikan serpihan ujung serat kaca terpotong masuk otomatis ke kotak penampung sampah (trash bin) cleaver.'],
        stepByStepGuide: [
          'Buka penutup cleaver dan klem penjepit serat.',
          'Letakkan serat optik yang sudah bersih pada pemandu penggaris (cleave length 10 - 16 mm).',
          'Pastikan serat berada tegak lurus terhadap roda pisau tungsten karbida.',
          'Tutup klem penjepit dan dorong bilah pisau pemotong secara halus dan mantap.',
          'Buka klem dan ambil serat yang sudah terpotong dengan hati-hati tanpa menyentuh ujung potongannya.'
        ],
        expectedObservation: 'Ujung permukaan potongan kaca rata sempurna membentuk bidang 90 derajat tanpa serpihan tajam (hackle/lip).',
        criticalAnalysisQuestion: 'Bagaimana dampak permukaan potongan yang miring (cleave angle > 2 derajat) terhadap hasil sambungan pada mesin fusion splicer?'
      },
      {
        id: 'sim_10_3',
        taskNumber: 3,
        title: 'Operasi Fusion Splicer: Core-to-Core Alignment & Arc Discharge',
        type: 'fiber_splice',
        objective: 'Menyambungkan dua inti serat optik menggunakan peleburan busur listrik elektroda dan membaca estimasi redaman sambungan (Splice Loss).',
        toolsAndMaterials: ['Fusion Splicer Virtual 6-Motor PAS', 'Elektroda Pengelas Optik'],
        safetyGuidelines: ['Jangan membuka wind protector cover saat proses pemancaran busur listrik berlangsung.'],
        stepByStepGuide: [
          'Nyalakan mesin fusion splicer, buka wind protector cover.',
          'Tempatkan kedua ujung serat pada V-groove tepat di antara kedua elektroda, jangan melewati titik tengah.',
          'Tutup penutup angin, mesin secara otomatis melakukan pemfokusan kamera X/Y dan penyejajaran inti (PAS - Profile Alignment System).',
          'Amati proses pembersihan prapanas (cleaning arc) dan penyambungan utama (main arc fusion).',
          'Evaluasi estimasi splice loss pada layar (Target: 0.00 - 0.02 dB, Maksimum: 0.03 dB).'
        ],
        expectedObservation: 'Kedua inti kaca menyatu sempurna tanpa gelembung udara, garis batas sambungan hilang, dan estimasi redaman tercatat 0.01 dB.',
        criticalAnalysisQuestion: 'Apa penyebab munculnya pesan error "Axis Offset Exceeded" atau "Fat Splice" pada layar fusion splicer dan bagaimana cara menanganinya?'
      },
      {
        id: 'sim_10_4',
        taskNumber: 4,
        title: 'Pemanasan Protection Sleeve & Manajemen Tray Sambungan (Splicing Tray OTB)',
        type: 'fiber_splice',
        objective: 'Melindungi titik sambungan kaca menggunakan heat shrink oven dan menata gulungan serat cadangan pada kaset sambungan.',
        toolsAndMaterials: ['Heating Oven Splicer', 'Protection Sleeve 60mm', 'OTB Splicing Tray Cassette'],
        safetyGuidelines: ['Hati-hati dengan panas heater oven (suhu mencapai 180°C - 200°C).'],
        stepByStepGuide: [
          'Geser protection sleeve tepat ke tengah titik sambungan kaca.',
          'Pindahkan serat dengan tegang halus ke dalam slot pemanas (heater oven).',
          'Tekan tombol HEAT, tunggu proses penyusutan hingga LED indikator pemanas berbunyi bip selesai.',
          'Dinginkan sleeve di rak pendingin logam.',
          'Tata gulungan sisa serat dengan radius belokan aman (diameter minimal 6 cm) ke dalam splicing tray OTB.'
        ],
        expectedObservation: 'Protection sleeve mengeras membungkus batang kawat penguat stainless steel, dan serat tertata rapi di tray tanpa terjepit.',
        criticalAnalysisQuestion: 'Mengapa sisa serat (slack fiber) sepanjang minimal 1 meter wajib digulung cadangan di dalam tray kaset ODC/ODP?'
      }
    ]
  },
  {
    id: 11,
    code: 'TJKN-11',
    title: 'Perbaikan Jaringan Fiber Optic',
    semester: 3,
    grade: 'Kelas XII',
    hoursAllocation: 18,
    elemen: 'Jaringan Fiber Optic',
    capaianPembelajaran: 'Peserta didik mampu melakukan pemeliharaan, pengukuran, dan troubleshooting jaringan serat optik menggunakan Visual Fault Locator (VFL), Optical Power Meter (OPM), Optical Light Source (OLS), serta menganalisis grafik jejak Optical Time Domain Reflectometer (OTDR) untuk menentukan lokasi core putus (cut fiber), redaman tinggi (macrobending/microbending), dan konektor kotor.',
    tujuanPembelajaran: [
      'Mendeteksi titik kebocoran cahaya dan serat putus jarak dekat (< 5 km) menggunakan VFL laser merah 650 nm.',
      'Mengukur daya terima absolut (dBm) dan redaman relatif (dB) menggunakan kombinasi OLS dan OPM.',
      'Menafsirkan grafik jejak OTDR: Dead Zone (Event & Attenuation), Event Non-Reflektif (Splice & Macrobend), Event Reflektif (Konektor & Mechanical Splice), dan End of Fiber.',
      'Menghitung jarak tepat titik putus kabel menggunakan rumus d = (c * t) / (2 * n) pada instrumen OTDR.'
    ],
    primarySimulationType: 'otdr_analysis',
    simulations: [
      {
        id: 'sim_11_1',
        taskNumber: 1,
        title: 'Inspeksi & Pembersihan Permukaan Konektor Fiber Optic (Fiber Scope)',
        type: 'otdr_analysis',
        objective: 'Memeriksa kebersihan permukaan ferrule konektor SC/LC perbesaran 400x dan mendeteksi kontaminasi debu atau minyak.',
        toolsAndMaterials: ['Digital Video Fiber Inspection Probe', 'One-Click Cleaner Tool'],
        safetyGuidelines: ['Jangan mengarahkan mata langsung ke ujung konektor sebelum memastikan sumber laser mati.'],
        stepByStepGuide: [
          'Hubungkan probe mikroskop optik ke konektor patch cord.',
          'Amati gambar permukaan ferrule: zona core, cladding, dan kontak perekat.',
          'Identifikasi partikel debu yang menutupi area core 9 mikron.',
          'Gunakan One-Click Cleaner mekanis untuk membersihkan permukaan ferrule.',
          'Verifikasi bahwa permukaan konektor memenuhi kriteria lolos standar IEC 61300-3-35.'
        ],
        expectedObservation: 'Area core bersih bebas dari partikel asing, goresan, atau noda minyak sidik jari.',
        criticalAnalysisQuestion: 'Mengapa sebutir partikel debu berukuran 2 mikrometer yang menempel di core Single Mode dapat menimbulkan redaman koneksi hingga lebih dari 1 dB?'
      },
      {
        id: 'sim_11_2',
        taskNumber: 2,
        title: 'Pengukuran Redaman Total Kabel dengan OLS (Light Source) & OPM (Power Meter)',
        type: 'otdr_analysis',
        objective: 'Melakukan uji insertion loss end-to-end pada kabel backbone sepanjang 3.5 km pada panjang gelombang 1310 nm dan 1550 nm.',
        toolsAndMaterials: ['Optical Light Source (1310/1550 nm)', 'Optical Power Meter terkalibrasi'],
        safetyGuidelines: ['Lakukan kalibrasi referensi (Zero Reference / Set Ref) patch cord sebelum pengukuran lapangan.'],
        stepByStepGuide: [
          'Pasang OLS di OTB Gedung A, atur output -7.00 dBm pada panjang gelombang 1310 nm.',
          'Pasang OPM di OTB Gedung B, set panjang gelombang 1310 nm.',
          'Catat daya terima yang terbaca pada OPM: -8.40 dBm.',
          'Hitung total loss link: (-7.00 dBm) - (-8.40 dBm) = 1.40 dB.',
          'Bandingkan dengan batas ambang teoritis: (3.5 km x 0.35 dB/km) + (2 x 0.25 dB konektor) = 1.725 dB (Status: Lolos/Good).'
        ],
        expectedObservation: 'Nilai redaman aktual terukur 1.40 dB, lebih rendah dari anggaran redaman maksimal 1.725 dB membuktikan jalur kabel optik prima.',
        criticalAnalysisQuestion: 'Mengapa pengujian pada panjang gelombang 1550 nm lebih sensitif dalam mendeteksi adanya tekukan mikro/makro (bending) dibanding pada 1310 nm?'
      },
      {
        id: 'sim_11_3',
        taskNumber: 3,
        title: 'Analisis Jejak Grafik OTDR (Event Dead Zone & Splice Loss Step)',
        type: 'otdr_analysis',
        objective: 'Membaca kurva backscatter Rayleigh dan mengidentifikasi titik sambungan buruk dan konektor reflektif pada trace OTDR.',
        toolsAndMaterials: ['Simulator Jejak OTDR Interaktif', 'Modul Marker Jarak & Redaman'],
        safetyGuidelines: ['Gunakan launch cable dummy minimal 500 meter untuk mengeliminasi dead zone awal instrumen.'],
        stepByStepGuide: [
          'Muat grafik OTDR panjang bentang 12.000 meter (12 km).',
          'Amati spike refleksi awal di 0 meter (konektor port OTDR).',
          'Identifikasi event non-reflektif berupa penurunan tangga (step-down) di jarak 4.250 meter dengan redaman 0.45 dB (sambungan fusion buruk / high loss splice).',
          'Identifikasi spike Fresnel di jarak 12.000 meter sebagai ujung akhir kabel (End of Fiber).',
          'Gunakan kursor marker A dan B untuk menghitung kemiringan redaman per kilometer (dB/km).'
        ],
        expectedObservation: 'Grafik OTDR secara visual membedakan event konektor (lonjakan runcing) dan event sambungan/tekukan (penurunan bertingkat tanpa lonjakan).',
        criticalAnalysisQuestion: 'Bagaimana cara membedakan event sambungan fusion yang jelek dengan event tekukan kabel (macrobend) pada instrumen OTDR dual wavelength?'
      },
      {
        id: 'sim_11_4',
        taskNumber: 4,
        title: 'Penentuan Lokasi Kabel Putus (Fiber Cut Recovery) & Penyambungan Darurat',
        type: 'otdr_analysis',
        objective: 'Menemukan titik putus kabel feeder bawah tanah akibat galian konstruksi dan menghitung jarak patok lapangan.',
        toolsAndMaterials: ['OTDR Fault Locator', 'Peta Geografis Jalur FO & Joint Closure'],
        safetyGuidelines: ['Amankan area kerja lubang manhole dan pasang rambu K3 pekerjaan jalan raya.'],
        stepByStepGuide: [
          'Hubungkan OTDR ke core yang mengalami status link down di sentral.',
          'Set lebar pulsa (pulse width) 100 ns dan indeks bias n = 1.4682.',
          'Jalankan real-time averaging test.',
          'OTDR mendeteksi refleksi ujung patahan kaca tajam di jarak tepat 2.418 meter.',
          'Konversikan jarak optik ke jarak kabel fisik tanah dengan faktor kelebihan pilinan (helix factor 1.02): Jarak fisik = 2.418 / 1.02 = 2.370 meter.',
          'Kirim tim lapangan ke patok KM 2.37 untuk penggalian dan pemasangan joint closure sambungan darurat.'
        ],
        expectedObservation: 'Titik kabel putus ditemukan presisi dalam radius toleransi beberapa meter dari patok rute jalur kabel.',
        criticalAnalysisQuestion: 'Mengapa panjang kabel optik fisik selalu sedikit lebih pendek dibandingkan jarak optik yang terbaca oleh instrumen OTDR?'
      }
    ]
  },
  {
    id: 12,
    code: 'TJKN-12',
    title: 'Integrasi Topologi Jaringan Kabel & Nirkabel',
    semester: 4,
    grade: 'Kelas XII',
    hoursAllocation: 18,
    elemen: 'Perencanaan dan Pengalamatan Jaringan',
    capaianPembelajaran: 'Peserta didik mampu merancang, memodelkan, dan mengintegrasikan topologi jaringan enterprise hibrida (gabungan kabel twisted-pair, backbone serat optik, dan distribusi nirkabel), menerapkan segmentasi VLAN 802.1Q, Inter-VLAN Routing (Router-on-a-stick & Layer 3 Switch), DHCP Relay Agent, serta simulasi pengujian konektivitas.',
    tujuanPembelajaran: [
      'Merancang topologi jaringan hierarkis 3-lapis: Core Layer, Distribution Layer, dan Access Layer.',
      'Mengonfigurasi VLAN ID 10, 20, 30 dan port trunking IEEE 802.1Q pada Switch Layer 2.',
      'Mengimplementasikan Router-on-a-Stick menggunakan sub-interface router dan enkapsulasi dot1Q.',
      'Mengonfigurasi antarmuka Access Point untuk memetakan Multi-SSID ke VLAN yang berbeda.'
    ],
    primarySimulationType: 'topology_vlan',
    simulations: [
      {
        id: 'sim_12_1',
        taskNumber: 1,
        title: 'Konfigurasi VLAN 802.1Q & Port Trunking pada Switch Layer 2',
        type: 'topology_vlan',
        objective: 'Memisahkan traffic broadcast jaringan Guru (VLAN 10) dan Siswa (VLAN 20) pada satu switch fisik.',
        toolsAndMaterials: ['Virtual Switch CLI Simulator', 'Packet Flow Monitor'],
        safetyGuidelines: ['Hindari looping jaringan dengan memastikan Spanning Tree Protocol (STP) aktif.'],
        stepByStepGuide: [
          'Buat VLAN 10 dengan nama `GURU_STAFF` dan VLAN 20 dengan nama `SISWA_LAB`.',
          'Tetapkan port Fa0/1 - Fa0/10 sebagai Access VLAN 10.',
          'Tetapkan port Fa0/11 - Fa0/20 sebagai Access VLAN 20.',
          'Konfigurasikan port Gigabit 0/1 sebagai port Trunk 802.1Q menuju router.',
          'Uji ping antar PC dalam satu VLAN vs antar VLAN berbeda.'
        ],
        expectedObservation: 'PC pada VLAN 10 dapat saling berkomunikasi, namun terisolasi total dari PC di VLAN 20 sebelum ada router penerus.',
        criticalAnalysisQuestion: 'Bagaimana format tag 4-byte 802.1Q disisipkan ke dalam frame Ethernet standar saat melewati port trunk?'
      },
      {
        id: 'sim_12_2',
        taskNumber: 2,
        title: 'Penerapan Inter-VLAN Routing Mode Router-on-a-Stick',
        type: 'topology_vlan',
        objective: 'Menghubungkan traffic antar-VLAN yang berbeda menggunakan satu antarmuka fisik router dengan sub-interface logis.',
        toolsAndMaterials: ['Cisco/MikroTik Router Simulator', 'IP Routing Table Inspector'],
        safetyGuidelines: ['Pastikan default gateway pada masing-masing PC klien diarahkan ke IP sub-interface yang bersesuaian.'],
        stepByStepGuide: [
          'Akses router, aktifkan interface fisik `GigabitEthernet 0/0` tanpa IP address (`no shutdown`).',
          'Buat sub-interface `G0/0.10`, jalankan `encapsulation dot1Q 10`, beri IP `192.168.10.1/24`.',
          'Buat sub-interface `G0/0.20`, jalankan `encapsulation dot1Q 20`, beri IP `192.168.20.1/24`.',
          'Aktifkan DHCP Server untuk kedua subnet.',
          'Jalankan ping antar VLAN dan lacak rute menggunakan traceroute.'
        ],
        expectedObservation: 'Paket data dari PC Siswa (VLAN 20) berhasil mencapai PC Guru (VLAN 10) dengan melewati router gateway.',
        criticalAnalysisQuestion: 'Apa kelemahan utama metode Router-on-a-Stick (ROAS) pada jaringan dengan volume transfer data yang sangat tinggi?'
      },
      {
        id: 'sim_12_3',
        taskNumber: 3,
        title: 'Pemetaan Multi-SSID Access Point ke VLAN Berbeda (VLAN Tagging Nirkabel)',
        type: 'topology_vlan',
        objective: 'Memancarkan SSID `Wi-Fi-Guru` yang terhubung ke VLAN 10 dan SSID `Wi-Fi-Siswa` yang terhubung ke VLAN 20 dari satu unit Access Point fisik.',
        toolsAndMaterials: ['Enterprise AP Configurator', 'Wireless Client Simulator'],
        safetyGuidelines: ['Hubungkan AP ke port switch yang dikonfigurasi sebagai port Trunk (bukan access port).'],
        stepByStepGuide: [
          'Hubungkan port LAN AP ke port switch mode Trunk dengan native VLAN 1 (manajemen).',
          'Buat Wireless Network 1: SSID `Wi-Fi-Guru`, Security WPA2-PSK, VLAN Tag: 10.',
          'Buat Wireless Network 2: SSID `Wi-Fi-Siswa`, Security Captive Portal, VLAN Tag: 20.',
          'Koneksikan laptop siswa ke `Wi-Fi-Siswa` dan periksa perolehan alamat IP dari DHCP Server VLAN 20.'
        ],
        expectedObservation: 'Klien nirkabel secara otomatis terisolasi ke subnet masing-masing sesuai SSID yang dipilih.',
        criticalAnalysisQuestion: 'Mengapa port switch yang terhubung ke Enterprise Access Point dengan fitur Multi-SSID wajib beroperasi dalam mode Trunk?'
      },
      {
        id: 'sim_12_4',
        taskNumber: 4,
        title: 'Konfigurasi DHCP Relay Agent Melintasi Batas Router',
        type: 'topology_vlan',
        objective: 'Mengizinkan klien di VLAN 20 mendapatkan konfigurasi IP dari server DHCP pusat yang terletak di VLAN 100.',
        toolsAndMaterials: ['DHCP Server Simulator', 'Router Helper Address Module'],
        safetyGuidelines: ['Broadcast DHCP Discover tidak dapat menembus router secara default tanpa relay agent.'],
        stepByStepGuide: [
          'Konfigurasikan DHCP Server di VLAN 100 dengan pool alamat untuk VLAN 20 (`192.168.20.0/24`).',
          'Pada router, masuk ke antarmuka klien `interface G0/0.20`.',
          'Tambahkan perintah helper address: `ip helper-address 192.168.100.2` (IP Server DHCP).',
          'Amati konversi paket broadcast DHCP DISCOVER menjadi unicast relay ke server.',
          'Verifikasi bahwa klien VLAN 20 berhasil mendapatkan IP address yang valid.'
        ],
        expectedObservation: 'Router bertindak sebagai agen perantara (Relay Agent) meneruskan permintaan IP DHCP melintasi segmen jaringan yang berbeda.',
        criticalAnalysisQuestion: 'Bagaimana server DHCP mengetahui subnet mana yang harus dialokasikan ke klien ketika permintaan tiba melalui DHCP Relay Agent?'
      }
    ]
  },
  {
    id: 13,
    code: 'TJKN-13',
    title: 'Manajemen Bandwidth & QoS',
    semester: 4,
    grade: 'Kelas XII',
    hoursAllocation: 18,
    elemen: 'Pemasangan dan Konfigurasi Perangkat Jaringan',
    capaianPembelajaran: 'Peserta didik mampu merencanakan dan mengonfigurasi manajemen alokasi bandwidth serta Quality of Service (QoS) pada router (MikroTik / Linux), menggunakan metode Simple Queue, Queue Tree, Hierarchical Token Bucket (HTB), Per Connection Queue (PCQ), serta memprioritaskan paket data krusial (VoIP, Video Conference, Ujian Online) dibanding traffic unduhan umum.',
    tujuanPembelajaran: [
      'Membedakan konsep CIR (Committed Information Rate / Limit-at) dengan MIR (Maximum Information Rate / Max-limit).',
      'Mengonfigurasi pembagian bandwidth dinamis yang adil untuk ratusan siswa menggunakan algoritma PCQ (Per Connection Queue).',
      'Membuat hierarki antrean bertingkat (Queue Tree HTB) dengan penandaan paket (Packet Marking) pada Mangle Firewall.',
      'Menganalisis fenomena Bufferbloat dan menerapkan mitigasi antrean CoDel / fq_codel / CAKE.'
    ],
    primarySimulationType: 'bandwidth_qos',
    simulations: [
      {
        id: 'sim_13_1',
        taskNumber: 1,
        title: 'Konfigurasi Simple Queue dengan Batasan CIR, MIR, dan Burst Rate',
        type: 'bandwidth_qos',
        objective: 'Membatasi kecepatan download/upload ruang lab komputer sekolah dan memberikan lonjakan kecepatan awal (Burst) saat membuka web.',
        toolsAndMaterials: ['MikroTik Simple Queue Simulator', 'Virtual Bandwidth Speed Test'],
        safetyGuidelines: ['Pastikan penomoran urutan (order) simple queue tepat karena dievaluasi dari atas ke bawah.'],
        stepByStepGuide: [
          'Buat Simple Queue baru dengan Target IP `192.168.1.0/24`.',
          'Atur Max-Limit (MIR): Upload 5 Mbps, Download 20 Mbps.',
          'Atur Limit-At (CIR): Upload 2 Mbps, Download 5 Mbps sebagai garansi kecepatan terendah.',
          'Konfigurasikan Burst Limit: Download 40 Mbps, Burst Threshold: 15 Mbps, Burst Time: 8 detik.',
          'Jalankan uji unduhan file dan amati grafik lonjakan kecepatan sebelum turun ke max-limit.'
        ],
        expectedObservation: 'Klien merasakan sensasi browsing cepat berkat burst rate, namun kecepatan unduhan file besar stabil tertahan di 20 Mbps.',
        criticalAnalysisQuestion: 'Bagaimana rumus perhitungan rata-rata bergerak (moving average) yang digunakan MikroTik untuk menentukan kapan burst rate harus dihentikan?'
      },
      {
        id: 'sim_13_2',
        taskNumber: 2,
        title: 'Pembagian Bandwidth Adil Otomatis dengan Algoritma PCQ (Per Connection Queue)',
        type: 'bandwidth_qos',
        objective: 'Membagi total bandwidth internet 50 Mbps secara dinamis dan proporsional kepada semua siswa yang aktif tanpa membuat antrean satu per satu.',
        toolsAndMaterials: ['PCQ Queue Simulator', 'Multi-Client Traffic Generator'],
        safetyGuidelines: ['Gunakan classifier `dst-address` untuk arah unduhan (download) dan `src-address` untuk arah unggahan (upload).'],
        stepByStepGuide: [
          'Buat Queue Type baru bernama `PCQ_Download`, Kind: `pcq`, PCQ Classifier: centang `Dst. Address`.',
          'Atur PCQ Rate = 0 (berarti bandwidth dibagi rata secara otomatis oleh router).',
          'Buat Simple Queue dengan target seluruh subnet lab, arahkan Queue Type ke `PCQ_Download`.',
          'Simulasikan 1 klien online: mendapatkan 50 Mbps penuh.',
          'Nyalakan 5 klien bersamaan: masing-masing otomatis mendapatkan 10 Mbps secara adil.'
        ],
        expectedObservation: 'Bandwidth tidak terbuang sia-sia jika klien sedikit, dan tidak ada satu pengguna yang memonopoli jaringan saat banyak klien aktif.',
        criticalAnalysisQuestion: 'Mengapa algoritma PCQ jauh lebih efisien dalam penggunaan memori CPU router dibanding membuat ratusan baris Simple Queue statis?'
      },
      {
        id: 'sim_13_3',
        taskNumber: 3,
        title: 'Hierarki Antrean Bertingkat (Queue Tree HTB) & Packet Marking Mangle',
        type: 'bandwidth_qos',
        objective: 'Memprioritaskan traffic Ujian Online (CBT) dan Video Call di atas traffic streaming YouTube dan media sosial.',
        toolsAndMaterials: ['Firewall Mangle Simulator', 'Hierarchical Queue Tree Builder'],
        safetyGuidelines: ['Selalu matikan opsi `passthrough=yes` pada baris rule mangle terakhir untuk mencegah penimpaan tanda paket.'],
        stepByStepGuide: [
          'Pada IP Firewall Mangle: tandai koneksi port CBT (port 8080) dengan connection mark `conn_cbt`.',
          'Tandai paket dengan packet mark `pkt_cbt`.',
          'Tandai traffic umum lainnya dengan packet mark `pkt_general`.',
          'Pada Queue Tree: buat antrean induk `Total_Download` (Parent: bridge-lan, Max: 100 Mbps).',
          'Buat sub-antrean anak `Queue_CBT` (Priority: 1 - tertinggi) dan `Queue_General` (Priority: 8 - terendah).'
        ],
        expectedObservation: 'Saat jaringan penuh 100%, router mendahulukan antrean paket CBT dengan priority 1 sehingga ujian siswa tidak mengalami lag atau terputus.',
        criticalAnalysisQuestion: 'Bagaimana prinsip peminjaman bandwidth sisa (bandwidth borrowing) bekerja pada struktur pohon hierarki HTB antara antrean anak dan induk?'
      },
      {
        id: 'sim_13_4',
        taskNumber: 4,
        title: 'Mitigasi Fenomena Bufferbloat Menggunakan Algoritma Modern (CAKE / FQ-CoDel)',
        type: 'bandwidth_qos',
        objective: 'Mencegah lonjakan ping latensi (RTT spike) dari 15 ms melonjak menjadi 500 ms saat link internet digunakan mengunggah video.',
        toolsAndMaterials: ['Bufferbloat Latency Tester', 'Active Queue Management (AQM) Module'],
        safetyGuidelines: ['Atur shaping bandwidth 90-95% dari kecepatan uplink maksimal ISP untuk mengontrol antrean di router kita.'],
        stepByStepGuide: [
          'Jalankan tes latensi ping sambil memulai unduhan dan unggahan beban penuh (FIFO queue).',
          'Amati buffer antrean membengkak dan RTT melonjak hingga 450 ms (Grade F Bufferbloat).',
          'Ubah antrean antarmuka ke algoritma `fq_codel` atau `cake`.',
          'Ulangi tes kecepatan penuh dan amati latensi tetap stabil di bawah 20 ms (Grade A+ Bufferbloat).'
        ],
        expectedObservation: 'Algoritma FQ-CoDel secara proaktif membuang (drop) atau menandai paket data saat antrean buffer mulai tergenang, menjaga latensi tetap sangat rendah.',
        criticalAnalysisQuestion: 'Mengapa memperbesar ukuran buffer RAM pada router jaringan tidak selalu menjadi solusi yang baik dan justru dapat memperparah masalah lag jaringan?'
      }
    ]
  },
  {
    id: 14,
    code: 'TJKN-14',
    title: 'Troubleshooting Komprehensif TJKN',
    semester: 4,
    grade: 'Kelas XII',
    hoursAllocation: 18,
    elemen: 'Pemasangan dan Konfigurasi Perangkat Jaringan',
    capaianPembelajaran: 'Peserta didik mampu menerapkan metodologi pemecahan masalah jaringan yang terstruktur (Bottom-Up, Top-Down, Divide-and-Conquer) dari Lapisan Fisik (Layer 1) hingga Lapisan Aplikasi (Layer 7 OSI), menggunakan instrumen uji hardware dan utilitas software (Ping, Traceroute, Nslookup, Netstat, Wireshark Packet Analyzer), mendokumentasikan log insiden, dan merumuskan langkah mitigasi permanen.',
    tujuanPembelajaran: [
      'Menerapkan alur logika troubleshooting 7-Langkah Standar Industri (Identifikasi gejala, Teori penyebab, Uji teori, Rencana aksi, Implementasi perbaikan, Verifikasi fungsionalitas, Dokumentasi).',
      'Mendiagnosis gangguan pada Physical Layer (kabel putus, redaman tinggi, konektor longgar).',
      'Mendiagnosis gangguan pada Data Link & Network Layer (IP conflict, Subnet mask salah, default gateway tidak dapat dijangkau, loop STP).',
      'Menganalisis file tangkapan paket (PCAP Wireshark) untuk menemukan akar masalah kegagalan DHCP, DNS, dan TCP handshake.'
    ],
    primarySimulationType: 'topology_vlan',
    simulations: [
      {
        id: 'sim_14_1',
        taskNumber: 1,
        title: 'Troubleshooting Metodologi Bottom-Up: Kasus "No Internet Access"',
        type: 'topology_vlan',
        objective: 'Mendiagnosis dan memperbaiki komputer klien yang tidak dapat terhubung ke internet menggunakan pendekatan lapis demi lapis dari Layer 1 ke Layer 7.',
        toolsAndMaterials: ['Multi-Fault Lab Environment', 'Network Command Prompt'],
        safetyGuidelines: ['Jangan mengubah konfigurasi sebelum melakukan verifikasi status awal.'],
        stepByStepGuide: [
          'Layer 1 (Physical): Periksa lampu link LED pada kartu jaringan NIC dan port switch (Status: Menyala).',
          'Layer 2 (Data Link): Periksa tabel ARP dengan `arp -a`, pastikan MAC address switch terdaftar.',
          'Layer 3 (Network): Jalankan `ipconfig /all`, temukan IP `169.254.x.x` (APIPA - gagal DHCP).',
          'Periksa layanan DHCP server pada router, temukan IP Pool telah habis (DHCP Exhaustion).',
          'Perbesar rentang subnet DHCP pool dari /24 menjadi /23, jalankan `ipconfig /renew` pada klien.'
        ],
        expectedObservation: 'Klien langsung mendapatkan alamat IP valid dan koneksi internet kembali normal.',
        criticalAnalysisQuestion: 'Mengapa keberadaan alamat IP APIPA (169.254.0.0/16) langsung mengindikasikan bahwa masalah berada pada layanan DHCP server?'
      },
      {
        id: 'sim_14_2',
        taskNumber: 2,
        title: 'Diagnosis Tabrakan Alamat IP (IP Address Conflict) dan ARP Poisoning',
        type: 'topology_vlan',
        objective: 'Menemukan dan mengisolasi perangkat liar yang menggunakan alamat IP statis yang sama dengan IP Default Gateway router.',
        toolsAndMaterials: ['Wireshark ARP Filter', 'ARP Table Inspector'],
        safetyGuidelines: ['Gunakan fitur DHCP Snooping dan Dynamic ARP Inspection (DAI) pada switch terkelola.'],
        stepByStepGuide: [
          'Amati gejala: seluruh pengguna di lab mengalami koneksi internet putus-nyambung secara acak.',
          'Jalankan Wireshark dengan filter `arp.duplicate-address-frame`.',
          'Temukan frame ARP Reply yang mengklaim IP gateway `192.168.1.1` berasal dari dua MAC address berbeda.',
          'Lacak MAC address liar tersebut ke nomor port switch menggunakan perintah `show mac address-table`.',
          'Matikan port switch terkait dan ubah konfigurasi perangkat penyusup menjadi DHCP.'
        ],
        expectedObservation: 'Koneksi kembali stabil setelah perangkat yang berkonflik diisolasi dari segmen jaringan.',
        criticalAnalysisQuestion: 'Bagaimana fitur switch canggih Dynamic ARP Inspection (DAI) bekerja sama dengan DHCP Snooping dalam mencegah konflik IP dan serangan Man-in-the-Middle?'
      },
      {
        id: 'sim_14_3',
        taskNumber: 3,
        title: 'Analisis Kegagalan Resolusi Nama Domain (DNS Failure Troubleshooting)',
        type: 'topology_vlan',
        objective: 'Memecahkan kasus di mana klien dapat melakukan ping ke IP public `8.8.8.8`, namun gagal membuka situs web via nama domain.',
        toolsAndMaterials: ['Nslookup Tool', 'DNS Server Configurator'],
        safetyGuidelines: ['Gunakan minimal dua DNS server (Primary dan Secondary) untuk redundansi.'],
        stepByStepGuide: [
          'Uji ping ke IP publik: `ping 8.8.8.8` (Hasil: Berhasil Reply 0% loss).',
          'Uji ping ke domain: `ping google.com` (Hasil: "Ping request could not find host google.com").',
          'Jalankan perintah `nslookup smk.sch.id` untuk memeriksa server DNS yang sedang digunakan klien.',
          'Temukan bahwa IP DNS yang dibagikan DHCP adalah IP server lokal yang layanannya sedang mati.',
          'Ubah konfigurasi DNS forwarder pada router gateway ke IP DNS yang aktif (`1.1.1.1` dan `8.8.8.8`), jalankan `ipconfig /flushdns`.'
        ],
        expectedObservation: 'Resolusi nama domain kembali berfungsi seketika dan browser web dapat membuka halaman internet secara normal.',
        criticalAnalysisQuestion: 'Mengapa perintah `ipconfig /flushdns` penting dijalankan pada komputer klien setelah kita memperbaiki konfigurasi server DNS?'
      },
      {
        id: 'sim_14_4',
        taskNumber: 4,
        title: 'Investigasi Bottleneck Jaringan & Loop Topologi (Broadcast Storm STP)',
        type: 'topology_vlan',
        objective: 'Menganalisis switch yang lumpuh akibat kabel patch cord yang tercolok melingkar (loop) antar port pada switch unmanaged.',
        toolsAndMaterials: ['Switch Port Traffic Meter', 'Spanning Tree Protocol (STP) Manager'],
        safetyGuidelines: ['Selalu aktifkan BPDU Guard dan Loop Protection pada port akses switch.'],
        stepByStepGuide: [
          'Amati gejala: semua lampu LED indikator switch berkedip serentak sangat cepat dan CPU switch mencapai 100%.',
          'Gunakan Wireshark, temukan jutaan frame broadcast ARP dan Ethernet membanjiri jaringan dalam hitungan detik.',
          'Aktifkan protokol Spanning Tree (RSTP - 802.1w) pada switch distribution.',
          'Aktifkan fitur `spanning-tree bpduguard enable` pada seluruh port akses.',
          'Cabut kabel loop yang menghubungkan port 5 dan port 6 pada switch lab.'
        ],
        expectedObservation: 'Trafik broadcast storm langsung mereda, utilisasi bandwidth kembali normal, dan BPDU Guard mematikan port jika terjadi looping.',
        criticalAnalysisQuestion: 'Bagaimana Spanning Tree Protocol (STP) menentukan Root Bridge dan memblokir port cadangan (Blocking / Alternate Port) untuk mencegah loop fisik?'
      }
    ]
  }
];
