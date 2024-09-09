import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [orders, setOrders] = useState({
    "Ready for Pickup": [],
    "Failed Delivery": [],
    "Returned": [],
    "Lost": []
  });
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('Ready for Pickup');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      navigate('/login');
    } else {
      setUserEmail(email);
      fetchAllOrders(email);
    }
  }, [navigate]);

  useEffect(() => {
    if (filter === 'Lost') {
      setFilteredOrders(orders['Lost']);
    } else {
      const filtered = orders[filter] || [];
      setFilteredOrders(sortOrders(filtered));
    }
  }, [orders, filter]);

  const fetchAllOrders = async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:8000/get_all_orders', {
        params: { email }
      });

      const allOrders = response.data;
      const { readyForPickup, lostOrders } = categorizeOrders(allOrders['Ready for Pickup']);

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
    const lostOrders = readyForPickupOrders.filter(order => differenceInDays(new Date(), new Date(order.date)) > 7);
    const filteredReadyForPickup = readyForPickupOrders.filter(order => differenceInDays(new Date(), new Date(order.date)) <= 7);

    return { readyForPickup: filteredReadyForPickup, lostOrders };
  };

  const checkNewOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:8000/fetch_emails', {
        params: { email: userEmail }
      });
      const { new_orders, all_orders } = response.data;

      const { readyForPickup, lostOrders } = categorizeOrders(all_orders['Ready for Pickup']);
      setOrders({
        ...all_orders,
        "Ready for Pickup": readyForPickup,
        Lost: lostOrders
      });
      setFilteredOrders(sortOrders(all_orders[filter] || []));

      const newOrdersCount = Object.values(new_orders).flat().length;
      alert(`Success new order(s) will be added if found`);
    } catch (error) {
      console.error('Error checking new orders:', error);
      setError('Failed to check new orders. Please try again.');
    } finally {
      setIsLoading(false);
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
    if (daysDiff > 7) return 'bg-gray-500';
    if (daysDiff > 5) return 'bg-red-500';
    if (daysDiff > 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  const confirmDeleteOrder = async () => {
    try {
      await axios.post(`http://127.0.0.1:8000/discard_order`, {
        order_number: orderToDelete.order_number,
        email: userEmail
      });
      alert('Order has been discarded.');
      setDeleteModalOpen(false);
      fetchAllOrders(userEmail);
    } catch (error) {
      console.error('Error discarding order:', error);
      alert('Failed to discard order. Please try again.');
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error!</strong>
      <span className="block sm:inline"> {error}</span>
    </div>
  );

  return (
    <div className="container mx-auto p-4 lg:px-24">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-700">Orders Dashboard</h1>

      <div className="flex justify-center mb-6">
        <button
          onClick={checkNewOrders}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md shadow-lg transition duration-300"
        >
          Check New Orders
        </button>
      </div>

      <div className="flex flex-wrap justify-center mb-6 space-x-2 sm:space-x-4">
        {['Ready for Pickup', 'Returned', 'Failed Delivery', 'Lost'].map((category) => (
          <button
            key={category}
            onClick={() => handleFilterChange(category)}
            className={`px-4 py-2 mb-2 rounded-md shadow-md transition-colors duration-300 ${
              filter === category ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Order Number', 'Date', 'Status', 'Subject', 'Tracking Number', ...(filter === 'Ready for Pickup' ? ['Status Indicator'] : []), 'Actions'].map((header) => (
                <th key={header} className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
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
                <td className="py-4 px-6 whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteOrder(order)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
                  >
                    Discard
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Discard</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to discard this order? This action is irreversible.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteOrder}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition duration-300"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;