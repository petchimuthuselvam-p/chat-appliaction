import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import './Dashboard.css';

export interface DemoEntity {
  id: number;
  user_name: string;
  dob: string;
  email: string;
  phone_no: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const [usersData, setUsersData] = useState([
    { name: 'Active', users: 0, color: '#28a745' },
    { name: 'Blocked', users: 0, color: '#dc3545' },
    { name: 'Total', users: 0, color: '#005782' },
  ]);

useEffect(() => {
  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token missing, please login.');
        return;
      }

      const res = await fetch('http://localhost:8080/api/get-all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();

      console.log('Fetched data:', result);  // <-- ADD THIS

      const employees: DemoEntity[] = Array.isArray(result.data) ? result.data : [];
      console.log('Parsed employees:', employees);

      const active = employees.filter(e => e.status === 'active').length;
      const blocked = employees.filter(e => e.status !== 'active').length;
      const total = employees.length;

      console.log(`Active: ${active}, Blocked: ${blocked}, Total: ${total}`);

      setUsersData([
        { name: 'Active', users: active, color: '#28a745' },
        { name: 'Blocked', users: blocked, color: '#dc3545' },
        { name: 'Total', users: total, color: '#005782' },
      ]);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  fetchCounts();
}, []);


  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      <div className="summary-cards">
        {usersData.map((item) => (
          <div className="card small" key={item.name}>
            <h3>{item.name} Users</h3>
            <p>{item.users}</p>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="card chart">
          <h3>User Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={usersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="users" barSize={40} radius={[6, 6, 0, 0]}>
                {usersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
