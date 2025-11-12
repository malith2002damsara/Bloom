import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Plus, 
  Package, 
  ShoppingBag,
  LogOut,
  Flower,
  Phone,
  Mail,
  Lock,
  User,
  CreditCard
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import NotificationBell from './NotificationBell';

const Sidebar = () => {
  const { logout, admin, changePassword } = useAdminAuth();
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/add-items', icon: Plus, label: 'Add Items' },
    { path: '/list-items', icon: Package, label: 'List Items' },
    { path: '/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
  };

  const handlePasswordChange = async (passwords) => {
    await changePassword(passwords.currentPassword, passwords.newPassword);
  };

  return (
    <div className="bg-white shadow-lg h-screen w-64 fixed left-0 top-0 z-30 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Flower className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">BloomGrad</h1>
              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>
          </div>
          {/* Notification Bell */}
          <NotificationBell />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 sidebar-scrollbar overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {admin?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {admin?.name || 'Admin User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {admin?.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200 mb-2"
        >
          <Lock className="w-5 h-5" />
          <span className="font-medium">Change Password</span>
        </button>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordChange={handlePasswordChange}
      />
    </div>
  );
};

export default Sidebar;
