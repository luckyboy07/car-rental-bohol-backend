import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { body } from 'express-validator';
import { getCars, getCarById, createCar, updateCar, deleteCar } from '../controllers/carsController';
import { authenticateAdmin } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validate';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const carValidation = [
  body('name').isString().notEmpty(),
  body('brand').isString().notEmpty(),
  body('type').isIn(['sedan', 'suv', 'van', 'motorcycle']),
  body('pricePerDay').isNumeric(),
  body('seats').isInt({ min: 1 }),
  body('transmission').isIn(['manual', 'automatic']),
  body('fuelType').isIn(['gasoline', 'diesel']),
  // available logic can be boolean or string 'true'/'false'
  validateRequest
];

// Public endpoints
router.get('/', getCars);
router.get('/:id', getCarById);

// Protected endpoints
router.post('/', authenticateAdmin, upload.single('image'), carValidation, createCar);
router.put('/:id', authenticateAdmin, upload.single('image'), carValidation, updateCar);
router.delete('/:id', authenticateAdmin, deleteCar);

export default router;
