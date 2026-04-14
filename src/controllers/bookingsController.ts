import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/db';
import { cancelExpiredPendingBookings } from '../util/util';

export const getBookings = (req: Request, res: Response): void => {
  try {
    cancelExpiredPendingBookings();

    const stmt = db.prepare(`
      SELECT b.*, c.name as car_name
      FROM bookings b
      LEFT JOIN cars c ON b.car_id = c.id
      ORDER BY b.created_at DESC
    `);
    const bookings = stmt.all();
    
    // Map snake_case to camelCase
    const mapped = bookings.map((b: any) => ({
      id: b.id,
      carId: b.car_id,
      customerName: b.customer_name,
      customerEmail: b.customer_email,
      customerPhone: b.customer_phone,
      pickupDate: b.pickup_date,
      returnDate: b.return_date,
      totalPrice: b.total_price,
      status: b.status,
      createdAt: b.created_at,
      car: {
        name: b.car_name
      }
    }));

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving bookings' });
  }
};

export const createBooking = (req: Request, res: Response): void => {
  try {
    const { carId, customerName, customerEmail, customerPhone, pickupDate, returnDate, totalPrice } = req.body;
    
    // Validation
    if (!carId || !customerName || !customerEmail || !pickupDate || !returnDate) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Cancel expired pending bookings before validation
    cancelExpiredPendingBookings();

    // Check if car exists and is available
    const carStmt = db.prepare('SELECT id, available FROM cars WHERE id = ?');
    const car: any = carStmt.get(carId);

    if (!car) {
      res.status(404).json({ message: 'Car not found' });
      return;
    }
    
    if (car.available === 0) {
       // Allow booking even if "available" is false if we are just logging requested dates, 
       // but strictly prompt asked: "validate car exists and is available".
       res.status(400).json({ message: 'Car is currently unavailable' });
       return;
    }

    // Validate if the user already has an active booking
    const activeBookingStmt = db.prepare(`
      SELECT id FROM bookings
      WHERE customer_email = ? AND status IN ('pending', 'confirmed')
    `);
    const activeBooking = activeBookingStmt.get(customerEmail);
    if (activeBooking) {
      res.status(400).json({ message: 'You already have an active booking' });
      return;
    }

    // Validate if the car is already booked for the selected dates
    const overlapStmt = db.prepare(`
      SELECT id FROM bookings
      WHERE car_id = ? AND status IN ('pending', 'confirmed')
      AND (pickup_date <= ? AND return_date >= ?)
    `);
    const overlap = overlapStmt.get(carId, returnDate, pickupDate);
    if (overlap) {
      res.status(400).json({ message: 'The car is already booked for the selected dates' });
      return;
    }

    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO bookings (id, car_id, customer_name, customer_email, customer_phone, pickup_date, return_date, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, carId, customerName, customerEmail, customerPhone || '', pickupDate, returnDate, Number(totalPrice));

    const newBookingStmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    const newBooking: any = newBookingStmt.get(id);

    res.status(201).json({
      id: newBooking.id,
      carId: newBooking.car_id,
      status: newBooking.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

export const updateBookingStatus = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const stmt = db.prepare('UPDATE bookings SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);

    if (result.changes === 0) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    const updatedStmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    const updated: any = updatedStmt.get(id);
    
    res.json({
      id: updated.id,
      status: updated.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating booking status' });
  }
};

export const getUnavailableDatesForCar = (req: Request, res: Response): void => {
  try {
    const { carId } = req.params;
    
    // Cancel expired pending bookings before checking unavailable dates
    cancelExpiredPendingBookings();

    const stmt = db.prepare(`
      SELECT pickup_date, return_date 
      FROM bookings 
      WHERE car_id = ? AND status IN ('pending', 'confirmed')
    `);
    

    const bookings = stmt.all(carId);

    const mapped = bookings.map((b: any) => ({
      pickupDate: b.pickup_date,
      returnDate: b.return_date,
    }));

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving unavailable dates' });
  }
};
