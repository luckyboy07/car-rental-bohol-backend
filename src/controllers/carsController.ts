import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/db';

const selectCols = 'id, name, brand, type, price_per_day as pricePerDay, seats, transmission, fuel_type as fuelType, image_url as imageUrl, available, description';

export const getCars = (req: Request, res: Response): void => {
  try {
    const stmt = db.prepare(`SELECT ${selectCols} FROM cars`);
    const limit = req.query.limit ? Number(req.query.limit) : null;
    let cars = stmt.all();
    
    // cast available from 1/0 to true/false
    cars = cars.map((c: any) => ({ ...c, available: c.available === 1 }));
    
    if (limit) {
      cars = cars.slice(0, limit);
    }

    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCarById = (req: Request, res: Response): void => {
  try {
    const stmt = db.prepare(`SELECT ${selectCols} FROM cars WHERE id = ?`);
    const car: any = stmt.get(req.params.id);

    if (!car) {
      res.status(404).json({ message: 'Car not found' });
      return;
    }

    car.available = car.available === 1;
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCar = (req: Request, res: Response): void => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'Image file is required' });
      return;
    }

    const { name, brand, type, pricePerDay, seats, transmission, fuelType, available, description } = req.body;
    
    const id = uuidv4();
    const isAvail = available === 'true' || available === true || available === '1' ? 1 : 0;
    const imageUrl = `/uploads/${file.filename}`;

    const stmt = db.prepare(`
      INSERT INTO cars (id, name, brand, type, price_per_day, seats, transmission, fuel_type, image_url, available, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, name, brand, type, Number(pricePerDay), Number(seats), transmission, fuelType, imageUrl, isAvail, description || ''
    );

    const newCarStmt = db.prepare(`SELECT ${selectCols} FROM cars WHERE id = ?`);
    const newCar: any = newCarStmt.get(id);
    newCar.available = newCar.available === 1;

    res.status(201).json(newCar);
  } catch (error) {
    console.error('Failed to create car', error);
    res.status(500).json({ message: 'Server error creating car' });
  }
};

export const updateCar = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { name, brand, type, pricePerDay, seats, transmission, fuelType, available, description } = req.body;
    
    const file = req.file;
    const isAvail = available === 'true' || available === true || available === '1' ? 1 : 0;

    let stmt;
    if (file) {
      const imageUrl = `/uploads/${file.filename}`;
      stmt = db.prepare(`
        UPDATE cars SET 
          name = ?, brand = ?, type = ?, price_per_day = ?, seats = ?, 
          transmission = ?, fuel_type = ?, available = ?, description = ?, image_url = ?
        WHERE id = ?
      `);
      stmt.run(name, brand, type, Number(pricePerDay), Number(seats), transmission, fuelType, isAvail, description || '', imageUrl, id);
    } else {
      stmt = db.prepare(`
        UPDATE cars SET 
          name = ?, brand = ?, type = ?, price_per_day = ?, seats = ?, 
          transmission = ?, fuel_type = ?, available = ?, description = ?
        WHERE id = ?
      `);
      stmt.run(name, brand, type, Number(pricePerDay), Number(seats), transmission, fuelType, isAvail, description || '', id);
    }

    const updatedCarStmt = db.prepare(`SELECT ${selectCols} FROM cars WHERE id = ?`);
    const updatedCar: any = updatedCarStmt.get(id);
    if (!updatedCar) {
      res.status(404).json({ message: 'Car not found' });
      return;
    }
    updatedCar.available = updatedCar.available === 1;

    res.json(updatedCar);
  } catch (error) {
    console.error('Failed to update car', error);
    res.status(500).json({ message: 'Server error updating car' });
  }
};

export const deleteCar = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const checkStmt = db.prepare('SELECT id FROM cars WHERE id = ?');
    if (!checkStmt.get(id)) {
      res.status(404).json({ message: 'Car not found' });
      return;
    }

    const stmt = db.prepare('DELETE FROM cars WHERE id = ?');
    stmt.run(id);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting car' });
  }
};
