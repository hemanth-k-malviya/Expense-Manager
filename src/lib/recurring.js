import { addFrequency, createId } from './dates'

export function isSavingsTransfer(transaction) {
  if (!transaction) return false
  return Boolean(transaction.savings) || transaction.category === 'Savings'
}

function alreadyPosted(transactions, recurringId, date) {
  return (transactions || []).some(
    (item) => item.recurringId === recurringId && item.date === date,
  )
}

export function materializeRecurring(recurring, today, existingTransactions = []) {
  const newTransactions = []

  const updatedRecurring = (recurring || []).map((item) => {
    if (!item.nextDate || item.nextDate > today) {
      return item
    }

    let nextDate = item.nextDate
    let guard = 0

    while (nextDate && nextDate <= today && guard < 36) {
      if (!alreadyPosted(existingTransactions, item.id, nextDate) &&
          !alreadyPosted(newTransactions, item.id, nextDate)) {
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
      }
      nextDate = addFrequency(nextDate, item.frequency)
      guard += 1
    }

    return { ...item, nextDate }
  })

  return { newTransactions, updatedRecurring }
}

/** Merge newly posted recurring rows into the workspace lists. */
export function applyRecurringMaterialization(recurring, transactions, today) {
  const { newTransactions, updatedRecurring } = materializeRecurring(
    recurring,
    today,
    transactions,
  )
  if (!newTransactions.length) {
    return {
      transactions,
      recurring: updatedRecurring,
      postedCount: 0,
    }
  }
  return {
    transactions: [...newTransactions, ...(transactions || [])],
    recurring: updatedRecurring,
    postedCount: newTransactions.length,
  }
}
