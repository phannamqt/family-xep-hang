import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { visitsApi, roomsApi } from '../../api';
import type { Visit, ClinicRoom } from '../../types';

export default function CheckInPage() {
  const [code, setCode] = useState('');
  const [type, setType] = useState<'new' | 'result'>('new');
  const [roomId, setRoomId] = useState('');
  const [result, setResult] = useState<{ visit: Visit; success: boolean; message: string } | null>(null);

  const { data: rooms = [] } = useQuery<ClinicRoom[]>({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const checkInMut = useMutation({
    mutationFn: () => visitsApi.checkIn(code.trim().toUpperCase(), type, roomId),
    onSuccess: (visit: Visit) => {
      setResult({
        visit,
        success: true,
        message: `Check-in thành công! ${visit.patient?.fullName} đã được đưa vào hàng chờ.`,
      });
      setCode('');
    },
    onError: (err: any) => {
      setResult({
        visit: null as any,
        success: false,
        message: err?.response?.data?.message ?? 'Check-in thất bại',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !roomId) return;
    setResult(null);
    checkInMut.mutate();
  };

  return (
    <div className="min-h-full bg-gray-50 flex items-start justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Check-in bệnh nhân</h2>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-sm font-medium text-gray-700">Mã lượt khám</label>
              <input
                className="w-full mt-1.5 px-4 py-3 border border-gray-300 rounded-xl text-lg font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VK-20240405-001"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                autoFocus
                autoCapitalize="characters"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Phòng khám *</label>
              <select
                className="w-full mt-1.5 px-3 py-3 border border-gray-300 rounded-xl text-sm"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
              >
                <option value="">-- Chọn phòng --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
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

            <button
              type="submit"
              disabled={!code.trim() || !roomId || checkInMut.isPending}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 disabled:opacity-40 transition-colors">
              {checkInMut.isPending ? 'Đang xử lý...' : 'Check-in'}
            </button>
          </form>

          {result && (
            <div className={`mt-4 p-4 rounded-xl ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`font-medium text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.success ? '✓' : '✗'} {result.message}
              </div>
              {result.success && result.visit && (
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <div>Bệnh nhân: <strong>{result.visit.patient?.fullName}</strong></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
