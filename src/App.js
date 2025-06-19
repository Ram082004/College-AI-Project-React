import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import ErrorBoundary from './Admin-Frontend/components/ErrorBoundary';
import LoginSelection from './Admin-Frontend/components/LoginSelection';
import AdminLogin from './Admin-Frontend/components/Login';
import DepartmentLogin from './department/frontend/departmentlogin';
import OfficeLogin from './office/frontend/OfficeLogin';
import AdminDashboard from './Admin-Frontend/components/Dashboard';
import DepartmentDashboard from './department/frontend/departmentDashboard'; // Fix casing
import OfficeDashboard from './office/frontend/OfficeDashboard';
import ForgotPassword from './Admin-Frontend/components/ForgetPassword';
import PrincipleLogin from './principle/frontend/principleLogin';
import PrincipleDashboard from './principle/frontend/principleDashboard';

function App() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginType, setLoginType] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserType = localStorage.getItem('userType');
    if (token) {
      setIsLoggedIn(true);
      setUserType(storedUserType);
    }
  }, []);

  const handleLoginSelection = (type) => {
    setLoginType(type);
    setShowForgotPassword(false);
  };

  const handleLoginSuccess = (type) => {
    setIsLoggedIn(true);
    setUserType(type);
    localStorage.setItem('userType', type);
  };

  const handleBackToSelection = () => {
    setLoginType(null);
    setShowForgotPassword(false);
  };

  const renderDashboard = () => {
    switch (userType) {
      case 'admin':
        return <AdminDashboard />;
      case 'department':
        return <DepartmentDashboard />;
      case 'office':
        return <OfficeDashboard />;
      case 'principle':
        return <PrincipleDashboard />;
      default:
        return null;
    }
  };

  const renderLoginComponent = () => {
    if (showForgotPassword && loginType === 'admin') {
      return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />;
    }

    switch (loginType) {
      case 'admin':
        return (
          <AdminLogin
            onForgotClick={() => setShowForgotPassword(true)}
            onLoginSuccess={() => handleLoginSuccess('admin')}
            onBack={handleBackToSelection}
          />
        );
      case 'department':
        return (
          <DepartmentLogin
            onLoginSuccess={() => handleLoginSuccess('department')}
            onBack={handleBackToSelection}
          />
        );
      case 'office':
        return (
          <OfficeLogin
            onLoginSuccess={() => handleLoginSuccess('office')}
            onBack={handleBackToSelection}
          />
        );
      case 'principle':
        return (
          <PrincipleLogin
            onLoginSuccess={() => handleLoginSuccess('principle')}
            onBack={handleBackToSelection}
          />
        );
      default:
        return <LoginSelection onSelect={handleLoginSelection} />;
    }
  };

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-navy-800 to-navy-900">
          {isLoggedIn ? renderDashboard() : renderLoginComponent()}
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
