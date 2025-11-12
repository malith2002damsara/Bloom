import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag,
  LogOut,
  Flower,
  UserPlus,
  List,
  Lock,
  Receipt
} from 'lucide-react';
import { useSuperAdminAuth } from '../context/SuperAdminAuthContext';
import ChangePasswordModal from './ChangePasswordModal';

const Sidebar = () => {
  const { logout, superAdmin, changePassword } = useSuperAdminAuth();
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/add-admin', icon: UserPlus, label: 'Add Admin' },
    { path: '/list-admin', icon: Users, label: 'List Admin' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' }
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
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Flower className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">BloomGrad</h1>
            <p className="text-sm text-gray-500">Super Admin Panel</p>
          </div>
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
                      ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600'
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
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {superAdmin?.name?.charAt(0) || 'S'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {superAdmin?.name || 'Super Admin'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {superAdmin?.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors duration-200 mb-2"
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