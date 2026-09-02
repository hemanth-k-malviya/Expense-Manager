import { useState } from 'react'
import Field, { controlClass } from '../components/Field'
import LockedFeature from '../components/LockedFeature'
import { useExpenses } from '../context/ExpenseContext'
import { EMPLOYEE_ROLES, nameById } from '../lib/business'

export default function Team() {
  const { isFeatureEnabled, departments, employees, addDepartment, deleteDepartment, addEmployee, deleteEmployee, t } = useExpenses()
  const [dept, setDept] = useState({ name: '', code: '' })
  const [member, setMember] = useState({ name: '', email: '', role: 'employee', departmentId: '' })

  if (!isFeatureEnabled('team')) return <LockedFeature feature="team" />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title m-0 font-semibold text-[#223535]">{t('team.title')}</h1>
        <p className="mt-2 text-[13px] text-[#88918b]">{t('team.subtitle')}</p>
      </div>

      <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('team.departments')}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!dept.name.trim()) return
            addDepartment(dept)
            setDept({ name: '', code: '' })
          }}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_auto]"
        >
          <Field label={t('team.deptName')} explain={t('team.deptHint')} placeholder={t('team.deptPh')}>
            <input value={dept.name} onChange={(event) => setDept((current) => ({ ...current, name: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('team.code')} explain={t('team.codeHint')} placeholder={t('team.codePh')}>
            <input value={dept.code} onChange={(event) => setDept((current) => ({ ...current, code: event.target.value }))} className={controlClass} />
          </Field>
          <button type="submit" className="self-end min-h-11 rounded-[8px] bg-[#1d3434] px-4 py-2 text-[12px] font-semibold text-white">
            {t('common.add')}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {departments.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-2 rounded-full bg-[#f3f6f1] px-3 py-1 text-[11px]">
              {item.name} {item.code ? `· ${item.code}` : ''}
              <button type="button" onClick={() => deleteDepartment(item.id)} className="text-[#b45b4a]">
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[9px] border border-[#e8ebe4] bg-white p-5">
        <h2 className="text-[17px] font-semibold text-[#263b39]">{t('team.employees')}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!member.name.trim()) return
            addEmployee(member)
            setMember({ name: '', email: '', role: 'employee', departmentId: member.departmentId })
          }}
          className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          <Field label={t('team.name')} explain={t('team.nameHint')} placeholder={t('team.namePh')}>
            <input value={member.name} onChange={(event) => setMember((current) => ({ ...current, name: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('team.email')} explain={t('team.emailHint')} placeholder={t('team.emailPh')}>
            <input value={member.email} onChange={(event) => setMember((current) => ({ ...current, email: event.target.value }))} className={controlClass} />
          </Field>
          <Field label={t('team.role')} explain={t('team.roleHint')}>
            <select value={member.role} onChange={(event) => setMember((current) => ({ ...current, role: event.target.value }))} className={controlClass}>
              {EMPLOYEE_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {t(`role.${role.value}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('form.department')} explain={t('team.deptPickHint')}>
            <select value={member.departmentId} onChange={(event) => setMember((current) => ({ ...current, departmentId: event.target.value }))} className={controlClass}>
              <option value="">{t('team.noDept')}</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <button type="submit" className="self-end min-h-11 rounded-[8px] bg-[#e96d52] px-4 py-2 text-[12px] font-semibold text-white">
            {t('team.addMember')}
          </button>
        </form>

        <div className="mt-4 divide-y divide-[#eff1ed]">
          {employees.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
              <div className="min-w-0">
                <b className="block truncate text-[#263b39]">{item.name}</b>
                <span className="block truncate text-[12px] text-[#7d8782]">
                  {t(`role.${item.role}`)} · {nameById(departments, item.departmentId, t('team.noDept'))}
                  {item.email ? ` · ${item.email}` : ''}
                </span>
              </div>
              <button type="button" onClick={() => deleteEmployee(item.id)} className="flex-shrink-0 text-[12px] text-[#b45b4a]">
                {t('common.remove')}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
