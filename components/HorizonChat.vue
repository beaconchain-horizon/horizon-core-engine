<template>
  <div class="chat-container">
    <!-- هدر -->
    <div class="header">
      <div class="header-left">
        <div class="logo-icon">H</div>
        <div class="logo-text">
          Horizon AI
          <small>Core Chat</small>
        </div>
      </div>
      <div class="header-right">
        <span class="badge-pro">● {{ statusText }}</span>
        <button class="icon-btn" @click="onSettings">⚙</button>
      </div>
    </div>

    <!-- لیست مدل‌ها -->
    <div class="model-grid">
      <button 
        v-for="model in models" 
        :key="model.id"
        class="model-btn" 
        :class="{ active: currentModel === model.id }"
        @click="switchModel(model.id)"
      >
        {{ model.icon }} {{ model.name }}
        <span class="sub">{{ model.sub }}</span>
      </button>
    </div>

    <!-- باکس چت -->
    <div class="chat-box" ref="chatBoxRef">
      <div v-for="(msg, index) in messages" :key="index" class="msg" :class="msg.role">
        <span v-if="msg.role === 'ai'" class="label">🧠 {{ msg.sender || 'Horizon Core' }}</span>
        <span>{{ msg.content }}</span>
      </div>

      <!-- نشانگر تایپ -->
      <div v-if="isTyping" class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>

    <!-- نوار ورودی -->
    <div class="input-row">
      <button class="attach-btn" @click="onAttach">📎</button>
      <input 
        type="text" 
        v-model="inputText" 
        placeholder="پیام خود را بنویسید ..." 
        @keydown.enter="sendMessage"
        :disabled="isTyping"
      />
      <button class="send-btn" @click="sendMessage" :disabled="isTyping || !inputText.trim()">➤</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

// ---------- پراپ‌ها (برای سفارشی‌سازی) ----------
const props = defineProps({
  apiEndpoint: { type: String, default: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1' },
  useMockApi: { type: Boolean, default: false }, // اگر true باشد، از customFetch استفاده می‌کند (بک‌اند Go)
})

const chatBoxRef = ref(null)
const inputText = ref('')
const isTyping = ref(false)
const currentModel = ref('llama')

const models = [
  { id: 'llama', name: 'Horizon Core', icon: '🧠', sub: 'Engine · 7B' },
  { id: 'gemini', name: 'Gemini', icon: '⚡', sub: 'Multimodal' },
  { id: 'claude', name: 'Claude', icon: '🎯', sub: 'Balanced' },
  { id: 'grok', name: 'Grok', icon: '💡', sub: 'Creative' }
]

const messages = ref([
  { role: 'ai', content: 'سلام! من هسته هوش مصنوعی Horizon هستم. هر سوالی داری، بپرس.' }
])

const statusText = computed(() => isTyping.value ? 'در حال فکر کردن...' : 'آنلاین')

// ---------- توابع ----------
function switchModel(id) {
  currentModel.value = id
  addMessage('ai', `🧠 سوئیچ به ${models.find(m => m.id === id).name}`)
}

function onSettings() {
  addMessage('ai', '⚙️ تنظیمات: زبان فارسی · حالت شب · خروجی Markdown')
}

function onAttach() {
  addMessage('ai', '📎 قابلیت آپلود فایل و تصویر به زودی در نسخهٔ PRO فعال می‌شود.')
}

function addMessage(role, content) {
  messages.value.push({ role, content })
  nextTick(() => {
    chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight
  })
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return

  addMessage('user', text)
  inputText.value = ''
  isTyping.value = true

  try {
    let reply = ''

    // ۱. حالت استفاده از بک‌اند (customFetch)
    if (props.useMockApi) {
      // اینجا فرض می‌کنیم که `customFetch` را ایمپورت کرده‌اید
      // const data = await customFetch('AI_CHAT', {}, { message: text })
      // reply = data.response
      reply = '⚠️ در حالت بک‌اند، لطفاً `customFetch` را فعال کنید.' 
    } 
    // ۲. حالت استفاده از API مستقیم Hugging Face (مشابه کد اصلی)
    else {
      const response = await fetch(props.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: `[INST] ${text} [/INST]`,
          parameters: { max_new_tokens: 350, temperature: 0.7, top_p: 0.9 }
        })
      })
      const data = await response.json()
      
      if (data && data.generated_text) {
        reply = data.generated_text.replace(/\[INST\].*?\[\/INST\]/g, '').trim()
      } else if (data.error) {
        reply = `⚠️ خطای API: ${data.error}`
      } else {
        reply = '⚠️ پاسخی دریافت نشد.'
      }
    }

    if (!reply) reply = 'پاسخی دریافت نشد.'
    addMessage('ai', reply)

  } catch (error) {
    addMessage('ai', `⚠️ خطای ارتباط: ${error.message}`)
  } finally {
    isTyping.value = false
  }
}
</script>

