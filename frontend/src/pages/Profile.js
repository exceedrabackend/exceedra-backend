import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Save
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm
  } = useForm();

  const onProfileSubmit = async (data) => {
    setIsUpdating(true);
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      if (result.success) {
        toast.success('Password changed successfully');
        resetPasswordForm();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      ADMIN: 'bg-red-100 text-red-800',
      CLAIM_TEAM: 'bg-blue-100 text-blue-800',
      CLEANER: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[role]}`}>
        <Shield className="w-3 h-3 mr-1" />
        {role.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 h-16 w-16">
              <div className="h-16 w-16 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-1" />
                  {user?.email}
                </div>
                {getRoleBadge(user?.role)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4 mr-2 inline" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Lock className="w-4 h-4 mr-2 inline" />
              Change Password
            </button>
          </nav>
        </div>

        <div className="card-body">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>

              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      {...registerProfile('name', { required: 'Name is required' })}
                      type="text"
                      className="form-input"
                    />
                    {profileErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="form-input bg-gray-50 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      {...registerProfile('phone')}
                      type="tel"
                      className="form-input"
                      placeholder="e.g., +1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="pt-2">
                      {getRoleBadge(user?.role)}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Role is managed by administrators</p>
                  </div>
                </div>

                {/* Account Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Account Information</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user?.updatedAt ? formatDate(user.updatedAt) : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                      <dd className="mt-1 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn-primary"
                  >
                    {isUpdating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                <div className="max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password *
                    </label>
                    <input
                      {...registerPassword('currentPassword', {
                        required: 'Current password is required'
                      })}
                      type="password"
                      className="form-input"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password *
                    </label>
                    <input
                      {...registerPassword('newPassword', {
                        required: 'New password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      type="password"
                      className="form-input"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <input
                      {...registerPassword('confirmPassword', {
                        required: 'Please confirm your new password'
                      })}
                      type="password"
                      className="form-input"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
                  <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                    <li>At least 6 characters long</li>
                    <li>Use a combination of letters, numbers, and special characters</li>
                    <li>Avoid using personal information</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn-primary"
                  >
                    {isUpdating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;