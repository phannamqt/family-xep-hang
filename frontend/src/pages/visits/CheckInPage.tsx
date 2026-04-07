import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { visitsApi, roomsApi } from '../../api';
import type { ClinicRoom } from '../../types';
import { extractErrorMessage } from '../../components/Toast';

interface CodeRow {
  code: string;
  initialScore: string;
  result?: { ok: boolean; text: string };
}

export default function CheckInPage() {
  const [rows, setRows] = useState<CodeRow[]>([{ code: '', initialScore: '' }]);
  const [type, setType] = useState<'new' | 'result'>('new');
  const [roomId, setRoomId] = useState('');
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { data: rooms = [] } = useQuery<ClinicRoom[]>({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const checkInMut = useMutation({
    mutationFn: ({ code, initialScore }: { code: string; initialScore: number }) =>
      visitsApi.checkIn(code, type, roomId, initialScore || undefined),
  });

  const updateRow = (idx: number, field: keyof CodeRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const code = rows[idx].code.trim().toUpperCase();
    if (!code) return;

    // Auto-add new row nếu là dòng cuối
    if (idx === rows.length - 1) {
      setRows(prev => [...prev, { code: '', initialScore: '' }]);
      setTimeout(() => codeRefs.current[idx + 1]?.focus(), 50);
    } else {
      codeRefs.current[idx + 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    const toProcess = rows.filter(r => r.code.trim());
    if (!toProcess.length) return;

    const updated = [...rows];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.code.trim()) continue;
      try {
        const visit = await checkInMut.mutateAsync({
          code: r.code.trim().toUpperCase(),
          initialScore: parseFloat(r.initialScore) || 0,
        });
        updated[i] = { ...updated[i], result: { ok: true, text: `✓ ${visit.patient?.fullName}` } };
      } catch (err) {
        updated[i] = { ...updated[i], result: { ok: false, text: extractErrorMessage(err, 'Thất bại') } };
      }
    }
    setRows(updated);
  };

  const clearDone = () => {
    const remaining = rows.filter(r => !r.result?.ok);
    setRows(remaining.length ? remaining : [{ code: '', initialScore: '' }]);
    setTimeout(() => codeRefs.current[0]?.focus(), 50);
  };

  return (
    <div className="min-h-full bg-gray-50 flex items-start justify-center p-4 md:p-8">
      <div className="w-full max-w-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Check-in bệnh nhân</h2>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Danh sách mã */}
            <div>
              <div className="grid grid-cols-[1fr_100px] gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">Mã lượt khám</span>
                <span className="text-sm font-medium text-gray-500 text-center">Điểm ban đầu</span>
              </div>
              <div className="space-y-2">
                {rows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_100px] gap-2 items-center">
                    <div>
                      <input
                        ref={el => { codeRefs.current[idx] = el; }}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          row.result ? (row.result.ok ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-gray-300'
                        }`}
                        placeholder={`VK-YYYYMMDD-${String(idx + 1).padStart(3, '0')}`}
                        value={row.code}
                        onChange={e => updateRow(idx, 'code', e.target.value.toUpperCase())}
                        onKeyDown={e => handleCodeKeyDown(e, idx)}
                        autoFocus={idx === 0}
                        autoCapitalize="characters"
                        autoComplete="off"
                      />
                      {row.result && (
                        <p className={`text-xs mt-0.5 px-1 ${row.result.ok ? 'text-green-600' : 'text-red-600'}`}>
                          {row.result.text}
                        </p>
                      )}
                    </div>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      value={row.initialScore}
                      onChange={e => updateRow(idx, 'initialScore', e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRows(prev => [...prev, { code: '', initialScore: '' }])}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                + Thêm dòng
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Phòng khám *</label>
              <select
                className="w-full mt-1.5 px-3 py-3 border border-gray-300 rounded-xl text-sm"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
              >
                <option value="">-- Chọn phòng --</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Loại check-in</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'new', label: 'Khám mới', desc: 'Lần đầu đến trong ngày' },
                  { value: 'result', label: 'Trả kết quả', desc: 'Quay lại nhận kết quả' },
                ].map(opt => (
                  <button type="button" key={opt.value}
                    onClick={() => setType(opt.value as 'new' | 'result')}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${type === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!rows.some(r => r.code.trim()) || !roomId || checkInMut.isPending}
                className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 disabled:opacity-40 transition-colors">
                {checkInMut.isPending ? 'Đang xử lý...' : `Check-in (${rows.filter(r => r.code.trim()).length} mã)`}
              </button>
              {rows.some(r => r.result?.ok) && (
                <button type="button" onClick={clearDone}
                  className="px-4 py-3.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">
                  Xoá xong
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-xs text-gray-400 text-center mt-3">
          Nhấn Enter sau mỗi mã để tự động xuống dòng tiếp theo
        </p>
      </div>
    </div>
  );
}
