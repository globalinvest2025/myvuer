// src/DashboardPage.jsx - VERSIÓN REFACTORIZADA CON EVENTOS COMPLETOS

import React, { useState, Component } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { PlusCircle, Building, Edit, Trash2, Image as ImageIcon, Calendar } from 'lucide-react';
import EventsPage from './EventsPage.jsx';

// ============================================================================
// === CONSTANTES - Eliminar "Magic Strings" ===
// ============================================================================
const PREDEFINED_CATEGORIES = [
  { value: 'restaurants', label: 'Restaurant' },
  { value: 'hotels', label: 'Hotel' },
  { value: 'clinics', label: 'Clinic' },
  { value: 'gyms', label: 'Gym' },
  { value: 'stores', label: 'Store' },
];

const OTHER_CATEGORY_VALUE = 'other';

// --- List Business Modal Component ---
function ListBusinessModal({ onClose, onAddBusiness, isSubmitting }) {
    const [formData, setFormData] = useState({
        name: '', category: 'restaurants', location: '',
        description: '', phone: '', website: '', hours: '', tour_3d_url: '',
        coordinates: null, customCategory: ''
    });
    const [formError, setFormError] = useState('');
    const placePickerRef = React.useRef(null);

    const handleChange = (e) => {
        // Limpiar errores cuando el usuario interactúa con el formulario
        if (formError) {
            setFormError('');
        }
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    React.useEffect(() => {
        const inputElement = placePickerRef.current;
        if (!inputElement) return;
        
        const waitForGoogleMaps = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                setupAutocomplete();
            } else {
                setTimeout(waitForGoogleMaps, 100);
            }
        };

        const setupAutocomplete = () => {
            try {
                const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
                    types: ['establishment', 'geocode'],
                    fields: ['place_id', 'formatted_address', 'name', 'geometry']
                });

                const placeChangedListener = autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (!place || !place.geometry) return;

                    const newAddress = place.formatted_address || place.name || '';
                    const location = place.geometry.location;
                    const newCoordinates = {
                        lat: typeof location.lat === 'function' ? location.lat() : location.lat,
                        lng: typeof location.lng === 'function' ? location.lng() : location.lng
                    };
                    
                    setFormData(prev => ({
                        ...prev,
                        location: newAddress,
                        coordinates: newCoordinates,
                    }));
                });

                return () => {
                    if (placeChangedListener) {
                        window.google.maps.event.removeListener(placeChangedListener);
                    }
                };
            } catch (error) {
                console.error('Error setting up Autocomplete in modal:', error);
            }
        };

        waitForGoogleMaps();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.coordinates) {
            alert("Por favor, selecciona una dirección del autocompletado para obtener las coordenadas.");
            return;
        }
        const finalCategory = formData.category === 'other' ? formData.customCategory : formData.category;
        const businessDataToSave = { ...formData, category: finalCategory };
        onAddBusiness({ businessData: businessDataToSave });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative my-auto animate-in fade-in-0 zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 z-10 text-2xl font-bold">&times;</button>
                <h2 className="text-2xl font-bold mb-6">List a New Business</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">Business Name *</label><input name="name" required onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category *</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1">
                            <option value="restaurants">Restaurant</option>
                            <option value="hotels">Hotel</option>
                            <option value="clinics">Clinic</option>
                            <option value="gyms">Gym</option>
                            <option value="stores">Store</option>
                            <option value="other">Other / Specify</option>
                        </select>
                        {formData.category === 'other' && (
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700">Specify your category *</label>
                                <input type="text" name="customCategory" value={formData.customCategory} onChange={handleChange} placeholder="e.g., Barbershop, Auto Repair, etc." className="w-full border rounded-lg p-2 mt-1" required />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location *</label>
                        <input ref={placePickerRef} type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Introduce una dirección" className="w-full border rounded-lg p-2 mt-1" />
                        {formData.coordinates && <p className="text-xs text-green-600 mt-1">📍 Coordenadas: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}</p>}
                        {!formData.coordinates && formData.location && <p className="text-xs text-red-600 mt-1">⚠️ Selecciona una dirección del autocompletado para obtener coordenadas</p>}
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700">Description</label><textarea name="description" rows="3" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1"></textarea></div>
                    <div><label className="block text-sm font-medium text-gray-700">Hours</label><input name="hours" placeholder="e.g., 9:00 AM - 10:00 PM" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Phone Number</label><input type="tel" name="phone" placeholder="123-456-7890" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Website URL</label><input type="url" name="website" placeholder="https://example.com" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">3D Tour URL</label><input type="url" name="tour_3d_url" placeholder="https://my.matterport.com/..." onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:bg-purple-300 mt-4">
                        {isSubmitting ? 'Saving Business...' : 'Save Business'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// --- Error Boundary Component ---
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="max-w-7xl mx-auto p-6">
                    <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
                        <div className="text-center py-10">
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
                                <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
                                <p className="mb-2">We're sorry, but an error occurred while loading this page.</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Helper function for showing notifications ---
const showNotification = (message, type = 'success') => {
    const isSuccess = type === 'success';
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${isSuccess ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'} border-l-4 p-4 rounded shadow-md z-50`;

    const icon = isSuccess
        ? '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';

    notification.innerHTML = `<div class="flex items-center">${icon}${message}</div>`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, isSuccess ? 3000 : 5000);
};

// ============================================================================
// --- BusinessListPage Component ---
// ============================================================================
function BusinessListPage({ user }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: businesses, isLoading: isLoadingBusinesses } = useQuery({
        queryKey: ['businesses', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase.from('businesses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!user,
    });

    const addBusinessMutation = useMutation({
        mutationFn: async ({ businessData }) => {
            if (!user) throw new Error("User not found.");
            const { customCategory, ...cleanBusinessData } = businessData;
            const dataToInsert = { ...cleanBusinessData, user_id: user.id };
            const { data, error } = await supabase.from('businesses').insert([dataToInsert]).select();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses', user?.id] });
            showNotification('Business added successfully!', 'success');
            setIsModalOpen(false);
        },
        onError: (error) => showNotification(`Error: ${error.message}`, 'error'),
    });
    
    const deleteBusinessMutation = useMutation({
        mutationFn: async (businessId) => {
            console.log('🗑️ Starting business deletion process for ID:', businessId);
            
            try {
                // Step 1: Fetch all photos for this business
                const { data: photos, error: fetchError } = await supabase
                    .from('business_photos')
                    .select('id, url')
                    .eq('business_id', businessId);
                
                if (fetchError) {
                    console.error('Error fetching photos for deletion:', fetchError);
                    throw new Error(`Failed to fetch photos: ${fetchError.message}`);
                }
                
                console.log(`📸 Found ${photos?.length || 0} photos to delete`);
                
                // Step 2: Delete photos from Storage and database if any exist
                if (photos && photos.length > 0) {
                    const DELETE_PHOTO_URL = import.meta.env.VITE_SUPABASE_DELETE_URL || 
                        'https://dkisgcdpimagrpujochw.supabase.co/functions/v1/delete-photo';
                    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
                    
                    // Delete each photo using the Edge Function
                    for (const photo of photos) {
                        console.log(`🗑️ Deleting photo ${photo.id}: ${photo.url}`);
                        
                        // Extract storage path from URL
                        const urlParts = photo.url.split('business-photos/');
                        if (urlParts.length >= 2) {
                            const storagePath = urlParts[1];
                            
                            try {
                                const response = await fetch(DELETE_PHOTO_URL, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                        'Content-Type': 'application/json',
                                        'apikey': SUPABASE_ANON_KEY,
                                    },
                                    body: JSON.stringify({
                                        photoId: photo.id,
                                        storagePath: storagePath
                                    })
                                });
                                
                                if (!response.ok) {
                                    console.warn(`Failed to delete photo ${photo.id} via Edge Function`);
                                }
                            } catch (photoError) {
                                console.warn(`Error deleting photo ${photo.id}:`, photoError);
                                // Continue with other photos even if one fails
                            }
                        }
                    }
                    
                    // Step 3: Delete remaining photo records from database (cleanup)
                    const { error: photoDeleteError } = await supabase
                        .from('business_photos')
                        .delete()
                        .eq('business_id', businessId);
                    
                    if (photoDeleteError) {
                        console.warn('Error cleaning up photo records:', photoDeleteError);
                        // Don't throw here - continue with business deletion
                    }
                }
                
                // Step 4: Finally delete the business record
                const { error: businessDeleteError } = await supabase
                    .from('businesses')
                    .delete()
                    .eq('id', businessId);
                
                if (businessDeleteError) {
                    throw new Error(`Failed to delete business: ${businessDeleteError.message}`);
                }
                
                console.log('✅ Business and all associated photos deleted successfully');
                
            } catch (error) {
                console.error('❌ Error in business deletion process:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses', user?.id] });
            showNotification('Business and all photos deleted successfully.', 'success');
        },
        onError: (error) => {
            showNotification(`Error deleting business: ${error.message}`, 'error');
        }
    });

    const handleDeleteBusiness = (businessId, businessName) => {
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
        confirmDialog.innerHTML = `
            <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Confirm Deletion</h3>
                <p class="text-gray-600 mb-6">Are you sure you want to delete "${businessName}"? This action cannot be undone.</p>
                <div class="flex justify-end gap-3">
                    <button id="cancel-delete" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                    <button id="confirm-delete" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);

        document.getElementById('cancel-delete').addEventListener('click', () => {
            confirmDialog.remove();
        });

        document.getElementById('confirm-delete').addEventListener('click', () => {
            deleteBusinessMutation.mutate(businessId);
            confirmDialog.remove();
        });
    };

    if (isLoadingBusinesses) {
        return (
            <div className="text-center py-10">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent" role="status">
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                </div>
                <p className="mt-4 font-semibold text-xl text-gray-700">Loading Your Businesses...</p>
            </div>
        );
    }
    
    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Your Businesses</h2>
                <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Add New Business
                </button>
            </div>
            <div className="space-y-4">
                {businesses && businesses.length > 0 ? (
                    businesses.map(business => (
                        <div key={business.id} className="bg-slate-50 border rounded-lg p-4 flex justify-between items-center hover:bg-slate-100 transition-colors">
                           <div className="flex items-center gap-4">
                               <div className="bg-slate-200 p-3 rounded-lg"><Building className="w-6 h-6 text-slate-600" /></div>
                               <div>
                                   <h3 className="font-bold text-lg">{business.name}</h3>
                                   <p className="text-sm text-gray-500 capitalize">{business.category}</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-4">
                               <Link to={`/dashboard/edit/${business.id}#photos`} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                   <ImageIcon className="w-4 h-4" /> Add Photos
                               </Link>
                               <Link to={`/dashboard/edit/${business.id}`} className="text-sm font-semibold text-purple-600 hover:underline flex items-center gap-1">
                                   <Edit className="w-4 h-4" /> Edit
                               </Link>
                               <button onClick={() => handleDeleteBusiness(business.id, business.name)} disabled={deleteBusinessMutation.isPending} className="text-sm font-semibold text-red-600 hover:underline flex items-center gap-1 disabled:opacity-50">
                                   <Trash2 className="w-4 h-4" /> Delete
                               </button>
                           </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-xl">
                        <p className="text-gray-500">You haven't listed any businesses yet.</p>
                        <button onClick={() => setIsModalOpen(true)} className="mt-4 bg-purple-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto">
                           <PlusCircle className="w-5 h-5" />
                           Add Your First Business
                        </button>
                    </div>
                )}
            </div>
            {isModalOpen && (
                <ListBusinessModal
                    onClose={() => setIsModalOpen(false)}
                    onAddBusiness={addBusinessMutation.mutate}
                    isSubmitting={addBusinessMutation.isPending}
                />
            )}
        </>
    )
}

