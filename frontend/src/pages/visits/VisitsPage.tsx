import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { visitsApi, patientsApi, configApi } from '../../api';
import type { Visit, Patient, PriorityCategory } from '../../types';

export default function VisitsPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showForm, setShowForm] = useState(false);
  const [createdVisit, setCreatedVisit] = useState<Visit | null>(null);
  const [form, setForm] = useState({
    patientId: '',
    categoryIds: [] as string[],
    appointmentTime: '',
    visitDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: visits = [] } = useQuery<Visit[]>({
    queryKey: ['visits', date],
    queryFn: () => visitsApi.getAll(date),
  });
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
  });
  const { data: categories = [] } = useQuery<PriorityCategory[]>({
    queryKey: ['categories'],
    queryFn: configApi.getCategories,
  });

  const createMut = useMutation({
    mutationFn: visitsApi.create,
    onSuccess: (visit: Visit) => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      setCreatedVisit(visit);
      setShowForm(false);
      setForm({ patientId: '', categoryIds: [], appointmentTime: '', visitDate: format(new Date(), 'yyyy-MM-dd') });
    },
  });

  const toggleCategory = (id: string) => {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter(c => c !== id)
        : [...f.categoryIds, id],
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Lượt khám</h2>
        <div className="flex gap-2 items-center">
          <input type="date" className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={date} onChange={e => setDate(e.target.value)} />
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            + Tạo lượt khám
          </button>
        </div>
      </div>

      {/* Visit code result */}
      {createdVisit && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-sm text-green-700 font-medium">Tạo lượt khám thành công!</div>
            <div className="text-2xl font-bold text-green-800 font-mono mt-1">{createdVisit.visitCode}</div>
            <div className="text-xs text-green-600 mt-1">
              Bệnh nhân mang mã này đến phòng khám để check-in
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { navigator.clipboard.writeText(createdVisit.visitCode); }}
              className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
            >
              Copy mã
            </button>
            <button onClick={() => setCreatedVisit(null)}
              className="px-3 py-2 border border-green-300 text-green-700 rounded-md text-sm">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-4">Tạo lượt khám mới</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Bệnh nhân *</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
                  <option value="">-- Chọn bệnh nhân --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName}{p.phone ? ` (${p.phone})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Đối tượng ưu tiên * <span className="text-blue-600">(chọn nhiều)</span>
                </label>
                <div className="mt-1 border border-gray-300 rounded-md divide-y divide-gray-100 max-h-52 overflow-y-auto">
                  {categories.map(cat => (
                    <label key={cat.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${form.categoryIds.includes(cat.id) ? 'bg-blue-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={form.categoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                      <span className="text-xs font-bold text-blue-700">P={cat.scoreP}</span>
                    </label>
                  ))}
                </div>
                {form.categoryIds.length > 0 && (
                  <div className="mt-1 text-xs text-blue-600">
                    Tổng điểm P = {categories
                      .filter(c => form.categoryIds.includes(c.id))
                      .reduce((sum, c) => sum + c.scoreP, 0)}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium">Giờ hẹn (tuỳ chọn)</label>
                <input type="datetime-local" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.appointmentTime} onChange={e => setForm(f => ({ ...f, appointmentTime: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium">Ngày khám</label>
                <input type="date" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.visitDate} onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => createMut.mutate(form)}
                disabled={!form.patientId || form.categoryIds.length === 0 || createMut.isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-40"
              >
                {createMut.isPending ? 'Đang tạo...' : 'Tạo lượt khám'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visits table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mã lượt</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Bệnh nhân</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Đối tượng</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phòng</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Check-in</th>
            </tr>
          </thead>
          <tbody>
            {visits.map(v => (
              <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-mono font-bold text-blue-700 text-xs">{v.visitCode}</div>
                  <button onClick={() => navigator.clipboard.writeText(v.visitCode)}
                    className="text-xs text-gray-400 hover:text-blue-600">copy</button>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{v.patient?.fullName}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(v.categories ?? []).map(cat => (
                      <span key={cat.id} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {v.room?.name ?? <span className="text-gray-300">Chưa check-in</span>}
                </td>
                <td className="px-4 py-3">
                  {v.checkInAt
                    ? <span className="text-green-600 text-xs">✓ {new Date(v.checkInAt).toLocaleTimeString('vi-VN')} ({v.checkInType === 'new' ? 'Khám mới' : 'Trả KQ'})</span>
                    : <span className="text-gray-400 text-xs">Chưa check-in</span>
                  }
                </td>
              </tr>
            ))}
            {visits.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Không có lượt khám nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
