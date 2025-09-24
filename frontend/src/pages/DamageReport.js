import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { Camera, X, Upload, Plus, Trash2 } from 'lucide-react';

const DamageReport = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([
    {
      id: Date.now(),
      itemName: '',
      damageType: '',
      description: '',
      repairCost: '',
      repairTime: '',
      replacementCost: '',
      replacementLink: '',
      images: []
    }
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      damageDate: new Date().toISOString().split('T')[0]
    }
  });

  const handleImageSelect = (itemId, event) => {
    const files = Array.from(event.target.files);
    const maxFiles = 10;
    const maxSizePerFile = 10 * 1024 * 1024; // 10MB

    const item = items.find(item => item.id === itemId);
    if (item.images.length + files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} images per item`);
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > maxSizePerFile) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }

      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }

      return true;
    });

    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, images: [...item.images, ...newImages] }
        : item
    ));
  };

  const removeImage = (itemId, imageId) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const imageToRemove = item.images.find(img => img.id === imageId);
        if (imageToRemove) {
          URL.revokeObjectURL(imageToRemove.preview);
        }
        return {
          ...item,
          images: item.images.filter(img => img.id !== imageId)
        };
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: Date.now(),
      itemName: '',
      damageType: '',
      description: '',
      repairCost: '',
      repairTime: '',
      replacementCost: '',
      replacementLink: '',
      images: []
    }]);
  };

  const removeItem = (itemId) => {
    if (items.length === 1) {
      toast.error('At least one item is required');
      return;
    }

    const item = items.find(item => item.id === itemId);
    if (item) {
      item.images.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    }

    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateItem = (itemId, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const onSubmit = async (data) => {
    // Validate items
    const invalidItems = items.filter(item => {
      // Basic validation - only item name, damage type, and images are required
      if (!item.itemName.trim() || !item.damageType || item.images.length === 0) {
        return true;
      }

      return false;
    });

    if (invalidItems.length > 0) {
      toast.error('Please fill in all item details and upload at least one image per item');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('propertyName', data.propertyName);
      formData.append('propertyAddress', data.propertyAddress || '');
      formData.append('damageDate', data.damageDate);

      // Prepare items data with image counts
      const itemsData = items.map(item => ({
        itemName: item.itemName,
        damageType: item.damageType,
        description: item.description || '',
        repairCost: item.damageType === 'REPAIR' ? parseFloat(item.repairCost) || null : null,
        repairTime: item.damageType === 'REPAIR' ? item.repairTime : null,
        replacementCost: item.damageType === 'REPLACE' ? parseFloat(item.replacementCost) || null : null,
        replacementLink: item.damageType === 'REPLACE' ? item.replacementLink : null,
        imageCount: item.images.length
      }));

      formData.append('items', JSON.stringify(itemsData));

      // Add all images in order
      items.forEach(item => {
        item.images.forEach(image => {
          formData.append('images', image.file);
        });
      });

      await api.post('/damages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Damage report submitted successfully!');

      // Clean up image previews
      items.forEach(item => {
        item.images.forEach(image => {
          URL.revokeObjectURL(image.preview);
        });
      });

      reset();
      setItems([{
        id: Date.now(),
        itemName: '',
        damageType: '',
        description: '',
        repairCost: '',
        repairTime: '',
        replacementCost: '',
        replacementLink: '',
        images: []
      }]);
      navigate('/damages');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit damage report');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Report Damage</h1>
          <p className="text-gray-600">Submit a new damage report for property maintenance</p>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Property fields (no section heading) */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name *
                </label>
                <input
                  {...register('propertyName', { required: 'Please enter property name' })}
                  type="text"
                  placeholder="e.g., Downtown Apartment, Beach House Villa"
                  className="form-input"
                />
                {errors.propertyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.propertyName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Address (Optional)
                </label>
                <input
                  {...register('propertyAddress')}
                  type="text"
                  placeholder="e.g., 123 Main St, City, State 12345"
                  className="form-input"
                />
              </div>
            </div>

            {/* Date Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Damage Date *
              </label>
              <input
                {...register('damageDate', { required: 'Please select damage date' })}
                type="date"
                className="form-input"
              />
              {errors.damageDate && (
                <p className="mt-1 text-sm text-red-600">{errors.damageDate.message}</p>
              )}
            </div>

            {/* Damaged Items */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Damaged Items</h2>

              {items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-medium text-gray-800">Item {index + 1}</h3>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item/Area Damaged *
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                      placeholder="e.g., Living room coffee table, Bedroom wall, Kitchen cabinet"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Damage Type *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="REPAIR"
                          checked={item.damageType === 'REPAIR'}
                          onChange={(e) => updateItem(item.id, 'damageType', e.target.value)}
                          className="form-radio text-primary-600"
                        />
                        <span className="text-gray-700">Needs Repair</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="REPLACE"
                          checked={item.damageType === 'REPLACE'}
                          onChange={(e) => updateItem(item.id, 'damageType', e.target.value)}
                          className="form-radio text-primary-600"
                        />
                        <span className="text-gray-700">Needs Replacement</span>
                      </label>
                    </div>
                  </div>

                  {/* Conditional fields based on damage type */}
                  {item.damageType === 'REPAIR' && (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                      <h4 className="text-sm font-medium text-blue-900">Repair Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Repair Cost
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.repairCost}
                              onChange={(e) => updateItem(item.id, 'repairCost', e.target.value)}
                              placeholder="0.00"
                              className="form-input pl-8"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Repair Time
                          </label>
                          <input
                            type="text"
                            value={item.repairTime}
                            onChange={(e) => updateItem(item.id, 'repairTime', e.target.value)}
                            placeholder="e.g., 2-3 hours, 1 day, 1 week"
                            className="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {item.damageType === 'REPLACE' && (
                    <div className="bg-green-50 p-4 rounded-lg space-y-4">
                      <h4 className="text-sm font-medium text-green-900">Replacement Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Replacement Cost
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.replacementCost}
                              onChange={(e) => updateItem(item.id, 'replacementCost', e.target.value)}
                              placeholder="0.00"
                              className="form-input pl-8"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Link
                          </label>
                          <input
                            type="url"
                            value={item.replacementLink}
                            onChange={(e) => updateItem(item.id, 'replacementLink', e.target.value)}
                            placeholder="https://amazon.com/product-link"
                            className="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      rows={2}
                      placeholder="Additional details about the damage..."
                      className="form-textarea"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Damage Photos * (Maximum 10 images, 10MB each)
                    </label>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageSelect(item.id, e)}
                        className="hidden"
                        id={`image-upload-${item.id}`}
                      />
                      <label
                        htmlFor={`image-upload-${item.id}`}
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Camera className="w-6 h-6 text-gray-400" />
                        <div>
                          <span className="text-primary-600 font-medium">Click to upload images</span>
                          <span className="text-gray-500"> or drag and drop</span>
                        </div>
                        <span className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB each</span>
                      </label>
                    </div>

                    {item.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {item.images.map(image => (
                          <div key={image.id} className="relative">
                            <img
                              src={image.preview}
                              alt="Damage preview"
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(item.id, image.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Item Button at bottom */}
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={addItem}
                  className="btn-outline text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/damages')}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DamageReport;
