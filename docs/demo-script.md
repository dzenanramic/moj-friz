# Demo script

A five-minute walkthrough for a salon owner. Keep it conversational. The goal is to learn how the
salon works today, not to claim that the demo is already a live product.

## Before the meeting

1. Start the app with `./scripts/demo.sh`.
2. Open `/` in a fresh browser profile or click **Resetuj demo**.
3. Check that the top bar says **Demo — podaci nisu stvarni**.
4. Do not enter any real client data.
5. If it is after salon hours, the current day will show completed appointments. Say that openly and
   open tomorrow in the calendar; do not pretend the day is still ahead.

## Five-minute flow

### 0:00 — Open

Start at `/`. Point out the fictional salon and the demo bar.

> „Ovo je demo, svi podaci su izmišljeni. Cilj je da vidite kako bi vođenje termina izgledalo na
> telefonu i računaru, prije nego što bilo šta gradimo za vaš salon.“

Click **Uđi u demo**.

### 0:30 — Today

Show the day headline, completed appointments, statuses and the next appointment panel.

> „Vlasnica odmah vidi šta je završeno, šta slijedi i ko je u smjeni. Kada je dan gotov, to je jasno
> označeno — nema lažnog broja termina.“

If the current day is late/closed:

> „Pošto je sada kraj dana, današnji termini su završeni. Otvorimo sutra da vidite pun raspored.“

### 1:00 — Calendar, filter and break

Open **Kalendar**, then open tomorrow. Point out:

- three staff columns on desktop and a readable agenda on the phone;
- free space versus booked time;
- the hairdresser filter;
- a seeded lunch break and a time off block.

Click **Dodaj pauzu**, choose 16:45–17:00 and add it. Show that it immediately becomes unavailable
in the schedule.

> „Pauza nije samo napomena. Ona blokira vrijeme, pa je ne možemo slučajno prodati klijentu.“

### 2:00 — New appointment, edit, cancel

Click **Novi termin**.

- Pick an existing client or create a fictional new one.
- Choose service, hairdresser and a date; show the free time chips.
- Add the appointment.
- Open it, change the time and save.
- Open it again and cancel it; confirm. Note that the slot is free again.

If you want to demonstrate conflict handling, try a time that is already occupied; the interface
returns a clear conflict message rather than silently overwriting.

### 3:00 — Public booking (Paket 2)

Open the **Javna stranica** link from the sidebar, or go to `/rezervacija/studio-lana`.

- Choose Žensko šišanje → Lana Jovanović.
- Choose a date and a free time.
- Enter a fictional name and dummy phone number.
- Check the privacy acknowledgement and confirm.

Point out explicitly:

> „Potvrda je odmah na ekranu. Ne šaljemo SMS ni e-mail. Klijent mora sačuvati privatni link; bez
> njega ne može mijenjati termin. Ovo je demo, pa link ne dokazuje vlasništvo telefona.“

### 4:00 — Private management

From the confirmation, open **Upravljaj terminom**.

- Show that only this appointment is visible: no other clients, no internal notes.
- Reschedule it, or cancel it with the confirmation dialog.
- Return to the salon view and show that the change is reflected there.

> „Link je privatni ključ. U pilotu će biti vezan samo za taj termin, sa rokom važenja i bez
> prikazivanja internih podataka.“

### 4:40 — Paket 1 / Paket 2 and price

Use the package switch in the top bar.

- Paket 2: public page exists.
- Paket 1: public page shows an honest lock; the core calendar remains.

Show **Postavke → Paket** for the informative price: 19 KM or 29 KM per active hairdresser/month and
the estimated monthly total. Explain that no charge happens in the demo and the pilot will be
activated manually.

### 5:00 — Reset and honesty

Click **Resetuj demo** and confirm.

> „Ovo je frontend demo. Nema baze, prijave ni stvarne rezervacije. Sljedeći korak je mali pilot sa
> pravom bazom, pravim nalozima i sigurnim razdvajanjem salona. Neću vam tvrditi da je to već
> gotovo.“

## Discovery questions for the salon visit

Ask, listen, and write down exact words:

1. Kako danas vodite termine — papir, telefon, Instagram, nešto drugo?
2. Šta vam oduzima najviše vremena: unos, izmjene, nedolasci ili odgovaranje na poruke?
3. Koliko klijenata sedmično zakaže samo preko poruka ili društvenih mreža?
4. Da li bi vam bilo važnije da klijent sam izabere termin ili da ga vi potvrđujete?
5. Šta bi moralo raditi besprekorno da biste ovo koristili svaki dan?
6. Koliko vrijedi alat koji vam smanji nedolaske i telefonske izmjene? (Ne izgovarajte cijenu kao
   fakturu; pitajte za reakciju.)
7. Da li biste pristali na 14-dnevni probni period sa vašim stvarnim podacima? Pod kojim uslovima?
8. Ko bi još u salonu trebao imati pristup?

## Do not claim

- Do not say the demo is a working backend or that it is secure against real-world abuse.
- Do not promise SMS, email, payments or a marketplace.
- Do not invent usage numbers, customer counts, savings or testimonials.
- Do not treat the private link as phone verification.
- Do not call the trial or price final without checking the agreed defaults.

## Two-minute version

Open `/` → enter demo → open calendar for tomorrow → add one appointment → open the public page and
book one → show the confirmation and explicit no-SMS copy → switch to Paket 1 → reset. Close with the
honest frontend-only limitation.
