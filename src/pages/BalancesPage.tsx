import React from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BalancesPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Bilans</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Bilan Annuel (2024)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xl font-bold text-green-600">Revenus: 25,000€</p>
              <p className="text-xl font-bold text-red-600">Dépenses: 8,000€</p>
              <p className="text-xl font-bold text-blue-600">Bénéfice Net: 17,000€</p>
              <p className="text-sm text-gray-500">Dernière mise à jour: 31/12/2024</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Bilan Trimestriel (T1 2025)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xl font-bold text-green-600">Revenus: 6,000€</p>
              <p className="text-xl font-bold text-red-600">Dépenses: 2,500€</p>
              <p className="text-xl font-bold text-blue-600">Bénéfice Net: 3,500€</p>
              <p className="text-sm text-gray-500">Dernière mise à jour: 31/03/2025</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Bilan Mensuel (Mai 2025)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xl font-bold text-green-600">Revenus: 2,000€</p>
              <p className="text-xl font-bold text-red-600">Dépenses: 800€</p>
              <p className="text-xl font-bold text-blue-600">Bénéfice Net: 1,200€</p>
              <p className="text-sm text-gray-500">Dernière mise à jour: 31/05/2025</p>
            </CardContent>
          </Card>
        </div>
        <Card className="shadow-md mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Rapports Détaillés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Consultez ou générez des rapports financiers détaillés pour une analyse approfondie.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">Télécharger Bilan Annuel</Button>
              <Button variant="outline">Générer Rapport Personnalisé</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default BalancesPage;