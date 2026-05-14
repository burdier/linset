import { computed, onMounted, reactive, ref, watch } from 'vue/dist/vue.esm-bundler.js'

export default {
  setup() {
const STORAGE_KEY = 'deuditas:v1'
const today = new Date().toISOString().slice(0, 10)

const debts = ref([])
const selectedDebtId = ref(null)
const showImport = ref(false)
const importText = ref('')
const importError = ref('')

const debtForm = reactive({
  name: '',
  total: '',
  emoji: '🚗',
  dueDate: '',
})

const paymentForm = reactive({
  amount: '',
  date: today,
  note: '',
})

const selectedDebt = computed(() => debts.value.find((debt) => debt.id === selectedDebtId.value) ?? debts.value[0] ?? null)

const totals = computed(() => {
  const totalDebt = debts.value.reduce((sum, debt) => sum + debt.total, 0)
  const totalPaid = debts.value.reduce((sum, debt) => sum + paidFor(debt), 0)
  const remaining = Math.max(totalDebt - totalPaid, 0)
  return {
    totalDebt,
    totalPaid,
    remaining,
    percent: totalDebt ? Math.min(Math.round((totalPaid / totalDebt) * 100), 100) : 0,
  }
})

const sortedPayments = computed(() => {
  if (!selectedDebt.value) return []
  return [...selectedDebt.value.payments].sort((a, b) => b.date.localeCompare(a.date))
})

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function money(value) {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0)
}

function paidFor(debt) {
  return debt.payments.reduce((sum, payment) => sum + payment.amount, 0)
}

function remainingFor(debt) {
  return Math.max(debt.total - paidFor(debt), 0)
}

function progressFor(debt) {
  return debt.total ? Math.min(Math.round((paidFor(debt) / debt.total) * 100), 100) : 0
}

function addDebt() {
  const total = Number(debtForm.total)
  if (!debtForm.name.trim() || !Number.isFinite(total) || total <= 0) return

  const newDebt = {
    id: uid(),
    name: debtForm.name.trim(),
    total,
    emoji: debtForm.emoji.trim() || '💸',
    dueDate: debtForm.dueDate,
    payments: [],
    createdAt: new Date().toISOString(),
  }

  debts.value.unshift(newDebt)
  selectedDebtId.value = newDebt.id
  Object.assign(debtForm, { name: '', total: '', emoji: '🚗', dueDate: '' })
}

function addPayment() {
  if (!selectedDebt.value) return
  const amount = Number(paymentForm.amount)
  if (!Number.isFinite(amount) || amount <= 0) return

  selectedDebt.value.payments.unshift({
    id: uid(),
    amount,
    date: paymentForm.date || today,
    note: paymentForm.note.trim(),
  })

  Object.assign(paymentForm, { amount: '', date: today, note: '' })
}

function removePayment(paymentId) {
  if (!selectedDebt.value) return
  selectedDebt.value.payments = selectedDebt.value.payments.filter((payment) => payment.id !== paymentId)
}

function removeDebt(debtId) {
  const debt = debts.value.find((item) => item.id === debtId)
  if (!debt || !confirm(`¿Borrar "${debt.name}" y todos sus pagos?`)) return
  debts.value = debts.value.filter((item) => item.id !== debtId)
  selectedDebtId.value = debts.value[0]?.id ?? null
}

function seedDemo() {
  const demo = {
    id: uid(),
    name: 'Pagar el carro',
    total: 12500,
    emoji: '🚗',
    dueDate: '2026-12-31',
    createdAt: new Date().toISOString(),
    payments: [
      { id: uid(), amount: 450, date: today, note: 'Primer pagaré' },
      { id: uid(), amount: 300, date: today, note: 'Extra de esta semana' },
    ],
  }
  debts.value = [demo]
  selectedDebtId.value = demo.id
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({ debts: debts.value }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `deuditas-backup-${today}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function importBackup() {
  importError.value = ''
  try {
    const parsed = JSON.parse(importText.value)
    const nextDebts = Array.isArray(parsed) ? parsed : parsed.debts
    if (!Array.isArray(nextDebts)) throw new Error('Formato inválido')
    debts.value = nextDebts.map((debt) => ({
      id: debt.id || uid(),
      name: String(debt.name || 'Deuda sin nombre'),
      total: Number(debt.total) || 0,
      emoji: String(debt.emoji || '💸'),
      dueDate: debt.dueDate || '',
      createdAt: debt.createdAt || new Date().toISOString(),
      payments: Array.isArray(debt.payments)
        ? debt.payments.map((payment) => ({
            id: payment.id || uid(),
            amount: Number(payment.amount) || 0,
            date: payment.date || today,
            note: String(payment.note || ''),
          }))
        : [],
    })).filter((debt) => debt.total > 0)
    selectedDebtId.value = debts.value[0]?.id ?? null
    importText.value = ''
    showImport.value = false
  } catch (error) {
    importError.value = 'No pude leer ese JSON. Verifica el archivo y vuelve a intentar.'
  }
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    seedDemo()
    return
  }

  try {
    const parsed = JSON.parse(saved)
    debts.value = Array.isArray(parsed.debts) ? parsed.debts : []
    selectedDebtId.value = parsed.selectedDebtId ?? debts.value[0]?.id ?? null
  } catch {
    seedDemo()
  }
})

watch([debts, selectedDebtId], () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ debts: debts.value, selectedDebtId: selectedDebtId.value }))
}, { deep: true })

return { debts, selectedDebtId, showImport, importText, importError, debtForm, paymentForm, selectedDebt, totals, sortedPayments, money, paidFor, remainingFor, progressFor, addDebt, addPayment, removePayment, removeDebt, exportBackup, importBackup }
  },
  template: `
  <main class="app-shell">
    <section class="hero card">
      <div>
        <p class="eyebrow">Tu avance, sin estrés</p>
        <h1>Deuditas</h1>
        <p class="hero-copy">Trackea deudas, apunta cada pagaré y celebra cómo baja el balance. Todo queda guardado en este navegador.</p>
      </div>
      <div class="hero-meter" :style="{ '--meter': totals.percent }" aria-label="Progreso total">
        <span>{{ totals.percent }}%</span>
        <small>pagado</small>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat card">
        <span>Total de deudas</span>
        <strong>{{ money(totals.totalDebt) }}</strong>
      </article>
      <article class="stat card paid">
        <span>Pagado</span>
        <strong>{{ money(totals.totalPaid) }}</strong>
      </article>
      <article class="stat card pending">
        <span>Pendiente</span>
        <strong>{{ money(totals.remaining) }}</strong>
      </article>
    </section>

    <section class="layout">
      <aside class="card panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">Nueva meta</p>
            <h2>Agrega una deuda</h2>
          </div>
        </div>

        <form class="stack" @submit.prevent="addDebt">
          <label>
            Nombre
            <input v-model="debtForm.name" placeholder="Ej. Pagar el carro" required />
          </label>
          <div class="two-cols">
            <label>
              Total
              <input v-model="debtForm.total" min="1" step="0.01" type="number" placeholder="12500" required />
            </label>
            <label>
              Emoji
              <input v-model="debtForm.emoji" maxlength="3" placeholder="🚗" />
            </label>
          </div>
          <label>
            Fecha meta (opcional)
            <input v-model="debtForm.dueDate" type="date" />
          </label>
          <button class="primary" type="submit">Crear deuda</button>
        </form>

        <div class="tools">
          <button class="ghost" @click="exportBackup">Exportar backup</button>
          <button class="ghost" @click="showImport = !showImport">Importar</button>
        </div>
        <div v-if="showImport" class="import-box">
          <textarea v-model="importText" placeholder="Pega aquí tu backup JSON"></textarea>
          <p v-if="importError" class="error">{{ importError }}</p>
          <button class="primary small" @click="importBackup">Cargar backup</button>
        </div>
      </aside>

      <section class="card panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">Tus deudas</p>
            <h2>Selecciona una</h2>
          </div>
          <span class="pill">{{ debts.length }} activas</span>
        </div>

        <div class="debt-list" v-if="debts.length">
          <button
            v-for="debt in debts"
            :key="debt.id"
            class="debt-item"
            :class="{ active: selectedDebt?.id === debt.id }"
            @click="selectedDebtId = debt.id"
          >
            <span class="emoji">{{ debt.emoji }}</span>
            <span class="debt-info">
              <strong>{{ debt.name }}</strong>
              <small>{{ money(paidFor(debt)) }} / {{ money(debt.total) }}</small>
              <span class="progress"><i :style="{ width: progressFor(debt) + '%' }"></i></span>
            </span>
            <span class="percent">{{ progressFor(debt) }}%</span>
          </button>
        </div>
        <p v-else class="empty">Todavía no tienes deudas. Crea la primera para empezar.</p>
      </section>

      <section class="card panel detail-panel">
        <template v-if="selectedDebt">
          <div class="debt-header">
            <div>
              <p class="eyebrow">Detalle</p>
              <h2><span>{{ selectedDebt.emoji }}</span> {{ selectedDebt.name }}</h2>
              <p class="muted" v-if="selectedDebt.dueDate">Meta: {{ selectedDebt.dueDate }}</p>
            </div>
            <button class="danger" @click="removeDebt(selectedDebt.id)">Borrar</button>
          </div>

          <div class="big-progress">
            <div class="progress"><i :style="{ width: progressFor(selectedDebt) + '%' }"></i></div>
            <div class="progress-labels">
              <span>{{ progressFor(selectedDebt) }}% completado</span>
              <strong>{{ money(remainingFor(selectedDebt)) }} falta</strong>
            </div>
          </div>

          <form class="payment-form" @submit.prevent="addPayment">
            <label>
              Pagaré / pago
              <input v-model="paymentForm.amount" min="0.01" step="0.01" type="number" placeholder="Cantidad" required />
            </label>
            <label>
              Fecha
              <input v-model="paymentForm.date" type="date" required />
            </label>
            <label class="note-field">
              Nota
              <input v-model="paymentForm.note" placeholder="Ej. pago quincenal" />
            </label>
            <button class="primary" type="submit">Registrar</button>
          </form>

          <div class="timeline">
            <h3>Historial de pagos</h3>
            <article v-for="payment in sortedPayments" :key="payment.id" class="payment-row">
              <div>
                <strong>{{ money(payment.amount) }}</strong>
                <small>{{ payment.date }} · {{ payment.note || 'Sin nota' }}</small>
              </div>
              <button class="icon-button" title="Borrar pago" @click="removePayment(payment.id)">×</button>
            </article>
            <p v-if="!sortedPayments.length" class="empty">Cuando registres un pagaré aparecerá aquí.</p>
          </div>
        </template>
        <p v-else class="empty">Crea una deuda para ver el detalle.</p>
      </section>
    </section>
  </main>
`
}
