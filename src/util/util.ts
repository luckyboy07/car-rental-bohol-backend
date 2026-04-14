import db from '../models/db';

// Utility function to cancel pending bookings older than 24 hours
export const cancelExpiredPendingBookings = (): void => {
  try {
    const stmt = db.prepare(`
      UPDATE bookings 
      SET status = 'cancelled' 
      WHERE status = 'pending' 
      AND datetime(created_at) <= datetime('now', '-24 hours')
    `);
    stmt.run();
  } catch (error) {
    console.error('Error cancelling expired bookings:', error);
  }
};