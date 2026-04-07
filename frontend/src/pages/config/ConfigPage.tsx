import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi, roomsApi } from '../../api';
import type { PriorityCategory, ScoreConfig, ClinicRoom, DoctorSlot } from '../../types';
import { toast, extractErrorMessage } from '../../components/Toast';

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
  const emptyForm = { name: '', description: '', scoreP: 0, sortOrder: 0 };
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');

  const createMut = useMutation({
    mutationFn: (data: any) => editId
      ? configApi.updateCategory(editId, data)
      : configApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setForm(emptyForm);
      setNameError('');
      toast.success(editId ? 'Đã cập nhật đối tượng' : 'Đã thêm đối tượng mới');
      setEditId(null);
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Lưu đối tượng thất bại')),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) { setNameError('Tên đối tượng không được để trống'); return; }
    setNameError('');
    createMut.mutate(form);
  };

  const deleteMut = useMutation({
    mutationFn: configApi.deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã xoá đối tượng');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Xoá đối tượng thất bại')),
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
            <label className="text-xs text-gray-500">Tên đối tượng *</label>
            <input
              className={`w-full mt-1 px-3 py-2 border rounded-md text-sm ${nameError ? 'border-red-400' : 'border-gray-300'}`}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (e.target.value.trim()) setNameError(''); }}
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
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
              onClick={handleSubmit}
              disabled={createMut.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-40"
            >
              {createMut.isPending ? 'Đang lưu...' : (editId ? 'Cập nhật' : 'Thêm')}
            </button>
            {editId && (
              <button
                onClick={() => { setEditId(null); setForm(emptyForm); setNameError(''); }}
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['score-config'] });
      toast.success('Đã lưu cấu hình điểm');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Lưu cấu hình thất bại')),
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
          <label className="text-sm text-gray-600">Điểm S tự động khi bị đẩy lùi (cách nhau bằng dấu phẩy)</label>
          <input className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={(val.autoSkipScores ?? [5, 10, 20]).join(', ')}
            onChange={e => setForm(f => ({
              ...f,
              autoSkipScores: e.target.value.split(',').map(s => +s.trim()).filter(n => !isNaN(n))
            }))}
          />
          <p className="text-xs text-gray-400 mt-1">Ví dụ: 5, 10, 20 → lần 1 +5, lần 2 +10, lần 3+ +20</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-gray-600">Tính điểm đẩy lùi theo từng bậc</label>
            <p className="text-xs text-gray-400">Bật: tụt 3 bậc = 3 lần đẩy lùi &nbsp;|&nbsp; Tắt: tụt bao nhiêu cũng chỉ 1 lần</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, pushbackPerStep: !(f.pushbackPerStep ?? val.pushbackPerStep ?? true) }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(form.pushbackPerStep ?? val.pushbackPerStep ?? true) ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(form.pushbackPerStep ?? val.pushbackPerStep ?? true) ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <div>
          <label className="text-sm text-gray-600">Điểm C: cộng mỗi phút chờ thực tế</label>
          <input type="number" step="0.1" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={val.waitingScorePerMinute ?? 1}
            onChange={e => setForm(f => ({ ...f, waitingScorePerMinute: +e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Điểm C: trừ mỗi phút đến trễ hẹn</label>
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
  const emptyForm = { name: '', description: '', type: 'examination' as const };
  const [form, setForm] = useState(emptyForm);
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ClinicRoom | null>(null);
  const [slotCount, setSlotCount] = useState(5);

  const createRoomMut = useMutation({
    mutationFn: roomsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      setForm(emptyForm);
      toast.success('Đã thêm phòng khám');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Thêm phòng khám thất bại')),
  });

  const updateRoomMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => roomsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      setForm(emptyForm);
      setEditRoomId(null);
      toast.success('Đã cập nhật phòng khám');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Cập nhật phòng khám thất bại')),
  });

  const deleteRoomMut = useMutation({
    mutationFn: (id: string) => roomsApi.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      if (selectedRoom?.id === id) setSelectedRoom(null);
      if (editRoomId === id) cancelEditRoom();
      toast.success('Đã xoá phòng khám');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Xoá phòng khám thất bại')),
  });

  const upsertSlotsMut = useMutation({
    mutationFn: ({ id, count }: { id: string; count: number }) =>
      roomsApi.upsertSlots(id, count),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Đã cập nhật số slot');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Cập nhật slot thất bại')),
  });

  const updateSlotMut = useMutation({
    mutationFn: ({ roomId, slotId, data }: any) =>
      roomsApi.updateSlot(roomId, slotId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Đã lưu thông tin bác sĩ');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Lưu thông tin bác sĩ thất bại')),
  });

  const handleSubmitRoom = () => {
    if (!form.name.trim()) { setNameError('Tên phòng không được để trống'); return; }
    const duplicate = rooms.find(r => r.name.trim().toLowerCase() === form.name.trim().toLowerCase() && r.id !== editRoomId);
    if (duplicate) { setNameError('Tên phòng đã tồn tại'); return; }
    setNameError('');
    if (editRoomId) {
      updateRoomMut.mutate({ id: editRoomId, data: form });
    } else {
      createRoomMut.mutate(form);
    }
  };

  const handleDeleteRoom = (r: ClinicRoom) => {
    if (!window.confirm(`Xoá phòng "${r.name}"? Thao tác này không thể hoàn tác.`)) return;
    deleteRoomMut.mutate(r.id);
  };

  const startEditRoom = (r: ClinicRoom) => {
    setEditRoomId(r.id);
    setForm({ name: r.name, description: r.description ?? '', type: r.type as any });
    setNameError('');
  };

  const cancelEditRoom = () => {
    setEditRoomId(null);
    setForm(emptyForm);
    setNameError('');
  };

  const room = selectedRoom
    ? rooms.find(r => r.id === selectedRoom.id) ?? selectedRoom
    : null;

  const isPending = createRoomMut.isPending || updateRoomMut.isPending;

  return (
    <div className="flex gap-6 h-[calc(100vh-180px)] overflow-hidden">
      {/* Room list + create/edit form */}
      <div className="w-72 flex flex-col overflow-hidden">
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shrink-0">
          <h3 className="font-semibold text-gray-700 mb-3">
            {editRoomId ? 'Sửa phòng khám' : 'Thêm phòng khám'}
          </h3>
          <div className="space-y-3">
            <div>
              <input
                placeholder="Tên phòng *"
                className={`w-full px-3 py-2 border rounded-md text-sm ${nameError ? 'border-red-400' : 'border-gray-300'}`}
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (e.target.value.trim()) setNameError(''); }}
              />
              {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
            </div>
            <input placeholder="Mô tả" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
              <option value="examination">Phòng khám</option>
              <option value="result">Trả kết quả</option>
            </select>
            <div className="flex gap-2">
              <button onClick={handleSubmitRoom} disabled={isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-40">
                {isPending ? 'Đang lưu...' : (editRoomId ? 'Cập nhật' : 'Thêm phòng')}
              </button>
              {editRoomId && (
                <button onClick={cancelEditRoom}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                  Huỷ
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-y-auto flex-1">
          {rooms.map(r => (
            <div key={r.id}
              className={`border-b border-gray-100 text-sm ${selectedRoom?.id === r.id ? 'bg-blue-50' : 'hover:bg-gray-50'} ${editRoomId === r.id ? 'ring-2 ring-inset ring-blue-400' : ''}`}>
              <button className="w-full text-left px-4 py-3"
                onClick={() => { setSelectedRoom(r); setSlotCount(r.slots?.length || 5); }}>
                <div className="font-medium text-gray-800">{r.name}</div>
                <div className="text-xs text-gray-400">{r.type === 'examination' ? 'Phòng khám' : 'Trả kết quả'} · {r.slots?.length ?? 0} slot</div>
              </button>
              <div className="px-4 pb-2 flex gap-3">
                <button onClick={() => startEditRoom(r)} className="text-xs text-blue-600 hover:underline">Sửa</button>
                <button onClick={() => handleDeleteRoom(r)} className="text-xs text-red-500 hover:underline">Xoá</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slots config */}
      {room && (
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
          <div className={`flex items-center justify-between mb-4 ${(room.slots?.length ?? 0) === 0 ? 'p-3 bg-blue-50 border border-blue-200 rounded-lg' : ''}`}>
            <div>
              <h3 className="font-semibold text-gray-700">{room.name} — Cấu hình slot bác sĩ</h3>
              {(room.slots?.length ?? 0) === 0 && (
                <p className="text-xs text-blue-600 mt-0.5">Nhập số slot rồi bấm Áp dụng để tạo slot bác sĩ</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Số slot:</label>
              <input type="number" min={1} max={10}
                className={`w-16 px-2 py-1 border rounded text-sm ${(room.slots?.length ?? 0) === 0 ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-300'}`}
                value={slotCount} onChange={e => setSlotCount(+e.target.value)} />
              <button onClick={() => upsertSlotsMut.mutate({ id: room.id, count: slotCount })}
                className={`px-3 py-1 text-white rounded text-sm ${(room.slots?.length ?? 0) === 0 ? 'bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm' : 'bg-blue-600 hover:bg-blue-700'}`}>
                Áp dụng
              </button>
            </div>
          </div>

          {(room.slots?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-4xl mb-3">🪑</div>
              <div className="text-gray-500 font-medium">Phòng chưa có slot bác sĩ</div>
              <div className="text-gray-400 text-sm mt-1">Mỗi slot = 1 bác sĩ có thể khám đồng thời</div>
              <div className="text-gray-400 text-sm">Ví dụ: 3 bác sĩ → nhập 3 và bấm <span className="font-medium text-blue-600">Áp dụng</span></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[...(room.slots ?? [])].sort((a, b) => a.slotNumber - b.slotNumber).map(slot => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onUpdate={(slotId, data) => updateSlotMut.mutate({ roomId: room.id, slotId, data })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Slot card với local state để tránh input bị reset khi rooms re-fetch =====
function SlotCard({ slot, onUpdate }: {
  slot: DoctorSlot;
  onUpdate: (slotId: string, data: { doctorName?: string; isAbsent?: boolean }) => void;
}) {
  const [doctorName, setDoctorName] = useState(slot.doctorName ?? '');

  return (
    <div className={`border rounded-lg p-3 ${slot.isAbsent ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-gray-700">Slot {slot.slotNumber}</span>
        <label className="flex items-center gap-1 text-xs cursor-pointer">
          <input type="checkbox" checked={slot.isAbsent}
            onChange={e => onUpdate(slot.id, { isAbsent: e.target.checked })}
          />
          <span className="text-red-500">Vắng</span>
        </label>
      </div>
      <input
        placeholder="Tên bác sĩ"
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
        value={doctorName}
        onChange={e => setDoctorName(e.target.value)}
        onBlur={() => onUpdate(slot.id, { doctorName })}
      />
    </div>
  );
}
