import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, PlusCircle, Trash2, Home, Save } from 'lucide-react';
import { addUserRoom, getUserRooms, deleteUserRoom, UserRoom } from '@/lib/user-room-api';
import { getUserProfile, updateUserProfile, UserProfile } from '@/lib/user-profile-api';
import { toast } from 'sonner';

const ProfilePage: React.FC = () => {
  const [rooms, setRooms] = useState<UserRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);
  const [errorRooms, setErrorRooms] = useState<string | null>(null);
  const [newRoomId, setNewRoomId] = useState<string>('');
  const [newRoomName, setNewRoomName] = useState<string>('');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  const [googleSheetId, setGoogleSheetId] = useState<string>('');
  const [googleSheetTab, setGoogleSheetTab] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');

  // Fetch user profile and rooms on component mount
  useEffect(() => {
    const loadData = async () => {
      // Load Profile
      setLoadingProfile(true);
      setErrorProfile(null);
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
        if (profile) {
          setGoogleSheetId(profile.google_sheet_id || '');
          setGoogleSheetTab(profile.google_sheet_tab || '');
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
        }
      } catch (err: any) {
        setErrorProfile(`Erreur lors du chargement du profil : ${err.message}`);
        toast.error(`Erreur: ${err.message}`);
      } finally {
        setLoadingProfile(false);
      }

      // Load Rooms
      setLoadingRooms(true);
      setErrorRooms(null);
      try {
        const fetchedRooms = await getUserRooms();
        setRooms(fetchedRooms);
      } catch (err: any) {
        setErrorRooms(`Erreur lors du chargement des chambres : ${err.message}`);
        toast.error(`Erreur: ${err.message}`);
      } finally {
        setLoadingRooms(false);
      }
    };

    loadData();
  }, []);

  const handleAddRoom = async () => {
    if (!newRoomId.trim() || !newRoomName.trim()) {
      toast.error("Veuillez remplir l'ID et le nom de la chambre.");
      return;
    }
    setLoadingRooms(true);
    try {
      await addUserRoom(newRoomId.trim(), newRoomName.trim());
      toast.success("Chambre ajoutée avec succès !");
      setNewRoomId('');
      setNewRoomName('');
      const fetchedRooms = await getUserRooms(); // Refresh the list
      setRooms(fetchedRooms);
    } catch (err: any) {
      setErrorRooms(`Erreur lors de l'ajout de la chambre : ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette chambre de votre liste ?")) {
      return;
    }
    setLoadingRooms(true);
    try {
      await deleteUserRoom(id);
      toast.success("Chambre supprimée avec succès !");
      const fetchedRooms = await getUserRooms(); // Refresh the list
      setRooms(fetchedRooms);
    } catch (err: any) {
      setErrorRooms(`Erreur lors de la suppression de la chambre : ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoadingProfile(true);
    setErrorProfile(null);
    try {
      const updatedProfile = await updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        google_sheet_id: googleSheetId.trim() || null,
        google_sheet_tab: googleSheetTab.trim() || null,
      });
      setUserProfile(updatedProfile);
      toast.success("Profil mis à jour avec succès !");
    } catch (err: any) {
      setErrorProfile(`Erreur lors de la mise à jour du profil : ${err.message}`);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Mon Profil & Mes Chambres</h1>

        {(errorRooms || errorProfile) && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{errorRooms || errorProfile}</AlertDescription>
          </Alert>
        )}

        {/* User Profile Section */}
        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Mes Informations de Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Votre prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loadingProfile}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Votre nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loadingProfile}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="googleSheetId">ID de la Feuille Google (Spreadsheet ID)</Label>
              <Input
                id="googleSheetId"
                type="text"
                placeholder="Ex: 1ABC2DEF3GHI..."
                value={googleSheetId}
                onChange={(e) => setGoogleSheetId(e.target.value)}
                disabled={loadingProfile}
              />
              <p className="text-sm text-gray-500">Vous trouverez l'ID dans l'URL de votre feuille Google : `https://docs.google.com/spreadsheets/d/<ID_DE_LA_FEUILLE>/edit`</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="googleSheetTab">Nom de l'Onglet (Sheet Name)</Label>
              <Input
                id="googleSheetTab"
                type="text"
                placeholder="Ex: Réservations"
                value={googleSheetTab}
                onChange={(e) => setGoogleSheetTab(e.target.value)}
                disabled={loadingProfile}
              />
              <p className="text-sm text-gray-500">Le nom de l'onglet spécifique dans votre feuille (ex: "Feuil1", "Données").</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={loadingProfile}>
              <Save className="h-4 w-4 mr-2" />
              {loadingProfile ? 'Sauvegarde en cours...' : 'Sauvegarder le Profil'}
            </Button>
          </CardContent>
        </Card>

        {/* Room Management Section */}
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
                  disabled={loadingRooms}
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
                  disabled={loadingRooms}
                />
              </div>
            </div>
            <Button onClick={handleAddRoom} disabled={loadingRooms}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {loadingRooms ? 'Ajout en cours...' : 'Ajouter la Chambre'}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Mes Chambres Configurées</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRooms && rooms.length === 0 ? (
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
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteRoom(room.id)} disabled={loadingRooms}>
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