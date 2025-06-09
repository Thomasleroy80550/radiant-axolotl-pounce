import { MadeWithDyad } from "@/components/made-with-dyad";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import React, { useState, useEffect } from "react";
import { callGSheetProxy } from "@/lib/gsheets";
import { toast } from "sonner";
import ObjectiveDialog from "@/components/ObjectiveDialog"; // Import the new dialog component
import { getProfile } from "@/lib/profile-api"; // Import getProfile

const DashboardPage = () => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const [activityData, setActivityData] = useState([
    { name: 'Airbnb', value: 0, color: '#1e40af' }, // blue-800
    { name: 'Booking', value: 0, color: '#ef4444' }, // red-500
    { name: 'Abritel', value: 0, color: '#3b82f6' }, // blue-500
    { name: 'Hello Keys', value: 0, color: '#0e7490' }, // cyan-700
    { name: 'Proprio', value: 0, color: '#4f46e5' }, // indigo-600 for PROPRIO
  ]);
  const [loadingActivityData, setLoadingActivityData] = useState(true);
  const [activityDataError, setActivityDataError] = useState<string | null>(null);

  const [financialData, setFinancialData] = useState({
    venteAnnee: 0,
    rentreeArgentAnnee: 0,
    fraisAnnee: 0,
    resultatAnnee: 0,
    currentAchievementPercentage: 0, // Renamed for clarity
  });
  const [loadingFinancialData, setLoadingFinancialData] = useState(true);
  const [financialDataError, setFinancialDataError] = useState<string | null>(null);

  const [monthlyFinancialData, setMonthlyFinancialData] = useState<any[]>([]);
  const [loadingMonthlyFinancialData, setLoadingMonthlyFinancialData] = useState(true);
  const [monthlyFinancialDataError, setMonthlyFinancialDataError] = useState<string | null>(null);

  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false);
  const [userObjectiveAmount, setUserObjectiveAmount] = useState(0); // User's target objective in Euros

  const fetchData = async () => {
    // Fetch Activity Data
    setLoadingActivityData(true);
    setActivityDataError(null);
    try {
      const data = await callGSheetProxy({ action: 'read_sheet', range: 'DG2:DK2' });
      if (data && data.length > 0 && data[0].length >= 5) {
        const [bookingValue, airbnbValue, abritelValue, helloKeysValue, proprioValue] = data[0].map(Number);
        setActivityData([
          { name: 'Airbnb', value: isNaN(airbnbValue) ? 0 : airbnbValue, color: '#1e40af' },
          { name: 'Booking', value: isNaN(bookingValue) ? 0 : bookingValue, color: '#ef4444' },
          { name: 'Abritel', value: isNaN(abritelValue) ? 0 : abritelValue, color: '#3b82f6' },
          { name: 'Hello Keys', value: isNaN(helloKeysValue) ? 0 : helloKeysValue, color: '#0e7490' },
          { name: 'Proprio', value: isNaN(proprioValue) ? 0 : proprioValue, color: '#4f46e5' },
        ]);
        console.log("DEBUG: Activity Data fetched:", data);
      } else {
        setActivityDataError("Format de données inattendu pour l'activité de location.");
      }
    } catch (err: any) {
      setActivityDataError(`Erreur lors du chargement des données d'activité : ${err.message}`);
      console.error("Error fetching activity data:", err);
    } finally {
      setLoadingActivityData(false);
    }

    // Fetch Financial Data and User Profile
    setLoadingFinancialData(true);
    setFinancialDataError(null);
    try {
      const [financialSheetData, userProfile] = await Promise.all([
        callGSheetProxy({ action: 'read_sheet', range: 'C2:F2' }),
        getProfile(),
      ]);

      let currentResultatAnnee = 0;
      if (financialSheetData && financialSheetData.length > 0 && financialSheetData[0].length >= 4) {
        const [vente, rentree, frais, resultat] = financialSheetData[0].map(Number);
        currentResultatAnnee = isNaN(resultat) ? 0 : resultat;

        setFinancialData(prev => ({
          ...prev,
          venteAnnee: isNaN(vente) ? 0 : vente,
          rentreeArgentAnnee: isNaN(rentree) ? 0 : rentree,
          fraisAnnee: isNaN(frais) ? 0 : frais,
          resultatAnnee: currentResultatAnnee,
        }));
      } else {
        setFinancialDataError("Format de données inattendu pour le bilan financier.");
      }

      if (userProfile) {
        const objectiveAmount = userProfile.objective_amount || 0;
        setUserObjectiveAmount(objectiveAmount);

        // Calculate achievement percentage based on 'resultatAnnee' and 'objective_amount'
        const calculatedAchievement = (objectiveAmount === 0) ? 0 : (currentResultatAnnee / objectiveAmount) * 100;
        setFinancialData(prev => ({
          ...prev,
          currentAchievementPercentage: calculatedAchievement,
        }));
      } else {
        setFinancialDataError("Impossible de charger le profil utilisateur.");
      }
    } catch (err: any) {
      setFinancialDataError(`Erreur lors du chargement des données financières ou du profil : ${err.message}`);
      console.error("Error fetching financial data or profile:", err);
    } finally {
      setLoadingFinancialData(false);
    }

    // Fetch Monthly Financial Data
    setLoadingMonthlyFinancialData(true);
    setMonthlyFinancialDataError(null);
    try {
      const data = await callGSheetProxy({ action: 'read_sheet', range: 'BU2:CF5' });
      if (data && data.length >= 4) {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const caValues = data[0] || [];
        const montantVerseValues = data[1] || [];
        const fraisValues = data[2] || [];
        const benefValues = data[3] || [];

        const formattedData = months.map((month, index) => ({
          name: month,
          ca: parseFloat(caValues[index]) || 0,
          montantVerse: parseFloat(montantVerseValues[index]) || 0,
          frais: parseFloat(fraisValues[index]) || 0,
          benef: parseFloat(benefValues[index]) || 0,
        }));
        setMonthlyFinancialData(formattedData);
      } else {
        setMonthlyFinancialDataError("Format de données inattendu pour les statistiques financières mensuelles.");
      }
    } catch (err: any) {
      setMonthlyFinancialDataError(`Erreur lors du chargement des statistiques financières mensuelles : ${err.message}`);
      console.error("Error fetching monthly financial data:", err);
    } finally {
      setLoadingMonthlyFinancialData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  const reservationPerMonthData = [
    { name: 'Jan', reservations: 10 },
    { name: 'Fév', reservations: 12 },
    { name: 'Mar', reservations: 8 },
    { name: 'Avr', reservations: 15 },
    { name: 'Mai', reservations: 11 },
    { name: 'Juin', reservations: 14 },
    { name: 'Juil', reservations: 18 },
    { name: 'Août', reservations: 16 },
    { name: 'Sep', reservations: 13 },
    { name: 'Oct', reservations: 9 },
    { name: 'Nov', reservations: 10 },
    { name: 'Déc', reservations: 12 },
  ];

  const occupationRateData = [
    { name: 'Jan', occupation: 65 },
    { name: 'Fév', occupation: 70 },
    { name: 'Mar', occupation: 55 },
    { name: 'Avr', occupation: 80 },
    { name: 'Mai', occupation: 72 },
    { name: 'Juin', occupation: 78 },
    { name: 'Juil', occupation: 85 },
    { name: 'Août', occupation: 88 },
    { name: 'Sep', occupation: 75 },
    { name: 'Oct', occupation: 60 },
    { name: 'Nov', occupation: 68 },
    { name: 'Déc', occupation: 70 },
  ];

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
              {loadingFinancialData ? (
                <p className="text-gray-500">Chargement des données financières...</p>
              ) : financialDataError ? (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Erreur de chargement</AlertTitle>
                  <AlertDescription>{financialDataError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-start">
                      <p className="text-xl md:text-2xl font-bold text-green-600">{financialData.venteAnnee.toFixed(2)}€</p>
                      <p className="text-sm text-gray-500">Vente sur l'année</p>
                    </div>
                    <div className="flex flex-col items-start">
                      <p className="text-xl md:text-2xl font-bold text-orange-600">{financialData.rentreeArgentAnnee.toFixed(2)}€</p>
                      <p className="text-sm text-gray-500">Rentré d'argent sur l'année</p>
                    </div>
                    <div className="flex flex-col items-start">
                      <p className="text-xl md:text-2xl font-bold text-red-600">{financialData.fraisAnnee.toFixed(2)}€</p>
                      <p className="text-sm text-gray-500">Frais de gestion sur l'année</p>
                    </div>
                    <div className="flex flex-col items-start">
                      <p className="text-xl md:text-2xl font-bold text-green-600">{financialData.resultatAnnee.toFixed(2)}€</p>
                      <p className="text-sm text-gray-500">Résultats sur l'année</p>
                    </div>
                  </div>
                  <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400">Voir mes statistiques -&gt;</Button>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300">Mon objectif: <span className="font-bold">{userObjectiveAmount.toFixed(2)}€</span></p>
                    <Progress value={financialData.currentAchievementPercentage} className="h-2" />
                    <p className="text-xs text-gray-500">Atteint: {financialData.currentAchievementPercentage.toFixed(2)}%</p>
                    <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400" onClick={() => setIsObjectiveDialogOpen(true)}>
                      Modifier mon objectif -&gt;
                    </Button>
                  </div>
                </>
              )}
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
            <CardContent className="flex flex-col p-4"> {/* Removed md:justify-center here */}
              {loadingActivityData ? (
                <p className="text-gray-500">Chargement des données d'activité...</p>
              ) : activityDataError ? (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Erreur de chargement</AlertTitle>
                  <AlertDescription>{activityDataError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* New wrapper for chart and legend */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-center md:gap-x-8 w-full">
                    <div className="w-full md:w-3/5" style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart isAnimationActive={true}>
                          <Pie
                            data={activityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={100}
                            outerRadius={140}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            animationDuration={1000}
                            animationEasing="ease-in-out"
                          >
                            {activityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-sm space-y-2 mt-4 md:mt-0 md:ml-4 md:w-2/5 flex flex-col items-start">
                      {activityData.map((item) => (
                        <div key={item.name} className="flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400 mt-4 md:self-end">Voir mes réservations -&gt;</Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Statistiques Card (Line Chart for Financial Data) */}
          <Card className="shadow-md col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Statistiques Financières Mensuelles</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {loadingMonthlyFinancialData ? (
                <p className="text-gray-500">Chargement des statistiques mensuelles...</p>
              ) : monthlyFinancialDataError ? (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Erreur de chargement</AlertTitle>
                  <AlertDescription>{monthlyFinancialDataError}</AlertDescription>
                </Alert>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyFinancialData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} isAnimationActive={true}>
                    <CartesianGrid strokeDasharray="1 1" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="name" className="text-sm text-gray-600 dark:text-gray-400" />
                    <YAxis className="text-sm text-gray-600 dark:text-gray-400" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => `${value}€`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="ca" stroke="hsl(var(--primary))" name="CA" strokeWidth={3} dot={{ r: 4 }} animationDuration={1500} animationEasing="ease-in-out" />
                    <Line type="monotone" dataKey="montantVerse" stroke="hsl(var(--secondary))" name="Montant Versé" strokeWidth={3} dot={{ r: 4 }} animationDuration={1500} animationEasing="ease-in-out" />
                    <Line type="monotone" dataKey="frais" stroke="hsl(var(--destructive))" name="Frais" strokeWidth={3} dot={{ r: 4 }} animationDuration={1500} animationEasing="ease-in-out" />
                    <Line type="monotone" dataKey="benef" stroke="#22c55e" name="Bénéfice" strokeWidth={3} dot={{ r: 4 }} animationDuration={1500} animationEasing="ease-in-out" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Réservation / mois Card (Line Chart) */}
          <Card className="shadow-md col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Réservation / mois</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reservationPerMonthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} isAnimationActive={true}>
                  <CartesianGrid strokeDasharray="1 1" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="name" className="text-sm text-gray-600 dark:text-gray-400" />
                  <YAxis className="text-sm text-gray-600 dark:text-gray-400" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="reservations" stroke="hsl(var(--accent))" name="Réservations" strokeWidth={3} dot={{ r: 4 }} animationDuration={1500} animationEasing="ease-in-out" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Occupation Card (Line Chart) */}
          <Card className="shadow-md col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Occupation</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupationRateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} isAnimationActive={true}>
                  <CartesianGrid strokeDashArray="1 1" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="name" className="text-sm text-gray-600 dark:text-gray-400" />
                  <YAxis unit="%" className="text-sm text-gray-600 dark:text-gray-400" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => `${value}%`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="occupation" stroke="hsl(var(--secondary))" name="Occupation" strokeWidth={3} dot={{ r: 4 }} animationDuration={1500} animationEasing="ease-in-out" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
      <MadeWithDyad />
      <ObjectiveDialog
        isOpen={isObjectiveDialogOpen}
        onOpenChange={setIsObjectiveDialogOpen}
        currentObjectiveAmount={userObjectiveAmount} // Pass the amount
        onObjectiveUpdated={fetchData} // Re-fetch all data after objective is updated
      />
    </MainLayout>
  );
};

export default DashboardPage;