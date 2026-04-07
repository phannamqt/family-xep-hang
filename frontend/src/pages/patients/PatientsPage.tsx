import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '../../api';
import type { Patient } from '../../types';
import { toast, extractErrorMessage } from '../../components/Toast';

function calcAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

const emptyForm = {
  fullName: '', dateOfBirth: '', gender: 'other' as 'male' | 'female' | 'other',
  phone: '', idCard: '', address: '', notes: '',
};

function validateForm(form: typeof emptyForm) {
  const errors: Partial<Record<keyof typeof emptyForm, string>> = {};
  if (!form.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên';
  if (!form.dateOfBirth) errors.dateOfBirth = 'Vui lòng chọn ngày sinh';
  return errors;
}

export default function PatientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof emptyForm, string>>>({});
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
      setErrors({});
      setEditId(null);
      setShowForm(false);
      toast.success(editId ? 'Đã cập nhật bệnh nhân' : 'Đã thêm bệnh nhân mới');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Lưu thông tin bệnh nhân thất bại')),
  });

  const deleteMut = useMutation({
    mutationFn: patientsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Đã xoá bệnh nhân');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Xoá bệnh nhân thất bại')),
  });

  const startEdit = (p: Patient) => {
    setEditId(p.id);
    setErrors({});
    setForm({
      fullName: p.fullName, dateOfBirth: p.dateOfBirth, gender: p.gender,
      phone: p.phone ?? '', idCard: p.idCard ?? '', address: p.address ?? '', notes: p.notes ?? '',
    });
    setShowForm(true);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Bệnh nhân</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...emptyForm }); setErrors({}); }}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Thêm
        </button>
      </div>

      <input placeholder="Tìm theo tên, SĐT, CCCD..."
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-4"
        value={search} onChange={e => setSearch(e.target.value)} />

      {/* Form modal — full screen on mobile */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white w-full md:max-w-lg md:rounded-xl rounded-t-2xl p-5 shadow-xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">{editId ? 'Chỉnh sửa' : 'Thêm'} bệnh nhân</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl px-1">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Họ và tên *</label>
                <input
                  className={`w-full mt-1 px-3 py-2.5 border rounded-lg text-sm ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  value={form.fullName}
                  onChange={e => { setForm(f => ({ ...f, fullName: e.target.value })); setErrors(er => ({ ...er, fullName: undefined })); }}
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Ngày sinh *</label>
                  <input type="date"
                    className={`w-full mt-1 px-3 py-2.5 border rounded-lg text-sm ${errors.dateOfBirth ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    value={form.dateOfBirth}
                    onChange={e => { setForm(f => ({ ...f, dateOfBirth: e.target.value })); setErrors(er => ({ ...er, dateOfBirth: undefined })); }}
                  />
                  {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Giới tính</label>
                  <select className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as any }))}>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Số điện thoại</label>
                  <input className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">CCCD</label>
                  <input className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    value={form.idCard} onChange={e => setForm(f => ({ ...f, idCard: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Địa chỉ</label>
                <input className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Ghi chú</label>
                <textarea rows={2} className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const errs = validateForm(form);
                  if (Object.keys(errs).length > 0) { setErrors(errs); return; }
                  saveMut.mutate(form);
                }}
                disabled={saveMut.isPending}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saveMut.isPending ? 'Đang lưu...' : (editId ? 'Cập nhật' : 'Thêm')}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-center px-3 py-3 font-medium text-gray-600 w-10">STT</th>
              <th className="text-center px-3 py-3 font-medium text-gray-600 w-24">Mã BN</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Họ tên</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tuổi / Giới</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SĐT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">CCCD</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p, idx) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3 text-center text-xs text-gray-400 font-medium">{idx + 1}</td>
                <td className="px-3 py-3 text-center text-xs font-mono font-medium text-blue-600">{p.patientCode ?? '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.fullName}</td>
                <td className="px-4 py-3 text-gray-600">
                  {p.dateOfBirth ? `${calcAge(p.dateOfBirth)} tuổi` : '—'} · {p.gender === 'male' ? 'Nam' : p.gender === 'female' ? 'Nữ' : 'Khác'}
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
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Không có bệnh nhân nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {patients.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">{p.fullName}</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {p.dateOfBirth ? `${calcAge(p.dateOfBirth)} tuổi` : '—'} · {p.gender === 'male' ? 'Nam' : p.gender === 'female' ? 'Nữ' : 'Khác'}
                  {p.phone ? ` · ${p.phone}` : ''}
                </div>
                {p.idCard && <div className="text-xs text-gray-400 mt-0.5">CCCD: {p.idCard}</div>}
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => startEdit(p)} className="text-blue-600 text-sm font-medium">Sửa</button>
                <button onClick={() => deleteMut.mutate(p.id)} className="text-red-500 text-sm font-medium">Xoá</button>
              </div>
            </div>
          </div>
        ))}
        {patients.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Không có bệnh nhân nào</div>
        )}
      </div>
    </div>
  );
}
