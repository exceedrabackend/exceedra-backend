import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  Search,
  Calendar,
  Building,
  User,
  FileText,
  AlertTriangle,
  Download
} from 'lucide-react';

const DamageList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    propertyName: '',
    status: '',
    page: 1
  });

  useEffect(() => {
    fetchDamages();
  }, [filters]);

  const fetchDamages = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await api.get(`/damages?${queryParams.toString()}`);
      setDamages(response.data.damageReports);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching damages:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleExportExcel = async () => {
    try {
      const queryParams = new URLSearchParams();
      // Add current filters to export (except pagination)
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const response = await api.get(`/damages/export/excel?${queryParams.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'damage-reports-export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      // You could add a toast notification here
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      PENDING: 'badge-pending',
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

  const isOverdue = (damage) => {
    return new Date(damage.airbnbDeadline) < new Date() && !damage.submittedToAirbnb;
  };

  const isDeadlineSoon = (damage) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Damage Reports</h1>
          <p className="text-gray-600">
            {user.role === 'CLEANER'
              ? 'Your submitted damage reports'
              : 'All damage reports across properties'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          {(user.role === 'CLAIM_TEAM' || user.role === 'ADMIN') && (
            <button
              onClick={handleExportExcel}
              className="btn-outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </button>
          )}
          {user.role === 'CLEANER' && (
            <Link to="/report-damage" className="btn-primary">
              <FileText className="w-4 h-4 mr-2" />
              Report Damage
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Property
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by property name..."
                  value={filters.propertyName}
                  onChange={(e) => handleFilterChange('propertyName', e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-select"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="SUBMITTED_TO_AIRBNB">Submitted to Airbnb</option>
                <option value="PROOF_REQUIRED">Proof Required</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Damage Reports Table */}
      <div className="card">
        <div className="card-body p-0">
          {damages.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No damage reports found</p>
              {user.role === 'CLEANER' && (
                <Link to="/report-damage" className="btn-primary mt-4">
                  Submit Your First Report
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Damage Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline
                      </th>
                      {user.role !== 'CLEANER' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reporter
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {damages.map((damage) => (
                      <tr
                        key={damage.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/damages/${damage.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {damage.propertyName}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-32">
                                {damage.propertyAddress}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {damage.items?.length > 0 ? (
                              <div>
                                <div>{damage.items[0].itemName}</div>
                                <div className="text-xs text-gray-500">
                                  {damage.items[0].damageType}
                                  {damage.items.length > 1 && (
                                    <span className="ml-2 bg-gray-100 text-gray-600 px-1 rounded">
                                      +{damage.items.length - 1} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              'No items'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(damage.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(damage.damageDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className={`flex items-center ${
                            isOverdue(damage) ? 'text-red-600' :
                            isDeadlineSoon(damage) ? 'text-orange-600' :
                            'text-gray-500'
                          }`}>
                            {isOverdue(damage) && <AlertTriangle className="h-4 w-4 mr-1" />}
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(damage.airbnbDeadline)}
                          </div>
                        </td>
                        {user.role !== 'CLEANER' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {damage.reportedBy.name}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                      disabled={pagination.page === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                          disabled={pagination.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            const current = pagination.page;
                            return page === 1 || page === pagination.totalPages ||
                                   (page >= current - 1 && page <= current + 1);
                          })
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] < page - 1 && (
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              )}
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pagination.page
                                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))
                        }
                        <button
                          onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                          disabled={pagination.page === pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DamageList;