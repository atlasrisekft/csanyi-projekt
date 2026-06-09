import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  onBack: () => void;
}

export const TermsPage = ({ onBack }: Props) => {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Vissza
          </Button>
          <h1 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
            Általános Szerződési Feltételek
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-10 sm:py-14">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Általános Szerződési Feltételek
        </h1>
        <p className="text-sm text-slate-400 mb-10">Utoljára módosítva: 2025. január 1.</p>

        <section className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. A szolgáltató adatai</h2>
            <p>
              A Hangösvény alkalmazást (a továbbiakban: „Szolgáltatás") a Csányi Alapítvány
              (a továbbiakban: „Szolgáltató") üzemelteti. Az Alapítvány célja a látássérült és
              gyengénlátó személyek digitális akadálymentességének előmozdítása.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. A Szolgáltatás tárgya</h2>
            <p>
              A Hangösvény egy interaktív webalkalmazás, amely lehetővé teszi, hogy a felhasználók
              képekhez hangos leírásokat, narációkat és hangzónákat rendeljenek hozzá. A Szolgáltatás
              célja a vizuális tartalmak hangalapú megközelíthetővé tétele látássérült személyek
              számára.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">3. A Szolgáltatás igénybevételének feltételei</h2>
            <p>
              A Szolgáltatás ingyenesen igénybe vehető regisztrált felhasználók számára. A regisztrációhoz
              érvényes e-mail cím megadása szükséges. Kiskorúak csak szülői vagy törvényes képviselői
              hozzájárulással vehetik igénybe a Szolgáltatást.
            </p>
            <p className="mt-3">
              A felhasználó a Szolgáltatás használatával elfogadja jelen Általános Szerződési Feltételeket.
              A Szolgáltató fenntartja a jogot, hogy a feltételeket előzetes értesítés nélkül módosítsa.
              A módosítások a közzétételüktől hatályosak.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">4. A felhasználó jogai és kötelezettségei</h2>
            <p>A felhasználó jogosult:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>hangösvény projektek létrehozására, szerkesztésére és törlésére;</li>
              <li>projektjeit nyilvánossá tenni a közösségi galériában;</li>
              <li>más felhasználók nyilvános projektjeit megtekinteni és meghallgatni.</li>
            </ul>
            <p className="mt-3">A felhasználó köteles:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>tartózkodni mások szerzői jogait sértő tartalmak feltöltésétől;</li>
              <li>nem tölthet fel jogellenes, sértő, gyűlöletre uszító vagy megtévesztő tartalmat;</li>
              <li>a hozzáférési adatait bizalmasan kezelni, és azokat harmadik félnek nem átadni.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Szellemi tulajdon</h2>
            <p>
              A Szolgáltatás kódbázisa, arculati elemei és dokumentációja a Csányi Alapítvány
              szellemi tulajdonát képezik. A felhasználó által feltöltött tartalmak (képek, hangfájlok)
              szerzői joga a feltöltő felhasználónál marad; a Szolgáltatásba való feltöltéssel a
              felhasználó nem kizárólagos, ingyenes licencet ad a Szolgáltatónak a tartalom
              tárhelyen való elhelyezésére és megjelenítésére.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">6. A Szolgáltatás elérhetősége és felelősség korlátozása</h2>
            <p>
              A Szolgáltató törekszik a folyamatos elérhetőség biztosítására, de nem vállal
              felelősséget az esetleges leállásokból, adatvesztésből vagy technikai hibákból
              eredő károkért. A Szolgáltatás „ahogy van" alapon érhető el, mindenféle
              szavatosság nélkül.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Fiók megszüntetése</h2>
            <p>
              A felhasználó bármikor kérheti fiókja törlését az alkalmazáson belüli beállításokban
              vagy e-mailben. A Szolgáltató fenntartja a jogot, hogy szabályzatot súlyosan sértő
              felhasználó fiókját azonnali hatállyal felfüggessze vagy törölje.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Irányadó jog</h2>
            <p>
              Jelen feltételekre a magyar jog az irányadó. A felek közötti jogvitákban a magyar
              bíróságok rendelkeznek hatáskörrel.
            </p>
          </div>

        </section>
      </main>
    </div>
  );
};
