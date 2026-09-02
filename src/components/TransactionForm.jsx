import { useMemo, useState } from 'react'
import Field, { controlClass } from './Field'
import { useExpenses } from '../context/ExpenseContext'
import { PAYMENT_METHODS } from '../lib/constants'
import { todayISO } from '../lib/dates'

function emptyForm(categories, company, variant) {
  const expenseCategory = categories.find((category) => category.type === 'expense')
  const withTax = variant === 'billable' || variant === 'company'
  return {
    name: '',
    type: 'expense',
    category: expenseCategory?.name || 'Other',
    amount: '',
    date: todayISO(),
    paymentMethod: 'Card',
    note: '',
    employeeId: '',
    departmentId: '',
    clientId: '',
    projectId: '',
    vendorId: '',
    shopId: '',
    billable: variant === 'billable',
    reimbursable: variant === 'reimburse',
    taxRate: withTax && company?.defaultTaxRate ? String(company.defaultTaxRate) : '0',
    status: variant === 'reimburse' ? 'submitted' : 'recorded',
  }
}

function buildForm(categories, company, initialValue, variant) {
  const base = emptyForm(categories, company, variant)
  if (!initialValue) return base
  return {
    ...base,
    ...initialValue,
    name: initialValue.name || '',
    type: variant === 'billable' || variant === 'reimburse' ? 'expense' : initialValue.type || base.type,
    amount: initialValue.amount != null && initialValue.amount !== '' ? String(initialValue.amount) : '',
    date: initialValue.date || base.date,
    paymentMethod: initialValue.paymentMethod || base.paymentMethod,
    note: initialValue.note || '',
    taxRate: String(initialValue.taxRate ?? base.taxRate),
    billable: variant === 'billable',
    reimbursable: variant === 'reimburse',
    status: variant === 'reimburse' ? initialValue.status || 'submitted' : initialValue.status || 'recorded',
  }
}

function categoryOptionLabel(t, name) {
  const key = `cat.${name}`
  const label = t(key)
  return label === key ? name : label
}

