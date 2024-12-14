const mongoose = require('mongoose')

const incomeOrCostSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    type: { type: String, enum: ['income', 'cost'], required: true },
})

const IncomeOrCost = mongoose.model('IncomeOrCost', incomeOrCostSchema)

module.exports = IncomeOrCost