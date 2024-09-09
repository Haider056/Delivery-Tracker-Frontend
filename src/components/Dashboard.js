import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';

const Dashboard = () => {
  const [orders, setOrders] = useState({
    "Ready for Pickup": [],
    "Failed Delivery": [],
    "Returned": [],
    "Lost": [] // Section for Lost orders
  });
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('Ready for Pickup');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  useEffect(() => {
    if (filter === 'Lost') {
      setFilteredOrders(orders['Lost']);
    } else {
      const filtered = orders[filter] || [];
      setFilteredOrders(sortOrders(filtered));
    }
  }, [orders, filter]);

  const fetchAllOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:8000/get_all_orders', {
        params: { email: 'vitaglowmore@gmail.com' } // Replace with actual user email
      });

      const allOrders = response.data;
      const { readyForPickup, lostOrders } = categorizeOrders(allOrders['Ready for Pickup']);

      // Update the orders state with separated 'Lost' and filtered 'Ready for Pickup'
      setOrders({ 
        ...allOrders, 
        "Ready for Pickup": readyForPickup, 
        Lost: lostOrders 
      });
      setFilteredOrders(sortOrders(allOrders[filter] || []));
    } catch (error) {
      console.error('Error fetching all orders:', error);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const categorizeOrders = (readyForPickupOrders) => {
    // Move only 7+ day old orders from 'Ready for Pickup' to 'Lost'
    const lostOrders = readyForPickupOrders.filter(order => differenceInDays(new Date(), new Date(order.date)) > 7);
    const filteredReadyForPickup = readyForPickupOrders.filter(order => differenceInDays(new Date(), new Date(order.date)) <= 7);

    return { readyForPickup: filteredReadyForPickup, lostOrders };
  };

  const checkNewOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:8000/fetch_emails');
      const { new_orders, all_orders } = response.data;

      const { readyForPickup, lostOrders } = categorizeOrders(all_orders['Ready for Pickup']);
      setOrders({ 
        ...all_orders, 
        "Ready for Pickup": readyForPickup, 
        Lost: lostOrders 
      });
      setFilteredOrders(sortOrders(all_orders[filter] || []));
      
      const newOrdersCount = Object.values(new_orders).flat().length;
      alert(`${newOrdersCount} new order(s) found and added to the dashboard.`);
    } catch (error) {
      console.error('Error checking new orders:', error);
      setError('Failed to check new orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsReturned = async (orderNumber) => {
    try {
      await axios.post(`http://127.0.0.1:8000/orders/${orderNumber}/mark-returned`);
      alert('Order marked as returned');
      fetchAllOrders();
    } catch (error) {
      console.error('Error marking order as returned:', error);
      alert('Failed to mark order as returned. Please try again.');
    }
  };

  const handleFilterChange = (category) => {
    setFilter(category);
  };

  const sortOrders = (orders) => {
    return orders.sort((a, b) => {
      const daysA = differenceInDays(new Date(), new Date(a.date));
      const daysB = differenceInDays(new Date(), new Date(b.date));
      return daysB - daysA;
    });
  };

  const getColorForDate = (orderDate) => {
    const daysDiff = differenceInDays(new Date(), new Date(orderDate));
    if (daysDiff > 7) return 'bg-gray-500'; // Shouldn't appear in Ready for Pickup as it's moved to Lost
    if (daysDiff > 5) return 'bg-red-500'; // 5+ days
    if (daysDiff > 3) return 'bg-yellow-500'; // 4-5 days
    return 'bg-green-500'; // 3 days or less
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error!</strong>
      <span className="block sm:inline"> {error}</span>
    </div>
  );

  return (
    <div className="container mx-auto p-4 lg:px-24"> {/* Added padding for white spaces */}
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-700">Orders Dashboard</h1>
      
      <div className="flex justify-center mb-6">
        <button 
          onClick={checkNewOrders} 
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md shadow-lg"
        >
          Check New Orders
        </button>
      </div>

      <div className="flex justify-center mb-6 space-x-4">
        <button 
          onClick={() => handleFilterChange('Ready for Pickup')} 
          className={`px-6 py-2 rounded-md shadow-md transition-colors duration-300 ${filter === 'Ready for Pickup' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Ready for Pickup
        </button>
        <button 
          onClick={() => handleFilterChange('Returned')} 
          className={`px-6 py-2 rounded-md shadow-md transition-colors duration-300 ${filter === 'Returned' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Returned
        </button>
        <button 
          onClick={() => handleFilterChange('Failed Delivery')} 
          className={`px-6 py-2 rounded-md shadow-md transition-colors duration-300 ${filter === 'Failed Delivery' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Failed Delivery
        </button>
        <button 
          onClick={() => handleFilterChange('Lost')} 
          className={`px-6 py-2 rounded-md shadow-md transition-colors duration-300 ${filter === 'Lost' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Lost
        </button>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white rounded-md shadow-lg">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking Number</th>
              {filter === 'Ready for Pickup' && <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Indicator</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map(order => (
              <tr key={order.order_number} className="hover:bg-gray-50 transition duration-150">
                <td className="py-4 px-6 whitespace-nowrap">{order.order_number}</td>
                <td className="py-4 px-6 whitespace-nowrap">{format(new Date(order.date), 'yyyy-MM-dd')}</td>
                <td className="py-4 px-6 whitespace-nowrap">
                  {filter === 'Lost' ? 'Lost' : order.category}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">{order.subject}</td>
                <td className="py-4 px-6 whitespace-nowrap">{order.tracking_number || 'N/A'}</td>
                {filter === 'Ready for Pickup' && (
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`inline-block w-5 h-5 rounded-full ${getColorForDate(order.date)}`}></span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
