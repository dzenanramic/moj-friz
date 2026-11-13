import { buttonClassName } from '@/components/ui/Button'
import { usePageTitle } from '@/lib/hooks'

export function PrivacyPage() {
  usePageTitle('Obavještenje o privatnosti (nacrt)')

  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-ink">Obavještenje o privatnosti</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Nacrt koji vlasnik salona treba dati na pravnu provjeru prije pilot verzije. Nije pravni
        dokument i ne predstavlja tvrdnju o usklađenosti. U demou se ne obrađuju stvarni podaci.
      </p>

      <div className="mt-8 space-y-7 rounded-lg bg-surface px-5 py-6 text-sm leading-relaxed text-ink sm:px-7 sm:py-8">
        <section>
          <h2 className="text-lg font-semibold">Ko obrađuje podatke</h2>
          <p className="mt-2 text-muted">
            Salon <strong className="font-medium text-ink">Studio Lana</strong> (izmišljeni salon u
            demou), Banja Luka. Kontakt za pitanja o privatnosti je telefon salona prikazan na
            stranici za rezervaciju.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Koje podatke koristimo</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted">
            <li>Ime i prezime i broj telefona koje unesete pri rezervaciji.</li>
            <li>Uslugu, frizera, datum i vrijeme termina.</li>
            <li>
              Kratke poslovne napomene koje salon unese. Salon je upućen da ne unosi zdravstvene ni
              druge osjetljive podatke.
            </li>
          </ul>
          <p className="mt-2 text-muted">
            Ne tražimo kreiranje korisničkog računa. U ovoj fazi ne šaljemo SMS ni e-mail i ne
            provjeravamo vlasništvo broja telefona.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Zašto ih koristimo</h2>
          <p className="mt-2 text-muted">
            Da salon zakaže termin, kontaktira vas u vezi termina i vodi osnovnu evidenciju
            dolazaka. Podatke ne koristimo za oglašavanje ni prodaju.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Gdje se čuvaju</h2>
          <p className="mt-2 text-muted">
            U ovom demou podaci ostaju u vašem pregledniku (localStorage) i mogu se obrisati
            dugmetom „Resetuj demo“. U pilot verziji podaci će se čuvati u salonovoj bazi i
            backupima; tačan način čuvanja, rok i postupak brisanja biće potvrđeni prije puštanja
            pilota.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Vaša prava i kontakt</h2>
          <p className="mt-2 text-muted">
            Za pristup, ispravku ili brisanje podataka kontaktirajte salon. U pilotu će salon imati
            dokumentovan ručni postupak izvoza i brisanja, uključujući ograničenja koja proizlaze iz
            backupa.
          </p>
        </section>

        <p className="text-xs text-muted">
          Napomena za vlasnika: ovo obavještenje treba pravna provjera i dopuna stvarnim podacima o
          salonu, hosting lokaciji i rokovima čuvanja. Ne tvrditi usklađenost bez te provjere.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/rezervacija/studio-lana" className={buttonClassName('secondary')}>
          Nazad na rezervaciju
        </a>
        <a href="/" className={buttonClassName('quiet')}>
          Demo početna
        </a>
      </div>
    </article>
  )
}
