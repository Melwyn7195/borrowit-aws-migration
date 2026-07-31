import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  User,
  LogOut
} from 'lucide-react'

const Sidebar_Seller = ({ active }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };
  
  const items = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/seller/dashboard' },
    { name: 'Products', icon: Package, path: '/seller/products' },
    { name: 'Orders', icon: ShoppingCart, path: '/seller/orders' },
    { name: 'Profile', icon: User, path: '/seller/profile' },
    { name: 'Log Out', icon: LogOut, action: 'logout' }
  ];

  return (
    <aside className="w-[280px] min-h-screen bg-[#0a0a0a] text-white px-4 py-6 flex flex-col">
      <Link to="/" className="flex items-center gap-3 mb-8 px-3 hover:opacity-80 transition-opacity">
        <span className="text-xl font-bold tracking-wide">BORROWIT</span>
        <span className="bg-[#ff4757] text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl tracking-wide">
          SELLER
        </span>
      </Link>
      <nav className="flex-1">
        <ul className="flex flex-col gap-1">
          {items.map(item => {
            const Icon = item.icon
            const isActive = item.name === active || location.pathname === item.path
            
            if (item.action === 'logout') {
              return (
                <li key={item.name}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-lg
                      transition-all duration-200 text-[15px] font-medium w-full text-left
                      text-[#8e8e8e] hover:bg-[#1a1a1a] hover:text-white"
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                  </button>
                </li>
              )
            }

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3.5 px-4 py-3.5 rounded-lg
                    transition-all duration-200 text-[15px] font-medium
                    ${isActive 
                      ? 'bg-[#ff4757] text-white' 
                      : 'text-[#8e8e8e] hover:bg-[#1a1a1a] hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar_Seller