import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { roomsApi, queueApi, visitsApi } from '../../api';
import type { ClinicRoom, QueueEntry, DoctorSlot } from '../../types';
import { useQueueSocket } from '../../hooks/useSocket';
import { toast, extractErrorMessage } from '../../components/Toast';

export default function QueuePage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [mobileTab, setMobileTab] = useState<'waiting' | 'in_room' | 'done'>('waiting');

  const { data: rooms = [] } = useQuery<ClinicRoom[]>({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const onSocketUpdate = useCallback((data: QueueEntry[]) => {
    setEntries(data);
  }, []);

  useQueueSocket(selectedRoomId || null, date, onSocketUpdate);

  const room = rooms.find(r => r.id === selectedRoomId);

  const waiting = entries.filter(e => e.status === 'waiting')
    .sort((a, b) => (b.scoreBreakdown?.total ?? b.totalScore) - (a.scoreBreakdown?.total ?? a.totalScore));
  const inRoom = entries.filter(e => e.status === 'in_room');
  const done = entries.filter(e => e.status === 'done').sort((a, b) =>
    new Date(b.finishedAt ?? 0).getTime() - new Date(a.finishedAt ?? 0).getTime()
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-2 md:py-3 flex flex-wrap items-center gap-2">
        <select
          className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-md text-sm"
          value={selectedRoomId}
          onChange={e => setSelectedRoomId(e.target.value)}
        >
          <option value="">-- Chọn phòng --</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input type="date" className="px-2 py-2 border border-gray-300 rounded-md text-sm"
          value={date} onChange={e => setDate(e.target.value)} />
        {selectedRoomId && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">● Realtime</span>
        )}
      </div>

      {!selectedRoomId ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm px-4 text-center">
          Chọn phòng khám để xem hàng đợi
        </div>
      ) : (
        <>
          {/* Mobile tab bar */}
          <div className="md:hidden flex border-b border-gray-200 bg-white shrink-0">
            {([
              { key: 'waiting', label: 'Chờ', count: waiting.length, color: 'text-blue-600' },
              { key: 'in_room', label: 'Đang khám', count: inRoom.length, color: 'text-orange-500' },
              { key: 'done', label: 'Xong', count: done.length, color: 'text-green-600' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setMobileTab(tab.key)}
                className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${mobileTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}>
                {tab.label} <span className={`font-bold ${tab.color}`}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Desktop: 3 cột | Mobile: 1 tab */}
          <div className="flex-1 overflow-hidden flex">
            {/* Desktop columns */}
            <div className="hidden md:flex flex-1 gap-0 overflow-hidden">
              <WaitingColumn entries={waiting} room={room} />
              <InRoomColumn entries={inRoom} room={room} />
              <DoneColumn entries={done} />
            </div>

            {/* Mobile single panel */}
            <div className="flex md:hidden flex-1 overflow-hidden">
              {mobileTab === 'waiting' && <WaitingColumn entries={waiting} room={room} />}
              {mobileTab === 'in_room' && <InRoomColumn entries={inRoom} room={room} />}
              {mobileTab === 'done' && <DoneColumn entries={done} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ===== Cột Chờ khám =====
function WaitingColumn({ entries, room }: {
  entries: QueueEntry[];
  room?: ClinicRoom;
}) {
  const qc = useQueryClient();
  const [inviteModal, setInviteModal] = useState<QueueEntry | null>(null);
  const [fairnessInput, setFairnessInput] = useState<Record<string, string>>({});
  const [queuedAtInput, setQueuedAtInput] = useState<Record<string, string>>({});
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInType, setCheckInType] = useState<'new' | 'result'>('new');
  const [checkInMsg, setCheckInMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const skipMut = useMutation({
    mutationFn: (id: string) => queueApi.skip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Bỏ qua thất bại')),
  });

  const fairnessMut = useMutation({
    mutationFn: ({ id, scoreF }: { id: string; scoreF: number }) =>
      queueApi.updateFairness(id, scoreF),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue'] });
      toast.success('Đã cập nhật điểm F');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Cập nhật điểm F thất bại')),
  });

  const queuedAtMut = useMutation({
    mutationFn: ({ id, queuedAt }: { id: string; queuedAt: string }) =>
      queueApi.updateQueuedAt(id, queuedAt),
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Cập nhật thời gian thất bại')),
  });

  const checkInMut = useMutation({
    mutationFn: () => visitsApi.checkIn(checkInCode.trim().toUpperCase(), checkInType, room!.id),
    onSuccess: (v: any) => {
      setCheckInMsg({ ok: true, text: `✓ ${v.patient?.fullName} đã vào hàng chờ` });
      setCheckInCode('');
      setTimeout(() => setCheckInMsg(null), 3000);
    },
    onError: (e: unknown) => {
      setCheckInMsg({ ok: false, text: extractErrorMessage(e, 'Check-in thất bại') });
    },
  });

  return (
    <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">
          Chờ khám <span className="text-blue-600 ml-1">{entries.length}</span>
        </h3>
      </div>

      {/* Check-in inline */}
      <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
        <div className="flex gap-1">
          <input
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono uppercase"
            placeholder="Mã lượt khám..."
            value={checkInCode}
            onChange={e => setCheckInCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && checkInCode && checkInMut.mutate()}
          />
          <select
            className="px-1.5 py-1.5 border border-gray-300 rounded text-xs"
            value={checkInType}
            onChange={e => setCheckInType(e.target.value as 'new' | 'result')}
          >
            <option value="new">Khám</option>
            <option value="result">Trả KQ</option>
          </select>
          <button
            onClick={() => checkInMut.mutate()}
            disabled={!checkInCode.trim() || !room}
            className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-40"
          >
            Check-in
          </button>
        </div>
        {checkInMsg && (
          <div className={`mt-1 text-xs px-2 py-1 rounded ${checkInMsg.ok ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
            {checkInMsg.text}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {entries.map((entry, idx) => (
          <WaitingCard
            key={entry.id}
            entry={entry}
            rank={idx + 1}
            fairnessValue={fairnessInput[entry.id] ?? String(entry.scoreF)}
            onFairnessChange={val => setFairnessInput(f => ({ ...f, [entry.id]: val }))}
            onFairnessSave={() => {
              const val = parseFloat(fairnessInput[entry.id] ?? '0');
              if (!isNaN(val)) fairnessMut.mutate({ id: entry.id, scoreF: val });
            }}
            queuedAtValue={queuedAtInput[entry.id] ?? (() => { const d = new Date(entry.queuedAt); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}
            onQueuedAtChange={val => setQueuedAtInput(f => ({ ...f, [entry.id]: val }))}
            onQueuedAtSave={() => {
              const raw = queuedAtInput[entry.id];
              if (!raw) return;
              // Ghép với ngày hôm nay của visit
              const visitDate = entry.visit?.visitDate ?? new Date().toISOString().slice(0, 10);
              const iso = new Date(`${visitDate}T${raw}:00`).toISOString();
              queuedAtMut.mutate({ id: entry.id, queuedAt: iso });
            }}
            onSkip={() => skipMut.mutate(entry.id)}
            onInvite={() => setInviteModal(entry)}
          />
        ))}
        {entries.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">Không có bệnh nhân chờ</div>
        )}
      </div>

      {inviteModal && room && (
        <InviteModal
          entry={inviteModal}
          room={room}
          onClose={() => setInviteModal(null)}
        />
      )}
    </div>
  );
}

// ===== Card bệnh nhân chờ =====
function WaitingCard({ entry, rank, fairnessValue, onFairnessChange, onFairnessSave, queuedAtValue, onQueuedAtChange, onQueuedAtSave, onSkip, onInvite }: {
  entry: QueueEntry;
  rank: number;
  fairnessValue: string;
  onFairnessChange: (val: string) => void;
  onFairnessSave: () => void;
  queuedAtValue: string;
  onQueuedAtChange: (val: string) => void;
  onQueuedAtSave: () => void;
  onSkip: () => void;
  onInvite: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const bd = entry.scoreBreakdown;
  const total = bd?.total ?? entry.totalScore;
  const waitMin = bd?.waitingMinutes ?? 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 relative">
      {/* Rank badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
        {rank}
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1 ml-2">
          <div className="font-medium text-sm text-gray-800">{entry.visit?.patient?.fullName}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {(entry.visit?.categories ?? []).map(c => c.name).join(', ') || '—'} · {waitMin} phút chờ
          </div>
        </div>

        {/* Score badge với tooltip */}
        <div className="relative ml-2" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold text-sm cursor-help">
            {total.toFixed(1)} điểm
          </div>

          {showTooltip && bd && (
            <div className="absolute right-0 top-8 z-20 bg-gray-900 text-white text-xs rounded-lg p-3 w-60 shadow-xl">
              <div className="font-semibold mb-2 border-b border-gray-600 pb-1">
                {entry.visit?.patient?.fullName}
              </div>
              <div className="space-y-1">
                {/* P — liệt kê từng danh mục */}
                <div className="flex justify-between font-medium">
                  <span>P (Điểm theo đối tượng):</span>
                  <span className="font-mono">+{bd.scoreP.toFixed(1)}</span>
                </div>
                {(entry.visit?.categories ?? []).map(cat => (
                  <div key={cat.id} className="flex justify-between pl-3 text-gray-400">
                    <span className="truncate mr-2">{cat.name}</span>
                    <span className="font-mono shrink-0">+{cat.scoreP}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-0.5"><span>T ({waitMin}ph):</span><span className="font-mono">+{bd.scoreT.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>S (Skip/đẩy lùi):</span><span className="font-mono">+{bd.scoreS.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>C (Check-in):</span><span className="font-mono">{bd.scoreC >= 0 ? '+' : ''}{bd.scoreC.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>F (Thủ công):</span><span className="font-mono">{entry.scoreF >= 0 ? '+' : ''}{entry.scoreF.toFixed(1)}</span></div>
                <div className="flex justify-between border-t border-gray-600 pt-1 font-bold">
                  <span>TỔNG:</span><span className="font-mono">{bd.total.toFixed(1)}</span>
                </div>
              </div>
              {entry.skipCount > 0 && <div className="mt-1 text-yellow-300">Bỏ qua {entry.skipCount} lần</div>}
              {entry.autoSkipCount > 0 && <div className="text-orange-300">Bị đẩy lùi {entry.autoSkipCount} lần</div>}
            </div>
          )}
        </div>
      </div>

      {/* queuedAt + Fairness */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Chờ từ:</span>
          <input
            type="time"
            className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
            value={queuedAtValue}
            onChange={e => onQueuedAtChange(e.target.value)}
            onBlur={onQueuedAtSave}
            onKeyDown={e => e.key === 'Enter' && onQueuedAtSave()}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">F <span className="text-gray-300">(ưu tiên thủ công)</span>:</span>
          <input
            type="number"
            className="w-14 px-1.5 py-0.5 border border-gray-300 rounded text-xs text-center"
            value={fairnessValue}
            onChange={e => onFairnessChange(e.target.value)}
            onBlur={onFairnessSave}
            onKeyDown={e => e.key === 'Enter' && onFairnessSave()}
          />
        </div>
      </div>
      {/* Actions */}
      <div className="flex gap-2 mt-2">
        <button onClick={onSkip}
          className="flex-1 py-1.5 text-xs border border-orange-300 text-orange-600 rounded hover:bg-orange-50">
          Bỏ qua
        </button>
        <button onClick={onInvite}
          className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
          Mời vào ►
        </button>
      </div>
    </div>
  );
}

// ===== Modal chọn slot khi mời vào =====
function InviteModal({ entry, room, onClose }: {
  entry: QueueEntry;
  room: ClinicRoom;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { data: availableSlots = [] } = useQuery<DoctorSlot[]>({
    queryKey: ['available-slots', room.id],
    queryFn: () => roomsApi.getAvailableSlots(room.id),
  });

  const inviteMut = useMutation({
    mutationFn: (slotId: string) => queueApi.invite(entry.id, slotId),
    onSuccess: () => onClose(),
    onError: (e: unknown) => setError(extractErrorMessage(e, 'Lỗi mời vào phòng')),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-5 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-1">Mời vào phòng</h3>
        <p className="text-sm text-gray-500 mb-4">Chọn slot bác sĩ cho <strong>{entry.visit?.patient?.fullName}</strong></p>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
        )}

        {availableSlots.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">Không có slot trống</div>
        ) : (
          <div className="space-y-2">
            {availableSlots.map(slot => (
              <button key={slot.id}
                onClick={() => { setError(null); inviteMut.mutate(slot.id); }}
                disabled={inviteMut.isPending}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50">
                <div className="font-medium text-sm">Slot {slot.slotNumber}</div>
                {slot.doctorName && <div className="text-xs text-gray-500">BS. {slot.doctorName}</div>}
              </button>
            ))}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          Huỷ
        </button>
      </div>
    </div>
  );
}

// ===== Cột Đang khám =====
function InRoomColumn({ entries, room }: {
  entries: QueueEntry[];
  room?: ClinicRoom;
}) {
  const qc = useQueryClient();

  const doneMut = useMutation({
    mutationFn: (id: string) => queueApi.markDone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue'] });
      toast.success('Đã hoàn tất khám');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Cập nhật trạng thái thất bại')),
  });

  const slots = [...(room?.slots ?? [])].sort((a, b) => a.slotNumber - b.slotNumber);

  return (
    <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">
          Đang khám <span className="text-orange-500 ml-1">{entries.length}</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {slots.map(slot => {
          const patient = entries.find(e => e.slotId === slot.id);
          return (
            <div key={slot.id} className={`bg-white rounded-lg border p-3 ${slot.isAbsent ? 'border-red-200 opacity-60' : patient ? 'border-orange-300' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-gray-500">Slot {slot.slotNumber}</span>
                  {slot.doctorName && <span className="text-xs text-gray-400 ml-1">· BS. {slot.doctorName}</span>}
                </div>
                {slot.isAbsent && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Vắng</span>}
              </div>

              {patient ? (
                <div>
                  <div className="font-medium text-sm text-gray-800">{patient.visit?.patient?.fullName}</div>
                  <div className="text-xs text-gray-400">{(patient.visit?.categories ?? []).map(c => c.name).join(', ') || '—'}</div>
                  <div className="text-xs text-gray-400">
                    Vào lúc: {patient.startedAt ? new Date(patient.startedAt).toLocaleTimeString('vi-VN') : '—'}
                  </div>
                  <button
                    onClick={() => doneMut.mutate(patient.id)}
                    className="mt-2 w-full py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    ✓ Khám xong
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-400 text-center py-2">
                  {slot.isAbsent ? 'Bác sĩ vắng' : 'Trống'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== Cột Đã khám =====
function DoneColumn({ entries }: { entries: QueueEntry[] }) {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">
          Đã khám xong <span className="text-green-600 ml-1">{entries.length}</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {entries.map(entry => (
          <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="font-medium text-sm text-gray-700">{entry.visit?.patient?.fullName}</div>
            <div className="text-xs text-gray-400">{(entry.visit?.categories ?? []).map(c => c.name).join(', ') || '—'}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              Xong lúc: {entry.finishedAt ? new Date(entry.finishedAt).toLocaleTimeString('vi-VN') : '—'}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">Chưa có bệnh nhân nào hoàn tất</div>
        )}
      </div>
    </div>
  );
}
