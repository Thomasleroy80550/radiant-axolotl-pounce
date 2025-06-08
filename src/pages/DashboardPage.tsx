import { MadeWithDyad } from "@/components/made-with-dyad";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DashboardPage = () => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-2">Bonjour 👋</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Nous sommes le 8 juin 2025</p>

        <div className="flex space-x-2 mb-8">
          {years.map((year) => (
            <Button
              key={year}
              variant={year === currentYear ? "default" : "outline"}
              className="rounded-full"
            >
              {year}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Bilan Financier Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Bilan Financier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">22418.07€</p>
                  <p className="text-sm text-gray-500">Vente sur l'année</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">19202.82€</p>
                  <p className="text-sm text-gray-500">Rentré d'argent sur l'année</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-red-600">6009.73€</p>
                  <p className="text-sm text-gray-500">Frais de gestion sur l'année</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">13193.09€</p>
                  <p className="text-sm text-gray-500">Résultats sur l'année</p>
                </div>
              </div>
              <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400">Voir mes statistiques -&gt;</Button>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">Mon objectif</p>
                <Progress value={53.77} className="h-2" />
                <p className="text-xs text-gray-500">53.77%</p>
                <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400">Modifier mon objectif -&gt;</Button>
              </div>
            </CardContent>
          </Card>

          {/* Activité de Location Card (Top Left) */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Activité de Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xl font-bold">11 juin à 15h</p>
                <p className="text-sm text-gray-500">Prochaine arrivée</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xl font-bold">28</p>
                  <p className="text-sm text-gray-500">Réservations sur l'année</p>
                </div>
                <div>
                  <p className="text-xl font-bold">3</p>
                  <p className="text-sm text-gray-500">Nuits sur l'année</p>
                </div>
                <div>
                  <p className="text-xl font-bold">5</p>
                  <p className="text-sm text-gray-500">Voyageurs sur l'année</p>
                </div>
                <div>
                  <p className="text-xl font-bold">62.82%</p>
                  <p className="text-sm text-gray-500">Occupation sur l'année</p>
                </div>
                <div>
                  <p className="text-xl font-bold">4398€</p>
                  <p className="text-sm text-gray-500">Prix net / nuit</p>
                </div>
                <div>
                  <p className="text-xl font-bold">4.4/5</p>
                  <p className="text-sm text-gray-500">Votre note</p>
                </div>
              </div>
              <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400">Voir mes avis -&gt;</Button>
            </CardContent>
          </Card>

          {/* Activité de Location Card (Top Right - Donut Chart) */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Activité de Location</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-full">
              {/* Placeholder for Donut Chart */}
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm mb-4">
                Donut Chart Placeholder
              </div>
              <div className="text-sm space-y-1">
                <div className="flex items-center"><span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>Airbnb</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-red-600 rounded-full mr-2"></span>Booking</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-yellow-600 rounded-full mr-2"></span>Abritel</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-green-600 rounded-full mr-2"></span>Hello Keys</div>
              </div>
              <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400 mt-4">Voir mes réservations -&gt;</Button>
            </CardContent>
          </Card>

          {/* Statistics Card (Placeholder for Chart) */}
          <Card className="shadow-md col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
              Graphique Statistiques Placeholder
            </CardContent>
          </Card>

          {/* Réservation / mois Card (Placeholder for Chart) */}
          <Card className="shadow-md col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Réservation / mois</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
              Graphique Réservation / mois Placeholder
            </CardContent>
          </Card>

          {/* Occupation Card (Placeholder for Chart) */}
          <Card className="shadow-md col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Occupation</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
              Graphique Occupation Placeholder
            </CardContent>
          </Card>
        </div>
      </div>
      <MadeWithDyad />
    </MainLayout>
  );
};

export default DashboardPage;