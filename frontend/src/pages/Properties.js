import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  FileText
} from 'lucide-react';

const Properties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    airbnbId: '',
    description: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data);
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.airbnbId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (property = null) => {
    setEditingProperty(property);
    setFormData(property || {
      name: '',
      address: '',
      airbnbId: '',
      description: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProperty(null);
    setFormData({
      name: '',
      address: '',
      airbnbId: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingProperty) {
        await api.put(`/properties/${editingProperty.id}`, formData);
        toast.success('Property updated successfully');
      } else {
        await api.post('/properties', formData);
        toast.success('Property created successfully');
      }

      fetchProperties();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await api.delete(`/properties/${propertyId}`);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete property');
    }
  };

  const toggleActive = async (property) => {
    try {
      await api.put(`/properties/${property.id}`, {
        isActive: !property.isActive
      });
      toast.success(`Property ${property.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchProperties();
    } catch (error) {
      toast.error('Failed to update property status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your Airbnb properties</p>
        </div>
        {(user.role === 'ADMIN' || user.role === 'CLAIM_TEAM') && (
          <button
            onClick={() => openModal()}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <div key={property.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Building className="w-5 h-5 text-primary-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {property.name}
                    </h3>
                  </div>

                  <div className="flex items-start mb-2 text-gray-600">
                    <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{property.address}</span>
                  </div>

                  {property.airbnbId && (
                    <p className="text-sm text-gray-500 mb-2">
                      Airbnb ID: {property.airbnbId}
                    </p>
                  )}

                  {property.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {property.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <FileText className="w-4 h-4 mr-1" />
                      {property._count?.damageReports || 0} reports
                    </div>

                    <span className={`badge ${
                      property.isActive ? 'badge-resolved' : 'badge-cancelled'
                    }`}>
                      {property.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {(user.role === 'ADMIN' || user.role === 'CLAIM_TEAM') && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => openModal(property)}
                    className="btn-outline flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>

                  <button
                    onClick={() => toggleActive(property)}
                    className={`btn-outline flex-1 ${
                      property.isActive
                        ? 'text-orange-600 border-orange-300 hover:bg-orange-50'
                        : 'text-green-600 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {property.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="btn-danger p-2"
                      title="Delete property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">
            {searchTerm ? 'No properties found matching your search' : 'No properties found'}
          </p>
          {(user.role === 'ADMIN' || user.role === 'CLAIM_TEAM') && !searchTerm && (
            <button
              onClick={() => openModal()}
              className="btn-primary mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Property
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                    placeholder="e.g., Downtown Apartment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="form-textarea"
                    rows={2}
                    placeholder="Full property address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Airbnb ID
                  </label>
                  <input
                    type="text"
                    value={formData.airbnbId}
                    onChange={(e) => setFormData({...formData, airbnbId: e.target.value})}
                    className="form-input"
                    placeholder="e.g., AIRBNB001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-textarea"
                    rows={3}
                    placeholder="Property description and notes"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingProperty ? 'Update' : 'Create'} Property
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;