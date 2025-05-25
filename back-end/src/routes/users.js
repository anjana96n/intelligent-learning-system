import express from 'express';
import User from '../models/User.js';
import { authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all students (teacher only)
router.get('/students', authorizeRole(['teacher']), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('_id name email isPresent lastActive')
      .sort({ name: 1 });
    
    // Map the _id to id for frontend compatibility
    const formattedStudents = students.map(student => ({
      ...student.toObject(),
      id: student._id
    }));
    
    res.json(formattedStudents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

export default router; 