// ============================================================================
// --- COMPONENTE PRINCIPAL REFACTORIZADO: DashboardPage ---
// ============================================================================
function DashboardPage() {
    const navigate = useNavigate();
    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/register');
                return null;
            }
            return session.user;
        }
    });

    if (isLoadingUser) {
        return (
             <div className="max-w-7xl mx-auto p-6">
                 <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
                     <div className="text-center py-10">
                         <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent" role="status">
                             <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                         </div>
                         <p className="mt-4 font-semibold text-xl text-gray-700">Loading Dashboard...</p>
                     </div>
                 </div>
             </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Welcome to your Dashboard</h1>
                    <p className="text-gray-600 mt-1">Logged in as: {user?.email}</p>
                </div>

                {/* --- SECCIÓN DE NAVEGACIÓN PRINCIPAL --- */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Tarjeta para Gestionar Negocios */}
                    <Link to="/dashboard/businesses" className="group block bg-slate-50 p-6 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                               <Building className="w-8 h-8" />
                            </div>
                            <div>
                               <h2 className="text-xl font-bold text-gray-800 group-hover:text-purple-600">Manage Your Businesses</h2>
                               <p className="text-gray-500 mt-1">Add, edit, and view your business listings.</p>
                            </div>
                        </div>
                    </Link>

                    {/* Tarjeta para Gestionar Eventos */}
                    <Link to="/dashboard/events" className="group block bg-slate-50 p-6 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                               <Calendar className="w-8 h-8" />
                            </div>
                            <div>
                               <h2 className="text-xl font-bold text-gray-800 group-hover:text-green-600">Manage Your Events</h2>
                               <p className="text-gray-500 mt-1">Create and organize events for your businesses.</p>
                            </div>
                        </div>
                    </Link>
                </div>
                
                {/* --- ÁREA PARA RENDERIZAR LAS SUB-PÁGINAS --- */}
                <div className="mt-12 border-t pt-8">
                    <Routes>
                        <Route path="businesses" element={<BusinessListPage user={user} />} />
                        <Route path="events" element={<EventsPage user={user} />} />
                        <Route index element={
                            <div className="text-center text-gray-500 py-4">
                                <p>Select a category above to get started.</p>
                            </div>
                        }/>
                    </Routes>
                </div>
            </div>
        </div>
    );
}

// Wrap the DashboardPage component with ErrorBoundary
const DashboardPageWithErrorBoundary = () => (
    <ErrorBoundary>
        <DashboardPage />
    </ErrorBoundary>
);

export default DashboardPageWithErrorBoundary;
export { DashboardPage };