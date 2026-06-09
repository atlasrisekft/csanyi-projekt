import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  onBack: () => void;
}

export const PrivacyPage = ({ onBack }: Props) => {
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
            Adatvédelmi tájékoztató
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-10 sm:py-14">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Adatvédelmi tájékoztató
        </h1>
        <p className="text-sm text-slate-400 mb-10">Utoljára módosítva: 2025. január 1.</p>

        <section className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Adatkezelő</h2>
            <p>
              Az adatkezelő a Csányi Alapítvány (a továbbiakban: „Adatkezelő"). Jelen tájékoztató
              az Európai Unió 2016/679 számú általános adatvédelmi rendeletével (GDPR) és a
              hatályos magyar adatvédelmi jogszabályokkal összhangban készült.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Kezelt személyes adatok és céljaik</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Adat</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Cél</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Jogalap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3">E-mail cím</td>
                    <td className="px-4 py-3">Fiók létrehozása és azonosítás</td>
                    <td className="px-4 py-3">Szerződés teljesítése</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Feltöltött képek és hangfájlok</td>
                    <td className="px-4 py-3">Hangösvény projekt tárolása és megjelenítése</td>
                    <td className="px-4 py-3">Szerződés teljesítése</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Projekt metaadatok</td>
                    <td className="px-4 py-3">Galéria megjelenítése, megosztás</td>
                    <td className="px-4 py-3">Jogos érdek</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Böngésző napló adatok</td>
                    <td className="px-4 py-3">Hibakeresés, biztonság</td>
                    <td className="px-4 py-3">Jogos érdek</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Adattárolás és adatbiztonság</h2>
            <p>
              Az adatokat a Supabase felhőszolgáltatás infrastruktúráján tároljuk, amelynek
              adatközpontjai az Európai Unió területén találhatók. Az Adatkezelő technikai és
              szervezeti intézkedésekkel gondoskodik az adatok védelméről, beleértve a titkosított
              adatátvitelt (HTTPS) és a hozzáférési jogok korlátozását.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Adatmegőrzési idő</h2>
            <p>
              A személyes adatokat a fiók fennállásáig, illetve a felhasználó törlési kérelméig
              tároljuk. A feltöltött médiafájlok a projekt törlésekor azonnal eltávolításra
              kerülnek a tárolórendszerből.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Az érintett jogai</h2>
            <p>A GDPR alapján Ön jogosult:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Hozzáférési jog:</strong> tájékoztatást kérni az Önről kezelt adatokról;</li>
              <li><strong>Helyesbítési jog:</strong> pontatlan adatok javítását kérni;</li>
              <li><strong>Törlési jog („az elfeledtetéshez való jog"):</strong> adatai törlését kérni;</li>
              <li><strong>Az adatkezelés korlátozásához való jog:</strong> adatai kezelésének korlátozását kérni;</li>
              <li><strong>Adathordozhatóság joga:</strong> adatait géppel olvasható formátumban megkapni;</li>
              <li><strong>Tiltakozás joga:</strong> jogos érdeken alapuló adatkezelés ellen tiltakozni.</li>
            </ul>
            <p className="mt-3">
              Jogai gyakorlásához kérjük, lépjen kapcsolatba velünk. Panasszal a Nemzeti Adatvédelmi
              és Információszabadság Hatóságnál (NAIH, <span className="font-medium">www.naih.hu</span>) élhet.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Sütik (cookie-k)</h2>
            <p>
              A Hangösvény kizárólag a működéshez szükséges munkamenet-sütiket használ. Harmadik
              fél által elhelyezett analitikai vagy marketing célú sütiket az alkalmazás nem alkalmaz.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Kapcsolat</h2>
            <p>
              Adatvédelmi kérdésekkel és joggyakorlási igényekkel kapcsolatban kérjük, lépjen
              kapcsolatba velünk az alkalmazáson belüli profil menüpontban, vagy írjon a
              Csányi Alapítvány elérhetőségein.
            </p>
          </div>

        </section>
      </main>
    </div>
  );
};
