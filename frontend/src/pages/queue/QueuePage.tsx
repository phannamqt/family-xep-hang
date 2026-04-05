import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { roomsApi, queueApi } from '../../api';
import type { ClinicRoom, QueueEntry, DoctorSlot } from '../../types';
import { useQueueSocket } from '../../hooks/useSocket';

export default function QueuePage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<QueueEntry[]>([]);

  const { data: rooms = [] } = useQuery<ClinicRoom[]>({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  // Socket realtime update — chỉ cập nhật state, không re-render toàn bộ
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
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <h2 className="text-lg font-bold text-gray-800">Xếp hàng</h2>
        <select
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          value={selectedRoomId}
          onChange={e => setSelectedRoomId(e.target.value)}
        >
          <option value="">-- Chọn phòng khám --</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input type="date" className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          value={date} onChange={e => setDate(e.target.value)} />
        {selectedRoomId && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">● Realtime</span>
        )}
      </div>

      {!selectedRoomId ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Chọn phòng khám để xem hàng đợi
        </div>
      ) : (
        <div className="flex-1 flex gap-0 overflow-hidden">
          {/* Cột 1: Chờ khám */}
          <WaitingColumn
            entries={waiting}
            room={room}
            date={date}
          />

          {/* Cột 2: Đang khám */}
          <InRoomColumn
            entries={inRoom}
            room={room}
            waiting={waiting}
          />

          {/* Cột 3: Đã khám */}
          <DoneColumn entries={done} />
        </div>
      )}
    </div>
  );
}

// ===== Cột Chờ khám =====
function WaitingColumn({ entries, room, date }: {
  entries: QueueEntry[];
  room?: ClinicRoom;
  date: string;
}) {
  const qc = useQueryClient();
  const [inviteModal, setInviteModal] = useState<QueueEntry | null>(null);
  const [fairnessInput, setFairnessInput] = useState<Record<string, string>>({});

  const skipMut = useMutation({
    mutationFn: (id: string) => queueApi.skip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  });

  const fairnessMut = useMutation({
    mutationFn: ({ id, scoreF }: { id: string; scoreF: number }) =>
      queueApi.updateFairness(id, scoreF),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  });

  return (
    <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50 overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">
          Chờ khám <span className="text-blue-600 ml-1">{entries.length}</span>
        </h3>
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
function WaitingCard({ entry, rank, fairnessValue, onFairnessChange, onFairnessSave, onSkip, onInvite }: {
  entry: QueueEntry;
  rank: number;
  fairnessValue: string;
  onFairnessChange: (val: string) => void;
  onFairnessSave: () => void;
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
            {entry.visit?.category?.name} · {waitMin} phút chờ
          </div>
        </div>

        {/* Score badge với tooltip */}
        <div className="relative ml-2" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold text-sm cursor-help">
            {total.toFixed(1)}đ
          </div>

          {showTooltip && bd && (
            <div className="absolute right-0 top-8 z-20 bg-gray-900 text-white text-xs rounded-lg p-3 w-52 shadow-xl">
              <div className="font-semibold mb-2 border-b border-gray-600 pb-1">
                {entry.visit?.patient?.fullName}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between"><span>P (ưu tiên nền):</span><span className="font-mono">+{bd.scoreP.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>T ({waitMin}ph):</span><span className="font-mono">+{bd.scoreT.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>S (skip/đẩy lùi):</span><span className="font-mono">+{bd.scoreS.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>C (check-in):</span><span className="font-mono">{bd.scoreC >= 0 ? '+' : ''}{bd.scoreC.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>F (thủ công):</span><span className="font-mono">{entry.scoreF >= 0 ? '+' : ''}{entry.scoreF.toFixed(1)}</span></div>
                <div className="flex justify-between border-t border-gray-600 pt-1 font-bold">
                  <span>TỔNG:</span><span className="font-mono">{bd.total.toFixed(1)}</span>
                </div>
              </div>
              {entry.skipCount > 0 && <div className="mt-1 text-yellow-300 text-xs">Bỏ qua {entry.skipCount} lần</div>}
              {entry.autoSkipCount > 0 && <div className="text-orange-300 text-xs">Bị đẩy lùi {entry.autoSkipCount} lần</div>}
            </div>
          )}
        </div>
      </div>

      {/* Fairness input + actions */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1 flex-1">
          <span className="text-xs text-gray-400">F:</span>
          <input
            type="number"
            className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-xs text-center"
            value={fairnessValue}
            onChange={e => onFairnessChange(e.target.value)}
            onBlur={onFairnessSave}
            onKeyDown={e => e.key === 'Enter' && onFairnessSave()}
          />
        </div>
        <button onClick={onSkip}
          className="px-2 py-1 text-xs border border-orange-300 text-orange-600 rounded hover:bg-orange-50">
          Bỏ qua
        </button>
        <button onClick={onInvite}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
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
  const qc = useQueryClient();
  const { data: availableSlots = [] } = useQuery<DoctorSlot[]>({
    queryKey: ['available-slots', room.id],
    queryFn: () => roomsApi.getAvailableSlots(room.id),
  });

  const inviteMut = useMutation({
    mutationFn: (slotId: string) => queueApi.invite(entry.id, slotId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-5 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-1">Mời vào phòng</h3>
        <p className="text-sm text-gray-500 mb-4">Chọn slot bác sĩ cho <strong>{entry.visit?.patient?.fullName}</strong></p>

        {availableSlots.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">Không có slot trống</div>
        ) : (
          <div className="space-y-2">
            {availableSlots.map(slot => (
              <button key={slot.id} onClick={() => inviteMut.mutate(slot.id)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
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
function InRoomColumn({ entries, room, waiting }: {
  entries: QueueEntry[];
  room?: ClinicRoom;
  waiting: QueueEntry[];
}) {
  const qc = useQueryClient();

  const doneMut = useMutation({
    mutationFn: (id: string) => queueApi.markDone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  });

  const slots = room?.slots ?? [];

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
                  <div className="text-xs text-gray-400">{patient.visit?.category?.name}</div>
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
            <div className="text-xs text-gray-400">{entry.visit?.category?.name}</div>
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
