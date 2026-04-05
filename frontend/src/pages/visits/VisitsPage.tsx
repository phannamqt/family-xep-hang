import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitsApi, patientsApi, configApi, roomsApi } from '../../api';
import { Visit, Patient, PriorityCategory, ClinicRoom } from '../../types';
import { format } from 'date-fns';

export default function VisitsPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showForm, setShowForm] = useState(false);
  const [createdVisit, setCreatedVisit] = useState<Visit | null>(null);
  const [form, setForm] = useState({
    patientId: '', categoryId: '', roomId: '',
    appointmentTime: '', visitDate: format(new Date(), 'yyyy-MM-dd'),
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
  const { data: rooms = [] } = useQuery<ClinicRoom[]>({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const createMut = useMutation({
    mutationFn: visitsApi.create,
    onSuccess: (visit: Visit) => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      setCreatedVisit(visit);
      setShowForm(false);
      setForm({ patientId: '', categoryId: '', roomId: '', appointmentTime: '', visitDate: format(new Date(), 'yyyy-MM-dd') });
    },
  });

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
            <div className="text-sm text-green-700 font-medium">Lượt khám đã tạo thành công!</div>
            <div className="text-2xl font-bold text-green-800 mt-1">{createdVisit.visitCode}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { navigator.clipboard.writeText(createdVisit.visitCode); }}
              className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
            >
              Copy mã
            </button>
            <button onClick={() => setCreatedVisit(null)} className="px-3 py-2 border border-green-300 text-green-700 rounded-md text-sm">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Tạo lượt khám mới</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Bệnh nhân *</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
                  <option value="">-- Chọn bệnh nhân --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} {p.phone ? `(${p.phone})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Đối tượng ưu tiên *</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">-- Chọn đối tượng --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (P={c.scoreP})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Phòng khám *</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}>
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Giờ hẹn (tuỳ chọn)</label>
                <input type="datetime-local" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.appointmentTime} onChange={e => setForm(f => ({ ...f, appointmentTime: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Ngày khám</label>
                <input type="date" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={form.visitDate} onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => createMut.mutate(form)}
                disabled={!form.patientId || !form.categoryId || !form.roomId}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-40"
              >
                Tạo lượt khám
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
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{v.category?.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{v.room?.name}</td>
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