export default function TransactionForm({
  categories,
  initialValue,
  onSubmit,
  onCancel,
  submitLabel = 'Save entry',
  variant = 'personal',
}) {
  const { employees, departments, clients, projects, vendors, shops, company, t } = useExpenses()
  const [form, setForm] = useState(() => buildForm(categories, company, initialValue, variant))
  const [error, setError] = useState('')
  const isPersonal = variant === 'personal'
  const isBillable = variant === 'billable'
  const isReimburse = variant === 'reimburse'
  const isCompany = variant === 'company'
  const allowsType = isPersonal || isCompany

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.type === form.type),
    [categories, form.type],
  )
  const clientProjects = projects.filter((project) => !form.clientId || project.clientId === form.clientId)

  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }))
    setError('')
  }

  const handleTypeChange = (type) => {
    const nextCategory = categories.find((category) => category.type === type)
    update({ type, category: nextCategory?.name || form.category })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const amount = Number.parseFloat(form.amount)

    if (!form.name.trim()) {
      setError(t('form.needTitle'))
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t('form.needAmount'))
      return
    }
    if (!form.date) {
      setError(t('form.needDate'))
      return
    }
    if (isBillable && !form.clientId) {
      setError(t('form.needClient'))
      return
    }
    if (
      isCompany &&
      !form.shopId &&
      !form.vendorId &&
      !form.employeeId &&
      !form.departmentId &&
      !form.clientId &&
      !form.projectId
    ) {
      setError(t('form.needCompanyTag'))
      return
    }

    if (isPersonal) {
      onSubmit({
        ...form,
        amount,
        billable: false,
        reimbursable: false,
        taxRate: 0,
        status: 'recorded',
        clientId: '',
        projectId: '',
        employeeId: '',
        departmentId: '',
        vendorId: '',
        shopId: '',
      })
      return
    }

    onSubmit({
      ...form,
      amount,
      type: isBillable || isReimburse ? 'expense' : form.type,
      billable: isBillable,
      reimbursable: isReimburse,
      taxRate: isReimburse ? 0 : Number.parseFloat(form.taxRate) || 0,
      status: isReimburse ? (form.status === 'recorded' ? 'submitted' : form.status) : form.status || 'recorded',
      clientId: isBillable ? form.clientId : isCompany ? form.clientId : '',
      projectId: isBillable ? form.projectId : isCompany ? form.projectId : '',
      employeeId: isReimburse || isCompany ? form.employeeId : '',
      departmentId: isReimburse || isCompany ? form.departmentId : '',
      vendorId: isCompany ? form.vendorId : '',
      shopId: isCompany ? form.shopId : '',
    })
  }

  const titleExample = isBillable ? t('form.titlePhBillable') : isReimburse ? t('form.titlePhReimburse') : t('form.titlePh')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isPersonal ? <p className="text-[12px] text-[#7d8782]">{t('form.personalHint')}</p> : null}
      {isBillable ? <p className="text-[12px] text-[#7d8782]">{t('form.billableHint')}</p> : null}
      {isReimburse ? <p className="text-[12px] text-[#7d8782]">{t('form.reimbursableHint')}</p> : null}
      {isCompany ? <p className="text-[12px] text-[#7d8782]">{t('form.companyHint')}</p> : null}

      <Field label={t('form.title')} explain={t('form.titleHint')} placeholder={titleExample}>
        <input value={form.name} onChange={(event) => update({ name: event.target.value })} className={controlClass} />
      </Field>

      {allowsType ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('form.type')} explain={t('form.typeHint')}>
            <select value={form.type} onChange={(event) => handleTypeChange(event.target.value)} className={controlClass}>
              <option value="expense">{t('type.expense')}</option>
              <option value="income">{t('type.income')}</option>
            </select>
          </Field>
          <Field label={t('form.category')} explain={t('form.categoryHint')}>
            <select value={form.category} onChange={(event) => update({ category: event.target.value })} className={controlClass}>
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {categoryOptionLabel(t, category.name)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : (
        <Field label={t('form.category')} explain={t('form.categoryHint')}>
          <select value={form.category} onChange={(event) => update({ category: event.target.value })} className={controlClass}>
            {categories
              .filter((category) => category.type === 'expense')
              .map((category) => (
                <option key={category.id} value={category.name}>
                  {categoryOptionLabel(t, category.name)}
                </option>
              ))}
          </select>
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('form.amount')} explain={t('form.amountHint')} placeholder={t('form.amountPh')}>
          <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => update({ amount: event.target.value })} className={controlClass} />
        </Field>
        <Field label={t('form.date')} explain={t('form.dateHint')}>
          <input type="date" value={form.date} onChange={(event) => update({ date: event.target.value })} className={controlClass} />
        </Field>
      </div>

      <Field label={t('form.payment')} explain={t('form.paymentHint')}>
        <select value={form.paymentMethod} onChange={(event) => update({ paymentMethod: event.target.value })} className={controlClass}>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {t(`pay.${method}`)}
            </option>
          ))}
        </select>
      </Field>

      {isBillable ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('form.client')} explain={t('form.clientHint')}>
            <select value={form.clientId} onChange={(event) => update({ clientId: event.target.value, projectId: '' })} className={controlClass}>
              <option value="">{t('form.pickClient')}</option>
              {clients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('form.project')} explain={t('form.projectHint')}>
            <select value={form.projectId} onChange={(event) => update({ projectId: event.target.value })} className={controlClass}>
              <option value="">{t('form.none')}</option>
              {clientProjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('form.tax')} explain={t('form.taxHint')} placeholder={t('form.taxPh')} className="sm:col-span-2">
            <input type="number" min="0" step="0.01" value={form.taxRate} onChange={(event) => update({ taxRate: event.target.value })} className={controlClass} />
          </Field>
        </div>
      ) : null}

      {isReimburse ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('form.employee')} explain={t('form.employeeHint')}>
            <select value={form.employeeId} onChange={(event) => update({ employeeId: event.target.value })} className={controlClass}>
              <option value="">{t('form.unassigned')}</option>
              {employees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('form.department')} explain={t('form.departmentHint')}>
            <select value={form.departmentId} onChange={(event) => update({ departmentId: event.target.value })} className={controlClass}>
              <option value="">{t('form.unassigned')}</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      {isCompany ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('form.shop')} explain={t('form.shopHint')}>
            <select value={form.shopId} onChange={(event) => update({ shopId: event.target.value })} className={controlClass}>
              <option value="">{t('form.noShop')}</option>
              {shops.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('form.vendor')} explain={t('form.vendorHint')}>
            <select value={form.vendorId} onChange={(event) => update({ vendorId: event.target.value })} className={controlClass}>
              <option value="">{t('form.none')}</option>
              {vendors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('form.employee')} explain={t('form.employeeHint')}>
            <select value={form.employeeId} onChange={(event) => update({ employeeId: event.target.value })} className={controlClass}>
              <option value="">{t('form.unassigned')}</option>
              {employees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('form.department')} explain={t('form.departmentHint')}>
            <select value={form.departmentId} onChange={(event) => update({ departmentId: event.target.value })} className={controlClass}>
              <option value="">{t('form.unassigned')}</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('form.tax')} explain={t('form.taxHint')} placeholder={t('form.taxPh')} className="sm:col-span-2">
            <input type="number" min="0" step="0.01" value={form.taxRate} onChange={(event) => update({ taxRate: event.target.value })} className={controlClass} />
          </Field>
        </div>
      ) : null}

      <Field label={t('form.note')} explain={t('form.noteHint')} placeholder={t('form.notePh')}>
        <textarea value={form.note} onChange={(event) => update({ note: event.target.value })} rows={3} className={`${controlClass} resize-y`} />
      </Field>

      {error ? <p className="text-[12px] text-[#c45b45]">{error}</p> : null}

      <div className="flex flex-col-reverse gap-[10px] pt-[8px] sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="min-h-11 rounded-[8px] border border-[#dfe6df] bg-white px-[14px] py-[10px] text-[12px] font-medium text-[#485d5a]">
          {t('common.cancel')}
        </button>
        <button type="submit" className="min-h-11 rounded-[8px] bg-[#e96d52] px-[16px] py-[10px] text-[12px] font-semibold text-white">
          {submitLabel || t('tx.saveEntry')}
        </button>
      </div>
    </form>
  )
}
