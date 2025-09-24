import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  FileText,
  Camera,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const DamageDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [damage, setDamage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [claimAmount, setClaimAmount] = useState('');
  const [guestName, setGuestName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');

  useEffect(() => {
    fetchDamageDetail();
  }, [id]);

  const fetchDamageDetail = async () => {
    try {
      const response = await api.get(`/damages/${id}`);
      setDamage(response.data);
    } catch (error) {
      toast.error('Failed to load damage details');
      navigate('/damages');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus, submittedToAirbnb = false) => {
    setStatusLoading(true);
    try {
      await api.put(`/damages/${id}/status`, {
        status: newStatus,
        submittedToAirbnb
      });

      toast.success('Status updated successfully');
      fetchDamageDetail();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleApproval = () => {
    setShowApprovalModal(true);
  };

  const confirmApproval = async () => {
    if (!claimAmount || parseFloat(claimAmount) <= 0) {
      toast.error('Please enter a valid claim amount');
      return;
    }
    if (!guestName || guestName.trim() === '') {
      toast.error('Please enter the guest name');
      return;
    }
    if (!confirmationCode || confirmationCode.trim() === '') {
      toast.error('Please enter the confirmation code');
      return;
    }
    if (!receivedAmount || parseFloat(receivedAmount) < 0) {
      toast.error('Please enter a valid received amount');
      return;
    }

    setStatusLoading(true);
    try {
      await api.put(`/damages/${id}/status`, {
        status: 'APPROVED',
        claimAmount: parseFloat(claimAmount),
        guestName: guestName.trim(),
        confirmationCode: confirmationCode.trim(),
        receivedAmount: parseFloat(receivedAmount)
      });

      toast.success('Damage report approved successfully');
      setShowApprovalModal(false);
      setClaimAmount('');
      setGuestName('');
      setConfirmationCode('');
      setReceivedAmount('');
      fetchDamageDetail();
    } catch (error) {
      toast.error('Failed to approve damage report');
    } finally {
      setStatusLoading(false);
    }
  };


  const getStatusBadge = (status) => {
    const statusStyles = {
      PENDING: 'badge-pending',
      APPROVED: 'badge-resolved',
      IN_REVIEW: 'badge-in-review',
      SUBMITTED_TO_AIRBNB: 'badge-submitted',
      PROOF_REQUIRED: 'badge-proof-required',
      RESOLVED: 'badge-resolved',
      CANCELLED: 'badge-cancelled'
    };

    return (
      <span className={`badge ${statusStyles[status] || 'badge-pending'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = () => {
    return new Date(damage.airbnbDeadline) < new Date() && !damage.submittedToAirbnb;
  };

  const isDeadlineSoon = () => {
    const daysUntilDeadline = Math.ceil((new Date(damage.airbnbDeadline) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 3 && daysUntilDeadline > 0 && !damage.submittedToAirbnb;
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!damage) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Damage report not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/damages')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Damage Reports
        </button>
      </div>

      {/* Header Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">
                Damage Report - {damage.propertyName}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-gray-600">
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{damage.propertyName}</span>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{damage.reportedBy.name}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span>{formatDate(damage.damageDate)}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span>{damage.items?.length || 0} items</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end space-y-2">
              {getStatusBadge(damage.status)}
              {(isOverdue() || isDeadlineSoon()) && (
                <div className={`text-sm ${isOverdue() ? 'text-red-600' : 'text-orange-600'}`}>
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {isOverdue() ? 'Overdue!' : 'Deadline Soon!'}
                  </div>
                  <div className="lg:text-right">Deadline: {formatDate(damage.airbnbDeadline)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Details</h2>
            </div>
            <div className="card-body">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Property</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div>{damage.propertyName}</div>
                    {damage.propertyAddress && (
                      <div className="text-gray-500">{damage.propertyAddress}</div>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Items</dt>
                  <dd className="mt-1 text-sm text-gray-900">{damage.items?.length || 0}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Damage Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(damage.damageDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Checkout Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(damage.checkoutDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Airbnb Deadline</dt>
                  <dd className={`mt-1 text-sm ${
                    isOverdue() ? 'text-red-600 font-medium' :
                    isDeadlineSoon() ? 'text-orange-600 font-medium' :
                    'text-gray-900'
                  }`}>
                    {formatDate(damage.airbnbDeadline)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Proof Deadline</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(damage.proofDeadline)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reported By</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div>{damage.reportedBy.name}</div>
                    <div className="text-gray-500">{damage.reportedBy.email}</div>
                    {damage.reportedBy.phone && (
                      <div className="text-gray-500">{damage.reportedBy.phone}</div>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Submitted to Airbnb</dt>
                  <dd className="mt-1 text-sm">
                    {damage.submittedToAirbnb ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Yes ({damage.submittedAt ? formatDate(damage.submittedAt) : 'N/A'})
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        No
                      </span>
                    )}
                  </dd>
                </div>
                {damage.status === 'APPROVED' && damage.claimAmount && (
                  <>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Approval Information</dt>
                      <dd className="mt-1 text-sm">
                        {damage.approvedAt && (
                          <div className="text-xs text-gray-500 mb-2">
                            Approved on {formatDate(damage.approvedAt)}
                          </div>
                        )}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-xs font-medium text-gray-500">Claim Amount</span>
                              <p className="text-green-600 font-medium text-lg">
                                ${parseFloat(damage.claimAmount).toFixed(2)}
                              </p>
                            </div>
                            {damage.receivedAmount && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">Received Amount</span>
                                <p className="text-green-600 font-medium text-lg">
                                  ${parseFloat(damage.receivedAmount).toFixed(2)}
                                </p>
                              </div>
                            )}
                            {damage.guestName && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">Guest Name</span>
                                <p className="text-sm text-gray-900">{damage.guestName}</p>
                              </div>
                            )}
                            {damage.confirmationCode && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">Confirmation Code</span>
                                <p className="text-sm text-gray-900">{damage.confirmationCode}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </dd>
                    </div>
                  </>
                )}
              </dl>

            </div>
          </div>

          {/* Damaged Items */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                Damaged Items ({damage.items?.length || 0})
              </h2>
            </div>
            <div className="card-body space-y-6">
              {(!damage.items || damage.items.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No items reported</p>
                </div>
              ) : (
                damage.items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        Item {index + 1}: {item.itemName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.damageType === 'REPAIR'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.damageType === 'REPAIR' ? 'Needs Repair' : 'Needs Replacement'}
                      </span>
                    </div>

                    {item.description && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    )}

                    {/* Repair/Replacement Details */}
                    {(item.damageType === 'REPAIR' && (item.repairCost || item.repairTime)) && (
                      <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Repair Details</h4>
                        <div className="space-y-2">
                          {item.repairCost && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">Estimated Cost</span>
                              <p className="text-sm text-gray-900">${parseFloat(item.repairCost).toFixed(2)}</p>
                            </div>
                          )}
                          {item.repairTime && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">Estimated Time</span>
                              <p className="text-sm text-gray-900">{item.repairTime}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(item.damageType === 'REPLACE' && (item.replacementCost || item.replacementLink)) && (
                      <div className="mb-4 bg-green-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-green-900 mb-2">Replacement Details</h4>
                        <div className="space-y-2">
                          {item.replacementCost && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">Replacement Cost</span>
                              <p className="text-sm text-gray-900">${parseFloat(item.replacementCost).toFixed(2)}</p>
                            </div>
                          )}
                          {item.replacementLink && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">Product Link</span>
                              <a
                                href={item.replacementLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                              >
                                {item.replacementLink}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Images ({item.images?.length || 0})
                      </h4>
                      {(!item.images || item.images.length === 0) ? (
                        <div className="text-center py-4 text-gray-400 border border-dashed border-gray-200 rounded">
                          <Camera className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">No images for this item</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {item.images.map((image) => (
                            <div
                              key={image.id}
                              className="relative cursor-pointer group"
                              onClick={() => {
                                setSelectedImage(image.imageUrl);
                                setShowImageModal(true);
                              }}
                            >
                              <img
                                src={image.imageUrl}
                                alt={image.description || `${item.itemName} damage photo`}
                                className="w-full h-24 object-cover rounded-lg group-hover:opacity-75 transition-opacity"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-25 rounded-lg transition-all" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6 order-1 lg:order-2">
          {(user.role === 'CLAIM_TEAM' || user.role === 'ADMIN') && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
              </div>
              <div className="card-body space-y-3">
                {damage.status === 'PENDING' && (
                  <>
                    <button
                      onClick={handleApproval}
                      disabled={statusLoading}
                      className="btn-success w-full"
                    >
                      {statusLoading ? <LoadingSpinner size="sm" /> : 'Approved'}
                    </button>
                    <button
                      onClick={() => updateStatus('CANCELLED')}
                      disabled={statusLoading}
                      className="btn-danger w-full"
                    >
                      Cancel Claim
                    </button>
                  </>
                )}

                {damage.status !== 'PENDING' && damage.status !== 'CANCELLED' && (
                  <button
                    onClick={() => updateStatus('CANCELLED')}
                    disabled={statusLoading}
                    className="btn-danger w-full"
                  >
                    Cancel Claim
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Timeline would go here in a real app */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Deadlines</h2>
            </div>
            <div className="card-body space-y-3">
              <div className={`p-3 rounded-lg ${
                isOverdue() ? 'bg-red-50 border border-red-200' :
                isDeadlineSoon() ? 'bg-orange-50 border border-orange-200' :
                'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Airbnb Deadline</span>
                  <span className={`text-sm ${
                    isOverdue() ? 'text-red-600' :
                    isDeadlineSoon() ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    {formatDate(damage.airbnbDeadline)}
                  </span>
                </div>
                {damage.submittedToAirbnb && (
                  <div className="text-xs text-green-600 mt-1">
                    ✓ Submitted to Airbnb
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Proof Deadline</span>
                  <span className="text-sm text-gray-600">
                    {formatDate(damage.proofDeadline)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Approve Damage Claim
            </h3>
            <p className="text-gray-600 mb-4">
              Enter the approved claim amount for this damage report:
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter guest name"
                  className="form-input w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Code
                </label>
                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Enter confirmation code"
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Claim Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="0.00"
                    className="form-input pl-8 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="0.00"
                    className="form-input pl-8 w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={confirmApproval}
                disabled={statusLoading || !claimAmount || !guestName || !confirmationCode || !receivedAmount}
                className="btn-success flex-1"
              >
                {statusLoading ? <LoadingSpinner size="sm" /> : 'Approve'}
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setClaimAmount('');
                  setGuestName('');
                  setConfirmationCode('');
                  setReceivedAmount('');
                }}
                disabled={statusLoading}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Damage photo"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DamageDetail;