import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, PlusCircle, Trash2, Home } from 'lucide-react';
import { addUserRoom, getUserRooms, deleteUserRoom, UserRoom } from '@/lib/user-room-api';
import { toast } from 'sonner';

const ProfilePage: React.FC = () => {
  const [rooms, setRooms] = useState<UserRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoomId, setNewRoomId] = useState<string>('');
  const [newRoomName, setNewRoomName] = useState<string>('');

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedRooms = await getUserRooms();
      setRooms(fetchedRooms);
    } catch (err: any) {
      setError(`Erreur lors du chargement des chambres : ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleAddRoom = async () => {
    if (!newRoomId.trim() || !newRoomName.trim()) {
      toast.error("Veuillez remplir l'ID et le nom de la chambre.");
      return;
    }
    setLoading(true);
    try {
      await addUserRoom(newRoomId.trim(), newRoomName.trim());
      toast.success("Chambre ajoutée avec succès !");
      setNewRoomId('');
      setNewRoomName('');
      await fetchRooms(); // Refresh the list
    } catch (err: any) {
      setError(`Erreur lors de l'ajout de la chambre : ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette chambre de votre liste ?")) {
      return;
    }
    setLoading(true);
    try {
      await deleteUserRoom(id);
      toast.success("Chambre supprimée avec succès !");
      await fetchRooms(); // Refresh the list
    } catch (err: any) {
      setError(`Erreur lors de la suppression de la chambre : ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Mon Profil & Mes Chambres</h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ajouter une Nouvelle Chambre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newRoomId">ID de la Chambre (Krossbooking)</Label>
                <Input
                  id="newRoomId"
                  type="text"
                  placeholder="Ex: 36"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newRoomName">Nom de la Chambre (pour affichage)</Label>
                <Input
                  id="newRoomName"
                  type="text"
                  placeholder="Ex: Appartement Paris 1"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <Button onClick={handleAddRoom} disabled={loading}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {loading ? 'Ajout en cours...' : 'Ajouter la Chambre'}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Mes Chambres Configurées</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && rooms.length === 0 ? (
              <p className="text-gray-500">Chargement de vos chambres...</p>
            ) : rooms.length === 0 ? (
              <p className="text-gray-500">Vous n'avez pas encore configuré de chambres. Ajoutez-en une ci-dessus !</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom de la Chambre</TableHead>
                      <TableHead>ID Krossbooking</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium flex items-center">
                          <Home className="h-4 w-4 mr-2 text-gray-500" />
                          {room.room_name}
                        </TableCell>
                        <TableCell>{room.room_id}</TableCell>
                        <TableCell>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteRoom(room.id)} disabled={loading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;