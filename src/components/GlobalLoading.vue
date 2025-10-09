<template>
    <transition name="fade">
      <div v-if="visible" class="loading-overlay">
        <div class="loading-content">
          <div class="plane-wrapper">
            <svg class="plane" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V20l-2 1.5V23l3.5-1 3.5 1v-1.5L13 20v-6.5z"
              />
            </svg>
          </div>
          <div class="loading-text">{{ text }}</div>
        </div>
      </div>
    </transition>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const visible = ref(false)
  const text = ref('加载中...')
  
  function show(msg = '加载中...') {
    text.value = msg
    visible.value = true
  }
  
  function hide() {
    visible.value = false
  }
  
  defineExpose({ show, hide })
  </script>
  
  <style scoped>
  .loading-overlay {
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3000;
  }
  
  .loading-content {
    text-align: center;
    animation: fadeIn 0.3s ease;
  }
  
  .plane-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .plane {
    width: 64px;
    height: 64px;
    color: #409eff;
    animation: fly 1.5s infinite ease-in-out;
  }
  
  .loading-text {
    font-size: 1.1rem;
    color: #333;
    letter-spacing: 1px;
  }
  
  @keyframes fly {
    0% {
      transform: translateY(0) rotate(0deg);
    }
    25% {
      transform: translateY(-5px) rotate(-5deg);
    }
    50% {
      transform: translateY(0) rotate(0deg);
    }
    75% {
      transform: translateY(5px) rotate(5deg);
    }
    100% {
      transform: translateY(0) rotate(0deg);
    }
  }
  
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.4s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  </style>
  