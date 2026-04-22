<template>
  <div class="home">
    <header class="hero">
      <h1 class="title">DA AI Agent</h1>
      <p class="subtitle">一个基于 Spring AI + Vue3 打造的智能助手平台</p>
    </header>

    <section class="app-grid">
      <router-link class="app-card love" to="/love">
        <div class="app-icon">💞</div>
        <div class="app-info">
          <h2>AI 恋爱大师</h2>
          <p>专业的恋爱心理专家，帮你走出情感迷局</p>
        </div>
        <span class="enter">进入对话 →</span>
      </router-link>

      <router-link class="app-card manus" to="/manus">
        <div class="app-icon">🤖</div>
        <div class="app-info">
          <h2>AI 超级智能体</h2>
          <p>具备工具调用能力的 ReAct Agent，能帮你执行复杂任务</p>
        </div>
        <span class="enter">进入对话 →</span>
      </router-link>
    </section>

    <footer class="foot">© {{ new Date().getFullYear() }} DA AI Agent · Powered by Spring AI Alibaba</footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 64px 24px 24px;
  background:
    radial-gradient(1200px 500px at 20% -10%, #ffe5ef 0%, transparent 60%),
    radial-gradient(1000px 500px at 90% 10%, #e0ecff 0%, transparent 55%),
    linear-gradient(180deg, #fafbff 0%, #f5f7fb 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero {
  text-align: center;
  margin-bottom: 48px;
}

.title {
  font-size: 56px;
  font-weight: 800;
  margin: 0;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #ff6aa1 0%, #6a8bff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitle {
  margin-top: 12px;
  font-size: 18px;
  color: #6b7280;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 1040px;
}

.app-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 32px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(30, 41, 59, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  overflow: hidden;
  color: inherit;
}

.app-card::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.06;
  background: linear-gradient(135deg, currentColor 0%, transparent 60%);
  pointer-events: none;
}

.app-card.love { color: #ff6aa1; }
.app-card.manus { color: #6a8bff; }

.app-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 48px rgba(30, 41, 59, 0.12);
}

.app-icon {
  font-size: 44px;
  margin-bottom: 12px;
}

.app-info h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #1f2937;
}

.app-info p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

.enter {
  align-self: flex-start;
  margin-top: 24px;
  padding: 8px 14px;
  border-radius: 999px;
  background: currentColor;
  color: #fff !important;
  font-size: 13px;
  font-weight: 600;
}

.foot {
  margin-top: auto;
  padding-top: 48px;
  font-size: 13px;
  color: #9ca3af;
}
</style>
