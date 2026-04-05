import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '../../api';
import type { Patient } from '../../types';

function calcAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

const emptyForm = {
  fullName: '', dateOfBirth: '', gender: 'other' as 'male' | 'female' | 'other',
  phone: '', idCard: '', address: '', notes: '',
};

export default function PatientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients', search],
    queryFn: () => patientsApi.getAll(search || undefined),
  });

  const saveMut = useMutation({
    mutationFn: (data: any) => editId ? patientsApi.update(editId, data) : patientsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      setForm({ ...emptyForm });
      setEditId(null);
      setShowForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: patientsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });

  const startEdit = (p: Patient) => {
    setEditId(p.id);
    setForm({
      fullName: p.fullName, dateOfBirth: p.dateOfBirth, gender: p.gender,
      phone: p.phone ?? '', idCard: p.idCard ?? '', address: p.address ?? '', notes: p.notes ?? '',
    });
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Bệnh nhân</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...emptyForm }); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          + Thêm bệnh nhân
        </button>
      </div>

      <input placeholder="Tìm theo tên, SĐT, CCCD..." className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md text-sm mb-4"
        value={search} onChange={e => setSearch(e.target.value)} />

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">{editId ? 'Chỉnh sửa' : 'Thêm'} bệnh nhân</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Họ và tên *</label>
                <input className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Ngày sinh *</label>
                <input type="date" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Giới tính</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as any }))}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Số điện thoại</label>
                <input className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500">CCCD</label>
                <input className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.idCard} onChange={e => setForm(f => ({ ...f, idCard: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Địa chỉ</label>
                <input className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Ghi chú</label>
                <textarea rows={2} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => saveMut.mutate(form)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700">
                {editId ? 'Cập nhật' : 'Thêm'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Họ tên</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tuổi / Giới</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SĐT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">CCCD</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.fullName}</td>
                <td className="px-4 py-3 text-gray-600">
                  {p.dateOfBirth ? `${calcAge(p.dateOfBirth)} tuổi` : '—'} ·{' '}
                  {p.gender === 'male' ? 'Nam' : p.gender === 'female' ? 'Nữ' : 'Khác'}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.idCard ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline mr-3 text-xs">Sửa</button>
                  <button onClick={() => deleteMut.mutate(p.id)} className="text-red-500 hover:underline text-xs">Xoá</button>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Không có bệnh nhân nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
