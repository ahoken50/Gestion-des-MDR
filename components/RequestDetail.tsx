import React, { useState, useEffect, useMemo } from 'react';
import type { PickupRequest } from '../types';
import { LOCATIONS, SPECIAL_ITEMS_BY_LOCATION } from '../constants';
import { TrashIcon, PlusIcon, SaveIcon, XMarkIcon } from './icons';
import { firebaseService, type FirebasePickupRequest } from '../services/firebaseService';

interface RequestDetailProps {
  request: PickupRequest | FirebasePickupRequest;
  onUpdate: (updatedRequest: PickupRequest | FirebasePickupRequest) => void;
  onCancel: () => void;
  inventory: Array<{ id: string; name: string; quantity: number; location: string }>;
}

const RequestDetail: React.FC<RequestDetailProps> = ({
  request,
  onUpdate,
  onCancel,
  inventory,
}) => {
  const isFirebase = 'requestNumber' in request;

  const [isEditing, setIsEditing] = useState(false);
  const [editedRequest, setEditedRequest] = useState<PickupRequest | FirebasePickupRequest>(request);
  const [emails, setEmails] = useState<string[]>(request.emails || []);
  const [newEmail, setNewEmail] = useState('');
  const [images, setImages] = useState<string[]>(request.images || []);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setEditedRequest(request);
    setEmails(request.emails || []);
    setImages(request.images || []);
  }, [request]);

  const availableItems = useMemo(() => {
    const specialItems = SPECIAL_ITEMS_BY_LOCATION[editedRequest.location] || [];
    const inventoryItems = inventory
      .filter(item => item.location === editedRequest.location)
      .map(item => item.name);

    let allItems = Array.from(new Set([...specialItems, ...inventoryItems]));

    // Fallback: if no items found for specific location, show all inventory items
    if (allItems.length === 0 && inventory.length > 0) {
      allItems = Array.from(new Set(inventory.map(i => i.name)));
    }

    return allItems.sort();
  }, [editedRequest.location, inventory]);

  const handleItemChange = (index: number, field: 'name' | 'quantity', value: string | number) => {
    if (!isEditing) return;

    const newItems = [...editedRequest.items];
    if (field === 'name' && typeof value === 'string') {
      if (newItems.some((item, i) => i !== index && item.name === value)) {
        alert("Ce contenant est déjà dans la demande.");
        return;
      }
      newItems[index].name = value;
    } else if (field === 'quantity' && typeof value === 'number') {
      const inventoryItem = inventory.find(i =>
        i.name === newItems[index].name && i.location === editedRequest.location
      );
      const maxQuantity = inventoryItem ? inventoryItem.quantity : Infinity;
      newItems[index].quantity = Math.max(1, Math.min(value, maxQuantity));
    }
    setEditedRequest({ ...editedRequest, items: newItems });
  };

  const handleAddItem = () => {
    if (!isEditing || availableItems.length === 0) return;

    const firstItemName = availableItems[0];
    if (!editedRequest.items.some(item => item.name === firstItemName)) {
      setEditedRequest({
        ...editedRequest,
        items: [...editedRequest.items, { name: firstItemName, quantity: 1 }]
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    if (!isEditing) return;
    setEditedRequest({
      ...editedRequest,
      items: editedRequest.items.filter((_, i) => i !== index)
    });
  };

  const handleAddEmail = () => {
    if (newEmail.trim() && !emails.includes(newEmail.trim())) {
      setEmails([...emails, newEmail.trim()]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files) as File[]) {
        if (file.size > 10 * 1024 * 1024) {
          alert(`Le fichier ${file.name} est trop volumineux (max 10MB)`);
          continue;
        }

        if (!file.type.startsWith('image/')) {
          alert(`Le fichier ${file.name} n'est pas une image`);
          continue;
        }

        if (isFirebase && 'id' in request) {
          const imageUrl = await firebaseService.addImageToRequest(request.id!, file);
          setImages(prev => [...prev, imageUrl]);
        } else {
          // Pour le mode local, convertir en base64
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setImages(prev => [...prev, e.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors du téléchargement de l\'image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setImages(images.filter(img => img !== imageUrl));
  };

  const handleSave = async () => {
    try {
      const updatedRequest = {
        ...editedRequest,
        emails,
        images
      };

      if (isFirebase && 'id' in request) {
        await firebaseService.updatePickupRequest(request.id!, updatedRequest);
      }

      onUpdate(updatedRequest);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Erreur lors de la mise à jour de la demande');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {isFirebase ? `Demande #${(request as FirebasePickupRequest).requestNumber}` : `Demande ${request.id}`}
            </h2>
            {request.bcNumber && (
              <p className="text-sm text-gray-600 dark:text-gray-400">BC: {request.bcNumber}</p>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <SaveIcon className="w-4 h-4" />
                  Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setEditedRequest(request);
                    setEmails(request.emails || []);
                    setIsEditing(false);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Modifier
                </button>
                <button
                  onClick={onCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Fermer
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numéro de BC
              </label>
              <input
                type="text"
                value={editedRequest.bcNumber || ''}
                onChange={(e) => setEditedRequest({ ...editedRequest, bcNumber: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 disabled:bg-gray-100 dark:disabled:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lieu de collecte
              </label>
              <select
                value={editedRequest.location}
                onChange={(e) => setEditedRequest({ ...editedRequest, location: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 disabled:bg-gray-100 dark:disabled:bg-gray-900"
              >
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du contact
              </label>
              <input
                type="text"
                value={editedRequest.contactName}
                onChange={(e) => setEditedRequest({ ...editedRequest, contactName: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 disabled:bg-gray-100 dark:disabled:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={editedRequest.contactPhone}
                onChange={(e) => setEditedRequest({ ...editedRequest, contactPhone: e.target.value })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 disabled:bg-gray-100 dark:disabled:bg-gray-900"
              />
            </div>
          </div>

          {/* Contenants */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Contenants à ramasser</h3>
              {isEditing && (
                <button
                  onClick={handleAddItem}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-1 px-3 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1 text-sm"
                >
                  <PlusIcon className="w-3 h-3" />
                  Ajouter
                </button>
              )}
            </div>
            <div className="space-y-2">
              {editedRequest.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-700">
                  {isEditing ? (
                    <>
                      <select
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2"
                      >
                        {availableItems.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                        min="1"
                        className="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2"
                      />
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 dark:text-gray-200">{item.name}</span>
                      <span className="font-medium dark:text-white">Quantité: {item.quantity}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={editedRequest.notes || ''}
              onChange={(e) => setEditedRequest({ ...editedRequest, notes: e.target.value })}
              disabled={!isEditing}
              rows={3}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 disabled:bg-gray-100 dark:disabled:bg-gray-900"
            />
          </div>

          {/* Courriels de suivi (Firebase uniquement) */}
          {isFirebase && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Courriels de suivi</h3>
              <div className="space-y-2">
                {emails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-700">
                    <span className="flex-1 dark:text-gray-200">{email}</span>
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Ajouter un courriel"
                      className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2"
                    />
                    <button
                      onClick={handleAddEmail}
                      className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                    >
                      Ajouter
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Images / Pièces jointes */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">📎 Pièces jointes (Images)</h3>
            <div className="space-y-3">
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Pièce jointe ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveImage(imageUrl)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-1 right-1 bg-blue-600 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Voir
                      </a>
                    </div>
                  ))}
                </div>
              )}
              {isEditing && (
                <div>
                  <label className="block">
                    <span className="sr-only">Choisir des images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    dark:file:bg-blue-900 dark:file:text-blue-200
                    hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                    disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isUploading ? '⏳ Téléchargement en cours...' : 'Max 10MB par image. Formats: JPG, PNG, GIF, WEBP'}
                  </p>
                </div>
              )}
              {images.length === 0 && !isEditing && (
                <p className="text-gray-500 italic text-sm dark:text-gray-400">Aucune pièce jointe</p>
              )}
            </div>
          </div>

          {/* Status */}
          {isFirebase && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                value={editedRequest.status}
                onChange={(e) => setEditedRequest({
                  ...editedRequest,
                  status: e.target.value as 'pending' | 'in_progress' | 'completed' | 'cancelled'
                })}
                disabled={!isEditing}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 disabled:bg-gray-100 dark:disabled:bg-gray-900"
              >
                <option value="pending">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Complétée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          )}

          {/* Facturation */}
          <div className="border-t dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">💰 Facturation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Montant de la facture ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedRequest.cost || ''}
                  onChange={(e) => setEditedRequest({ ...editedRequest, cost: parseFloat(e.target.value) || undefined })}
                  disabled={!isEditing}
                  placeholder="0.00"
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Facture (PDF ou Image)
                </label>
                {editedRequest.invoiceUrl ? (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-700">
                    <a
                      href={editedRequest.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-blue-600 hover:underline truncate text-sm dark:text-blue-400"
                    >
                      Voir la facture
                    </a>
                    {isEditing && (
                      <button
                        onClick={() => setEditedRequest({ ...editedRequest, invoiceUrl: undefined })}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                        title="Supprimer la facture"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  isEditing ? (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (file.size > 10 * 1024 * 1024) {
                            alert("Le fichier est trop volumineux (max 10MB)");
                            return;
                          }

                          setIsUploading(true);
                          try {
                            if (isFirebase && 'id' in request) {
                              const url = await firebaseService.addInvoiceToRequest(request.id!, file);
                              setEditedRequest(prev => ({ ...prev, invoiceUrl: url }));
                            } else {
                              // Local mode fallback (base64)
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setEditedRequest(prev => ({ ...prev, invoiceUrl: ev.target!.result as string }));
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          } catch (error) {
                            console.error('Error uploading invoice:', error);
                            alert("Erreur lors du téléchargement de la facture");
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          dark:file:bg-blue-900 dark:file:text-blue-200
                          hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {isUploading && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Téléchargement...</span>}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm dark:text-gray-400">Aucune facture jointe</p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;