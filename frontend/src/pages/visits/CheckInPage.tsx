import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { visitsApi } from '../../api';
import type { Visit } from '../../types';

export default function CheckInPage() {
  const [code, setCode] = useState('');
  const [type, setType] = useState<'new' | 'result'>('new');
  const [result, setResult] = useState<{ visit: Visit; success: boolean; message: string } | null>(null);

  const checkInMut = useMutation({
    mutationFn: () => visitsApi.checkIn(code.trim().toUpperCase(), type),
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
    if (!code.trim()) return;
    setResult(null);
    checkInMut.mutate();
  };

  return (
    <div className="p-6 flex items-start justify-center min-h-full">
      <div className="w-full max-w-md mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Check-in bệnh nhân</h2>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Mã lượt khám</label>
              <input
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VK-20240405-001"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Loại check-in</label>
              <div className="mt-2 flex gap-3">
                {[
                  { value: 'new', label: '🏥 Khám mới', desc: 'Lần đầu đến trong ngày' },
                  { value: 'result', label: '📋 Trả kết quả', desc: 'Quay lại nhận kết quả' },
                ].map(opt => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setType(opt.value as 'new' | 'result')}
                    className={`flex-1 p-3 rounded-lg border-2 text-left transition-colors ${
                      type === opt.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!code.trim() || checkInMut.isPending}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {checkInMut.isPending ? 'Đang xử lý...' : 'Check-in'}
            </button>
          </form>

          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`font-medium text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.success ? '✓' : '✗'} {result.message}
              </div>
              {result.success && result.visit && (
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <div>Bệnh nhân: <strong>{result.visit.patient?.fullName}</strong></div>
                  <div>Phòng: <strong>{result.visit.room?.name}</strong></div>
                  <div>Đối tượng: <strong>{result.visit.category?.name}</strong></div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Nhập mã lượt khám từ phiếu hoặc tin nhắn để check-in vào hàng chờ
        </p>
      </div>
    </div>
  );
}
