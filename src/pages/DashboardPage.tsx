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

const DashboardPage = () => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const [activityData, setActivityData] = useState([
    { name: 'Airbnb', value: 0, color: '#2563eb' }, // blue-600
    { name: 'Booking', value: 0, color: '#dc2626' }, // red-600
    { name: 'Abritel', value: 0, color: '#d97706' }, // yellow-600
    { name: 'Hello Keys', value: 0, color: '#16a34a' }, // green-600
    { name: 'Proprio', value: 0, color: '#4f46e5' }, // indigo-600 for PROPRIO
  ]);
  const [loadingActivityData, setLoadingActivityData] = useState(true);
  const [activityDataError, setActivityDataError] = useState<string | null>(null);

  const [financialData, setFinancialData] = useState({
    venteAnnee: 0,
    rentreeArgentAnnee: 0,
    fraisAnnee: 0,
    resultatAnnee: 0,
    objectifPourcentage: 0, // Assuming this will also come from GSheet, or calculated
  });
  const [loadingFinancialData, setLoadingFinancialData] = useState(true);
  const [financialDataError, setFinancialDataError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      setLoadingActivityData(true);
      setActivityDataError(null);
      try {
        const data = await callGSheetProxy({ action: 'read_sheet', range: 'DG2:DK2' });
        console.log("DEBUG (DashboardPage): Fetched activity data from GSheet:", data);

        if (data && data.length > 0 && data[0].length >= 5) {
          const [bookingValue, airbnbValue, abritelValue, helloKeysValue, proprioValue] = data[0].map(Number);

          setActivityData([
            { name: 'Airbnb', value: isNaN(airbnbValue) ? 0 : airbnbValue, color: '#2563eb' },
            { name: 'Booking', value: isNaN(bookingValue) ? 0 : bookingValue, color: '#dc2626' },
            { name: 'Abritel', value: isNaN(abritelValue) ? 0 : abritelValue, color: '#d97706' },
            { name: 'Hello Keys', value: isNaN(helloKeysValue) ? 0 : helloKeysValue, color: '#16a34a' },
            { name: 'Proprio', value: isNaN(proprioValue) ? 0 : proprioValue, color: '#4f46e5' },
          ]);
          toast.success("Données d'activité de location mises à jour !");
        } else {
          setActivityDataError("Format de données inattendu pour l'activité de location.");
          toast.error("Erreur: Format de données inattendu pour l'activité de location.");
        }
      } catch (err: any) {
        setActivityDataError(`Erreur lors du chargement des données d'activité : ${err.message}`);
        toast.error(`Erreur: ${err.message}`);
        console.error("Error fetching activity data:", err);
      } finally {
        setLoadingActivityData(false);
      }
    };

    const fetchFinancialData = async () => {
      setLoadingFinancialData(true);
      setFinancialDataError(null);
      try {
        // Fetch values from C2, D2, E2, F2
        const data = await callGSheetProxy({ action: 'read_sheet', range: 'C2:F2' });
        console.log("DEBUG (DashboardPage): Fetched financial data from GSheet:", data);

        if (data && data.length > 0 && data[0].length >= 4) {
          const [vente, rentree, frais, resultat] = data[0].map(Number);
          
          // Calculate objective percentage if 'resultat' and 'vente' are available
          const calculatedObjective = (isNaN(resultat) || isNaN(vente) || vente === 0) ? 0 : (resultat / vente) * 100;

          setFinancialData({
            venteAnnee: isNaN(vente) ? 0 : vente,
            rentreeArgentAnnee: isNaN(rentree) ? 0 : rentree,
            fraisAnnee: isNaN(frais) ? 0 : frais,
            resultatAnnee: isNaN(resultat) ? 0 : resultat,
            objectifPourcentage: calculatedObjective,
          });
          toast.success("Données financières mises à jour !");
        } else {
          setFinancialDataError("Format de données inattendu pour le bilan financier.");
          toast.error("Erreur: Format de données inattendu pour le bilan financier.");
        }
      } catch (err: any) {
        setFinancialDataError(`Erreur lors du chargement des données financières : ${err.message}`);
        toast.error(`Erreur: ${err.message}`);
        console.error("Error fetching financial data:", err);
      } finally {
        setLoadingFinancialData(false);
      }
    };

    fetchActivityData();
    fetchFinancialData();
  }, []); // Empty dependency array means this runs once on mount

  // Monthly Financial Data for Line Chart (kept as hardcoded for now)
  const monthlyFinancialData = [
    { name: 'Jan', montantVerse: 2500, frais: 500, benef: 2000, ca: 3000 },
    { name: 'Fév', montantVerse: 2800, frais: 550, benef: 2250, ca: 3350 },
    { name: 'Mar', montantVerse: 2200, frais: 450, benef: 1750, ca: 2650 },
    { name: 'Avr', montantVerse: 3000, frais: 600, benef: 2400, ca: 3600 },
    { name: 'Mai', montantVerse: 2700, frais: 520, benef: 2180, ca: 3220 },
    { name: 'Juin', montantVerse: 3200, frais: 650, benef: 2550, ca: 3850 },
    { name: 'Juil', montantVerse: 3500, frais: 700, benef: 2800, ca: 4200 },
    { name: 'Août', montantVerse: 3800, frais: 750, benef: 3050, ca: 4550 },
    { name: 'Sep', montantVerse: 3100, frais: 620, benef: 2480, ca: 3720 },
    { name: 'Oct', montantVerse: 2900, frais: 580, benef: 2320, ca: 3480 },
    { name: 'Nov', montantVerse: 3300, frais: 660, benef: 2640, ca: 3960 },
    { name: 'Déc', montantVerse: 3600, frais: 720, benef: 2880, ca: 4320 },
  ];

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
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{financialData.venteAnnee.toFixed(2)}€</p>
                      <p className="text-sm text-gray-500">Vente sur l'année</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{financialData.rentreeArgentAnnee.toFixed(2)}€</p>
                      <p className="text-sm text-gray-500">Rentré d'argent sur l'année</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-red-600">{financialData.fraisAnnee.toFixed(2)}€</p>
                      <p className="text-sm text-gray-500">Frais de gestion sur l'année</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{financialData.resultatAnnee.toFixed(2)}€</p>
                      <p className="text-sm text-gray-500">Résultats sur l'année</p>
                    </div>
                  </div>
                  <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400">Voir mes statistiques -&gt;</Button>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300">Mon objectif</p>
                    <Progress value={financialData.objectifPourcentage} className="h-2" />
                    <p className="text-xs text-gray-500">{financialData.objectifPourcentage.toFixed(2)}%</p>
                    <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400">Modifier mon objectif -&gt;</Button>
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
            <CardContent className="flex flex-col items-center justify-center h-full">
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
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart isAnimationActive={true}>
                      <Pie
                        data={activityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
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
                  <div className="text-sm space-y-1 mt-4">
                    {activityData.map((item) => (
                      <div key={item.name} className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
              <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400 mt-4">Voir mes réservations -&gt;</Button>
            </CardContent>
          </Card>

          {/* Statistiques Card (Line Chart for Financial Data) */}
          <Card className="shadow-md col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Statistiques Financières Mensuelles</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
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
                  <Line type="monotone" dataKey="ca" stroke="hsl(var(--primary))" name="CA" strokeWidth={2} dot={false} animationDuration={1500} animationEasing="ease-in-out" />
                  <Line type="monotone" dataKey="montantVerse" stroke="hsl(var(--secondary))" name="Montant Versé" strokeWidth={2} dot={false} animationDuration={1500} animationEasing="ease-in-out" />
                  <Line type="monotone" dataKey="frais" stroke="hsl(var(--destructive))" name="Frais" strokeWidth={2} dot={false} animationDuration={1500} animationEasing="ease-in-out" />
                  <Line type="monotone" dataKey="benef" stroke="#22c55e" name="Bénéfice" strokeWidth={2} dot={false} animationDuration={1500} animationEasing="ease-in-out" />
                </LineChart>
              </ResponsiveContainer>
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
                  <Line type="monotone" dataKey="reservations" stroke="hsl(var(--accent))" name="Réservations" strokeWidth={2} dot={false} animationDuration={1500} animationEasing="ease-in-out" />
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
                  <Line type="monotone" dataKey="occupation" stroke="hsl(var(--secondary))" name="Occupation" strokeWidth={2} dot={false} animationDuration={1500} animationEasing="ease-in-out" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
      <MadeWithDyad />
    </MainLayout>
  );
};

export default DashboardPage;