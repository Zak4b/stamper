import { useState, useEffect } from 'react';
import { Dossier, getAllDossiers, addDossier as addDossierDB, deleteDossier as deleteDossierDB, importDossiers } from '../lib/database';
import { Plus, Trash2, Upload, Download } from 'lucide-react';

export default function DatabaseManager() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [newDossier, setNewDossier] = useState({ numero: '', valeur: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDossiers();
  }, []);

  async function loadDossiers() {
    setLoading(true);
    try {
      const data = await getAllDossiers();
      setDossiers(data);
    } catch (error) {
      alert('Erreur de chargement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
    setLoading(false);
  }

  async function addDossier() {
    if (!newDossier.numero || !newDossier.valeur) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      await addDossierDB(newDossier.numero, newDossier.valeur);
      setNewDossier({ numero: '', valeur: '' });
      loadDossiers();
    } catch (error) {
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  }

  async function deleteDossier(id: number) {
    try {
      await deleteDossierDB(id);
      loadDossiers();
    } catch (error) {
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  }

  async function importCSV(file: File) {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const [numero, valeur] = lines[i].split(',').map(s => s.trim());
      if (numero && valeur) {
        records.push({ numero_dossier: numero, valeur_tampon: valeur });
      }
    }

    if (records.length === 0) {
      alert('Aucun enregistrement valide trouvé');
      return;
    }

    try {
      const count = await importDossiers(records);
      alert(`${count} dossiers importés avec succès`);
      loadDossiers();
    } catch (error) {
      alert('Erreur d\'importation: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  }

  function exportCSV() {
    const csv = ['numero_dossier,valeur_tampon'];
    dossiers.forEach(d => {
      csv.push(`${d.numero_dossier},${d.valeur_tampon}`);
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dossiers.csv';
    a.click();
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Base de données des dossiers</h2>
        <div className="flex gap-2">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Importer CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])}
            />
          </label>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Exporter CSV</span>
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Ajouter un dossier</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Numéro de dossier"
            value={newDossier.numero}
            onChange={(e) => setNewDossier({ ...newDossier, numero: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Valeur du tampon"
            value={newDossier.valeur}
            onChange={(e) => setNewDossier({ ...newDossier, valeur: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addDossier}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Chargement...</div>
      ) : dossiers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun dossier. Ajoutez-en un ou importez un fichier CSV.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Numéro de dossier
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Valeur du tampon
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {dossiers.map((dossier) => (
                <tr key={dossier.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{dossier.numero_dossier}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{dossier.valeur_tampon}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteDossier(dossier.id)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
