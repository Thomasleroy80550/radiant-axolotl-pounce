import React from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar'; // Import the Calendar component

const CalendarPage: React.FC = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Calendrier</h1>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Votre calendrier des réservations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow"
            />
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Date sélectionnée : {date ? date.toLocaleDateString('fr-FR') : 'Aucune'}
            </p>
            <div className="mt-6 w-full">
              <h2 className="text-xl font-semibold mb-3">Événements à venir</h2>
              <ul className="space-y-2">
                <li className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <p className="font-medium">15 juillet 2025 : Arrivée de M. Dupont</p>
                  <p className="text-sm text-gray-500">Appartement Paris - 3 nuits</p>
                </li>
                <li className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <p className="font-medium">20 juillet 2025 : Départ de Mme. Martin</p>
                  <p className="text-sm text-gray-500">Studio Nice</p>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CalendarPage;