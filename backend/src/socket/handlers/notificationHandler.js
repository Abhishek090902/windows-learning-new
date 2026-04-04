import prisma from '../../config/db.js';

const notificationHandler = (_io, socket) => {
  socket.on('notifications:subscribe', () => {
    socket.join(`notifications:${socket.userId}`);
  });

  socket.on('notifications:get_unread_count', async () => {
    try {
      const unreadCount = await prisma.notification.count({
        where: {
          userId: socket.userId,
          isRead: false,
          isActive: true,
        },
      });

      socket.emit('notifications:unread_count', { unreadCount });
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      socket.emit('error', { message: 'Failed to load notifications' });
    }
  });

  socket.on('notifications:mark_all_read', async () => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: socket.userId,
          isRead: false,
          isActive: true,
        },
        data: {
          isRead: true,
        },
      });

      socket.emit('notifications:all_read');
      socket.emit('new_notification', { unreadCount: 0 });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      socket.emit('error', { message: 'Failed to update notifications' });
    }
  });
};

export default notificationHandler;
