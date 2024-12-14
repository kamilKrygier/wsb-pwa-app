const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const bcrypt = require('bcrypt')
const User = require('./schemas/user_schema.js')
const Subscription = require('./schemas/subscription_schema.js')
const IncomeOrCost = require('./schemas/income_or_cost_schema.js')
const fs = require('fs')
const https = require('https')
const webPush = require('web-push')

const public_vapid_key  = 'BA7IiM-dAhz5SacmvKDA14ei6Xsa31ZoBYpOtgN-6-ETZTLl3gaonbRMWE2dW_ZazbAXAufpU7wD-hC2OldEohM'
const {private_vapid_key} = require('./priv-vapid-key')

webPush.setVapidDetails(
    'mailto:your-email@example.com',
    public_vapid_key,
    private_vapid_key
)  

const options = {
    key: fs.readFileSync('C:/xampp/apache/conf/ssl.key/localhost-key.pem'),
    cert: fs.readFileSync('C:/xampp/apache/conf/ssl.crt/localhost.pem')
}

const app = express()
const PORT = 3000
const mongoURI = 'mongodb://localhost:27017/pwa_app_local_db'

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

mongoose.connect(mongoURI)
    .then(() => console.log('Połączono z MongoDB'))
    .catch(err => console.error('Błąd połączenia z MongoDB:', err))


app.use(express.static(path.join(__dirname, '../public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'))
})

app.post('/login', async(req, res) => {

    const { pwa_app_user_mail, pwa_app_user_password } = req.body

    try {
        
        const user = await User.findOne({ email: pwa_app_user_mail })

        if (!user) {
            return res.status(404).send('User not found.')
        }

        
        const isPasswordCorrect = await bcrypt.compare(pwa_app_user_password, user.password)

        if (!isPasswordCorrect) {
            return res.status(401).send('Invalid email or password.')
        }

        res.cookie('pwa_app_is_logged_in', true, {
            secure: false,
            sameSite: 'Strict',
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        res.redirect('/')

    } catch (error) {

        console.error('Error during login:', error)
        res.status(500).send('Internal server error.')

    }
    
})

app.post('/register', async (req, res) => {
    
    const { pwa_app_register_user_mail, pwa_app_register_user_password, pwa_app_register_user_repeat_password } = req.body

    if (!pwa_app_register_user_mail || !pwa_app_register_user_password || !pwa_app_register_user_repeat_password) {
        return res.status(400).json({ message: 'Invalid data' })
    }

    if (pwa_app_register_user_password !== pwa_app_register_user_repeat_password) {
        return res.status(400).send('Hasła się nie zgadzają.')
    }

    if (!pwa_app_register_user_password) {
        return res.status(400).send('Hasło jest wymagane!')
    }

    try {
        const existingUser = await User.findOne({ email: pwa_app_register_user_mail })
        if (existingUser) {
            return res.status(400).send('Użytkownik o tym adresie e-mail już istnieje.')
        }

        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(pwa_app_register_user_password, saltRounds)

        const newUser = new User({
            email: pwa_app_register_user_mail,
            password: hashedPassword,
        })

        await newUser.save()

        // res.status(201).send('Użytkownik zarejestrowany pomyślnie!')
        res.redirect('/')

    } catch (error) {

        console.error(error)
        res.status(500).send('Wystąpił błąd podczas rejestracji.')

    }
    
})

app.post('/subscribe', async (req, res) => {
    const subscription = req.body
  
    try {
      // Check if the subscription already exists
      const existingSubscription = await Subscription.findOne({ endpoint: subscription.endpoint })
  
      if (existingSubscription) {
        res.status(200).json({ message: 'Subscription already exists' })
      } else {
        // Save the new subscription
        const newSubscription = new Subscription(subscription)
        await newSubscription.save()
        res.status(201).json({ message: 'Subscription saved successfully' })
      }
    } catch (error) {
      console.error('Error saving subscription:', error)
      res.status(500).json({ error: 'Failed to save subscription' })
    }
})

app.post('/send-notification', async (req, res) => {
    const payload = JSON.stringify({
      title: 'New Notification',
      body: 'You have a new message!',
    })
    console.log('/send-notification endpoint')
    try {
        const subscriptions = await Subscription.find()
        console.log('Subscriptions:', subscriptions)
    
        const notificationPromises = subscriptions.map(subscription =>
          webPush.sendNotification(subscription, payload).catch(error => {
            console.error('Error sending notification:', error)
    
            // Remove invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
              return Subscription.deleteOne({ endpoint: subscription.endpoint })
            }
          })
        )
    
        await Promise.all(notificationPromises)
        console.log('Notifications sent successfully')
        res.status(200).json({ message: 'Notifications sent successfully' })
      } catch (error) {
        console.error('Error in /send-notification:', error)
        res.status(500).json({ error: 'Failed to send notifications' })
      }
})

// Endpoint to fetch all records
app.get('/get-records', async (req, res) => {
    try {
        const records = await IncomeOrCost.find()
        res.status(200).json(records)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch records' })
    }
})

// Endpoint to save a record
app.post('/add-record', async (req, res) => {
    const { name, quantity, type } = req.body
    try {
        const newRecord = new IncomeOrCost({ name, quantity, type })
        await newRecord.save()
        res.status(201).json({ message: 'Record added successfully', id: newRecord._id })
    } catch (error) {
        console.error('Error adding record:', error)
        res.status(500).json({ error: 'Failed to add record' })
    }
})

// Endpoint to delete a record
app.delete('/delete-record/:id', async (req, res) => {
    const { id } = req.params
    try {
        await IncomeOrCost.findByIdAndDelete(id)
        res.status(200).json({ message: 'Record deleted successfully' })
    } catch (error) {
        console.error('Error deleting record:', error)
        res.status(500).json({ error: 'Failed to delete record' })
    }
})





app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'))
})

https.createServer(options, app).listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`)
})