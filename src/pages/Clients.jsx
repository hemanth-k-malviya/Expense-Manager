import { useState } from 'react'
import Field, { controlClass } from '../components/Field'
import { useExpenses } from '../context/ExpenseContext'
import { nameById } from '../lib/business'
import { formatMoney } from '../lib/format'

export default function Clients() {
  const { profile, clients, projects, monthTransactions, addClient, deleteClient, addProject, deleteProject, t } = useExpenses()
  const [client, setClient] = useState({ name: '', contact: '', email: '' })
  const [project, setProject] = useState({ name: '', clientId: '' })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title m-0 font-semibold text-[#223535]">{t('clients.title')}</h1>
        <p className="mt-2 text-[13px] text-[#88918b]">{t('clients.subtitle')}</p>
      </div>

      <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('clients.clients')}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!client.name.trim()) return
            addClient(client)
            setClient({ name: '', contact: '', email: '' })
          }}
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label={t('clients.name')} explain={t('clients.nameHint')} placeholder={t('clients.namePh')}>
            <input value={client.name} onChange={(event) => setClient((current) => ({ ...current, name: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('clients.contact')} explain={t('clients.contactHint')} placeholder={t('clients.contactPh')}>
            <input value={client.contact} onChange={(event) => setClient((current) => ({ ...current, contact: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('clients.email')} explain={t('clients.emailHint')} placeholder={t('clients.emailPh')}>
            <input value={client.email} onChange={(event) => setClient((current) => ({ ...current, email: event.target.value }))} className={controlClass} />
          </Field>
          <button type="submit" className="self-end min-h-11 rounded-[8px] bg-[#1d3434] px-4 py-2 text-[12px] font-semibold text-white">
            {t('clients.add')}
          </button>
        </form>
        <div className="mt-4 divide-y divide-[#eff1ed]">
          {clients.map((item) => {
            const billable = monthTransactions
              .filter((transaction) => transaction.clientId === item.id && transaction.billable)
              .reduce((sum, transaction) => sum + transaction.amount, 0)
            return (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
                <div className="min-w-0">
                  <b className="block truncate">{item.name}</b>
                  <span className="block truncate text-[12px] text-[#7d8782]">
                    {item.contact || t('clients.noContact')} · {t('clients.billable', { amount: formatMoney(billable, profile.currency) })}
                  </span>
                </div>
                <button type="button" onClick={() => deleteClient(item.id)} className="flex-shrink-0 text-[12px] text-[#b45b4a]">
                  {t('common.remove')}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('clients.projects')}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!project.name.trim() || !project.clientId) return
            addProject(project)
            setProject({ name: '', clientId: project.clientId })
          }}
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Field label={t('clients.projectName')} explain={t('clients.projectHint')} placeholder={t('clients.projectPh')}>
            <input value={project.name} onChange={(event) => setProject((current) => ({ ...current, name: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('form.client')} explain={t('clients.selectHint')}>
            <select value={project.clientId} onChange={(event) => setProject((current) => ({ ...current, clientId: event.target.value }))} className={controlClass}>
              <option value="">{t('clients.select')}</option>
              {clients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <button type="submit" className="self-end min-h-11 rounded-[8px] bg-[#e96d52] px-4 py-2 text-[12px] font-semibold text-white">
            {t('clients.addProject')}
          </button>
        </form>
        <div className="mt-4 divide-y divide-[#eff1ed]">
          {projects.map((item) => {
            const spend = monthTransactions.filter((transaction) => transaction.projectId === item.id).reduce((sum, transaction) => sum + transaction.amount, 0)
            return (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
                <div className="min-w-0">
                  <b className="block truncate">{item.name}</b>
                  <span className="block truncate text-[12px] text-[#7d8782]">
                    {t('clients.thisMonth', { client: nameById(clients, item.clientId), amount: formatMoney(spend, profile.currency) })}
                  </span>
                </div>
                <button type="button" onClick={() => deleteProject(item.id)} className="flex-shrink-0 text-[12px] text-[#b45b4a]">
                  {t('common.remove')}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
