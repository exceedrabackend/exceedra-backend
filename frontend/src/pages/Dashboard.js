import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
  Building
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentDamages, setRecentDamages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Redirect cleaners to the damage report form
  if (user?.role === 'CLEANER') {
    return <Navigate to="/report-damage" replace />;
  }

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, damagesResponse] = await Promise.all([
        user.role !== 'CLEANER' ? api.get('/damages/dashboard/stats') : Promise.resolve({ data: {} }),
        api.get('/damages?page=1&limit=5&sortBy=createdAt&sortOrder=desc')
      ]);

      if (user.role !== 'CLEANER') {
        setStats(statsResponse.data);
      }
      setRecentDamages(damagesResponse.data.damageReports);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">
            {user.role === 'CLEANER'
              ? 'Manage your damage reports and submit new ones'
              : 'Overview of all damage claims and deadlines'
            }
          </p>
        </div>
        {user.role === 'CLEANER' && (
          <Link to="/report-damage" className="btn-primary">
            <FileText className="w-4 h-4 mr-2" />
            Report Damage
          </Link>
        )}
      </div>

      {/* Stats Cards - Only for Claim Team and Admin */}
      {user.role !== 'CLEANER' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Reports
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalReports}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-warning-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Reports
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pendingReports}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-danger-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overdue Reports
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.overdueReports}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Upcoming Deadlines
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.upcomingDeadlines}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Damage Reports */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Damage Reports
            </h2>
            <Link to="/damages" className="text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
        </div>
        <div className="card-body p-0">
          {recentDamages.length === 0 ? (
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
                      Date
                    </th>
                    {user.role !== 'CLEANER' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reporter
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentDamages.map((damage) => (
                    <tr key={damage.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {damage.propertyName}
                            </div>
                            <div className="text-sm text-gray-500">
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
                              {damage.items.length > 1 && (
                                <div className="text-xs text-gray-500">
                                  +{damage.items.length - 1} more items
                                </div>
                              )}
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
                        {formatDate(damage.damageDate)}
                      </td>
                      {user.role !== 'CLEANER' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {damage.reportedBy.name}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user.role === 'CLEANER' && (
          <Link to="/report-damage" className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <FileText className="h-8 w-8 text-primary-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Report New Damage</h3>
              <p className="text-gray-500">Submit a new damage report with photos</p>
            </div>
          </Link>
        )}

        <Link to="/damages" className="card hover:shadow-lg transition-shadow">
          <div className="card-body text-center">
            <TrendingUp className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">View All Reports</h3>
            <p className="text-gray-500">Browse and manage damage reports</p>
          </div>
        </Link>

        {(user.role === 'CLAIM_TEAM' || user.role === 'ADMIN') && (
          <Link to="/users" className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <Building className="h-8 w-8 text-primary-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Users</h3>
              <p className="text-gray-500">View and manage user accounts</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;