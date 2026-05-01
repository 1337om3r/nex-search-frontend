# 🚀 NexSearch Frontend

Modern ve kullanıcı dostu arayüze sahip, web tabanlı proxy uygulaması için geliştirilmiş frontend.

NexSearch, kullanıcıların herhangi bir kurulum yapmadan tarayıcı üzerinden URL girerek web sitelerine proxy aracılığıyla erişmesini sağlar.

---

## 🌐 Canlı Demo

👉 https://nex-search-frontend.vercel.app/

---

## 🧩 Özellikler

* 🔍 URL üzerinden hızlı erişim
* ⚡ Hafif ve performanslı yapı
* 🎨 Modern UI/UX (dark theme + responsive tasarım)
* 🔗 Backend ile entegre proxy sistemi
* 🧠 Kolay kullanım (tek input ile erişim)

---

## ⚙️ Teknolojiler

* HTML5
* CSS3
* Vanilla JavaScript

---

## 🔗 Backend Entegrasyonu

Frontend, aşağıdaki endpoint üzerinden backend ile iletişim kurar:

```
POST /proxy
```

Örnek kullanım:

```js
fetch("https://nex-search-backend.onrender.com/proxy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ url: inputURL })
})
.then(res => res.text())
.then(data => {
  document.open();
  document.write(data);
  document.close();
});
```

---

## 🖥️ Kurulum (Local)

Projeyi çalıştırmak için:

```bash
git clone https://github.com/1337om3r/nex-search-frontend.git
cd nex-search-frontend
```

Ardından `index.html` dosyasını tarayıcıda açman yeterlidir.

---

## 🚀 Deploy

Frontend şu anda Vercel üzerinde deploy edilmiştir.

Deploy etmek için:

1. Repo’yu GitHub’a yükle
2. Vercel’e bağla
3. Otomatik deploy gerçekleşir

---

## ⚠️ Notlar

* Bu proje **eğitim ve geliştirme amaçlıdır**
* Bazı web siteleri (CSP, anti-bot vb.) proxy üzerinden düzgün çalışmayabilir
* Backend servisinin aktif olması gereklidir

---

## 📁 Proje Yapısı

```
nex-search-frontend/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

---

## 📄 Lisans

MIT License
