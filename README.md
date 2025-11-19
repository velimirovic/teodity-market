# 🛒 Teodity Market

E-commerce marketplace aplikacija izgrađena sa React-om i Node.js/Express-om. Podržava prodaju po fiksnoj ceni i aukcije, sa sistemom uloga za kupce, prodavce i administratore.

## 📋 Sadržaj

- [O Projektu](#o-projektu)
- [Funkcionalnosti](#funkcionalnosti)
- [Tehnologije](#tehnologije)
- [Instalacija](#instalacija)
- [Pokretanje](#pokretanje)

---

## O Projektu

Teodity Market je web aplikacija za online kupovinu i prodaju. Projekat omogućava kupcima da pregledaju proizvode, dodaju ih u korpu i kupuju, dok prodavci mogu da postavljaju proizvode po fiksnoj ceni ili kao aukcije. Administratori imaju kontrolu nad korisnicima, recenzijama i prijavama.

---

## Funkcionalnosti

### 🛍️ Za Kupce
- Pregled i pretraga proizvoda
- Filtriranje po kategorijama
- Dodavanje u korpu
- Kupovina proizvoda (fiksna cena ili aukcija)
- Ostavljanje recenzija
- Pregled istorije kupovina

### 💼 Za Prodavce
- Postavljanje novih proizvoda
- Izbor tipa prodaje (fiksna cena ili aukcija)
- Upravljanje proizvodima
- Pregled istorije prodaja
- Upload slika proizvoda

### 🔧 Za Administratore
- Upravljanje korisnicima
- Moderiranje recenzija
- Upravljanje prijavama
- Praćenje sumnjivih korisnika

### ✨ Dodatno
- Email notifikacije (Nodemailer)
- Leaflet mape za lokacije proizvoda
- Responzivan dizajn
- Animacije (Framer Motion)

---

## Tehnologije

### Frontend
- React 19.1.1
- React Router DOM 7.8.2
- Framer Motion 12.23.12
- React Leaflet 5.0.0
- CSS3

### Backend
- Node.js
- Express.js 5.1.0
- Nodemailer 7.0.6
- Multer 2.0.2 (upload slika)
- dotenv

---

## Instalacija

### Preduslov
- Node.js (v14+)
- npm

### Koraci

1. **Kloniraj repozitorijum**
```bash
git clone https://github.com/velimirovic/teodity-market.git
cd teodity-market
```

2. **Instaliraj zavisnosti**
```bash
# Root zavisnosti
npm install

# Client zavisnosti
cd client
npm install

# Server zavisnosti
cd ../server
npm install
cd ..
```

3. **Podesi environment varijable**

Napravi `.env` fajl u `server` folderu:
```env
EMAIL_USER=tvoj-email@gmail.com
EMAIL_PASSWORD=tvoj-gmail-app-password
PORT=5000
```

**Kako dobiti Gmail App Password:**
1. Idi na [Google Account Security](https://myaccount.google.com/security)
2. Uključi 2-Step Verification
3. Idi na [App Passwords](https://myaccount.google.com/apppasswords)
4. Generiši password za "Mail"
5. Kopiraj password u `.env` fajl

---

## Pokretanje

Otvori **dva terminala**:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

Aplikacija će biti dostupna na:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## Struktura Projekta

```
web-e2-ftn/
├── client/                      # React frontend
│   ├── public/
│   └── src/
│       ├── components/          # Reusable komponente
│       │   ├── CategorySelector/
│       │   ├── Footer/
│       │   ├── NavBar/
│       │   ├── ProductCard/
│       │   └── SearchFilterBar/
│       ├── contexts/            # React contexts
│       │   ├── AuthContext.js
│       │   └── NavigationContext.js
│       ├── pages/               # Stranice
│       │   ├── Home/
│       │   ├── Shop/
│       │   ├── ProductInfo/
│       │   ├── BuyerCart/
│       │   ├── AdminReviews/
│       │   └── ...
│       ├── App.js
│       └── index.js
│
└── server/                      # Node.js backend
    ├── routes/                  # API rute
    │   ├── products.js
    │   ├── users.js
    │   ├── reviews.js
    │   ├── reports.js
    │   └── categories.js
    ├── data/                    
    │   ├── json/                # JSON baza podataka
    │   └── images/              # Upload slike
    ├── emailService.js          # Email funkcionalnost
    └── server.js                # Server entry point
```

---

## API Endpoints

### Products
- `GET /products` - Svi proizvodi
- `GET /products/:id` - Proizvod po ID-u
- `POST /products` - Kreiraj proizvod
- `PUT /products/:id` - Ažuriraj proizvod
- `DELETE /products/:id` - Obriši proizvod

### Users
- `GET /users` - Svi korisnici
- `GET /users/:id` - Korisnik po ID-u
- `POST /users` - Registruj korisnika
- `PUT /users/:id` - Ažuriraj korisnika

### Reviews
- `GET /reviews` - Sve recenzije
- `POST /reviews` - Kreiraj recenziju
- `DELETE /reviews/:id` - Obriši recenziju

### Reports & Categories
- `GET /reports` - Sve prijave
- `POST /reports` - Kreiraj prijavu
- `GET /categories` - Sve kategorije

---

## Napomene

- Projekat koristi JSON fajlove za skladištenje podataka
- Za produkciju preporučuje se migracija na pravu bazu (MongoDB, PostgreSQL)
- Email notifikacije zahtevaju konfigurisanje Gmail App Password-a

---

## Autor

Projekat rađen u sklopu kursa Web programiranje na Fakultetu tehničkih nauka (FTN), Novi Sad.
