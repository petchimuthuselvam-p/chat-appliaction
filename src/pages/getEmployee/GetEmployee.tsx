import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../modal/Modal';
import './GetEmployee.css';
import '../../styles/global.css';

interface DemoEntity {
  id: number;
  user_name: string;
  dob: string;
  email: string;
  phone_no: string;
  status: string;
}

const GetEmployee: React.FC = () => {
  const [employees, setEmployees] = useState<DemoEntity[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<DemoEntity | null>(null);
  const [editForm, setEditForm] = useState<Partial<DemoEntity>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof DemoEntity, string>>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const fetchEmployees = async (pageNum: number = 1) => {
  try {
    const token = localStorage.getItem('token');
    console.log('Fetched token:', token);  // ✅ add this line

    if (!token) {
      setError('Missing token, please login again.');
      return;
    }

    const res = await fetch(`http://localhost:8080/api/get-all?page=${pageNum}&size=5`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    const dataArray: DemoEntity[] = Array.isArray(result.data) ? result.data : [];
    setEmployees(dataArray);

    const total = typeof result.total === 'number' ? result.total : dataArray.length;
    const size = typeof result.size === 'number' ? result.size : 5;
    setTotalPages(Math.max(1, Math.ceil(total / size)));
    setError(null);
  } catch (e: any) {
    console.error('Fetch error:', e);
    setError(e?.message || 'Failed to fetch employees');
  }
};


  useEffect(() => {
    fetchEmployees(page);
  }, [page]);

  const openAddModal = () => {
    setModalMode('add');
    setEditForm({});
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (emp: DemoEntity) => {
    setEditingEmployee(emp);
    setEditForm({
      user_name: emp.user_name,
      dob: emp.dob,
      email: emp.email,
      phone_no: emp.phone_no
    });
    setModalMode('edit');
    setFormErrors({});
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof DemoEntity, string>> = {};
    if (!editForm.user_name) errors.user_name = 'User name is required';
    if (!editForm.dob) errors.dob = 'DOB is required';
    if (!editForm.email) errors.email = 'Email is required';
    else if (!editForm.email.includes('@')) errors.email = 'Invalid email';
    if (!editForm.phone_no) errors.phone_no = 'Phone number is required';
    else if (editForm.phone_no.length !== 10) errors.phone_no = 'Phone must be 10 digits';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveNewEmployee = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://localhost:8080/api/save-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userName: editForm.user_name,
          dob: editForm.dob,
          email: editForm.email,
          phoneNo: editForm.phone_no
        })
      });
      const data = await res.json();
      if (data.code === '0000') {
        toast.success('User added successfully!');
        setShowModal(false);
        fetchEmployees(page);
      } else {
        toast.error(data.message || 'Failed to add user');
      }
    } catch (e) {
      console.error('Add error:', e);
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!validateForm() || !editingEmployee) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`http://localhost:8080/api/update-employee/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userName: editForm.user_name,
          dob: editForm.dob,
          email: editForm.email,
          phoneNo: editForm.phone_no
        })
      });
      const data = await res.json();
      if (data.code === '0000') {
        toast.success('User updated!');
        setShowModal(false);
        fetchEmployees(page);
      } else {
        toast.error(data.message || 'Failed to update user');
      }
    } catch (e) {
      console.error('Update error:', e);
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await fetch(`http://localhost:8080/api/toggle-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      toast.success('Status updated');
      fetchEmployees(page);
    } catch (e) {
      console.error('Toggle error:', e);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="dashboard">
      <h2>Admin Panel</h2>
      <div className="content-card">
        <div className="top-bar">
          <button onClick={openAddModal} className="button">+ Add</button>
          <input
            type="text"
            placeholder="🔍 Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>DOB</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees
                .filter(emp =>
                  emp.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  emp.phone_no.includes(searchQuery) ||
                  emp.id.toString().includes(searchQuery))
                .map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>{emp.user_name}</td>
                    <td>{emp.dob}</td>
                    <td>{emp.email}</td>
                    <td>{emp.phone_no}</td>
                    <td>
                      <button
                        className={`action-button ${emp.status === 'active' ? 'block-btn' : 'unblock-btn'}`}
                        onClick={() => toggleStatus(emp.id)}>
                        {emp.status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => openEditModal(emp)}
                        disabled={emp.status !== 'active'}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages}>Next</button>
        </div>
      </div>

      {showModal && (
        <Modal title={modalMode === 'add' ? 'Add New User' : `Edit User ID: ${editingEmployee?.id}`} onClose={() => setShowModal(false)}>
          <form onSubmit={e => { e.preventDefault(); modalMode === 'add' ? saveNewEmployee() : saveEdit(); }}>
            <input type="text" name="user_name" placeholder="User Name" value={editForm.user_name || ''} onChange={handleInputChange} />
            {formErrors.user_name && <div className="field-error">{formErrors.user_name}</div>}
            <input type="date" name="dob" value={editForm.dob || ''} onChange={handleInputChange} />
            {formErrors.dob && <div className="field-error">{formErrors.dob}</div>}
            <input type="email" name="email" placeholder="Email" value={editForm.email || ''} onChange={handleInputChange} />
            {formErrors.email && <div className="field-error">{formErrors.email}</div>}
            <input type="text" name="phone_no" placeholder="Phone" value={editForm.phone_no || ''} onChange={handleInputChange} />
            {formErrors.phone_no && <div className="field-error">{formErrors.phone_no}</div>}
            <div className="modal-actions">
              <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default GetEmployee;
