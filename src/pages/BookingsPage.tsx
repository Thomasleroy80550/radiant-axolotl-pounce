import React from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const bookings = [
  { id: 'BK001', guest: 'Jean Dupont', property: 'Appartement Paris', checkIn: '2025-07-15', checkOut: '2025-07-18', status: 'Confirmée', amount: '450€' },
  { id: 'BK002', guest: 'Marie Curie', property: 'Studio Nice', checkIn: '2025-07-20', checkOut: '2025-07-22', status: 'En attente', amount: '280€' },
  { id: 'BK003', guest: 'Pierre Martin', property: 'Maison Bordeaux', checkIn: '2025-08-01', checkOut: '2025-08-07', status: 'Confirmée', amount: '900€' },
  { id: 'BK004', guest: 'Sophie Dubois', property: 'Appartement Paris', checkIn: '2025-08-10', checkOut: '2025-08-12', status: 'Annulée', amount: '300€' },
];

const BookingsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Réservations</h1>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Liste de vos réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Réservation</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Propriété</TableHead>
                  <TableHead>Arrivée</TableHead>
                  <TableHead>Départ</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.id}</TableCell>
                    <TableCell>{booking.guest}</TableCell>
                    <TableCell>{booking.property}</TableCell>
                    <TableCell>{booking.checkIn}</TableCell>
                    <TableCell>{booking.checkOut}</TableCell>
                    <TableCell>
                      <Badge variant={
                        booking.status === 'Confirmée' ? 'default' :
                        booking.status === 'En attente' ? 'secondary' :
                        'destructive'
                      }>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{booking.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default BookingsPage;