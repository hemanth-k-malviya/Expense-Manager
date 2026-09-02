import { addFrequency, createId } from './dates'

export function materializeRecurring(recurring, today) {
  const newTransactions = []

  const updatedRecurring = recurring.map((item) => {
    if (!item.nextDate || item.nextDate > today) {
      return item
    }

    let nextDate = item.nextDate
    let guard = 0

    while (nextDate && nextDate <= today && guard < 36) {
      newTransactions.push({
        id: createId(),
        name: item.name,
        amount: Number(item.amount),
        type: item.type,
        category: item.category,
        date: nextDate,
        note: item.note || 'Recurring',
        paymentMethod: item.paymentMethod || 'Bank',
        recurringId: item.id,
        createdAt: new Date().toISOString(),
      })
      nextDate = addFrequency(nextDate, item.frequency)
      guard += 1
    }

    return { ...item, nextDate }
  })

  return { newTransactions, updatedRecurring }
}
