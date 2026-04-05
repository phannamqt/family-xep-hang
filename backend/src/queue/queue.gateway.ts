import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QueueService } from './queue.service';
import { format } from 'date-fns';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly queueService: QueueService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Client join vào room để nhận update: 'queue:{roomId}:{date}'
  @SubscribeMessage('join-queue')
  async handleJoinQueue(
    @MessageBody() data: { roomId: string; date?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const date = data.date ?? format(new Date(), 'yyyy-MM-dd');
    const room = `queue:${data.roomId}:${date}`;
    await client.join(room);
    client.emit('joined', { room });

    // Push danh sách hiện tại ngay khi join
    const queue = await this.queueService.getQueue(data.roomId, date);
    client.emit('queue:updated', queue);
  }

  @SubscribeMessage('leave-queue')
  handleLeaveQueue(
    @MessageBody() data: { roomId: string; date?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const date = data.date ?? format(new Date(), 'yyyy-MM-dd');
    const room = `queue:${data.roomId}:${date}`;
    client.leave(room);
  }

  // Gửi update tới tất cả client đang xem queue của phòng đó
  async emitQueueUpdate(roomId: string, date?: string) {
    const targetDate = date ?? format(new Date(), 'yyyy-MM-dd');
    const room = `queue:${roomId}:${targetDate}`;
    const queue = await this.queueService.getQueue(roomId, targetDate);
    this.server.to(room).emit('queue:updated', queue);
  }

  // Gửi update slot (trạng thái bác sĩ trực/vắng)
  emitSlotUpdate(roomId: string, slotData: any) {
    this.server.to(`queue:${roomId}:*`).emit('slot:updated', slotData);
  }
}
