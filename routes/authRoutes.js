import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';

const router = express.Router();

// ================= Sign Up Route =================
router.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= Sign In Route =================
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Success → send user data (without password)
    res.status(200).json({
      message: 'Sign in successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= Get Profile =================
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); // exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= Update Profile Route =================
router.patch('/update-profile/:id', async (req, res) => {
  const { id } = req.params;
  const { homeTown, age, currentPosition, skillsWanted, skillsOffered } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        homeTown,
        age,
        currentPosition,
        skillsWanted,
        skillsOffered,
      },
      { new: true } // return updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'fullName skillsOffered skillsWanted');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

export default router;
