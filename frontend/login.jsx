import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { RoleContext } from '../context/RoleContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('customer');
  
  const { setUserRole } = useContext(RoleContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      // Save token
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      // Set role in context
      setUserRole(res.data.user.role);
      
      // Redirect based on role
      redirectByRole(res.data.user.role);
      
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
    
    setLoading(false);
  };

  const redirectByRole = (userRole) => {
    switch(userRole) {
      case 'super_admin': navigate('/super-admin'); break;
      case 'event_manager': navigate('/event-manager'); break;
      case 'vendor': navigate('/vendor'); break;
      case 'marketing': navigate('/marketing'); break;
      default: navigate('/customer');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="logo">
            <h1>🎟️ EventHub</h1>
            <p>Event Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="demo-logins">
            <h3>🔥 Quick Demo Login</h3>
            <div className="demo-buttons">
              <button 
                onClick={() => {
                  setFormData({email: 'admin@eventhub.com', password: '123456'});
                }}
                className="demo-btn admin"
              >
                👑 Super Admin
              </button>
              <button 
                onClick={() => {
                  setFormData({email: 'manager@eventhub.com', password: '123456'});
                }}
                className="demo-btn manager"
              >
                🎪 Event Manager
              </button>
              <button 
                onClick={() => {
                  setFormData({email: 'vendor@eventhub.com', password: '123456'});
                }}
                className="demo-btn vendor"
              >
                💰 Vendor
              </button>
              <button 
                onClick={() => {
                  setFormData({email: 'marketing@eventhub.com', password: '123456'});
                }}
                className="demo-btn marketing"
              >
                📣 Marketing
              </button>
              <button 
                onClick={() => {
                  setFormData({email: 'customer@eventhub.com', password: '123456'});
                }}
                className="demo-btn customer"
              >
                🎟️ Customer
              </button>
            </div>
          </div>

          <div className="register-link">
            <Link to="/register">Create New Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;