<style scoped>
/* تمام استایل‌های کد اصلی شما در اینجا کپی شده و به صورت scoped درآمده است */
.chat-container {
  max-width: 480px;
  width: 100%;
  background: #14141c;
  border-radius: 32px;
  padding: 24px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.8);
  border: 1px solid #2a2a35;
  margin: 0 auto;
}
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.header-left { display: flex; align-items: center; gap: 10px; }
.logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #fff; }
.logo-text { font-size: 18px; font-weight: 700; background: linear-gradient(135deg, #a78bfa, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.logo-text small { font-size: 11px; font-weight: 400; -webkit-text-fill-color: #6b7280; display: block; margin-top: -2px; }
.header-right { display: flex; gap: 12px; align-items: center; }
.badge-pro { background: #7c3aed; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #fff; letter-spacing: 0.3px; }
.icon-btn { background: none; border: none; color: #6b7280; font-size: 20px; cursor: pointer; transition: 0.2s; padding: 4px; }
.icon-btn:hover { color: #a78bfa; }

.model-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
.model-btn { background: #1a1a26; border: 1px solid #2a2a3a; border-radius: 12px; padding: 10px 12px; color: #9ca3af; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s; text-align: center; font-family: inherit; }
.model-btn:hover { border-color: #4f46e5; color: #e5e7eb; }
.model-btn.active { border-color: #7c3aed; background: #1e1e32; color: #a78bfa; box-shadow: 0 0 20px rgba(124,58,237,0.1); }
.model-btn .sub { display: block; font-size: 10px; font-weight: 400; color: #6b7280; margin-top: 2px; }

.chat-box { background: #0e0e16; border-radius: 16px; padding: 16px; height: 280px; overflow-y: auto; margin-bottom: 14px; border: 1px solid #1e1e2a; display: flex; flex-direction: column; gap: 12px; }
.chat-box::-webkit-scrollbar { width: 4px; }
.chat-box::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 10px; }
.msg { max-width: 88%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.6; word-wrap: break-word; animation: fadeIn 0.3s ease; }
.msg.user { align-self: flex-end; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border-bottom-right-radius: 4px; }
.msg.ai { align-self: flex-start; background: #1a1a26; color: #d1d5db; border-bottom-left-radius: 4px; border: 1px solid #2a2a3a; }
.msg.ai .label { font-size: 10px; color: #6b7280; display: block; margin-bottom: 4px; }

.typing-dots { align-self: flex-start; background: #1a1a26; padding: 10px 18px; border-radius: 20px; display: flex; gap: 5px; border: 1px solid #2a2a3a; }
.typing-dots span { width: 8px; height: 8px; background: #7c3aed; border-radius: 50%; animation: bounce 1.2s infinite; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.input-row { display: flex; gap: 10px; align-items: center; }
.input-row input { flex: 1; background: #0e0e16; border: 1px solid #2a2a3a; border-radius: 14px; padding: 12px 16px; color: #e5e7eb; font-size: 14px; outline: none; transition: 0.2s; font-family: inherit; }
.input-row input:focus { border-color: #7c3aed; box-shadow: 0 0 20px rgba(124,58,237,0.05); }
.input-row input::placeholder { color: #4a4a5a; }
.input-row .send-btn { background: linear-gradient(135deg, #7c3aed, #4f46e5); border: none; border-radius: 14px; padding: 12px 20px; color: #fff; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: inherit; font-size: 14px; white-space: nowrap; }
.input-row .send-btn:hover { transform: scale(1.04); }
.input-row .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.input-row .attach-btn { background: none; border: none; color: #4a4a5a; font-size: 22px; cursor: pointer; transition: 0.2s; padding: 8px; }
.input-row .attach-btn:hover { color: #a78bfa; }
</style>
