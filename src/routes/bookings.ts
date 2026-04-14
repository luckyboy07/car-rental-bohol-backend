import { Router } from 'express';
import { body } from 'express-validator';
import { getBookings, createBooking, updateBookingStatus, getUnavailableDatesForCar } from '../controllers/bookingsController';
import { authenticateAdmin } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validate';

const router = Router();

const createBookingValidation = [
  body('carId').isString().notEmpty(),
  body('customerName').isString().notEmpty(),
  body('customerEmail').isEmail(),
  body('pickupDate').isISO8601(),
  body('returnDate').isISO8601(),
  body('totalPrice').isNumeric(),
  validateRequest
];

// Public endpoints
router.post('/', createBookingValidation, createBooking);
router.get('/car/:carId/unavailable-dates', getUnavailableDatesForCar);

// Protected endpoints
router.get('/', authenticateAdmin, getBookings);
router.put('/:id/status', authenticateAdmin, [body('status').isIn(['pending', 'confirmed', 'cancelled']), validateRequest], updateBookingStatus);

export default router;
