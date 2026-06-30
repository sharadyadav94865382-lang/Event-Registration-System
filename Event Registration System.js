const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// 1. DATABASE CONNECTION (MongoDB)
// Agar aap local use kar rahe hain toh 'mongodb://localhost:27017/eventDB' use karein
const MONGO_URI = 'mongodb://127.0.0.1:27017/eventDB'; 
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.error('Database Connection Error:', err));


// 2. DATABASE MODELS (Schemas)

// Event Schema
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    location: String
});
const Event = mongoose.model('Event', eventSchema);

// Registration Schema (Links User and Event)
const registrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    registeredAt: { type: Date, default: Date.now }
});
// Ek user ek event me ek hi baar register kar sake, isliye unique index
registrationSchema.index({ eventId: 1, userEmail: 1 }, { unique: true });
const Registration = mongoose.model('Registration', registrationSchema);


// 3. API ENDPOINTS (Routes)

// A. Create a New Event (Event banane ke liye)
app.post('/api/events', async (req, res) => {
    try {
        const { title, description, date, location } = req.body;
        const newEvent = new Event({ title, description, date, location });
        await newEvent.save();
        res.status(201).json({ message: 'Event created successfully!', event: newEvent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// B. View Event List (Saare events dekhne ke liye)
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// C. View Event Details (Kisi ek specific event ki details)
app.get('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// D. Submit Registration Form (Event me register karne ke liye)
app.post('/api/register', async (req, res) => {
    try {
        const { eventId, userName, userEmail } = req.body;

        // Check if event exists
        const eventExists = await Event.findById(eventId);
        if (!eventExists) return res.status(404).json({ message: 'Event does not exist' });

        // Create registration
        const newRegistration = new Registration({ eventId, userName, userEmail });
        await newRegistration.save();

        res.status(201).json({ message: 'Successfully registered for the event!', registration: newRegistration });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already registered for this event with this email.' });
        }
        res.status(500).json({ error: error.message });
    }
});

// E. View User Registrations (Kisi user ki saari registrations dekhna via Email)
app.get('/api/my-registrations', async (req, res) => {
    try {
        const { email } = req.query; // Query parameter me email pass karein (?email=xyz@gmail.com)
        if (!email) return res.status(400).json({ message: 'Email query parameter is required' });

        const myEvents = await Registration.find({ userEmail: email }).populate('eventId');
        res.status(200).json(myEvents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// F. Cancel Registration (Registration cancel/delete karne ke liye)
app.delete('/api/register/:id', async (req, res) => {
    try {
        const deletedRegistration = await Registration.findByIdAndDelete(req.params.id);
        if (!deletedRegistration) return res.status(404).json({ message: 'Registration not found' });
        
        res.status(200).json({ message: 'Registration cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// 4. SERVER START
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});