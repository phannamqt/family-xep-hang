import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi, roomsApi } from '../../api';
import type { PriorityCategory, ScoreConfig, ClinicRoom } from '../../types';

export default function ConfigPage() {
  const [tab, setTab] = useState<'categories' | 'score' | 'rooms'>('categories');

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Cấu hình hệ thống</h2>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'categories', label: 'Danh mục đối tượng' },
          { key: 'score', label: 'Hệ số điểm' },
          { key: 'rooms', label: 'Phòng khám & Bác sĩ' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'categories' && <CategoriesTab />}
      {tab === 'score' && <ScoreConfigTab />}
      {tab === 'rooms' && <RoomsTab />}
    </div>
  );
}

// ===== Tab: Danh mục đối tượng =====
function CategoriesTab() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery<PriorityCategory[]>({
    queryKey: ['categories'],
    queryFn: configApi.getCategories,
  });
  const [form, setForm] = useState({ name: '', description: '', scoreP: 0, sortOrder: 0 });
  const [editId, setEditId] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: (data: any) => editId
      ? configApi.updateCategory(editId, data)
      : configApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setForm({ name: '', description: '', scoreP: 0, sortOrder: 0 });
      setEditId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: configApi.deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  const startEdit = (cat: PriorityCategory) => {
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description ?? '', scoreP: cat.scoreP, sortOrder: cat.sortOrder });
  };

  return (
    <div className="flex gap-6">
      {/* Form */}
      <div className="w-80 bg-white rounded-lg border border-gray-200 p-4 h-fit">
        <h3 className="font-semibold text-gray-700 mb-3">
          {editId ? 'Chỉnh sửa' : 'Thêm mới'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Tên đối tượng</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Mô tả</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Điểm P (ưu tiên nền)</label>
            <input
              type="number"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.scoreP}
              onChange={e => setForm(f => ({ ...f, scoreP: +e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Thứ tự sắp xếp</label>
            <input
              type="number"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.sortOrder}
              onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMut.mutate(form)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700"
            >
              {editId ? 'Cập nhật' : 'Thêm'}
            </button>
            {editId && (
              <button
                onClick={() => { setEditId(null); setForm({ name: '', description: '', scoreP: 0, sortOrder: 0 }); }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Huỷ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tên đối tượng</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Điểm P</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Thứ tự</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{cat.name}</div>
                  {cat.description && <div className="text-xs text-gray-400">{cat.description}</div>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-bold text-blue-700">{cat.scoreP}</span>
                </td>
                <td className="px-4 py-3 text-center text-gray-500">{cat.sortOrder}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => startEdit(cat)} className="text-blue-600 hover:underline mr-3 text-xs">Sửa</button>
                  <button onClick={() => deleteMut.mutate(cat.id)} className="text-red-500 hover:underline text-xs">Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== Tab: Hệ số điểm =====
function ScoreConfigTab() {
  const qc = useQueryClient();
  const { data: config } = useQuery<ScoreConfig>({
    queryKey: ['score-config'],
    queryFn: configApi.getScoreConfig,
  });
  const [form, setForm] = useState<Partial<ScoreConfig>>({});

  const updateMut = useMutation({
    mutationFn: configApi.updateScoreConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['score-config'] }),
  });

  const val = { ...config, ...form };

  return (
    <div className="max-w-lg bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-700 mb-4">Cấu hình hệ số tính điểm</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">Hệ số T(t): <code className="bg-gray-100 px-1 rounded">t + coeff × t²</code></label>
          <input type="number" step="0.01" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={val.timeCoefficient ?? 0.04}
            onChange={e => setForm(f => ({ ...f, timeCoefficient: +e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Điểm S lỡ lượt thủ công (cách nhau bằng dấu phẩy)</label>
          <input className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={(val.skipScores ?? [20, 40, 60]).join(', ')}
            onChange={e => setForm(f => ({
              ...f,
              skipScores: e.target.value.split(',').map(s => +s.trim()).filter(n => !isNaN(n))
            }))}
          />
          <p className="text-xs text-gray-400 mt-1">Ví dụ: 20, 40, 60 → lần 1 +20, lần 2 +40, lần 3+ +60</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Điểm S tự động khi bị đẩy lùi (Case 2)</label>
          <input type="number" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={val.autoSkipScore ?? 5}
            onChange={e => setForm(f => ({ ...f, autoSkipScore: +e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">C: điểm cộng mỗi phút chờ</label>
          <input type="number" step="0.1" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={val.waitingScorePerMinute ?? 1}
            onChange={e => setForm(f => ({ ...f, waitingScorePerMinute: +e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">C: điểm trừ mỗi phút đến trễ hẹn</label>
          <input type="number" step="0.1" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={val.lateDeductionPerMinute ?? 1}
            onChange={e => setForm(f => ({ ...f, lateDeductionPerMinute: +e.target.value }))}
          />
        </div>
        <button
          onClick={() => updateMut.mutate(form)}
          className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Lưu cấu hình
        </button>
      </div>
    </div>
  );
}

// ===== Tab: Phòng khám & Bác sĩ =====
function RoomsTab() {
  const qc = useQueryClient();
  const { data: rooms = [] } = useQuery<ClinicRoom[]>({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });
  const [form, setForm] = useState({ name: '', description: '', type: 'examination' as const });
  const [selectedRoom, setSelectedRoom] = useState<ClinicRoom | null>(null);
  const [slotCount, setSlotCount] = useState(5);

  const createRoomMut = useMutation({
    mutationFn: roomsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      setForm({ name: '', description: '', type: 'examination' });
    },
  });

  const upsertSlotsMut = useMutation({
    mutationFn: ({ id, count }: { id: string; count: number }) =>
      roomsApi.upsertSlots(id, count),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const updateSlotMut = useMutation({
    mutationFn: ({ roomId, slotId, data }: any) =>
      roomsApi.updateSlot(roomId, slotId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const room = selectedRoom
    ? rooms.find(r => r.id === selectedRoom.id) ?? selectedRoom
    : null;

  return (
    <div className="flex gap-6">
      {/* Room list + create form */}
      <div className="w-72">
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Thêm phòng khám</h3>
          <div className="space-y-3">
            <input placeholder="Tên phòng" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input placeholder="Mô tả" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
              <option value="examination">Phòng khám</option>
              <option value="result">Trả kết quả</option>
            </select>
            <button onClick={() => createRoomMut.mutate(form)}
              className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700">
              Thêm phòng
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {rooms.map(r => (
            <button key={r.id} onClick={() => { setSelectedRoom(r); setSlotCount(r.slots?.length || 5); }}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 text-sm hover:bg-gray-50 ${selectedRoom?.id === r.id ? 'bg-blue-50' : ''}`}>
              <div className="font-medium text-gray-800">{r.name}</div>
              <div className="text-xs text-gray-400">{r.type === 'examination' ? 'Phòng khám' : 'Trả kết quả'} · {r.slots?.length ?? 0} slot</div>
            </button>
          ))}
        </div>
      </div>

      {/* Slots config */}
      {room && (
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">{room.name} — Cấu hình slot bác sĩ</h3>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Số slot:</label>
              <input type="number" min={1} max={10} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                value={slotCount} onChange={e => setSlotCount(+e.target.value)} />
              <button onClick={() => upsertSlotsMut.mutate({ id: room.id, count: slotCount })}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                Áp dụng
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(room.slots ?? []).map(slot => (
              <div key={slot.id} className={`border rounded-lg p-3 ${slot.isAbsent ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-700">Slot {slot.slotNumber}</span>
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="checkbox" checked={slot.isAbsent}
                      onChange={e => updateSlotMut.mutate({ roomId: room.id, slotId: slot.id, data: { isAbsent: e.target.checked } })}
                    />
                    <span className="text-red-500">Vắng</span>
                  </label>
                </div>
                <input placeholder="Tên bác sĩ" className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  defaultValue={slot.doctorName ?? ''}
                  onBlur={e => updateSlotMut.mutate({ roomId: room.id, slotId: slot.id, data: { doctorName: e.target.value } })}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
